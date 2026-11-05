/**
 * DPP 数字产品护照页（ESPR / Regulation (EU) 2024/1781）
 *
 * 合规要点落在这里：
 *  - 必填字段全部渲染，没有数据也占位（— / 未提供），审核时字段可核对
 *  - 语义化 HTML + 跳过导航链接 + 表格 caption/scope + 状态用「图标 + 文字」
 *  - 中英双语由服务端渲染（?lang=en），语言切换是真实链接，不依赖 JS
 *  - 页面无任何前端脚本：无障碍与稳定性优先
 */

const T = {
  zh: {
    docTitle: '数字产品护照',
    subtitle: '依据 ESPR（EU）2024/1781 的产品数字档案',
    skip: '跳到主要内容',
    langZh: '中文',
    langEn: 'English',
    toc: '目录',
    status: '档案状态',
    version: '档案版本',
    updated: '最后更新',
    dppId: '护照标识（DPP ID）',
    registry: 'Registry 索引',
    registryPending: '尚未上报欧盟中央 Registry',
    secOverview: '基本信息',
    secIdentity: '产品标识',
    secResponsible: '制造商与责任主体',
    secMaterials: '物料成分（BOM）',
    secBattery: '电池性能与碳足迹',
    secDocs: '合规文件',
    secRepair: '维修与拆解',
    secRecycle: '回收处置',
    secMachine: '机器可读数据',
    sku: 'SKU',
    model: '型号',
    batch: '批次号',
    serial: '序列号',
    category: '品类',
    origin: '原产地',
    manufacturer: '制造商',
    address: '注册地址',
    trademark: '注册商标',
    eori: 'EORI 号',
    euRep: '欧盟授权代表',
    euRepAddress: '代表地址',
    euRepContact: '代表联系方式',
    contact: '联系方式',
    material: '材料',
    weight: '重量',
    recycled: '回收材料比例',
    materialOrigin: '材料来源',
    bomEmpty: '尚未录入物料清单',
    docName: '文件名称',
    docNo: '编号',
    docIssuer: '签发机构',
    docDate: '签发日期',
    docFile: '文件',
    download: '下载',
    docsEmpty: '尚未上传合规文件',
    chemistry: '化学体系',
    capacity: '额定容量',
    cycleLife: '循环寿命 / 耐久',
    carbon: '碳足迹',
    batteryNA: '该品类不适用电池专项字段',
    spareParts: '备件供应年限',
    repairSteps: '维修步骤',
    dismantle: '拆解说明',
    tools: '所需工具',
    recycleChannel: '回收渠道',
    recycleNote: '处置要求',
    machineDesc:
      '同一地址按请求头返回不同格式：浏览器得到本页面，机读客户端（Accept: application/ld+json）得到 JSON-LD 结构化档案。',
    machineLink: '查看 JSON-LD（同一 URL，Accept 协商）',
    noGuide: '尚未提供',
    notProvided: '未提供',
    dashLabel: '未提供',
    scans: '本护照累计访问',
    footer:
      '本页面为演示档案，数据为示例，不构成合规结论。正式上报需替换为 EN 18xxx 标准 vocabulary 并在欧盟 Registry 完成索引登记。',
    statusNormal: '正常在售',
    statusRecalled: '已召回',
    statusVoid: '已作废',
    recalledNote: '该产品已启动召回程序，请停止使用并联系供应商。',
  },
  en: {
    docTitle: 'Digital Product Passport',
    subtitle: 'Product data record under ESPR (EU) 2024/1781',
    skip: 'Skip to main content',
    langZh: '中文',
    langEn: 'English',
    toc: 'Contents',
    status: 'Passport status',
    version: 'Version',
    updated: 'Last updated',
    dppId: 'Passport identifier (DPP ID)',
    registry: 'Registry record',
    registryPending: 'Not yet submitted to the EU central registry',
    secOverview: 'Overview',
    secIdentity: 'Product identification',
    secResponsible: 'Manufacturer and responsible operator',
    secMaterials: 'Bill of materials',
    secBattery: 'Battery performance and carbon footprint',
    secDocs: 'Conformity documents',
    secRepair: 'Repair and dismantling',
    secRecycle: 'Recycling and disposal',
    secMachine: 'Machine-readable data',
    sku: 'SKU',
    model: 'Model',
    batch: 'Batch number',
    serial: 'Serial number',
    category: 'Category',
    origin: 'Country of origin',
    manufacturer: 'Manufacturer',
    address: 'Registered address',
    trademark: 'Registered trademark',
    eori: 'EORI number',
    euRep: 'EU authorised representative',
    euRepAddress: 'Representative address',
    euRepContact: 'Representative contact',
    contact: 'Contact',
    material: 'Material',
    weight: 'Weight',
    recycled: 'Recycled content',
    materialOrigin: 'Material origin',
    bomEmpty: 'No bill of materials recorded yet',
    docName: 'Document',
    docNo: 'Number',
    docIssuer: 'Issued by',
    docDate: 'Date of issue',
    docFile: 'File',
    download: 'Download',
    docsEmpty: 'No conformity documents uploaded yet',
    chemistry: 'Chemistry',
    capacity: 'Rated capacity',
    cycleLife: 'Cycle life / durability',
    carbon: 'Carbon footprint',
    batteryNA: 'Battery-specific fields are not applicable to this category',
    spareParts: 'Spare parts availability',
    repairSteps: 'Repair steps',
    dismantle: 'Dismantling notes',
    tools: 'Required tools',
    recycleChannel: 'Take-back channel',
    recycleNote: 'Disposal requirements',
    machineDesc:
      'One URL, content negotiation: browsers receive this page, machine clients (Accept: application/ld+json) receive the JSON-LD record.',
    machineLink: 'View JSON-LD (same URL, Accept negotiation)',
    noGuide: 'Not provided',
    notProvided: 'Not provided',
    dashLabel: 'Not provided',
    scans: 'Passport visits',
    footer:
      'Demonstration record with sample data; not a statement of compliance. Production use must map to the EN 18xxx vocabulary and register the index in the EU registry.',
    statusNormal: 'Active',
    statusRecalled: 'Recalled',
    statusVoid: 'Void',
    recalledNote: 'This product is under recall. Stop using it and contact the supplier.',
  },
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ICONS = {
  check: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  bin: `<svg viewBox="0 0 64 64" width="46" height="46" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22h30l-3.4 30a4 4 0 01-4 3.6H21.4a4 4 0 01-4-3.6L14 22z"/><path d="M11 22h36"/><path d="M24 22v-5a3 3 0 013-3h4a3 3 0 013 3v5"/><path d="M24 30l10 16M34 30L24 46"/><path d="M50 10L12 54" stroke-width="3.6"/></g></svg>`,
  download: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0l-4-4m4 4l4-4M4 19h16"/></svg>`,
};

function fmtDate(s, lang) {
  if (!s) return null;
  const str = String(s);
  const d = new Date(str.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return str;
  const locale = lang === 'zh' ? 'zh-CN' : 'en-GB';
  try {
    const dateOnly = str.length === 10;
    return new Intl.DateTimeFormat(locale, dateOnly
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    ).format(d);
  } catch {
    return str;
  }
}

/** 键值行：有值显示值，无值显示"—"并带无障碍标签 */
function row(label, value, lang) {
  const empty = value === null || value === undefined || value === '';
  return `<div class="row">
    <dt>${esc(label)}</dt>
    <dd${empty ? ` class="empty" aria-label="${esc(T[lang].dashLabel)}"` : ''}>${empty ? '—' : value}</dd>
  </div>`;
}

export function renderDppPage(data, opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'zh';
  const t = T[lang];
  const baseUrl = opts.baseUrl || '';
  const dppUrl = `${baseUrl}/dpp/${encodeURIComponent(data.dppId)}`;
  const otherLang = lang === 'zh' ? 'en' : 'zh';
  const statusMeta = {
    normal: { icon: ICONS.check, text: t.statusNormal, cls: 'ok' },
    recalled: { icon: ICONS.alert, text: t.statusRecalled, cls: 'warn' },
    void: { icon: ICONS.cross, text: t.statusVoid, cls: 'bad' },
  }[data.status] || { icon: ICONS.alert, text: data.status, cls: 'warn' };

  const nameI18n = lang !== 'zh' && data.i18n && data.i18n[lang] ? data.i18n[lang] : null;
  const productName = (nameI18n && nameI18n.product_name) || data.productName;
  const providerName =
    (lang !== 'zh' && data.tenantI18n && data.tenantI18n[lang] && data.tenantI18n[lang].company_name) ||
    data.manufacturer?.name;

  const bomRows = (data.bom || []).length
    ? `<table class="tbl">
        <caption class="sr-only">${esc(t.secMaterials)}</caption>
        <thead><tr>
          <th scope="col">${esc(t.material)}</th>
          <th scope="col">${esc(t.weight)}</th>
          <th scope="col">${esc(t.recycled)}</th>
          <th scope="col">${esc(t.materialOrigin)}</th>
        </tr></thead>
        <tbody>${(data.bom || [])
          .map(
            (m) => `<tr>
              <th scope="row">${esc(m.material)}</th>
              <td>${m.weight ? esc(m.weight) : '—'}</td>
              <td>${m.recycledShare ? esc(m.recycledShare) : '—'}</td>
              <td>${m.origin ? esc(m.origin) : '—'}</td>
            </tr>`
          )
          .join('')}</tbody>
      </table>`
    : `<p class="none">${esc(t.bomEmpty)}</p>`;

  const docRows = (data.certificates || []).length
    ? `<table class="tbl">
        <caption class="sr-only">${esc(t.secDocs)}</caption>
        <thead><tr>
          <th scope="col">${esc(t.docName)}</th>
          <th scope="col">${esc(t.docNo)}</th>
          <th scope="col">${esc(t.docIssuer)}</th>
          <th scope="col">${esc(t.docDate)}</th>
          <th scope="col">${esc(t.docFile)}</th>
        </tr></thead>
        <tbody>${(data.certificates || [])
          .map(
            (c) => `<tr>
              <th scope="row">${esc(c.name)}</th>
              <td>${c.number ? esc(c.number) : '—'}</td>
              <td>${c.issuer ? esc(c.issuer) : '—'}</td>
              <td>${fmtDate(c.issuedAt, lang) || '—'}</td>
              <td>${
                c.url
                  ? `<a class="dl" href="${esc(c.url)}" target="_blank" rel="noopener">${ICONS.download}<span>${esc(t.download)}</span></a>`
                  : '—'
              }</td>
            </tr>`
          )
          .join('')}</tbody>
      </table>`
    : `<p class="none">${esc(t.docsEmpty)}</p>`;

  const isBattery = data.category === 'battery';
  const batteryBlock = isBattery
    ? `<dl class="kv">
        ${row(t.chemistry, data.battery?.chemistry, lang)}
        ${row(t.capacity, data.battery?.capacity, lang)}
        ${row(t.cycleLife, data.battery?.cycleLife, lang)}
        ${row(t.carbon, data.battery?.carbonFootprint, lang)}
      </dl>`
    : `<p class="none">${esc(t.batteryNA)}</p>`;

  const repairSteps = (data.repair?.steps || []).length
    ? `<ol class="steps">${data.repair.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`
    : `<p class="none">${esc(t.noGuide)}</p>`;

  const recalledBanner =
    data.status === 'recalled'
      ? `<div class="banner warn" role="alert">
          <span class="bi">${ICONS.alert}</span>
          <div><strong>${esc(t.statusRecalled)}</strong><p>${esc(data.statusNote || t.recalledNote)}</p></div>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
<meta name="robots" content="index,follow">
<title>${esc(productName)} · ${esc(t.docTitle)}</title>
<link rel="alternate" hreflang="zh" href="${esc(dppUrl)}?lang=zh">
<link rel="alternate" hreflang="en" href="${esc(dppUrl)}?lang=en">
<link rel="alternate" type="application/ld+json" href="${esc(dppUrl)}">
<style>
  *{box-sizing:border-box}
  :root{
    --ink:#111827; --body:#374151; --sub:#4B5563; --muted:#6B7280;
    --line:#E5E7EB; --line-soft:#F1F3F5;
    --ok-bg:#ECFDF3; --ok-fg:#05603A; --ok-bd:#A7E8C4;
    --warn-bg:#FFF7E6; --warn-fg:#8A4B00; --warn-bd:#F0C878;
    --bad-bg:#FEF2F2; --bad-fg:#991B1B; --bad-bd:#F2B8B8;
    --link:#0B4FCC;
  }
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:#F3F4F6;color:var(--ink);
       font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Segoe UI",Arial,sans-serif;
       font-size:16px;line-height:1.7;-webkit-font-smoothing:antialiased}
  /* 键盘可达性：明显的焦点环 */
  :focus-visible{outline:3px solid #0B4FCC;outline-offset:2px;border-radius:4px}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
           clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .skip{position:absolute;left:12px;top:-60px;z-index:20;background:#0B4FCC;color:#fff;
        padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600}
  .skip:focus{top:12px}

  .shell{max-width:860px;margin:0 auto;padding:0 16px 56px}
  .doc{background:#fff;border:1px solid var(--line);border-radius:6px;
       box-shadow:0 1px 2px rgba(17,24,39,.05);overflow:hidden}

  /* 文档头 */
  .masthead{padding:24px 28px 20px;border-bottom:2px solid var(--ink)}
  .topline{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .mark{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.6px;font-size:13px;
        text-transform:uppercase;color:var(--sub)}
  .mark .bi{display:flex;align-items:center;justify-content:center;width:30px;height:30px;
            border:1.5px solid var(--ink);border-radius:50%;color:var(--ink)}
  .langs{display:flex;gap:6px;font-size:14px}
  .langs a{color:var(--link);text-decoration:none;padding:4px 10px;border:1px solid var(--line);
           border-radius:6px;font-weight:600}
  .langs a[aria-current="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}
  h1{margin:16px 0 4px;font-size:26px;line-height:1.35;letter-spacing:-.2px}
  .sub{margin:0;color:var(--sub);font-size:14px}

  /* 状态条 */
  .statusbar{display:flex;flex-wrap:wrap;gap:10px 24px;margin-top:16px;padding-top:14px;
             border-top:1px solid var(--line-soft)}
  .badge{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:700;
         padding:5px 12px;border-radius:999px;border:1px solid}
  .badge.ok{background:var(--ok-bg);color:var(--ok-fg);border-color:var(--ok-bd)}
  .badge.warn{background:var(--warn-bg);color:var(--warn-fg);border-color:var(--warn-bd)}
  .badge.bad{background:var(--bad-bg);color:var(--bad-fg);border-color:var(--bad-bd)}
  .meta{font-size:13px;color:var(--muted)}
  .meta b{color:var(--body);font-weight:600}

  .banner{display:flex;gap:12px;margin:20px 28px 0;padding:14px 16px;border-radius:6px;
          border:1px solid var(--warn-bd);background:var(--warn-bg);color:var(--warn-fg)}
  .banner p{margin:4px 0 0;font-size:14px}

  /* 目录 */
  .toc{margin:22px 28px 0;padding:16px 18px;background:#FAFAFA;border:1px solid var(--line);border-radius:6px}
  .toc h2{margin:0 0 8px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)}
  .toc ol{margin:0;padding-left:20px;columns:2;column-gap:28px;font-size:14px}
  .toc li{margin:4px 0;break-inside:avoid}
  .toc a{color:var(--link);text-decoration:none}
  .toc a:hover{text-decoration:underline}

  section{padding:26px 28px;border-top:1px solid var(--line-soft)}
  section:first-of-type{border-top:0}
  section h2{display:flex;align-items:baseline;gap:10px;margin:0 0 16px;font-size:18px;letter-spacing:-.1px}
  section h2 .no{font-size:12px;font-weight:700;color:var(--muted);letter-spacing:1px;
                 border:1px solid var(--line);border-radius:4px;padding:1px 6px}

  dl.kv{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}
  .row{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--line-soft);min-width:0}
  .row dt{flex:0 0 130px;color:var(--muted);font-size:13.5px}
  .row dd{flex:1;margin:0;font-size:14.5px;color:var(--body);font-weight:500;word-break:break-word}
  .row dd.empty{color:#9CA3AF;font-weight:400}
  .row dd code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;letter-spacing:.3px}
  .row.full{grid-column:1/-1}

  .tbl{width:100%;border-collapse:collapse;font-size:14px}
  .tbl caption{text-align:left}
  .tbl th,.tbl td{padding:9px 10px;border-bottom:1px solid var(--line-soft);text-align:left;vertical-align:top}
  .tbl thead th{font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);
                border-bottom:1px solid var(--line);font-weight:700}
  .tbl tbody th{font-weight:600;color:var(--ink)}
  .tbl tbody td{color:var(--body)}
  .tbl tbody tr:last-child th,.tbl tbody tr:last-child td{border-bottom:0}
  .dl{display:inline-flex;align-items:center;gap:5px;color:var(--link);text-decoration:none;font-weight:600}

  .none{margin:0;padding:14px 16px;background:#FAFAFA;border:1px dashed var(--line);
        border-radius:6px;color:var(--muted);font-size:14px}
  .steps{margin:0;padding-left:22px;font-size:14.5px;color:var(--body)}
  .steps li{margin:6px 0}
  .subhead{margin:16px 0 6px;font-size:13px;font-weight:700;color:var(--muted);
           letter-spacing:.8px;text-transform:uppercase}
  .subhead:first-child{margin-top:0}

  .recycle{display:flex;gap:16px;align-items:flex-start;padding:16px;border:1px solid var(--line);
           border-radius:6px;background:#FAFAFA}
  .recycle .bi{flex:none;color:#0F5132}

  .machine{display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between}
  .machine p{margin:0;font-size:14px;color:var(--sub);max-width:520px}
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:#fff;
       text-decoration:none;font-size:14px;font-weight:600;padding:10px 16px;border-radius:6px}
  .btn:hover{background:#000}

  footer{padding:20px 28px 26px;border-top:1px solid var(--line);background:#FAFAFA}
  footer p{margin:0;font-size:12.5px;line-height:1.75;color:var(--muted)}
  .stamp{margin-top:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:#9CA3AF}

  @media (max-width:700px){
    dl.kv{grid-template-columns:1fr}
    .row dt{flex-basis:110px}
    .toc ol{columns:1}
    .masthead,section,footer{padding-left:18px;padding-right:18px}
    .banner,.toc{margin-left:18px;margin-right:18px}
    h1{font-size:22px}
    .tbl{display:block;overflow-x:auto;white-space:nowrap}
  }
  @media (prefers-reduced-motion:no-preference){
    .fade{animation:in .35s ease-out both}
    @keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  }
</style>
</head>
<body>
<a class="skip" href="#main">${esc(t.skip)}</a>

<div class="shell">
  <article class="doc">
    <header class="masthead">
      <div class="topline">
        <div class="mark"><span class="bi">${ICONS.shield}</span>${esc(t.docTitle)}</div>
        <nav class="langs" aria-label="${esc(t.langZh)} / ${esc(t.langEn)}">
          <a href="?lang=zh" hreflang="zh" lang="zh-CN"${lang === 'zh' ? ' aria-current="true"' : ''}>${esc(t.langZh)}</a>
          <a href="?lang=en" hreflang="en" lang="en"${lang === 'en' ? ' aria-current="true"' : ''}>${esc(t.langEn)}</a>
        </nav>
      </div>
      <h1>${esc(productName)}</h1>
      <p class="sub">${esc(t.subtitle)} · ${esc(providerName || '')}</p>

      <div class="statusbar">
        <span class="badge ${statusMeta.cls}">${statusMeta.icon}${esc(statusMeta.text)}</span>
        <span class="meta">${esc(t.version)} <b>${esc(data.version)}</b></span>
        <span class="meta">${esc(t.updated)} <b>${esc(fmtDate(data.updatedAt, lang) || '—')}</b></span>
        <span class="meta">${esc(t.scans)} <b>${data.scans}</b></span>
      </div>
    </header>

    ${recalledBanner}

    <nav class="toc" aria-labelledby="toc-h">
      <h2 id="toc-h">${esc(t.toc)}</h2>
      <ol>
        <li><a href="#sec-overview">${esc(t.secOverview)}</a></li>
        <li><a href="#sec-identity">${esc(t.secIdentity)}</a></li>
        <li><a href="#sec-responsible">${esc(t.secResponsible)}</a></li>
        <li><a href="#sec-materials">${esc(t.secMaterials)}</a></li>
        <li><a href="#sec-battery">${esc(t.secBattery)}</a></li>
        <li><a href="#sec-docs">${esc(t.secDocs)}</a></li>
        <li><a href="#sec-repair">${esc(t.secRepair)}</a></li>
        <li><a href="#sec-recycle">${esc(t.secRecycle)}</a></li>
        <li><a href="#sec-machine">${esc(t.secMachine)}</a></li>
      </ol>
    </nav>

    <main id="main">
      <section id="sec-overview" aria-labelledby="h-overview" class="fade">
        <h2 id="h-overview"><span class="no">01</span>${esc(t.secOverview)}</h2>
        <dl class="kv">
          ${row(t.dppId, `<code>${esc(data.dppId)}</code>`, lang)}
          ${row(t.version, esc(data.version), lang)}
          ${row(t.updated, esc(fmtDate(data.updatedAt, lang) || ''), lang)}
          ${row(t.status, esc(statusMeta.text), lang)}
          <div class="row full"><dt>${esc(t.registry)}</dt>
            <dd${data.registryUrl ? '' : ' class="empty"'}>${
              data.registryUrl
                ? `<a class="dl" href="${esc(data.registryUrl)}" target="_blank" rel="noopener">${esc(data.registryUrl)}</a>`
                : esc(t.registryPending)
            }</dd></div>
        </dl>
      </section>

      <section id="sec-identity" aria-labelledby="h-identity" class="fade">
        <h2 id="h-identity"><span class="no">02</span>${esc(t.secIdentity)}</h2>
        <dl class="kv">
          ${row(t.sku, esc(data.sku), lang)}
          ${row(t.model, `<code>${esc(data.modelCode || '')}</code>`, lang)}
          ${row(t.batch, esc(data.batchNo), lang)}
          ${row(t.serial, `<code>${esc(data.serial || '')}</code>`, lang)}
          ${row(t.category, esc(data.category), lang)}
          ${row(t.origin, esc(data.originCountry), lang)}
        </dl>
      </section>

      <section id="sec-responsible" aria-labelledby="h-responsible" class="fade">
        <h2 id="h-responsible"><span class="no">03</span>${esc(t.secResponsible)}</h2>
        <dl class="kv">
          ${row(t.manufacturer, esc(data.manufacturer?.name), lang)}
          ${row(t.address, esc(data.manufacturer?.address), lang)}
          ${row(t.trademark, esc(data.manufacturer?.trademark), lang)}
          ${row(t.contact, esc(data.manufacturer?.phone), lang)}
          ${row(t.eori, `<code>${esc(data.eori || '')}</code>`, lang)}
          ${row(t.euRep, esc(data.euRep?.name), lang)}
          ${row(t.euRepAddress, esc(data.euRep?.address), lang)}
          ${row(t.euRepContact, esc(data.euRep?.contact), lang)}
        </dl>
      </section>

      <section id="sec-materials" aria-labelledby="h-materials" class="fade">
        <h2 id="h-materials"><span class="no">04</span>${esc(t.secMaterials)}</h2>
        ${bomRows}
      </section>

      <section id="sec-battery" aria-labelledby="h-battery" class="fade">
        <h2 id="h-battery"><span class="no">05</span>${esc(t.secBattery)}</h2>
        ${batteryBlock}
      </section>

      <section id="sec-docs" aria-labelledby="h-docs" class="fade">
        <h2 id="h-docs"><span class="no">06</span>${esc(t.secDocs)}</h2>
        ${docRows}
      </section>

      <section id="sec-repair" aria-labelledby="h-repair" class="fade">
        <h2 id="h-repair"><span class="no">07</span>${esc(t.secRepair)}</h2>
        <dl class="kv">
          ${row(t.spareParts, esc(data.repair?.sparePartsYears), lang)}
          ${row(t.dismantle, esc(data.dismantle?.notes), lang)}
          ${row(t.tools, (data.dismantle?.tools || []).length
            ? esc(data.dismantle.tools.join(' · '))
            : '', lang)}
        </dl>
        <p class="subhead">${esc(t.repairSteps)}</p>
        ${repairSteps}
      </section>

      <section id="sec-recycle" aria-labelledby="h-recycle" class="fade">
        <h2 id="h-recycle"><span class="no">08</span>${esc(t.secRecycle)}</h2>
        <div class="recycle">
          <span class="bi">${ICONS.bin}</span>
          <dl class="kv" style="flex:1">
            ${row(t.recycleChannel, esc(data.recycle?.takeBack), lang)}
            ${row(t.recycleNote, esc(data.recycle?.notes), lang)}
          </dl>
        </div>
      </section>

      <section id="sec-machine" aria-labelledby="h-machine" class="fade">
        <h2 id="h-machine"><span class="no">09</span>${esc(t.secMachine)}</h2>
        <div class="machine">
          <p>${esc(t.machineDesc)}</p>
          <a class="btn" href="${esc(dppUrl)}" hreflang="en" type="application/ld+json">${esc(t.machineLink)}</a>
        </div>
        <p class="subhead">application/ld+json</p>
        <p class="none" style="font-family:ui-monospace,Menlo,monospace;font-size:12.5px;word-break:break-all">
          curl -H 'Accept: application/ld+json' ${esc(dppUrl)}
        </p>
      </section>
    </main>

    <footer>
      <p>${esc(t.footer)}</p>
      <p class="stamp">${esc(data.dppId)} · v${esc(data.version)} · ${esc(data.status)} · ${esc(fmtDate(data.updatedAt, lang) || '')}</p>
    </footer>
  </article>
</div>
</body>
</html>`;
}

export function renderDppNotFound(lang = 'zh') {
  const t = T[lang === 'en' ? 'en' : 'zh'];
  return `<!DOCTYPE html><html lang="${lang === 'en' ? 'en' : 'zh-CN'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
<title>404 · ${esc(t.docTitle)}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#F3F4F6;font-family:-apple-system,"PingFang SC",Arial,sans-serif;color:#111827}
.box{background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:32px;max-width:360px;text-align:center}
h1{font-size:18px;margin:0 0 8px}p{font-size:14px;color:#4B5563;margin:0}</style></head>
<body><div class="box"><h1>404</h1><p>${esc(t.docTitle)} · 未找到该护照档案 / Passport record not found</p></div></body></html>`;
}

export default { renderDppPage, renderDppNotFound };
