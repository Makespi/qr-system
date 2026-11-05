/**
 * 扫码结果页渲染（v2）
 *
 * 设计目标：
 *  1. 客户可对外展示的观感 —— 品牌色头部、状态色卡片、动效克制
 *  2. 多语言（中 / 英 / 西）—— 界面文案走前端词典，商品与参数名走数据库 i18n 字段
 *  3. 零外部依赖、零图片请求，首屏极快（微信内打开是关键场景）
 */

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 把对象安全地塞进 <script>，避免 </script> 截断 */
function jsonForScript(obj) {
  return JSON.stringify(obj === undefined ? null : obj).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------- 颜色

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 29, g: 158, b: 117 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** 调整明度：pct 为负变暗，为正变亮 */
function shade(hex, pct) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => {
    const x = pct < 0 ? v * (1 + pct / 100) : v + (255 - v) * (pct / 100);
    return Math.max(0, Math.min(255, Math.round(x)));
  };
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ---------------------------------------------------------------- 状态

const TONE = {
  ok: { color: '#0F9D58', bg: '#EAF8F0', fg: '#0B6B42', icon: 'check' },
  warn: { color: '#F59E0B', bg: '#FFF8EA', fg: '#8A5300', icon: 'alert' },
  info: { color: '#2F80ED', bg: '#EDF4FE', fg: '#154C86', icon: 'info' },
  danger: { color: '#DC2626', bg: '#FEF0F0', fg: '#8F1717', icon: 'cross' },
  muted: { color: '#9CA3AF', bg: '#F4F5F7', fg: '#4B5563', icon: 'question' },
};

/** 状态 → 视觉分组。文案不在这里，在下面的词典里 */
const STATE_TONE = {
  genuine_first: 'ok',
  genuine_repeat: 'warn',
  not_activated: 'info',
  voided: 'danger',
  mark_failed: 'muted',
  invalid: 'muted',
  disabled: 'muted',
};

function iconSvg(name) {
  const common = 'fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case 'check':
      return `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4.5 12.6l4.6 4.6L19.5 6.8" ${common}/></svg>`;
    case 'alert':
      return `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 6.5v7" ${common}/><circle cx="12" cy="17.6" r="1.25" fill="#fff"/></svg>`;
    case 'info':
      return `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="7.2" r="1.25" fill="#fff"/><path d="M12 11v6.5" ${common}/></svg>`;
    case 'cross':
      return `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M7 7l10 10M17 7L7 17" ${common}/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M9.4 9.2a2.7 2.7 0 015.1.9c0 1.8-2.5 2.2-2.5 3.9" ${common}/><circle cx="12" cy="17.4" r="1.2" fill="#fff"/></svg>`;
  }
}

// ---------------------------------------------------------------- 词典
// 新增一种语言：在这里加一个 key，再给 state/文案补全即可，代码无需改动。

const DICT = {
  zh: {
    tag: '官方防伪查询',
    sectionProduct: '产品信息',
    sectionTrace: '查询记录',
    sectionHow: '如何判断真伪',
    labelModel: '型号',
    labelBrand: '品牌',
    labelPrice: '官方零售价',
    batchNo: '生产批次',
    productionDate: '生产日期',
    labelGtin: 'GTIN',
    serviceHours: '服务时间 {n}',
    labelCode: '防伪码',
    copy: '复制',
    copied: '已复制',
    nowScan: '本次查询',
    firstScan: '首次查询',
    timesLabel: '累计查询',
    regionLabel: '查询地点',
    localNetwork: '本地网络',
    factoryStatus: '出厂状态',
    notRegistered: '尚未登记出厂',
    times: '{n} 次',
    cta: '联系厂家客服',
    powered: '本页面由一物一码防伪追溯平台提供技术支持',
    chip: '已验证',
    how: [
      '首次查询显示「正品验证通过」，说明此码此前未被任何人使用过。',
      '若显示「该码已被查询过」，请核对查询时间与地点，判断是否为您本人的前次查询。',
      '一个防伪码只对应一件产品，同一码出现在多件商品上即为假冒。',
    ],
    states: {
      genuine_first: { title: '正品验证通过', desc: '这是该产品的首次查询，信息与厂家生产记录一致。' },
      genuine_repeat: { title: '该码已被查询过', desc: '此码此前已被扫描过。若您是第一次查询，请留意商品来源。' },
      not_activated: { title: '该商品尚未出厂', desc: '此码已生产但未完成出厂登记，如已购买请联系厂家核实。' },
      voided: { title: '该码已作废', desc: '此防伪码已由厂家作废，可能因重打或更换包装。请通过客服电话核实。' },
      mark_failed: { title: '此码未完成注册', desc: '该码在生产环节未成功赋码，不能作为正品凭证。' },
      invalid: { title: '未查询到该商品', desc: '请核对二维码是否完整清晰。若多次扫描仍失败，请通过客服电话联系厂家。' },
      disabled: { title: '该商品信息已停止服务', desc: '如需验证，请通过产品包装上的客服电话联系厂家。' },
    },
  },

  en: {
    tag: 'Official verification',
    sectionProduct: 'Product details',
    sectionTrace: 'Check history',
    sectionHow: 'How to verify',
    labelModel: 'Model',
    labelBrand: 'Brand',
    labelPrice: 'Official retail price',
    batchNo: 'Batch',
    productionDate: 'Produced on',
    labelGtin: 'GTIN',
    serviceHours: 'Service hours {n}',
    labelCode: 'Security code',
    copy: 'Copy',
    copied: 'Copied',
    nowScan: 'This check',
    firstScan: 'First check',
    timesLabel: 'Total checks',
    regionLabel: 'Location',
    localNetwork: 'Local network',
    factoryStatus: 'Factory status',
    notRegistered: 'Not registered',
    times: '{n} times',
    cta: 'Contact customer service',
    powered: 'Powered by the One-Item-One-Code traceability platform',
    chip: 'Verified',
    how: [
      'A first check showing “Product verified authentic” means this code had never been used before.',
      'If it says “This code has been checked before”, compare the time and location to see whether it was your own earlier scan.',
      'One code belongs to exactly one item. The same code on several products means counterfeiting.',
    ],
    states: {
      genuine_first: { title: 'Product verified authentic', desc: 'This is the first check of this code, and the details match the factory record.' },
      genuine_repeat: { title: 'This code has been checked before', desc: 'Someone scanned this code previously. If this is your first scan, please check where the product came from.' },
      not_activated: { title: 'Not registered for sale yet', desc: 'This code exists but the product has not been registered for shipment. Contact the manufacturer if you already bought it.' },
      voided: { title: 'This code has been voided', desc: 'The manufacturer voided this code, possibly after re-marking or repackaging. Please confirm with customer service.' },
      mark_failed: { title: 'Code not completed in production', desc: 'This code was not successfully registered during production and cannot prove authenticity.' },
      invalid: { title: 'Product not found', desc: 'Please check that the QR code is complete and clear. If scanning keeps failing, contact the manufacturer.' },
      disabled: { title: 'Information service unavailable', desc: 'To verify, please use the customer service number on the packaging.' },
    },
  },

  es: {
    tag: 'Verificación oficial',
    sectionProduct: 'Detalles del producto',
    sectionTrace: 'Historial de consultas',
    sectionHow: 'Cómo verificar',
    labelModel: 'Modelo',
    labelBrand: 'Marca',
    labelPrice: 'Precio oficial',
    batchNo: 'Lote',
    productionDate: 'Fecha de producción',
    labelGtin: 'GTIN',
    serviceHours: 'Horario de atención {n}',
    labelCode: 'Código de seguridad',
    copy: 'Copiar',
    copied: 'Copiado',
    nowScan: 'Esta consulta',
    firstScan: 'Primera consulta',
    timesLabel: 'Consultas totales',
    regionLabel: 'Ubicación',
    localNetwork: 'Red local',
    factoryStatus: 'Estado de fábrica',
    notRegistered: 'No registrado',
    times: '{n} veces',
    cta: 'Contactar al servicio técnico',
    powered: 'Sitio ofrecido por la plataforma de trazabilidad un código por artículo',
    chip: 'Verificado',
    how: [
      'Si la primera consulta muestra «Producto auténtico verificado», el código nunca se había utilizado.',
      'Si aparece «Este código ya fue consultado», compare la fecha y el lugar para saber si fue su propia consulta anterior.',
      'Cada código corresponde a un solo artículo. El mismo código en varios productos indica falsificación.',
    ],
    states: {
      genuine_first: { title: 'Producto auténtico verificado', desc: 'Es la primera consulta de este código y los datos coinciden con el registro de fábrica.' },
      genuine_repeat: { title: 'Este código ya fue consultado', desc: 'Alguien escaneó este código antes. Si es su primera consulta, revise el origen del producto.' },
      not_activated: { title: 'Producto aún no registrado', desc: 'El código existe pero el producto no se ha registrado para salida de fábrica. Contacte al fabricante si ya lo compró.' },
      voided: { title: 'Código anulado', desc: 'El fabricante anuló este código, posiblemente por reimpresión o cambio de embalaje. Confirme con el servicio al cliente.' },
      mark_failed: { title: 'Código no registrado en producción', desc: 'Este código no se completó en producción y no puede usarse como prueba de autenticidad.' },
      invalid: { title: 'No se encontró el producto', desc: 'Verifique que el código QR esté completo y legible. Si sigue fallando, contacte al fabricante.' },
      disabled: { title: 'Información fuera de servicio', desc: 'Para verificar, utilice el teléfono de servicio al cliente del embalaje.' },
    },
  },
};

// ---------------------------------------------------------------- 页面

/** 货币符号：只做展示，汇率不由本系统负责 */
const CURRENCY_SIGN = { CNY: '¥', USD: '$', EUR: '€', JPY: 'JP¥' };

function fmtPrice(value, currency = 'CNY') {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const text = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${CURRENCY_SIGN[currency] || ''}${text}`;
}

/**
 * 规格参数：按模板分组渲染，长文本字段（如马达参数）占整行。
 * 分组顺序由 param_template.groups 决定；未分组的字段排在最后，兼容老模板。
 */
function renderSpecs(product) {
  const params = product?.params || [];
  if (!params.length) return '';
  const groups = product?.groups || [];
  const used = new Set();
  const blocks = [];

  const cell = (p) => `<div class="pc${p.wide ? ' wide' : ''}">
      <span class="pl" data-pkey="${esc(p.key)}">${esc(p.label)}</span>
      <b class="pv">${esc(p.value)}${p.unit ? `<i>${esc(p.unit)}</i>` : ''}</b>
    </div>`;

  for (const g of groups) {
    const cells = params.filter((p) => p.group === g.key);
    if (!cells.length) continue;
    cells.forEach((p) => used.add(p));
    blocks.push(`<div class="pgroup"><span data-gkey="${esc(g.key)}">${esc(g.label)}</span></div>
      <div class="pgrid">${cells.map(cell).join('')}</div>`);
  }

  const rest = params.filter((p) => !used.has(p));
  if (rest.length) {
    blocks.push(`${groups.length ? '<div class="pgroup"></div>' : ''}
      <div class="pgrid">${rest.map(cell).join('')}</div>`);
  }

  return `<div class="specs">${blocks.join('')}</div>`;
}

export function renderScanPage(data) {
  const state = data.state || 'invalid';
  const tone = TONE[STATE_TONE[state]] || TONE.muted;
  const brand = data.tenant?.brandColor || brand_default();
  const brandDark = shade(brand, -22);
  const company = data.tenant?.companyName || '商品信息查询';
  const product = data.product || null;
  const isVerified = state === 'genuine_first' || state === 'genuine_repeat';

  // 供前端切换语言时使用的数据
  const meta = {
    tenant: data.tenant?.i18n || null,
    product: product?.i18n || null,
    company,
    productName: product?.modelName || null,
    category: product?.category || null,
    description: product?.description || null,
    brand: product?.brand || null,
    highlights: product?.highlights || [],
    groups: product?.groups || [],
    params: (product?.params || []).map((p) => ({
      key: p.key,
      label: p.label,
      group: p.group || '',
      i18n: p.i18n || null,
    })),
  };

  // ---- 顶部三格数据
  const stats = [];
  if (state === 'genuine_first' || state === 'genuine_repeat' || state === 'not_activated') {
    if (data.firstScanAt) {
      stats.push(`<div class="st"><span data-t="firstScan"></span>
        <b class="ts" data-ts="${esc(data.firstScanAt)}">${esc(data.firstScanAt)}</b></div>`);
    }
    if (state !== 'not_activated' && data.scanCount != null) {
      stats.push(`<div class="st"><span data-t="timesLabel"></span>
        <b data-tpl="times" data-n="${esc(data.scanCount)}">${esc(data.scanCount)} 次</b></div>`);
    }
    if (data.firstScanRegion) {
      stats.push(`<div class="st wide"><span data-t="regionLabel"></span>
        <b data-region="${esc(data.firstScanRegion)}">${esc(data.firstScanRegion)}</b></div>`);
    }
    if (state === 'not_activated') {
      stats.push(`<div class="st wide"><span data-t="factoryStatus"></span>
        <b data-t="notRegistered"></b></div>`);
    }
  }

  // ---- 产品卡片
  const params = product?.params || [];
  const priceRow = product?.price != null
    ? `<div class="price">
        <span class="pk" data-t="labelPrice"></span>
        <b class="pv-now">${esc(fmtPrice(product.price, product.currency))}</b>
        ${product.marketPrice != null && product.marketPrice > product.price
          ? `<s class="pv-old">${esc(fmtPrice(product.marketPrice, product.currency))}</s>`
          : ''}
      </div>`
    : '';

  const highlights = (product?.highlights || []).filter((h) => h && (h.zh || h.en || h.es));
  const highlightRow = highlights.length
    ? `<div class="hls">${highlights
        .map((h, i) => `<span class="hl" data-hl="${i}">${esc(h.zh || h.en || '')}</span>`)
        .join('')}</div>`
    : '';

  const specBlock = renderSpecs(product);

  const cover = product?.coverImg
    ? `<div class="cover"><img src="${esc(product.coverImg)}" alt="${esc(product.modelName)}" loading="lazy"></div>`
    : '';

  const productBlock = product
    ? `<section class="card fade" style="--i:1">
        <div class="sec"><span data-t="sectionProduct"></span></div>
        ${cover}
        <div class="p-head">
          <div class="p-txt">
            <div class="p-name" id="mName">${esc(product.modelName)}</div>
            <div class="p-sub"><span data-t="labelModel"></span>
              <code>${esc(product.modelCode)}</code>
              <span class="dot">·</span><span id="mCat">${esc(product.category || '')}</span>
              ${product.brand ? `<span class="dot">·</span><span id="mBrand">${esc(product.brand)}</span>` : ''}
            </div>
          </div>
          ${isVerified ? '<span class="chip" data-t="chip"></span>' : ''}
        </div>
        ${priceRow}
        ${highlightRow}
        ${specBlock}
        ${product.description ? `<p class="p-desc" id="mDesc">${esc(product.description)}</p>` : ''}
      </section>`
    : '';

  // ---- 查询记录
  const timeline = [];
  if (isVerified || state === 'not_activated') {
    timeline.push(`<li><b data-t="nowScan"></b><span class="ts" data-ts="${esc(data.lastScanAt || data.firstScanAt || '')}">${esc(data.lastScanAt || data.firstScanAt || '—')}</span></li>`);
    if (data.firstScanAt) {
      timeline.push(`<li><b data-t="firstScan"></b><span class="ts" data-ts="${esc(data.firstScanAt)}">${esc(data.firstScanAt)}</span></li>`);
    }
  }

  // 批次追溯：只在码已投产时才展示，避免空壳信息
  const batch = data.batch;
  const batchRows = [];
  if (product?.gtin) {
    batchRows.push(`<div class="mrow"><span data-t="labelGtin"></span><b>${esc(product.gtin)}</b></div>`);
  }
  if (batch?.batch_no) {
    batchRows.push(`<div class="mrow"><span data-t="batchNo"></span><b>${esc(batch.batch_no)}</b></div>`);
  }
  if (batch?.production_date) {
    batchRows.push(`<div class="mrow"><span data-t="productionDate"></span>
      <b class="ts" data-ts="${esc(batch.production_date)}">${esc(batch.production_date)}</b></div>`);
  }

  const traceBlock = timeline.length
    ? `<section class="card fade" style="--i:2">
        <div class="sec"><span data-t="sectionTrace"></span></div>
        <ul class="tl">${timeline.join('')}</ul>
        ${batchRows.length ? `<div class="mrows">${batchRows.join('')}</div>` : ''}
        <div class="codeline">
          <span class="k" data-t="labelCode"></span>
          <code id="rawCode">${esc(data.code || '')}</code>
          <button class="cpy" id="cpyBtn" data-t="copy"></button>
        </div>
      </section>`
    : '';

  // ---- 判断方法（仅在能给出结论时展示，避免无效页面堆信息）
  const howBlock = isVerified
    ? `<section class="card fade" style="--i:3">
        <div class="sec"><span data-t="sectionHow"></span></div>
        <ol class="how" id="howList"></ol>
      </section>`
    : '';

  const phone = data.tenant?.servicePhone;
  const hours = data.tenant?.serviceHours;
  const hoursLine = hours
    ? `<div class="hours" data-tpl="serviceHours" data-n="${esc(hours)}"></div>`
    : '';
  const footer = phone
    ? `<footer class="ft">
        <a class="cta" href="tel:${esc(phone)}">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 3.5h3l1.5 4-2 1.4a12 12 0 005.9 5.9l1.4-2 4.1 1.5v3a2.1 2.1 0 01-2.3 2.1A16.5 16.5 0 014.5 5.8 2.1 2.1 0 016.6 3.5z"/></svg>
          <span data-t="cta"></span>
          <em>${esc(phone)}</em>
        </a>
        ${hoursLine}
        <div class="powered" data-t="powered"></div>
      </footer>`
    : `<footer class="ft">${hoursLine}<div class="powered" data-t="powered"></div></footer>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="${esc(brand)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='${esc(brand)}'/%3E%3Cpath d='M9 17l5 5 9-11' stroke='%23fff' stroke-width='3.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<title>${esc(company)} · ${esc(DICT.zh.states[state]?.title || '')}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  :root{
    --brand:${esc(brand)};
    --brand-dark:${esc(brandDark)};
    --tone:${tone.color};
    --tone-bg:${tone.bg};
    --tone-fg:${tone.fg};
    --ink:#0F172A;
    --sub:#64748B;
    --muted:#94A3B8;
    --line:#EDF2F0;
    --radius:20px;
    --shadow-sm:0 1px 2px rgba(15,23,42,.04),0 10px 26px -20px rgba(15,23,42,.5);
    --shadow-md:0 2px 6px rgba(15,23,42,.04),0 22px 46px -30px rgba(15,23,42,.55);
    color-scheme:light;
  }
  html,body{background:#E9EEEC}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
    color:var(--ink);font-size:15px;line-height:1.6;letter-spacing:.01em;
    -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
    background:radial-gradient(1100px 480px at 50% -160px,#fff 0%,#EEF2F0 55%,#E7ECEA 100%);
    background-attachment:fixed;
  }
  .phone{max-width:480px;margin:0 auto;min-height:100vh;background:#F5F8F7;position:relative;
         box-shadow:0 0 0 1px rgba(15,23,42,.035),0 40px 90px -50px rgba(15,23,42,.5);overflow-x:hidden}

  /* ---------- 头部 ---------- */
  .hd{position:relative;padding:calc(18px + env(safe-area-inset-top)) 18px 44px;
      color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;overflow:hidden;
      background:linear-gradient(150deg,var(--brand) 0%,var(--brand-dark) 76%,${shade(brand, -34)} 100%)}
  .hd::before{content:'';position:absolute;inset:0;pointer-events:none;
              background:radial-gradient(120% 100% at 100% 0%,rgba(255,255,255,.26),transparent 58%),
                         radial-gradient(90% 80% at 0% 110%,rgba(255,255,255,.14),transparent 60%)}
  .hd::after{content:'';position:absolute;right:-72px;bottom:-140px;width:280px;height:280px;border-radius:50%;
             background:radial-gradient(circle,rgba(255,255,255,.2),rgba(255,255,255,0) 70%);pointer-events:none}
  .brand{display:flex;align-items:center;gap:11px;min-width:0;position:relative;z-index:1}
  .logo{width:40px;height:40px;border-radius:13px;background:rgba(255,255,255,.16);flex:none;
        display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.26),0 8px 18px -12px rgba(0,0,0,.6);overflow:hidden}
  .logo img{width:100%;height:100%;object-fit:cover}
  .co{font-size:15px;font-weight:600;letter-spacing:.3px;line-height:1.3;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:186px}
  .tag{font-size:10.5px;opacity:.72;letter-spacing:1.1px;margin-top:2px}

  .langs{display:flex;gap:2px;padding:3px;border-radius:12px;flex:none;position:relative;z-index:1;
         background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);
         -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
  .langs button{border:0;background:transparent;color:rgba(255,255,255,.8);cursor:pointer;
                font-size:11px;font-weight:700;padding:6px 9px;border-radius:9px;line-height:1;
                font-family:inherit;letter-spacing:.3px;transition:background .18s,color .18s}
  .langs button.on{background:#fff;color:var(--brand-dark);box-shadow:0 2px 8px rgba(8,15,35,.22)}

  /* ---------- 主区 ---------- */
  .wrap{padding:0 14px 4px;margin-top:-26px;position:relative;z-index:2}
  .card{background:#fff;border-radius:var(--radius);padding:18px;margin-bottom:12px;
        border:1px solid var(--line);box-shadow:var(--shadow-sm)}

  /* 状态卡 */
  .hero{text-align:center;padding:26px 18px 18px;border-radius:22px;overflow:hidden;position:relative;
        background:linear-gradient(180deg,var(--tone-bg) 0%,#fff 60%);
        border:1px solid ${rgba(tone.color, 0.16)};
        box-shadow:var(--shadow-md);margin-bottom:12px}
  .seal{position:relative;width:64px;height:64px;margin:0 auto 15px;border-radius:50%;
        background:linear-gradient(160deg,${shade(tone.color, 14)},${tone.color});
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 14px 26px -10px ${rgba(tone.color, 0.7)},inset 0 1px 0 rgba(255,255,255,.4)}
  .seal::after{content:'';position:absolute;inset:-8px;border-radius:50%;
               border:1.5px solid ${rgba(tone.color, 0.42)};animation:pulse 3s ease-out infinite}
  @keyframes pulse{0%{transform:scale(.9);opacity:.7}72%{transform:scale(1.2);opacity:0}100%{opacity:0}}
  .hero h1{font-size:21px;font-weight:700;color:var(--tone-fg);letter-spacing:.3px;line-height:1.35}
  .hero .desc{font-size:13px;color:#5B6474;margin:8px auto 0;max-width:306px;line-height:1.7}

  .stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}
  .st{padding:9px 8px 10px;text-align:center;min-width:0;border-radius:12px;
      background:rgba(255,255,255,.74);border:1px solid ${rgba(tone.color, 0.12)}}
  .st.wide{grid-column:1/-1}
  .st span{display:block;font-size:10px;color:#8A93A0;letter-spacing:.6px;margin-bottom:3px}
  .st b{display:block;font-size:12.5px;font-weight:600;color:var(--tone-fg);word-break:break-word;line-height:1.45}

  /* 区块标题 */
  .sec{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#0F172A;
       margin-bottom:14px;letter-spacing:.3px}
  .sec::before{content:'';width:3px;height:14px;border-radius:2px;
               background:linear-gradient(180deg,var(--brand),${rgba(brand_default(), 0.55)})}

  /* 产品 */
  .cover{border-radius:14px;overflow:hidden;margin-bottom:14px;background:#F5F8F7;
         border:1px solid var(--line)}
  .cover img{width:100%;display:block}
  .p-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .p-txt{min-width:0}
  .p-name{font-size:17px;font-weight:700;line-height:1.4;letter-spacing:.2px}
  .p-sub{font-size:11.5px;color:var(--sub);margin-top:7px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .p-sub code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
              background:#F3F7F5;padding:2px 7px;border-radius:6px;color:#3C4654;letter-spacing:.4px;
              border:1px solid #E9EFEC}
  .p-sub .dot{color:#CBD5D1}
  .chip{flex:none;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:20px;
        color:#0B6B42;background:linear-gradient(180deg,#EAF9F2,#E2F5EB);
        border:1px solid #C9EBDA;letter-spacing:.3px;margin-top:2px}

  /* 官方零售价 */
  .price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:14px;
         padding:10px 12px;border-radius:12px;border:1px solid #FBE7D6;
         background:linear-gradient(90deg,#FFF8F1 0%,#FFFDFB 78%)}
  .price .pk{font-size:10.5px;color:#A9743F;letter-spacing:.4px}
  .price .pv-now{font-size:20px;font-weight:700;color:#D9480F;letter-spacing:.3px}
  .price .pv-old{font-size:11.5px;color:#B6ADA6}

  /* 核心卖点 */
  .hls{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
  .hl{font-size:11px;font-weight:600;padding:4px 10px;border-radius:8px;
      color:var(--brand-dark);background:${rgba(brand_default(), 0.07)};
      border:1px solid ${rgba(brand_default(), 0.12)};letter-spacing:.2px}

  /* 规格参数 */
  .specs{margin-top:16px}
  .pgroup{display:flex;align-items:center;gap:10px;margin:16px 0 8px;
          font-size:10.5px;font-weight:700;color:#94A3B8;letter-spacing:1px}
  .pgroup:first-child{margin-top:0}
  .pgroup::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#E9EFEC,rgba(233,239,236,0))}
  .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .pc{background:linear-gradient(180deg,#F9FBFA,#F4F8F6);border-radius:12px;padding:11px 12px 12px;
      min-width:0;border:1px solid #EDF2F0}
  .pc.wide{grid-column:1/-1}
  .pl{display:block;font-size:10.5px;color:#8892A0;margin-bottom:3px;letter-spacing:.4px}
  .pv{font-size:15px;font-weight:700;color:#101827;letter-spacing:.2px;word-break:break-word;line-height:1.5}
  .pv i{font-style:normal;font-size:10.5px;font-weight:600;color:var(--muted);margin-left:3px}

  .p-desc{margin-top:14px;padding-top:13px;border-top:1px dashed #E9EFEC;
          font-size:12.5px;color:#556070;line-height:1.85}

  /* 时间轴 */
  .tl{list-style:none;position:relative;padding-left:20px}
  .tl::before{content:'';position:absolute;left:5px;top:8px;bottom:8px;width:1px;background:#E7EDEA}
  .tl li{position:relative;padding-bottom:15px}
  .tl li:last-child{padding-bottom:0}
  .tl li::before{content:'';position:absolute;left:-20px;top:5px;width:10px;height:10px;border-radius:50%;
                 background:#fff;border:2.5px solid var(--brand);box-sizing:border-box}
  .tl li:first-child::before{background:var(--brand);
                             box-shadow:0 0 0 3px ${rgba(brand_default(), 0.14)}}
  .tl b{display:block;font-size:12.5px;font-weight:600;color:#1F2937;letter-spacing:.2px}
  .tl span{font-size:11.5px;color:var(--muted)}

  .mrows{margin-top:14px;padding-top:6px;border-top:1px dashed #E9EFEC}
  .mrow{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:12px;
        padding:8px 0;border-bottom:1px solid #F2F6F4}
  .mrow:last-child{border-bottom:0;padding-bottom:0}
  .mrow span{color:var(--muted);flex:none;letter-spacing:.2px}
  .mrow b{font-weight:600;color:#334155;text-align:right;word-break:break-all}

  .codeline{display:flex;align-items:center;gap:9px;margin-top:16px;padding:10px 12px;
            border-radius:12px;background:#F7FAF9;border:1px solid #EDF2F0}
  .codeline .k{font-size:10.5px;color:#94A3B8;flex:none;letter-spacing:.3px}
  .codeline code{flex:1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;
                 font-weight:700;letter-spacing:1.2px;color:#1F2937;word-break:break-all}
  .cpy{flex:none;border:1px solid #E4EAE7;background:#fff;border-radius:8px;font-size:10.5px;
       padding:6px 10px;color:#556070;cursor:pointer;font-family:inherit;letter-spacing:.2px;
       transition:background .16s,border-color .16s}
  .cpy:active{background:#F3F7F5}

  /* 判断方法 */
  .how{list-style:none;counter-reset:h}
  .how li{counter-increment:h;position:relative;padding-left:29px;font-size:12.5px;color:#556070;
          line-height:1.78}
  .how li+li{margin-top:11px}
  .how li::before{content:counter(h);position:absolute;left:0;top:1px;width:18px;height:18px;
                  border-radius:50%;background:${rgba(brand_default(), 0.09)};color:var(--brand);
                  font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;
                  box-shadow:inset 0 0 0 1px ${rgba(brand_default(), 0.1)}}

  /* 底部 */
  .ft{padding:2px 14px calc(26px + env(safe-area-inset-bottom))}
  .cta{display:flex;align-items:center;justify-content:center;gap:8px;height:49px;border-radius:15px;
       background:linear-gradient(135deg,var(--brand),var(--brand-dark));color:#fff;text-decoration:none;
       font-size:14.5px;font-weight:600;letter-spacing:.2px;
       box-shadow:0 16px 30px -18px ${rgba(brand_default(), 0.95)},inset 0 1px 0 rgba(255,255,255,.22);
       transition:transform .16s ease,box-shadow .16s ease}
  .cta:active{transform:translateY(1px) scale(.995)}
  .cta em{font-style:normal;font-weight:700;letter-spacing:.6px}
  .hours{margin-top:10px;text-align:center;font-size:10.5px;color:var(--muted);letter-spacing:.4px}
  .powered{margin-top:12px;text-align:center;font-size:10px;color:#AEB6BF;line-height:1.7;letter-spacing:.2px}

  /* 动效 */
  .fade{animation:up .58s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*70ms)}
  @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){
    .fade,.seal::after{animation:none!important}
  }
  @media (max-width:360px){
    .wrap{padding:0 12px 4px}
    .card{padding:15px;border-radius:18px}
    .hero h1{font-size:19px}
  }

  /* 复制提示 */
  .toast{position:fixed;left:50%;bottom:34px;transform:translate(-50%,14px);opacity:0;
         background:rgba(15,23,42,.92);color:#fff;font-size:12.5px;padding:10px 18px;border-radius:22px;
         box-shadow:0 12px 30px -12px rgba(15,23,42,.7);letter-spacing:.2px;
         pointer-events:none;transition:opacity .22s,transform .22s;z-index:9}
  .toast.show{opacity:1;transform:translate(-50%,0)}
</style>
</head>
<body>
<div class="phone">
  <header class="hd">
    <div class="brand">
      <div class="logo">${
        data.tenant?.logoUrl
          ? `<img src="${esc(data.tenant.logoUrl)}" alt="">`
          : esc((company || '品').charAt(0))
      }</div>
      <div>
        <div class="co" id="coName">${esc(company)}</div>
        <div class="tag" data-t="tag"></div>
      </div>
    </div>
    <div class="langs" id="langs">
      <button data-lang="zh">中文</button>
      <button data-lang="en">EN</button>
      <button data-lang="es">ES</button>
    </div>
  </header>

  <main class="wrap">
    <section class="hero fade" style="--i:0">
      <div class="seal">${iconSvg(tone.icon)}</div>
      <h1 id="stateTitle">${esc(DICT.zh.states[state]?.title || '')}</h1>
      <p class="desc" id="stateDesc">${esc(DICT.zh.states[state]?.desc || '')}</p>
      ${stats.length ? `<div class="stats">${stats.join('')}</div>` : ''}
    </section>

    ${productBlock}
    ${traceBlock}
    ${howBlock}
  </main>

  ${footer}
</div>

<div class="toast" id="toast"></div>

<script>
(function(){
  var D = ${jsonForScript(DICT)};
  var M = ${jsonForScript(meta)};
  var STATE = ${jsonForScript(state)};
  var LANGS = ['zh','en','es'];
  var HTML_LANG = {zh:'zh-CN',en:'en',es:'es'};

  function pick(obj, lang){
    if(!obj) return null;
    return obj[lang] || obj.zh || null;
  }
  function t(lang, key){
    var d = D[lang] || D.zh;
    return d[key] != null ? d[key] : (D.zh[key] != null ? D.zh[key] : '');
  }
  function fmtDate(s, lang){
    if(!s) return '—';
    var d = new Date(String(s).replace(' ','T'));
    if(isNaN(d.getTime())) return s;
    // 纯日期（生产日期）不带时分，避免出现「00:00」
    // 注意：本文件是模板字符串，正则里的 \d 必须写成 \\d
    var dateOnly = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(s));
    try{
      return new Intl.DateTimeFormat(
        lang==='zh'?'zh-CN':(lang==='es'?'es-ES':'en-GB'),
        dateOnly
          ? {year:'numeric',month:'short',day:'2-digit'}
          : {year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}
      ).format(d);
    }catch(e){ return s; }
  }

  function apply(lang){
    if(LANGS.indexOf(lang) < 0) lang = 'zh';
    document.documentElement.lang = HTML_LANG[lang];

    // 静态文案
    document.querySelectorAll('[data-t]').forEach(function(el){
      var v = t(lang, el.getAttribute('data-t'));
      if(v) el.textContent = v;
    });

    // 文案模板（含占位符）
    document.querySelectorAll('[data-tpl]').forEach(function(el){
      var s = t(lang, el.getAttribute('data-tpl'));
      el.textContent = s.replace('{n}', el.getAttribute('data-n') || '');
    });

    // 时间
    document.querySelectorAll('[data-ts]').forEach(function(el){
      el.textContent = fmtDate(el.getAttribute('data-ts'), lang);
    });

    // 地域：服务器返回的已知值翻译，未知值原样展示
    document.querySelectorAll('[data-region]').forEach(function(el){
      var raw = el.getAttribute('data-region');
      el.textContent = raw === '本地网络' ? t(lang, 'localNetwork') : raw;
    });

    // 状态标题与说明
    var st = (D[lang] && D[lang].states && D[lang].states[STATE]) || D.zh.states[STATE];
    if(st){
      var h = document.getElementById('stateTitle');
      var d = document.getElementById('stateDesc');
      if(h) h.textContent = st.title;
      if(d) d.textContent = st.desc;
    }

    // 公司名
    var co = document.getElementById('coName');
    if(co){
      var tt = pick(M.tenant, lang);
      co.textContent = (tt && tt.company_name) || M.company || '';
    }

    // 产品名 / 分类 / 描述
    var p = pick(M.product, lang);
    var n = document.getElementById('mName');
    if(n) n.textContent = (p && p.model_name) || M.productName || '';
    var c = document.getElementById('mCat');
    if(c) c.textContent = (p && p.category) || M.category || '';
    var ds = document.getElementById('mDesc');
    if(ds) ds.textContent = (p && p.description) || M.description || '';

    // 参数名
    document.querySelectorAll('[data-pkey]').forEach(function(el){
      var key = el.getAttribute('data-pkey');
      var item = null;
      for(var i=0;i<M.params.length;i++){ if(M.params[i].key === key){ item = M.params[i]; break; } }
      if(!item) return;
      var tr = pick(item.i18n, lang);
      el.textContent = tr || item.label || key;
    });

    // 参数分组名
    document.querySelectorAll('[data-gkey]').forEach(function(el){
      var key = el.getAttribute('data-gkey');
      var g = null;
      for(var i=0;i<M.groups.length;i++){ if(M.groups[i].key === key){ g = M.groups[i]; break; } }
      if(!g) return;
      var tr = pick(g.i18n, lang);
      el.textContent = tr || g.label || key;
    });

    // 核心卖点
    document.querySelectorAll('[data-hl]').forEach(function(el){
      var hl = M.highlights[Number(el.getAttribute('data-hl'))];
      if(!hl) return;
      el.textContent = pick(hl, lang) || hl.zh || hl.en || '';
    });

    // 判断方法列表
    var how = document.getElementById('howList');
    if(how){
      var arr = D[lang] ? D[lang].how : D.zh.how;
      how.innerHTML = '';
      arr.forEach(function(s){
        var li = document.createElement('li');
        li.textContent = s;
        how.appendChild(li);
      });
    }

    // 标题栏与浏览器标签页同步
    var coEl = document.getElementById('coName');
    document.title = (coEl ? coEl.textContent : '') + ' · ' + (st ? st.title : '');

    // 语言按钮态
    document.querySelectorAll('#langs button').forEach(function(b){
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    try{ localStorage.setItem('qr_lang', lang); }catch(e){}
  }

  document.querySelectorAll('#langs button').forEach(function(b){
    b.addEventListener('click', function(){ apply(b.getAttribute('data-lang')); });
  });

  // 复制防伪码
  var cpy = document.getElementById('cpyBtn');
  var toast = document.getElementById('toast');
  if(cpy){
    cpy.addEventListener('click', function(){
      var code = (document.getElementById('rawCode')||{}).textContent || '';
      var done = function(){
        toast.textContent = t(currentLang, 'copied');
        toast.classList.add('show');
        setTimeout(function(){ toast.classList.remove('show'); }, 1400);
      };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(done).catch(done);
      }else{
        var ta = document.createElement('textarea');
        ta.value = code; document.body.appendChild(ta); ta.select();
        try{ document.execCommand('copy'); }catch(e){}
        document.body.removeChild(ta);
        done();
      }
    });
  }

  // 初始语言：上次选择 > 浏览器语言 > 中文
  var saved = null;
  try{ saved = localStorage.getItem('qr_lang'); }catch(e){}
  var nav = (navigator.language || 'zh').toLowerCase();
  var auto = nav.indexOf('zh') === 0 ? 'zh' : (nav.indexOf('es') === 0 ? 'es' : 'en');
  var currentLang = saved && LANGS.indexOf(saved) >= 0 ? saved : auto;
  window.__setLang = apply;
  apply(currentLang);

  // 页面内 1 秒后把 URL 上的 lang 参数同步，便于分享指定语言
  try{
    var u = new URL(location.href);
    if(u.searchParams.get('lang') && LANGS.indexOf(u.searchParams.get('lang')) >= 0){
      currentLang = u.searchParams.get('lang');
      apply(currentLang);
    }
  }catch(e){}
})();
</script>
</body>
</html>`;
}

/** 默认品牌色，集中一处便于换默认值 */
function brand_default() {
  return '#1D9E75';
}

export default { renderScanPage };
