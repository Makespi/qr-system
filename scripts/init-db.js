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
  remark: '演示租户，产品数据取自 zlslc.com 3WBD-16 型产品页',
};

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
                             brand_color, service_phone, service_hours, i18n, quota_codes, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(DEMO.tenant_key, DEMO.company_name, DEMO.contact_name, DEMO.contact_phone,
           DEMO.brand_color, DEMO.service_phone, DEMO.service_hours,
           JSON.stringify(DEMO.i18n), 100000, DEMO.remark);
    tenant = db.prepare('SELECT * FROM tenant WHERE id = ?').get(info.lastInsertRowid);
    console.log(`✓ 示例租户：${tenant.company_name}（id=${tenant.id}）`);
  } else {
    db.prepare(
      `UPDATE tenant SET company_name = ?, contact_name = ?, contact_phone = ?,
                         brand_color = ?, service_phone = ?, service_hours = ?,
                         i18n = ?, remark = ?
       WHERE id = ?`
    ).run(DEMO.company_name, DEMO.contact_name, DEMO.contact_phone, DEMO.brand_color,
          DEMO.service_phone, DEMO.service_hours, JSON.stringify(DEMO.i18n),
          DEMO.remark, tenant.id);
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

  return tenant;
});

const tenant = seed();

console.log('\n初始化完成。启动服务：npm start');
console.log(`扫码页地址：http://localhost:3000/s/<16位码>`);
console.log(`初始化租户 id = ${tenant.id}`);
