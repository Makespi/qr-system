import express from 'express';
import QRCode from 'qrcode';
import { db } from './db/index.js';
import { isValid } from './core/codegen.js';
import { digitalLinkUrl } from './core/gs1.js';
import { scan, resolveDigitalLink, clientIp } from './services/scan.js';
import { renderScanPage } from './views/scanPage.js';
import { buildProductJsonLd } from './views/passport.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

app.set('trust proxy', true);
app.use(express.json());
app.use(express.static('public'));

// 统一日志
app.use((req, _res, next) => {
  if (!req.path.startsWith('/api/qr/')) {
    console.log(`${new Date().toLocaleTimeString('zh-CN')}  ${req.method} ${req.path}`);
  }
  next();
});

// ---------- 扫码页（消费者唯一看到的页面）----------
app.get('/s/:code', (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const data = scan(code, { ip: clientIp(req), ua: req.headers['user-agent'] });
  res.type('html').send(renderScanPage(data));
});

// ---------- GS1 Digital Link 解析（/01/{gtin}/21/{serial}）----------
// 浏览器拿 HTML 扫码页，机读客户端（Accept: application/ld+json）拿 JSON-LD
app.get('/01/:gtin/21/:serial', (req, res) => {
  const data = resolveDigitalLink(req.params.gtin, req.params.serial, {
    ip: clientIp(req),
    ua: req.headers['user-agent'],
  });

  if (wantsJsonLd(req) || req.query.format === 'json') {
    const body = buildProductJsonLd(data, { baseUrl: BASE_URL });
    return res
      .status(data.state === 'invalid' ? 404 : 200)
      .type('application/ld+json')
      .send(JSON.stringify(body, null, 2));
  }

  res.type('html').send(renderScanPage(data));
});

/** 内容协商：显式要 JSON 才给 JSON，浏览器一律给页面 */
function wantsJsonLd(req) {
  const accept = String(req.headers.accept || '');
  if (/text\/html/i.test(accept)) return false;
  return /application\/(ld\+json|json)/i.test(accept);
}

// ---------- 扫码 JSON 接口（供小程序/App 复用）----------
app.get('/api/scan/:code', (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const data = scan(code, { ip: clientIp(req), ua: req.headers['user-agent'] });
  const gtin = data.product?.gtin;
  res.json({
    code: 0,
    data: {
      ...data,
      digitalLink: gtin
        ? { gtin, serial: data.code, url: digitalLinkUrl(BASE_URL, gtin, data.code) }
        : null,
    },
  });
});

// ---------- 二维码图片 ----------
app.get('/api/qr/:code.png', async (req, res) => {
  const code = String(req.params.code || '').replace(/\.png$/, '').toUpperCase();
  if (!isValid(code)) {
    return res.status(400).type('text').send('invalid code');
  }
  // 有 GTIN 的型号走 Digital Link，没有的沿用 /s/ 短链（兼容老数据）
  const row = db
    .prepare(
      `SELECT m.gtin FROM qr_code c
       LEFT JOIN product_model m ON m.id = c.model_id
       WHERE c.code = ?`
    )
    .get(code);
  const payload = row?.gtin
    ? digitalLinkUrl(BASE_URL, row.gtin, code)
    : `${BASE_URL}/s/${code}`;

  try {
    const buf = await QRCode.toBuffer(payload, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320,
    });
    res.type('png').set('Cache-Control', 'public, max-age=86400').send(buf);
  } catch (e) {
    res.status(500).type('text').send(e.message);
  }
});

// ---------- 演示页：不用真扫码也能看效果 ----------
app.get('/demo', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.code, c.seq_no, c.status, c.mark_status, c.scan_count,
              m.model_name, m.gtin, t.company_name
       FROM qr_code c
       LEFT JOIN product_model m ON m.id = c.model_id
       LEFT JOIN tenant t ON t.id = c.tenant_id
       ORDER BY c.id DESC LIMIT 24`
    )
    .all();

  res.type('html').send(renderDemo(rows));
});

function renderDemo(rows) {
  const dlCount = rows.filter((r) => r.gtin).length;
  const items = rows
    .map(
      (r) => `
    <article class="item">
      <div class="qr"><img src="/api/qr/${r.code}.png" alt="${r.code}" width="118" height="118" loading="lazy"></div>
      <div class="meta">
        <div class="code">${r.code}</div>
        <div class="sub">${r.model_name || '—'} · 序号 ${r.seq_no ?? '—'}</div>
        ${r.gtin ? `<div class="dl">GTIN ${r.gtin}</div>` : ''}
        <div class="badges">
          <span class="b ${r.mark_status === 1 ? 'ok' : r.mark_status === 2 ? 'bad' : ''}">${
            r.mark_status === 1 ? '已打标' : r.mark_status === 2 ? '打标失败' : '待打标'
          }</span>
          <span class="b ${r.status === 1 ? 'ok' : r.status === 2 ? 'bad' : ''}">${
            r.status === 1 ? '在售' : r.status === 2 ? '已作废' : '未激活'
          }</span>
          <span class="b">扫码 ${r.scan_count} 次</span>
          ${r.gtin ? '<span class="b blue">Digital Link</span>' : ''}
        </div>
        <div class="links">
          <a class="go" href="/s/${r.code}" target="_blank">短链扫码页</a>
          ${r.gtin ? `<a class="go" href="/01/${r.gtin}/21/${r.code}" target="_blank">GS1 扫码页</a>
          <a class="go" href="/01/${r.gtin}/21/${r.code}?format=json" target="_blank">JSON-LD</a>` : ''}
        </div>
      </div>
    </article>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>演示 · 一物一码</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:30px 20px 60px;color:#0F172A;
       font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",Arial,sans-serif;
       font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;
       background:radial-gradient(1200px 500px at 50% -200px,#fff 0%,#F2F5F4 55%,#EDF1EF 100%);
       background-attachment:fixed}
  .page{max-width:1180px;margin:0 auto}
  .top{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:22px}
  h1{font-size:22px;font-weight:700;margin:0 0 8px;letter-spacing:.3px}
  .hint{font-size:12.5px;color:#64748B;margin:0;max-width:780px;line-height:1.75}
  .hint code{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;background:#fff;
             padding:2px 6px;border-radius:6px;border:1px solid #E7EDEA;color:#3C4654}
  .pills{display:flex;gap:8px;flex-wrap:wrap}
  .pill{font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;letter-spacing:.3px;
        color:#556070;background:#fff;border:1px solid #E7EDEA;box-shadow:0 6px 18px -14px rgba(15,23,42,.5)}
  .pill.blue{color:#164EBD;background:#EDF3FE;border-color:#D9E4FD}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
  .item{display:flex;gap:14px;align-items:flex-start;padding:14px;background:#fff;
        border:1px solid #E9EFEC;border-radius:16px;
        box-shadow:0 1px 2px rgba(15,23,42,.03),0 14px 34px -28px rgba(15,23,42,.5);
        transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
  .item:hover{transform:translateY(-2px);border-color:#DDE8E3;
              box-shadow:0 2px 4px rgba(15,23,42,.04),0 22px 44px -28px rgba(15,23,42,.5)}
  .qr{flex:none;width:118px;height:118px;padding:6px;background:#fff;border:1px solid #EDF2F0;
      border-radius:13px;display:flex;align-items:center;justify-content:center}
  .qr img{width:100%;height:100%;display:block;border-radius:7px}
  .meta{min-width:0;flex:1}
  .code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;font-weight:700;
        letter-spacing:.7px;color:#0F172A;word-break:break-all}
  .sub{font-size:11.5px;color:#7A8797;margin:5px 0 8px;line-height:1.5}
  .dl{display:inline-block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;
      color:#64748B;background:#F6F9F8;border:1px solid #EDF2F0;border-radius:6px;
      padding:3px 7px;margin-bottom:9px;letter-spacing:.2px}
  .badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .b{font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:6px;letter-spacing:.2px;
     background:#F2F6F4;color:#5B6875}
  .b.ok{background:#EAF8F1;color:#0B6B42}
  .b.bad{background:#FDEDED;color:#9B1C1C}
  .b.blue{background:#EDF3FE;color:#164EBD}
  .links{display:flex;flex-wrap:wrap;gap:7px}
  .go{font-size:11.5px;font-weight:600;text-decoration:none;letter-spacing:.2px;
      color:#0F6E56;background:#EFF8F4;border:1px solid #DCEFE6;border-radius:8px;
      padding:5px 9px;transition:background .16s,border-color .16s,color .16s}
  .go:hover{background:#E3F4EC;border-color:#C9E7DA;color:#0B5A47}
  .empty{background:#fff;padding:56px 24px;border-radius:16px;text-align:center;
         color:#64748B;font-size:13.5px;border:1px solid #E9EFEC}
  .empty code{font-family:ui-monospace,Menlo,monospace;background:#F4F7F6;padding:2px 6px;border-radius:6px}
  @media (max-width:520px){
    body{padding:22px 14px 44px}
    .grid{grid-template-columns:1fr}
    h1{font-size:19px}
  }
</style></head>
<body>
<div class="page">
  <header class="top">
    <div>
      <h1>扫码页演示</h1>
      <p class="hint">从数据库取最近 ${rows.length} 个码。二维码载荷为 GS1 Digital Link
        <code>/01/&lt;GTIN&gt;/21/&lt;序列号&gt;</code>：浏览器打开是扫码页，
        <code>Accept: application/ld+json</code> 或 <code>?format=json</code> 返回机读数据。</p>
    </div>
    <div class="pills">
      <span class="pill">最近 ${rows.length} 个码</span>
      <span class="pill blue">Digital Link ${dlCount}/${rows.length}</span>
    </div>
  </header>
  ${rows.length ? `<div class="grid">${items}</div>` : '<div class="empty">还没有码，先运行 <code>npm run gen -- --count 50</code> 生成一批</div>'}
</div>
</body></html>`;
}

// ---------- 健康检查 ----------
app.get('/health', (_req, res) => {
  const c = db.prepare('SELECT COUNT(*) AS n FROM qr_code').get();
  const gtinModels = db.prepare('SELECT COUNT(*) AS n FROM product_model WHERE gtin IS NOT NULL').get();
  res.json({
    ok: true,
    codes: c.n,
    baseUrl: BASE_URL,
    digitalLink: { enabled: gtinModels.n > 0, gtinModels: gtinModels.n },
  });
});

app.listen(PORT, () => {
  console.log(`\n一物一码服务已启动`);
  console.log(`  扫码页   ${BASE_URL}/s/<16位码>`);
  console.log(`  演示页   ${BASE_URL}/demo`);
  console.log(`  健康检查 ${BASE_URL}/health\n`);
});
