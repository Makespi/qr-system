/**
 * 初始化数据库：建表 + 种子数据
 * 用法：npm run init-db
 */
import bcrypt from 'bcryptjs';
import { db, initSchema, DB_PATH } from '../src/db/index.js';

console.log(`数据库文件：${DB_PATH}`);

initSchema();
console.log('✓ 表结构已就绪');

// ---------- 种子数据 ----------
// 产品与规格取自精龙 3WBD-16 型背负式电动喷雾器产品页（zlslc.com/h-pd-86.html）
const DEMO = {
  tenant_key: 'demo',
  company_name: '精龙电动喷雾器',
  contact_name: '郑总',
  contact_phone: '17131053535',
  brand_color: '#1C64F2',           // 产品主色：蓝色
  service_phone: '17131053535',
  service_hours: '9:00-21:00',
  i18n: {
    en: { company_name: 'Jinglong Electric Sprayers' },
    es: { company_name: 'Pulverizadores Eléctricos Jinglong' },
  },
  registered_address: '广东省广州市番禺区番禺大道北 555 号节能科技园 B 座',
  trademark: '精龙 JINGLONG',
  remark: '演示租户，产品数据取自 zlslc.com 3WBD-16 型产品页',
};

// ---------- 电池合规种子（EU 2023/1542 Art.13(6) demo）----------
// 3WBD-16 随机配备的 12V 14Ah 锂电池组。全部为示例数据。
const BATTERY = {
  model_code: 'JL-1214',
  model_name: '精龙 12V 14Ah 锂离子电池组',
  category: 'portable',          // 便携式电池（含在设备中）
  chemistry: 'li-ion',
  rated_voltage: '12V',
  rated_capacity: '14Ah（168Wh）',
  qr_mode: 'serial',             // 一序列号一码
  serial_count: 12,
  i18n: {
    en: { model_name: 'Jinglong 12V 14Ah Li-ion Battery Pack' },
    de: { model_name: 'Jinglong 12V 14Ah Li-Ionen-Batteriepack' },
  },
  materials: [
    { key: 'cobalt', share: '16%' },
    { key: 'lithium', share: '4%' },
    { key: 'nickel', share: '6%' },
    { key: 'manganese', share: '5%' },
    { key: 'graphite', share: '0%' },
    { key: 'copper', share: '20%' },
    { key: 'aluminum', share: '35%' },
  ],
  doc: {
    doc_no: 'EU-DOC-2026-JL1214-001',
    issued_at: '2026-10-30',
    standards: [
      'EN 62133-2:2021（含碱性电解液电池安全）',
      'UN 38.3（运输安全，Rev.7）',
      'Regulation (EU) 2023/1542',
    ],
    signer_name: 'Zheng Wei',
    signer_role: 'Technical Director',
    place: 'Guangzhou, China',
  },
};

// ---------- DPP 数字产品护照种子（ESPR / (EU) 2024/1781）----------
// 第一份：电池品类，必填字段基本齐全
// 第二份：故意留空多个字段（EORI、欧盟代表、BOM、证书、碳足迹），演示"数据没有就空"
const DPP_LIST = [
  {
    dpp_id: 'DPP-JL1214-2026-0001',
    sku: 'JL-1214-BAT',
    model_code: 'JL-1214',
    product_name: '精龙 12V 14Ah 锂离子电池组',
    batch_no: 'B20261030-01',
    serial: 'JL1214-2026-0001',
    category: 'battery',
    origin_country: '中国（CN）',
    eori: 'CN2026DEMO0001',
    eu_rep_name: 'GreenCycle Compliance GmbH',
    eu_rep_address: 'Hafenstraße 12, 20359 Hamburg, Germany',
    eu_rep_contact: 'compliance@greencycle-demo.eu',
    bom: [
      { material: '三元正极材料 NCM523', weight: '0.95 kg', recycledShare: '16%', origin: '中国' },
      { material: '天然石墨（负极）', weight: '0.22 kg', recycledShare: '0%', origin: '中国' },
      { material: '铜箔', weight: '0.12 kg', recycledShare: '20%', origin: '中国' },
      { material: '铝壳与极耳', weight: '0.18 kg', recycledShare: '35%', origin: '中国' },
      { material: '电解液（LiPF6）', weight: '0.11 kg', recycledShare: '0%', origin: '中国' },
      { material: 'ABS 外壳', weight: '0.09 kg', recycledShare: '30%', origin: '中国' },
      { material: 'BMS 电子元件', weight: '0.05 kg', recycledShare: '10%', origin: '中国' },
    ],
    certificates: [
      {
        name: 'EU 符合性声明（DoC）',
        number: 'EU-DOC-2026-JL1214-001',
        issuer: '精龙电动喷雾器',
        issuedAt: '2026-10-30',
        url: '/b/JL-1214/doc.pdf',
      },
      { name: 'RoHS 检测报告', number: 'RoHS-2026-0912', issuer: 'SGS（示例）', issuedAt: '2026-09-12', url: '' },
      { name: 'UN 38.3 运输测试摘要', number: 'UN38.3-2026-3310', issuer: 'TÜV（示例）', issuedAt: '2026-08-20', url: '' },
    ],
    repair: {
      sparePartsYears: '7 年',
      guideUrl: '',
      steps: [
        '断开设备电源并取出电池组',
        '用 PH2 十字螺丝刀拆下外壳 4 颗固定螺丝',
        '拔下 BMS 排线，取出电芯组',
        '更换电芯组后复装，并做一次完整充放电校准',
      ],
    },
    dismantle: {
      notes: '外壳为卡扣 + 螺丝混合结构，禁止暴力拆解；电芯属危险废物，需交由资质单位处理。',
      tools: ['PH2 十字螺丝刀', '绝缘镊子', '防静电手环'],
    },
    recycle: {
      takeBack: '可通过经销商或品牌回收点交回，也可联系欧盟授权代表安排回收',
      notes: '符合 WEEE 单独收集要求，禁止投入生活垃圾。',
    },
    chemistry: '锂离子（NCM523）',
    capacity: '12V 14Ah / 168Wh',
    cycle_life: '≥800 次循环（80% DoD，容量保持率 ≥80%）',
    carbon_footprint: '68 kgCO₂e/kWh（示例值，待第三方核算）',
    version: '1.2',
    status: 'normal',
    status_note: null,
    i18n: {
      en: { product_name: 'Jinglong 12V 14Ah Li-ion Battery Pack' },
    },
  },
  {
    dpp_id: 'DPP-3WBD16-2026-0001',
    sku: '3WBD-16',
    model_code: '3WBD-16',
    product_name: '3WBD-16 型背负式电动喷雾器',
    batch_no: 'B20261030-01',
    serial: '',
    category: 'equipment',
    origin_country: '中国（CN）',
    eori: '',                    // 留空演示
    eu_rep_name: '',             // 留空演示
    eu_rep_address: '',
    eu_rep_contact: '',
    bom: [],                     // 留空演示
    certificates: [],            // 留空演示
    repair: null,
    dismantle: null,
    recycle: null,
    chemistry: null,
    capacity: null,
    cycle_life: null,
    carbon_footprint: null,
    version: '1.0',
    status: 'normal',
    status_note: null,
    i18n: {
      en: { product_name: '3WBD-16 Knapsack Electric Sprayer' },
    },
  },
];

const FIELD_GROUPS = [
  { key: 'basic', label: '整机参数', i18n: { en: 'General', es: 'Datos generales' } },
  { key: 'power', label: '电池与动力', i18n: { en: 'Battery & motor', es: 'Batería y motor' } },
];

const FIELDS = [
  { key: 'brand', label: '品牌', group: 'basic', sort: 1, required: true,
    i18n: { en: 'Brand', es: 'Marca' } },
  { key: 'color', label: '颜色', group: 'basic', sort: 2,
    i18n: { en: 'Colour', es: 'Color' } },
  { key: 'control', label: '控制方式', group: 'basic', sort: 3,
    i18n: { en: 'Control type', es: 'Tipo de control' } },
  { key: 'wear', label: '佩戴方式', group: 'basic', sort: 4,
    i18n: { en: 'Carrying style', es: 'Modo de transporte' } },
  { key: 'battery_type', label: '电池类型', group: 'power', sort: 5,
    i18n: { en: 'Battery type', es: 'Tipo de batería' } },
  { key: 'battery', label: '电池参数', group: 'power', sort: 6,
    i18n: { en: 'Battery', es: 'Batería' } },
  { key: 'motor', label: '马达参数', group: 'power', sort: 7, wide: true,
    i18n: { en: 'Motor', es: 'Motor' } },
  { key: 'battery_gauge', label: '电量查看', group: 'power', sort: 8,
    i18n: { en: 'Battery level', es: 'Nivel de batería' } },
  { key: 'runtime_display', label: '工作时长显示', group: 'power', sort: 9,
    i18n: { en: 'Runtime display', es: 'Duración visible' } },
  { key: 'low_battery', label: '低电量提醒', group: 'power', sort: 10,
    i18n: { en: 'Low-battery alert', es: 'Aviso de batería baja' } },
];

const MODEL = {
  model_code: '3WBD-16',
  model_name: '3WBD-16 型背负式电动喷雾器',
  category: '电动喷雾器',
  brand: '精龙',
  // 示例 GTIN：校验位正确，但不是真实厂商前缀。正式印刷前必须换成 GS1 分配的 GTIN。
  gtin: '06912345678902',
  price: 500,
  market_price: 530,
  currency: 'CNY',
  params: {
    brand: '精龙',
    color: '蓝色',
    control: '智能遥控',
    wear: '背负式',
    battery_type: '锂电池',
    battery: '12V 14Ah',
    motor: '双滚珠智能压力隔膜泵',
    battery_gauge: '支持',
    runtime_display: '支持',
    low_battery: '支持',
  },
  highlights: [
    { zh: '智能遥控', en: 'Smart remote control', es: 'Control remoto inteligente' },
    { zh: '12V 14Ah 锂电池', en: '12V 14Ah lithium battery', es: 'Batería de litio 12V 14Ah' },
    { zh: '电量查看', en: 'Battery level display', es: 'Nivel de batería' },
    { zh: '低电量提醒', en: 'Low-battery alert', es: 'Aviso de batería baja' },
    { zh: '双滚珠隔膜泵', en: 'Dual-ball diaphragm pump', es: 'Bomba de diafragma de doble bola' },
  ],
  description:
    '智能遥控控制，12V 14Ah 锂电池供电，支持电量查看、工作时长显示与低电量提醒；双滚珠智能压力隔膜泵，适用于农田、果园与园林喷药作业。',
  i18n: {
    en: {
      model_name: '3WBD-16 Knapsack Electric Sprayer',
      category: 'Electric sprayer',
      description:
        'Smart remote control with a 12V 14Ah lithium battery. Battery level, runtime display and low-battery alert, plus a dual-ball smart-pressure diaphragm pump for farmland, orchard and garden spraying.',
    },
    es: {
      model_name: 'Pulverizador eléctrico de mochila 3WBD-16',
      category: 'Pulverizador eléctrico',
      description:
        'Control remoto inteligente con batería de litio de 12V 14Ah. Nivel de batería, duración visible y aviso de batería baja, con bomba de diafragma de doble bola para cultivos, huertos y jardines.',
    },
  },
};

const seed = db.transaction(() => {
  // 平台运营方（tenant_id = 0）
  const platformAdmin = db
    .prepare('SELECT id FROM sys_user WHERE tenant_id = 0 AND username = ?')
    .get('admin');
  if (!platformAdmin) {
    db.prepare(
      `INSERT INTO sys_user (tenant_id, username, password, real_name, role)
       VALUES (0, ?, ?, ?, 'PLATFORM_ADMIN')`
    ).run('admin', bcrypt.hashSync('admin123', 10), '平台管理员');
    console.log('✓ 平台管理员 admin / admin123');
  }

  // 示例租户（已存在则同步展示信息，不动剩余配额）
  let tenant = db.prepare('SELECT * FROM tenant WHERE tenant_key = ?').get(DEMO.tenant_key);
  if (!tenant) {
    const info = db
      .prepare(
        `INSERT INTO tenant (tenant_key, company_name, contact_name, contact_phone,
                             brand_color, service_phone, service_hours, i18n,
                             registered_address, trademark, quota_codes, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(DEMO.tenant_key, DEMO.company_name, DEMO.contact_name, DEMO.contact_phone,
           DEMO.brand_color, DEMO.service_phone, DEMO.service_hours,
           JSON.stringify(DEMO.i18n), DEMO.registered_address, DEMO.trademark,
           100000, DEMO.remark);
    tenant = db.prepare('SELECT * FROM tenant WHERE id = ?').get(info.lastInsertRowid);
    console.log(`✓ 示例租户：${tenant.company_name}（id=${tenant.id}）`);
  } else {
    db.prepare(
      `UPDATE tenant SET company_name = ?, contact_name = ?, contact_phone = ?,
                         brand_color = ?, service_phone = ?, service_hours = ?,
                         i18n = ?, registered_address = ?, trademark = ?, remark = ?
       WHERE id = ?`
    ).run(DEMO.company_name, DEMO.contact_name, DEMO.contact_phone, DEMO.brand_color,
          DEMO.service_phone, DEMO.service_hours, JSON.stringify(DEMO.i18n),
          DEMO.registered_address, DEMO.trademark, DEMO.remark, tenant.id);
    console.log(`✓ 示例租户已更新：${DEMO.company_name}（id=${tenant.id}）`);
  }

  // 该租户的管理员
  const tAdmin = db
    .prepare('SELECT id FROM sys_user WHERE tenant_id = ? AND username = ?')
    .get(tenant.id, 'demo');
  if (!tAdmin) {
    db.prepare(
      `INSERT INTO sys_user (tenant_id, username, password, real_name, role)
       VALUES (?, ?, ?, ?, 'TENANT_ADMIN')`
    )    .run(tenant.id, 'demo', bcrypt.hashSync('demo123', 10), '郑总');
    console.log('✓ 租户管理员 demo / demo123');
  }

  // 参数模板：分组 + 字段（分组顺序即扫码页展示顺序）
  let tpl = db
    .prepare('SELECT * FROM param_template WHERE tenant_id = ? AND name = ?')
    .get(tenant.id, '背负式喷雾器');
  if (tpl) {
    db.prepare('UPDATE param_template SET fields = ?, groups = ? WHERE id = ?').run(
      JSON.stringify(FIELDS),
      JSON.stringify(FIELD_GROUPS),
      tpl.id
    );
    console.log(`✓ 参数模板已更新：${tpl.name}（${FIELD_GROUPS.length} 组 / ${FIELDS.length} 个字段）`);
  } else {
    const info = db
      .prepare('INSERT INTO param_template (tenant_id, name, fields, groups) VALUES (?, ?, ?, ?)')
      .run(tenant.id, '背负式喷雾器', JSON.stringify(FIELDS), JSON.stringify(FIELD_GROUPS));
    tpl = db.prepare('SELECT * FROM param_template WHERE id = ?').get(info.lastInsertRowid);
    console.log(`✓ 参数模板：${tpl.name}（${FIELD_GROUPS.length} 组 / ${FIELDS.length} 个字段）`);
  }

  // 示例型号：优先复用租户下已有型号，保证已生成的码仍能扫出完整信息
  let model = db
    .prepare('SELECT * FROM product_model WHERE tenant_id = ? AND model_code = ?')
    .get(tenant.id, MODEL.model_code);
  if (!model) {
    model = db
      .prepare('SELECT * FROM product_model WHERE tenant_id = ? ORDER BY id LIMIT 1')
      .get(tenant.id);
  }

  const modelValues = [
    MODEL.model_code, MODEL.model_name, MODEL.category, MODEL.brand, MODEL.gtin,
    MODEL.price, MODEL.market_price, MODEL.currency,
    JSON.stringify(MODEL.highlights), JSON.stringify(MODEL.params),
    MODEL.description, JSON.stringify(MODEL.i18n), tpl.id,
  ];

  if (model) {
    db.prepare(
      `UPDATE product_model
       SET model_code = ?, model_name = ?, category = ?, brand = ?, gtin = ?,
           price = ?, market_price = ?, currency = ?,
           highlights = ?, params = ?, description = ?, i18n = ?, param_template_id = ?
       WHERE id = ?`
    ).run(...modelValues, model.id);
    console.log(`✓ 示例型号已更新：${MODEL.model_code} ${MODEL.model_name}`);
  } else {
    const info = db
      .prepare(
        `INSERT INTO product_model
           (model_code, model_name, category, brand, gtin, price, market_price, currency,
            highlights, params, description, i18n, param_template_id, tenant_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(...modelValues, tenant.id);
    model = db.prepare('SELECT * FROM product_model WHERE id = ?').get(info.lastInsertRowid);
    console.log(`✓ 示例型号：${MODEL.model_code} ${MODEL.model_name}`);
  }

  // 演示批次：没有批次时建一个，扫码页才能展示追溯信息
  const batch = db
    .prepare('SELECT id FROM production_batch WHERE tenant_id = ? ORDER BY id DESC LIMIT 1')
    .get(tenant.id);
  if (!batch) {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const batchNo = `B${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-01`;
    db.prepare(
      `INSERT INTO production_batch (tenant_id, batch_no, model_id, production_date, quantity)
       VALUES (?, ?, ?, date('now','localtime'), ?)`
    ).run(tenant.id, batchNo, model.id, 500);
    console.log(`✓ 演示批次：${batchNo}（生产日期 ${new Date().toISOString().slice(0, 10)}）`);
  }

  // ---------- 电池合规码（EU 2023/1542 Art.13(6) demo）----------
  let bDoc = db
    .prepare('SELECT * FROM battery_doc WHERE tenant_id = ? AND doc_no = ?')
    .get(tenant.id, BATTERY.doc.doc_no);
  if (!bDoc) {
    const info = db
      .prepare(
        `INSERT INTO battery_doc (tenant_id, doc_no, issued_at, standards, signer_name, signer_role, place)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(tenant.id, BATTERY.doc.doc_no, BATTERY.doc.issued_at,
           JSON.stringify(BATTERY.doc.standards), BATTERY.doc.signer_name,
           BATTERY.doc.signer_role, BATTERY.doc.place);
    bDoc = db.prepare('SELECT * FROM battery_doc WHERE id = ?').get(info.lastInsertRowid);
    console.log(`✓ EU 符合性声明：${bDoc.doc_no}`);
  }

  let bModel = db
    .prepare('SELECT * FROM battery_model WHERE tenant_id = ? AND model_code = ?')
    .get(tenant.id, BATTERY.model_code);
  const bValues = [
    BATTERY.model_name, BATTERY.category, BATTERY.chemistry,
    BATTERY.rated_voltage, BATTERY.rated_capacity, BATTERY.qr_mode,
    bDoc.id, JSON.stringify(BATTERY.materials), JSON.stringify(BATTERY.i18n),
  ];
  if (bModel) {
    db.prepare(
      `UPDATE battery_model
       SET model_name = ?, category = ?, chemistry = ?, rated_voltage = ?, rated_capacity = ?,
           qr_mode = ?, doc_id = ?, materials = ?, i18n = ?
       WHERE id = ?`
    ).run(...bValues, bModel.id);
    console.log(`✓ 电池型号已更新：${BATTERY.model_code} ${BATTERY.model_name}`);
  } else {
    const info = db
      .prepare(
        `INSERT INTO battery_model
           (tenant_id, model_code, model_name, category, chemistry, rated_voltage,
            rated_capacity, qr_mode, doc_id, materials, i18n)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(tenant.id, BATTERY.model_code, ...bValues);
    bModel = db.prepare('SELECT * FROM battery_model WHERE id = ?').get(info.lastInsertRowid);
    console.log(`✓ 电池型号：${BATTERY.model_code} ${BATTERY.model_name}`);
  }

  // 序列号：缺几个补几个，不重复生成
  const serialCount = db
    .prepare('SELECT COUNT(*) AS n FROM battery_serial WHERE model_id = ?')
    .get(bModel.id).n;
  if (serialCount < BATTERY.serial_count) {
    const year = new Date().getFullYear();
    const p = (n) => String(n).padStart(4, '0');
    const prodDate = BATTERY.doc.issued_at;
    const insert = db.prepare(
      `INSERT OR IGNORE INTO battery_serial (tenant_id, model_id, serial, batch_no, production_date)
       VALUES (?, ?, ?, ?, ?)`
    );
    let added = 0;
    for (let i = serialCount + 1; i <= BATTERY.serial_count; i++) {
      insert.run(tenant.id, bModel.id, `JL1214-${year}-${p(i)}`, 'B20261030-01', prodDate);
      added++;
    }
    console.log(`✓ 电池序列号：新增 ${added} 个（共 ${BATTERY.serial_count} 个）`);
  } else {
    console.log(`✓ 电池序列号：已有 ${serialCount} 个，跳过`);
  }

  // ---------- DPP 护照（必填字段建齐，没数据的留空由页面占位）----------
  const dppInsert = db.prepare(
    `INSERT INTO dpp_passport
       (tenant_id, dpp_id, sku, model_code, product_name, batch_no, serial, category,
        origin_country, eori, eu_rep_name, eu_rep_address, eu_rep_contact,
        bom, certificates, repair, dismantle, recycle,
        chemistry, capacity, cycle_life, carbon_footprint,
        version, status, status_note, i18n, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))`
  );
  const dppUpdate = db.prepare(
    `UPDATE dpp_passport SET sku = ?, model_code = ?, product_name = ?, batch_no = ?, serial = ?,
       category = ?, origin_country = ?, eori = ?, eu_rep_name = ?, eu_rep_address = ?, eu_rep_contact = ?,
       bom = ?, certificates = ?, repair = ?, dismantle = ?, recycle = ?,
       chemistry = ?, capacity = ?, cycle_life = ?, carbon_footprint = ?,
       version = ?, status = ?, status_note = ?, i18n = ?, updated_at = datetime('now','localtime')
     WHERE id = ?`
  );

  for (const d of DPP_LIST) {
    const values = [
      d.sku, d.model_code, d.product_name, d.batch_no, d.serial, d.category,
      d.origin_country, d.eori, d.eu_rep_name, d.eu_rep_address, d.eu_rep_contact,
      JSON.stringify(d.bom), JSON.stringify(d.certificates), JSON.stringify(d.repair),
      JSON.stringify(d.dismantle), JSON.stringify(d.recycle),
      d.chemistry, d.capacity, d.cycle_life, d.carbon_footprint,
      d.version, d.status, d.status_note, JSON.stringify(d.i18n),
    ];
    const exists = db
      .prepare('SELECT id FROM dpp_passport WHERE tenant_id = ? AND dpp_id = ?')
      .get(tenant.id, d.dpp_id);
    if (exists) {
      dppUpdate.run(...values, exists.id);
      console.log(`✓ DPP 护照已更新：${d.dpp_id}`);
    } else {
      dppInsert.run(tenant.id, d.dpp_id, ...values);
      console.log(`✓ DPP 护照：${d.dpp_id}`);
    }
  }

  return tenant;
});

const tenant = seed();

console.log('\n初始化完成。启动服务：npm start');
console.log(`扫码页地址：http://localhost:3000/s/<16位码>`);
console.log(`初始化租户 id = ${tenant.id}`);
