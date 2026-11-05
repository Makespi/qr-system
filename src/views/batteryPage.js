/**
 * 电池合规落地页（Regulation (EU) 2023/1542, Article 13(6)）
 *
 * 扫码后看到的唯一页面，固定包含 5 个合规模块：
 *   ① 产品信息  ② 制造商信息  ③ 关键原材料  ④ 废弃处理说明  ⑤ EU 符合性声明
 * 多语言切换（中/英/德/法/西/意），纯前端切换，无额外请求。
 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------- 多语言
const LANGS = ['zh', 'en', 'de', 'fr', 'es', 'it'];

const DICT = {
  zh: {
    title: '电池合规信息',
    secProduct: '产品信息',
    secManufacturer: '制造商信息',
    secMaterials: '关键原材料',
    secWaste: '废弃处理说明',
    secDoc: 'EU 符合性声明 (DoC)',
    labelModel: '型号',
    labelChemistry: '化学体系',
    labelVoltage: '额定电压',
    labelCapacity: '额定容量',
    labelCategory: '电池类别',
    labelBatch: '生产批次',
    labelProductionDate: '生产日期',
    labelSerial: '序列号',
    labelTrademark: '注册商标',
    labelAddress: '注册地址',
    labelContact: '联系方式',
    labelMaterial: '材料',
    labelRecycled: '回收含量占比',
    labelDocNo: '声明编号',
    labelIssuedAt: '签发日期',
    labelStandards: '适用标准',
    labelSigner: '签署人',
    labelPlace: '签发地点',
    downloadDoc: '下载符合性声明 PDF',
    wasteText:
      '本产品内含锂电池。废弃时请勿与未分类生活垃圾一起丢弃，应交由指定的单独收集点回收处理。',
    wasteNote: '单独收集 · 循环利用 · 请勿混入生活垃圾',
    serialUnknown: '该序列号未登记，以下为型号级合规信息。',
    demoNote:
      '本页面为演示用途，数据为示例，不构成合规意见。法规依据：Regulation (EU) 2023/1542 第 13(6) 条（2027 年 2 月 18 日起适用）。电池二维码 ≠ 电池护照（第 77 条）。',
    materialsFootnote: '* 回收含量占比为演示示例值，实际申报比例与时间以法规要求为准。',
    scansLabel: '本型号累计被查询',
  },
  en: {
    title: 'Battery compliance information',
    secProduct: 'Product information',
    secManufacturer: 'Manufacturer information',
    secMaterials: 'Critical raw materials',
    secWaste: 'Waste disposal instructions',
    secDoc: 'EU Declaration of Conformity (DoC)',
    labelModel: 'Model',
    labelChemistry: 'Chemistry',
    labelVoltage: 'Rated voltage',
    labelCapacity: 'Rated capacity',
    labelCategory: 'Battery category',
    labelBatch: 'Batch',
    labelProductionDate: 'Production date',
    labelSerial: 'Serial number',
    labelTrademark: 'Registered trademark',
    labelAddress: 'Registered address',
    labelContact: 'Contact',
    labelMaterial: 'Material',
    labelRecycled: 'Recycled content share',
    labelDocNo: 'DoC number',
    labelIssuedAt: 'Date of issue',
    labelStandards: 'Applied standards',
    labelSigner: 'Signatory',
    labelPlace: 'Place of issue',
    downloadDoc: 'Download DoC (PDF)',
    wasteText:
      'This product contains a lithium battery. Do not dispose of it with unsorted municipal waste; return it to a designated separate collection point for recycling.',
    wasteNote: 'Separate collection · Recycle · Keep out of household waste',
    serialUnknown: 'This serial number is not registered. Model-level information is shown below.',
    demoNote:
      'This page is a demonstration with sample data and does not constitute legal advice. Legal basis: Regulation (EU) 2023/1542, Article 13(6) (applicable from 18 February 2027). The battery QR code is not the battery passport (Article 77).',
    materialsFootnote: '* Recycled content shares are sample values for demonstration; actual reporting follows the regulation timeline.',
    scansLabel: 'Total lookups for this model',
  },
  de: {
    title: 'Batterie-Compliance-Informationen',
    secProduct: 'Produktinformationen',
    secManufacturer: 'Herstellerinformationen',
    secMaterials: 'Kritische Rohstoffe',
    secWaste: 'Entsorgungshinweise',
    secDoc: 'EU-Konformitätserklärung (DoC)',
    labelModel: 'Modell',
    labelChemistry: 'Chemisches System',
    labelVoltage: 'Nennspannung',
    labelCapacity: 'Nennkapazität',
    labelCategory: 'Batteriekategorie',
    labelBatch: 'Charge',
    labelProductionDate: 'Herstellungsdatum',
    labelSerial: 'Seriennummer',
    labelTrademark: 'Eingetragenes Warenzeichen',
    labelAddress: 'Eingetragene Adresse',
    labelContact: 'Kontakt',
    labelMaterial: 'Werkstoff',
    labelRecycled: 'Recyclinganteil',
    labelDocNo: 'Nr. der Konformitätserklärung',
    labelIssuedAt: 'Ausstellungsdatum',
    labelStandards: 'Angewandte Normen',
    labelSigner: 'Unterzeichner',
    labelPlace: 'Ausstellungsort',
    downloadDoc: 'Konformitätserklärung (PDF) herunterladen',
    wasteText:
      'Dieses Produkt enthält eine Lithium-Batterie. Nicht über den unsortierten Siedlungsabfall entsorgen, sondern an einer ausgewiesenen getrennten Sammelstelle zurückgeben.',
    wasteNote: 'Getrennte Sammlung · Recyceln · Nicht in den Hausmüll',
    serialUnknown: 'Diese Seriennummer ist nicht registriert. Nachfolgend die Informationen auf Modellebene.',
    demoNote:
      'Diese Seite dient der Demonstration mit Beispieldaten und stellt keine Rechtsberatung dar. Rechtsgrundlage: Verordnung (EU) 2023/1542, Artikel 13 Abs. 6 (anwendbar ab 18. Februar 2027). Der Batterie-QR-Code ist nicht der Batteriepass (Artikel 77).',
    materialsFootnote: '* Recyclinganteile sind Beispielwerte zur Demonstration; die tatsächliche Berichterstattung folgt dem Zeitplan der Verordnung.',
    scansLabel: 'Abfragen zu diesem Modell',
  },
  fr: {
    title: 'Informations de conformité de la batterie',
    secProduct: 'Informations produit',
    secManufacturer: 'Informations sur le fabricant',
    secMaterials: 'Matières premières critiques',
    secWaste: "Instructions d'élimination",
    secDoc: 'Déclaration UE de conformité (DoC)',
    labelModel: 'Modèle',
    labelChemistry: 'Chimie',
    labelVoltage: 'Tension nominale',
    labelCapacity: 'Capacité nominale',
    labelCategory: 'Catégorie de batterie',
    labelBatch: 'Lot',
    labelProductionDate: 'Date de production',
    labelSerial: 'Numéro de série',
    labelTrademark: 'Marque déposée',
    labelAddress: 'Adresse enregistrée',
    labelContact: 'Contact',
    labelMaterial: 'Matière',
    labelRecycled: 'Teneur en matière recyclée',
    labelDocNo: 'N° de déclaration',
    labelIssuedAt: "Date d'émission",
    labelStandards: 'Normes appliquées',
    labelSigner: 'Signataire',
    labelPlace: "Lieu d'émission",
    downloadDoc: 'Télécharger la déclaration (PDF)',
    wasteText:
      "Ce produit contient une batterie au lithium. Ne la jetez pas avec les déchets ménagers non triés ; rapportez-la à un point de collecte séparée désigné.",
    wasteNote: 'Collecte séparée · Recyclage · Pas dans les ordures ménagères',
    serialUnknown: "Ce numéro de série n'est pas enregistré. Les informations au niveau du modèle sont affichées ci-dessous.",
    demoNote:
      "Cette page est une démonstration avec des données d'exemple et ne constitue pas un avis juridique. Base juridique : règlement (UE) 2023/1542, article 13, paragraphe 6 (applicable à partir du 18 février 2027). Le QR code batterie n'est pas le passeport batterie (article 77).",
    materialsFootnote: "* Les teneurs en matière recyclée sont des valeurs d'exemple ; la déclaration réelle suit le calendrier du règlement.",
    scansLabel: 'Consultations pour ce modèle',
  },
  es: {
    title: 'Información de conformidad de la batería',
    secProduct: 'Información del producto',
    secManufacturer: 'Información del fabricante',
    secMaterials: 'Materias primas críticas',
    secWaste: 'Instrucciones de eliminación',
    secDoc: 'Declaración UE de conformidad (DoC)',
    labelModel: 'Modelo',
    labelChemistry: 'Sistema químico',
    labelVoltage: 'Tensión nominal',
    labelCapacity: 'Capacidad nominal',
    labelCategory: 'Categoría de batería',
    labelBatch: 'Lote',
    labelProductionDate: 'Fecha de producción',
    labelSerial: 'Número de serie',
    labelTrademark: 'Marca registrada',
    labelAddress: 'Dirección registrada',
    labelContact: 'Contacto',
    labelMaterial: 'Material',
    labelRecycled: 'Proporción de material reciclado',
    labelDocNo: 'N.º de declaración',
    labelIssuedAt: 'Fecha de emisión',
    labelStandards: 'Normas aplicadas',
    labelSigner: 'Firmante',
    labelPlace: 'Lugar de emisión',
    downloadDoc: 'Descargar declaración (PDF)',
    wasteText:
      'Este producto contiene una batería de litio. No la deseche con los residuos domésticos sin clasificar; entréguela en un punto de recogida selectiva designado.',
    wasteNote: 'Recogida selectiva · Reciclaje · Fuera de los residuos domésticos',
    serialUnknown: 'Este número de serie no está registrado. Se muestra la información a nivel de modelo.',
    demoNote:
      'Esta página es una demostración con datos de ejemplo y no constituye asesoramiento jurídico. Base jurídica: Reglamento (UE) 2023/1542, artículo 13, apartado 6 (aplicable desde el 18 de febrero de 2027). El código QR de la batería no es el pasaporte de la batería (artículo 77).',
    materialsFootnote: '* Las proporciones de material reciclado son valores de ejemplo; la declaración real sigue el calendario del reglamento.',
    scansLabel: 'Consultas de este modelo',
  },
  it: {
    title: 'Informazioni di conformità della batteria',
    secProduct: 'Informazioni sul prodotto',
    secManufacturer: 'Informazioni sul fabbricante',
    secMaterials: 'Materie prime critiche',
    secWaste: 'Istruzioni per lo smaltimento',
    secDoc: 'Dichiarazione UE di conformità (DoC)',
    labelModel: 'Modello',
    labelChemistry: 'Sistema chimico',
    labelVoltage: 'Tensione nominale',
    labelCapacity: 'Capacità nominale',
    labelCategory: 'Categoria di batteria',
    labelBatch: 'Lotto',
    labelProductionDate: 'Data di produzione',
    labelSerial: 'Numero di serie',
    labelTrademark: 'Marchio registrato',
    labelAddress: 'Indirizzo registrato',
    labelContact: 'Contatti',
    labelMaterial: 'Materia',
    labelRecycled: 'Quota di materiale riciclato',
    labelDocNo: 'N. della dichiarazione',
    labelIssuedAt: 'Data di emissione',
    labelStandards: 'Norme applicate',
    labelSigner: 'Firmatario',
    labelPlace: 'Luogo di emissione',
    downloadDoc: 'Scarica la dichiarazione (PDF)',
    wasteText:
      'Questo prodotto contiene una batteria al litio. Non smaltirla nei rifiuti urbani indifferenziati; consegnarla a un punto di raccolta differenziata designato.',
    wasteNote: 'Raccolta differenziata · Riciclo · Non nei rifiuti domestici',
    serialUnknown: 'Questo numero di serie non è registrato. Di seguito le informazioni a livello di modello.',
    demoNote:
      'Questa pagina è una dimostrazione con dati di esempio e non costituisce consulenza legale. Base giuridica: regolamento (UE) 2023/1542, articolo 13, paragrafo 6 (applicabile dal 18 febbraio 2027). Il codice QR della batteria non è il passaporto della batteria (articolo 77).',
    materialsFootnote: '* Le quote di materiale riciclato sono valori di esempio; la dichiarazione reale segue il calendario del regolamento.',
    scansLabel: 'Consultazioni per questo modello',
  },
};

/** 值字典：化学体系 / 类别 / 材料名 */
const VALUES = {
  chemistry: {
    'li-ion': {
      zh: '锂离子电池（Li-ion）',
      en: 'Lithium-ion (Li-ion)',
      de: 'Lithium-Ionen (Li-Ion)',
      fr: 'Lithium-ion (Li-ion)',
      es: 'Iones de litio (Li-ion)',
      it: 'Ioni di litio (Li-ion)',
    },
  },
  category: {
    portable: {
      zh: '便携式电池（含在设备中）',
      en: 'Portable battery (contained in equipment)',
      de: 'Tragbare Batterie (in Gerät enthalten)',
      fr: 'Batterie portable (incorporée dans un équipement)',
      es: 'Batería portátil (incorporada en un equipo)',
      it: 'Batteria portatile (incorporata in un apparecchio)',
    },
    ev: { zh: '电动汽车电池', en: 'EV battery', de: 'EV-Batterie', fr: 'Batterie de VE', es: 'Batería de VE', it: 'Batteria per VE' },
    lmt: { zh: '轻型交通工具电池', en: 'LMT battery', de: 'LMT-Batterie', fr: 'Batterie LMT', es: 'Batería LMT', it: 'Batteria LMT' },
    industrial: { zh: '工业电池', en: 'Industrial battery', de: 'Industriebatterie', fr: 'Batterie industrielle', es: 'Batería industrial', it: 'Batteria industriale' },
  },
  material: {
    cobalt: { zh: '钴', en: 'Cobalt', de: 'Kobalt', fr: 'Cobalt', es: 'Cobalto', it: 'Cobalto' },
    lithium: { zh: '锂', en: 'Lithium', de: 'Lithium', fr: 'Lithium', es: 'Litio', it: 'Litio' },
    nickel: { zh: '镍', en: 'Nickel', de: 'Nickel', fr: 'Nickel', es: 'Níquel', it: 'Nichel' },
    manganese: { zh: '锰', en: 'Manganese', de: 'Mangan', fr: 'Manganèse', es: 'Manganeso', it: 'Manganese' },
    graphite: { zh: '天然石墨', en: 'Natural graphite', de: 'Naturgraphit', fr: 'Graphite naturel', es: 'Grafito natural', it: 'Grafite naturale' },
    copper: { zh: '铜', en: 'Copper', de: 'Kupfer', fr: 'Cuivre', es: 'Cobre', it: 'Rame' },
    aluminum: { zh: '铝', en: 'Aluminium', de: 'Aluminium', fr: 'Aluminium', es: 'Aluminio', it: 'Alluminio' },
  },
};

const LANG_NAMES = { zh: '中文', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', it: 'Italiano' };

// 废弃电池符号：带叉的轮式垃圾桶（WEEE / 单独收集标志）
const WEEE_SVG = `<svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 22h30l-3.4 30a4 4 0 01-4 3.6H21.4a4 4 0 01-4-3.6L14 22z"/>
    <path d="M11 22h36"/>
    <path d="M24 22v-5a3 3 0 013-3h4a3 3 0 013 3v5"/>
    <path d="M24 30l10 16M34 30L24 46"/>
    <path d="M50 10L12 54" stroke-width="4"/>
  </g>
</svg>`;

const BATTERY_SVG = `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="8" width="15" height="9" rx="2"/><path d="M18 11h2a1 1 0 011 1v1a1 1 0 01-1 1h-2"/>
  <path d="M7 12h.01M11 12h.01"/>
</svg>`;

const DOWNLOAD_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16"/>
</svg>`;

function fmtDate(s, lang) {
  if (!s) return '—';
  const str = String(s);
  // 纯日期（生产日期/签发日期）不带时分
  const parts = str.split('-');
  const dateOnly = str.length === 10 && parts.length === 3;
  const d = new Date(str.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return str;
  try {
    const locale = { zh: 'zh-CN', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', it: 'it-IT' }[lang] || 'en-GB';
    return new Intl.DateTimeFormat(
      locale,
      dateOnly ? { year: 'numeric', month: 'short', day: '2-digit' } : { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    ).format(d);
  } catch {
    return str;
  }
}

export function renderBatteryPage(data, baseUrl) {
  if (data.state === 'not_found') {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Battery not found</title><style>body{font-family:-apple-system,"PingFang SC",sans-serif;background:#F4F6F5;
display:flex;align-items:center;justify-content:center;min-height:100vh;color:#334155}
.box{background:#fff;border-radius:18px;padding:36px 30px;text-align:center;max-width:320px;
box-shadow:0 12px 30px -18px rgba(15,23,42,.4)}h1{font-size:18px;margin:0 0 8px}p{font-size:13px;color:#64748B;margin:0}</style>
</head><body><div class="box"><h1>Battery / model not found</h1>
<p>The QR code does not match a registered battery model. · 二维码未匹配到已登记的电池型号</p></div></body></html>`;
  }

  const { model, tenant, doc } = data;
  const brand = tenant.brandColor || '#1C64F2';
  const serial = data.serialInfo?.serial || (data.state === 'serial_unknown' ? null : null);
  const serialGiven = data.state === 'serial' || data.state === 'serial_unknown';

  const initialLang = 'zh';
  const T = DICT[initialLang];

  // 模型名多语言：前端按语言切换
  const meta = {
    modelName: model.modelName,
    modelI18n: model.i18n || {},
    companyI18n: tenant.i18n || {},
    serialGiven,
    serialUnknown: data.state === 'serial_unknown',
  };

  // ---- 模块① 产品信息
  const productCells = [
    { k: 'labelModel', v: `<code class="mcode">${esc(model.modelCode)}</code>` },
    { k: 'labelChemistry', vkey: `chemistry.${model.chemistry}`, v: esc(model.chemistry) },
    { k: 'labelVoltage', v: esc(model.ratedVoltage || '—') },
    { k: 'labelCapacity', v: esc(model.ratedCapacity || '—') },
    { k: 'labelCategory', vkey: `category.${model.category}`, v: esc(model.category) },
    { k: 'labelBatch', v: esc(data.serialInfo?.batchNo || '—') },
    { k: 'labelProductionDate', v: esc(fmtDate(data.serialInfo?.productionDate, initialLang)), ts: data.serialInfo?.productionDate || '' },
    { k: 'labelSerial', v: serial ? `<code class="mcode">${esc(serial)}</code>` : '—', serial: Boolean(serial) },
  ]
    .map(
      (c) => `<div class="pc${c.serial ? ' wide' : ''}">
        <span class="pl" data-i18n="${c.k}">${esc(T[c.k])}</span>
        <b class="pv"${c.vkey ? ` data-vkey="${c.vkey}"` : ''}${c.ts ? ` data-ts="${esc(c.ts)}"` : ''}>${c.v}</b>
      </div>`
    )
    .join('');

  const serialNote =
    data.state === 'serial_unknown'
      ? `<div class="warn" data-i18n="serialUnknown">${esc(T.serialUnknown)}</div>`
      : '';

  // ---- 模块③ 关键原材料
  const materialRows = (model.materials || [])
    .map(
      (m) => `<tr>
        <td><span data-vkey="material.${esc(m.key)}">${esc(VALUES.material[m.key]?.zh || m.key)}</span></td>
        <td>${esc(m.share ?? '—')}</td>
      </tr>`
    )
    .join('');
  const materialsBlock = materialRows
    ? `<table class="mtab">
        <thead><tr><th data-i18n="labelMaterial">${esc(T.labelMaterial)}</th>
        <th data-i18n="labelRecycled">${esc(T.labelRecycled)}</th></tr></thead>
        <tbody>${materialRows}</tbody>
      </table>
      <p class="foot" data-i18n="materialsFootnote">${esc(T.materialsFootnote)}</p>`
    : `<p class="foot">—</p>`;

  // ---- 模块⑤ DoC
  const docBlock = doc
    ? `<div class="doc">
        <div class="drow"><span data-i18n="labelDocNo">${esc(T.labelDocNo)}</span><b>${esc(doc.docNo)}</b></div>
        <div class="drow"><span data-i18n="labelIssuedAt">${esc(T.labelIssuedAt)}</span>
          <b data-ts="${esc(doc.issuedAt || '')}">${esc(fmtDate(doc.issuedAt, initialLang))}</b></div>
        <div class="drow"><span data-i18n="labelStandards">${esc(T.labelStandards)}</span></div>
        <div class="stds">${(doc.standards || [])
          .map((s) => `<span class="std">${esc(s)}</span>`)
          .join('')}</div>
        <div class="drow"><span data-i18n="labelSigner">${esc(T.labelSigner)}</span>
          <b>${esc(doc.signerName || '—')}${doc.signerRole ? ` · ${esc(doc.signerRole)}` : ''}</b></div>
        <div class="drow"><span data-i18n="labelPlace">${esc(T.labelPlace)}</span><b>${esc(doc.place || '—')}</b></div>
        <a class="cta" href="/b/${esc(model.modelCode)}/doc.pdf" target="_blank">
          ${DOWNLOAD_SVG}<span data-i18n="downloadDoc">${esc(T.downloadDoc)}</span>
        </a>
        <p class="foot">EN · PDF · generated on demand</p>
      </div>`
    : `<p class="foot">DoC 未登记</p>`;

  const langBtns = LANGS.map(
    (l) => `<button data-lang="${l}" class="${l === initialLang ? 'on' : ''}">${LANG_NAMES[l]}</button>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<!-- 禁止浏览器自动翻译：翻译改写 DOM 会与语言切换脚本冲突 -->
<meta name="google" content="notranslate">
<meta name="theme-color" content="${esc(brand)}">
<title>${esc(tenant.companyName)} · ${esc(T.title)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  :root{
    --brand:${esc(brand)};
    --ink:#0F172A;--sub:#64748B;--muted:#94A3B8;--line:#EDF2F0;
    --radius:20px;
    --shadow-sm:0 1px 2px rgba(15,23,42,.04),0 10px 26px -20px rgba(15,23,42,.5);
    color-scheme:light;
  }
  html,body{background:#E9EEEC}
  body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
       color:var(--ink);font-size:15px;line-height:1.6;letter-spacing:.01em;-webkit-font-smoothing:antialiased;
       background:radial-gradient(1100px 480px at 50% -160px,#fff 0%,#EEF2F0 55%,#E7ECEA 100%);background-attachment:fixed}
  .phone{max-width:480px;margin:0 auto;min-height:100vh;background:#F5F8F7;
         box-shadow:0 0 0 1px rgba(15,23,42,.035),0 40px 90px -50px rgba(15,23,42,.5);overflow-x:hidden}

  .hd{position:relative;padding:calc(18px + env(safe-area-inset-top)) 18px 44px;color:#fff;
      display:flex;align-items:center;justify-content:space-between;gap:12px;overflow:hidden;
      background:linear-gradient(150deg,var(--brand) 0%,${esc(brand)} 55%,#123E86 100%)}
  .hd::before{content:'';position:absolute;inset:0;pointer-events:none;
              background:radial-gradient(120% 100% at 100% 0%,rgba(255,255,255,.26),transparent 58%),
                         radial-gradient(90% 80% at 0% 110%,rgba(255,255,255,.14),transparent 60%)}
  .brand{display:flex;align-items:center;gap:11px;min-width:0;position:relative;z-index:1}
  .logo{width:40px;height:40px;border-radius:13px;background:rgba(255,255,255,.16);flex:none;
        display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.26),0 8px 18px -12px rgba(0,0,0,.6);overflow:hidden}
  .logo img{width:100%;height:100%;object-fit:cover}
  .co{font-size:15px;font-weight:600;letter-spacing:.3px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tag{font-size:10.5px;opacity:.72;letter-spacing:1.1px;margin-top:2px}

  .langs{display:flex;gap:2px;padding:3px;border-radius:12px;flex:none;position:relative;z-index:1;
         background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);flex-wrap:wrap;
         -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);max-width:150px;justify-content:flex-end}
  .langs button{border:0;background:transparent;color:rgba(255,255,255,.8);cursor:pointer;
                font-size:10.5px;font-weight:700;padding:5px 7px;border-radius:8px;line-height:1;
                font-family:inherit;letter-spacing:.2px;transition:background .18s,color .18s}
  .langs button.on{background:#fff;color:#123E86;box-shadow:0 2px 8px rgba(8,15,35,.22)}

  .wrap{padding:0 14px 4px;margin-top:-26px;position:relative;z-index:2}
  .card{background:#fff;border-radius:var(--radius);padding:18px;margin-bottom:12px;
        border:1px solid var(--line);box-shadow:var(--shadow-sm)}

  .hero{text-align:center;padding:24px 18px 20px;border-radius:22px;overflow:hidden;position:relative;
        background:linear-gradient(180deg,#EAF1FE 0%,#fff 60%);
        border:1px solid rgba(28,100,242,.16);
        box-shadow:0 2px 6px rgba(15,23,42,.04),0 22px 46px -30px rgba(28,100,242,.55);margin-bottom:12px}
  .seal{position:relative;width:64px;height:64px;margin:0 auto 14px;border-radius:18px;
        background:linear-gradient(160deg,#3B82F6,#1C64F2);color:#fff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 14px 26px -10px rgba(28,100,242,.7),inset 0 1px 0 rgba(255,255,255,.4)}
  .hero h1{font-size:19px;font-weight:700;letter-spacing:.3px;line-height:1.4}
  .chips{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:10px}
  .chip{font-size:10.5px;font-weight:600;padding:4px 10px;border-radius:20px;
        color:#164EBD;background:#EDF3FE;border:1px solid #D9E4FD;letter-spacing:.3px}
  .chip.raw{color:#8A5A00;background:#FEF5E1;border-color:#F5E3BB}
  .serial-badge{display:inline-block;margin-top:12px;font-family:ui-monospace,Menlo,monospace;
        font-size:12px;font-weight:700;letter-spacing:1px;color:#0F172A;background:#F7FAF9;
        border:1px solid #EDF2F0;border-radius:10px;padding:6px 12px}

  .sec{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#0F172A;
       margin-bottom:14px;letter-spacing:.3px}
  .sec::before{content:'';width:3px;height:14px;border-radius:2px;background:linear-gradient(180deg,var(--brand),rgba(28,100,242,.55))}
  .sec small{margin-left:auto;font-weight:500;color:var(--muted);font-size:10.5px}

  .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .pc{background:linear-gradient(180deg,#F9FBFA,#F4F8F6);border-radius:12px;padding:11px 12px 12px;
      min-width:0;border:1px solid #EDF2F0}
  .pc.wide{grid-column:1/-1}
  .pl{display:block;font-size:10.5px;color:#8892A0;margin-bottom:3px;letter-spacing:.4px}
  .pv{font-size:14.5px;font-weight:700;color:#101827;letter-spacing:.2px;word-break:break-word;line-height:1.5}
  .mcode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;letter-spacing:.5px}
  .warn{margin-top:10px;font-size:11.5px;color:#8A5A00;background:#FEF5E1;border:1px solid #F5E3BB;
        border-radius:10px;padding:8px 11px;line-height:1.6}

  .kv{display:grid}
  .kv .drow{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:12.5px;
            padding:9px 0;border-bottom:1px solid #F2F6F4}
  .kv .drow:last-of-type{border-bottom:0}
  .drow span{color:var(--muted);flex:none;letter-spacing:.2px}
  .drow b{font-weight:600;color:#334155;text-align:right;word-break:break-word}

  .mtab{width:100%;border-collapse:collapse;font-size:12.5px}
  .mtab th{text-align:left;font-size:10.5px;font-weight:700;color:#94A3B8;letter-spacing:.6px;
           padding:0 0 7px;border-bottom:1px solid var(--line)}
  .mtab th:last-child,.mtab td:last-child{text-align:right}
  .mtab td{padding:8px 0;border-bottom:1px solid #F2F6F4;color:#334155;font-weight:600}
  .mtab tr:last-child td{border-bottom:0}
  .foot{margin-top:10px;font-size:10.5px;color:var(--muted);line-height:1.7}

  .waste{display:flex;gap:14px;align-items:flex-start;background:#F0FAF5;border:1px solid #D8EFE3;
         border-radius:14px;padding:14px}
  .waste .ic{flex:none;color:#0B6B42}
  .waste p{font-size:12.5px;color:#1F4A38;line-height:1.75}
  .waste .note{margin-top:8px;font-size:10.5px;font-weight:700;letter-spacing:.6px;color:#0B6B42}

  .stds{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px}
  .std{font-size:11px;font-weight:600;padding:4px 10px;border-radius:8px;color:#164EBD;
       background:#EDF3FE;border:1px solid #D9E4FD;letter-spacing:.2px}
  .cta{display:flex;align-items:center;justify-content:center;gap:8px;height:46px;border-radius:13px;
       margin-top:14px;text-decoration:none;color:#fff;font-size:13.5px;font-weight:600;letter-spacing:.2px;
       background:linear-gradient(135deg,var(--brand),#123E86);
       box-shadow:0 14px 26px -16px rgba(28,100,242,.9),inset 0 1px 0 rgba(255,255,255,.22)}

  .ft{padding:2px 14px calc(26px + env(safe-area-inset-bottom))}
  .stats{text-align:center;font-size:11px;color:var(--muted);letter-spacing:.3px;margin-bottom:10px}
  .legal{font-size:10.5px;color:#AEB6BF;line-height:1.8;text-align:center;letter-spacing:.2px}

  .fade{animation:up .58s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*70ms)}
  @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){.fade{animation:none!important}}
  @media (max-width:360px){.wrap{padding:0 12px}.card{padding:15px}}
</style>
</head>
<body>
<div class="phone">
  <header class="hd">
    <div class="brand">
      <div class="logo">${tenant.logoUrl ? `<img src="${esc(tenant.logoUrl)}" alt="">` : esc((tenant.companyName || '电').charAt(0))}</div>
      <div>
        <div class="co" id="coName">${esc(tenant.companyName)}</div>
        <div class="tag" data-i18n="title">${esc(T.title)}</div>
      </div>
    </div>
    <div class="langs" id="langs">${langBtns}</div>
  </header>

  <main class="wrap">
    <section class="hero fade" style="--i:0">
      <div class="seal">${BATTERY_SVG}</div>
      <h1 id="mName">${esc(model.modelName)}</h1>
      <div class="chips">
        <span class="chip" data-vkey="category.${esc(model.category)}">${esc(VALUES.category[model.category]?.zh || model.category)}</span>
        <span class="chip" data-vkey="chemistry.${esc(model.chemistry)}">${esc(VALUES.chemistry[model.chemistry]?.zh || model.chemistry)}</span>
        <span class="chip raw">${esc(model.ratedVoltage || '')} ${esc(model.ratedCapacity || '')}</span>
      </div>
      ${serialGiven ? `<div class="serial-badge">${serial ? esc(serial) : 'SN —'}</div>` : ''}
    </section>

    <section class="card fade" style="--i:1">
      <div class="sec"><span data-i18n="secProduct">${esc(T.secProduct)}</span></div>
      <div class="pgrid">${productCells}</div>
      ${serialNote}
    </section>

    <section class="card fade" style="--i:2">
      <div class="sec"><span data-i18n="secManufacturer">${esc(T.secManufacturer)}</span></div>
      <div class="kv">
        <div class="drow"><span data-i18n="secManufacturer">${esc(T.secManufacturer)}</span>
          <b id="coDetail">${esc(tenant.companyName)}</b></div>
        <div class="drow"><span data-i18n="labelTrademark">${esc(T.labelTrademark)}</span><b>${esc(tenant.trademark || '—')}</b></div>
        <div class="drow"><span data-i18n="labelAddress">${esc(T.labelAddress)}</span><b>${esc(tenant.registeredAddress || '—')}</b></div>
        <div class="drow"><span data-i18n="labelContact">${esc(T.labelContact)}</span><b>${esc(tenant.contactPhone || '—')}</b></div>
      </div>
    </section>

    <section class="card fade" style="--i:3">
      <div class="sec"><span data-i18n="secMaterials">${esc(T.secMaterials)}</span><small>Annex VI · demo</small></div>
      ${materialsBlock}
    </section>

    <section class="card fade" style="--i:4">
      <div class="sec"><span data-i18n="secWaste">${esc(T.secWaste)}</span></div>
      <div class="waste">
        <div class="ic">${WEEE_SVG}</div>
        <div>
          <p data-i18n="wasteText">${esc(T.wasteText)}</p>
          <div class="note" data-i18n="wasteNote">${esc(T.wasteNote)}</div>
        </div>
      </div>
    </section>

    <section class="card fade" style="--i:5">
      <div class="sec"><span data-i18n="secDoc">${esc(T.secDoc)}</span></div>
      ${docBlock}
    </section>
  </main>

  <footer class="ft">
    <div class="stats">${esc(T.scansLabel)} ${data.totalScans}</div>
    <p class="legal" data-i18n="demoNote">${esc(T.demoNote)}</p>
  </footer>
</div>

<script>
(function(){
  var M = ${JSON.stringify(meta)};
  var DICT = ${JSON.stringify(DICT)};
  var VALUES = ${JSON.stringify(VALUES)};
  var LANGS = ${JSON.stringify(LANGS)};

  function pick(obj, lang){
    if(!obj) return null;
    if(typeof obj === 'string') return obj;
    return obj[lang] || obj.en || obj.zh || null;
  }

  function vkey(key, lang){
    var path = key.split('.');
    var node = VALUES[path[0]];
    if(!node) return null;
    var entry = node[path.slice(1).join('.')];
    if(!entry) return null;
    return pick(entry, lang);
  }

  function fmtDate(s, lang){
    if(!s) return '—';
    var str = String(s);
    var dateOnly = str.length === 10 && str.split('-').length === 3;
    var d = new Date(str.replace(' ','T'));
    if(isNaN(d.getTime())) return str;
    try{
      var locale = {zh:'zh-CN',en:'en-GB',de:'de-DE',fr:'fr-FR',es:'es-ES',it:'it-IT'}[lang] || 'en-GB';
      return new Intl.DateTimeFormat(locale,
        dateOnly ? {year:'numeric',month:'short',day:'2-digit'}
                 : {year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d);
    }catch(e){ return str; }
  }

  function apply(lang){
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var t = DICT[lang][el.getAttribute('data-i18n')];
      if(t != null) el.textContent = t;
    });
    document.querySelectorAll('[data-vkey]').forEach(function(el){
      var v = vkey(el.getAttribute('data-vkey'), lang);
      if(v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-ts]').forEach(function(el){
      el.textContent = fmtDate(el.getAttribute('data-ts'), lang);
    });
    var tr = M.modelI18n && M.modelI18n[lang] && M.modelI18n[lang].model_name;
    document.getElementById('mName').textContent = tr || M.modelName;
    var co = (M.companyI18n && M.companyI18n[lang] && M.companyI18n[lang].company_name) || null;
    document.getElementById('coName').textContent = co || document.getElementById('coName').getAttribute('data-default') || document.getElementById('coName').textContent;
    document.getElementById('coDetail').textContent = co || document.getElementById('coDetail').getAttribute('data-default') || document.getElementById('coDetail').textContent;
    document.querySelectorAll('#langs button').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
    });
    try{ localStorage.setItem('battery-lang', lang); }catch(e){}
  }

  document.getElementById('coName').setAttribute('data-default', document.getElementById('coName').textContent);
  document.getElementById('coDetail').setAttribute('data-default', document.getElementById('coDetail').textContent);

  document.getElementById('langs').addEventListener('click', function(e){
    var btn = e.target.closest('button[data-lang]');
    if(btn) apply(btn.getAttribute('data-lang'));
  });

  var saved = null;
  try{ saved = localStorage.getItem('battery-lang'); }catch(e){}
  apply(saved && LANGS.indexOf(saved) >= 0 ? saved : 'zh');
})();
</script>
</body></html>`;
}
