/**
 * 演示数据多语言填充
 *
 * 真实业务里这些字段由后台录入，这里只是把示例公司/型号/参数补上英文与西班牙文，
 * 方便演示时切换语言看到完整效果。init-db 已写入同样内容，本脚本用于给老库补齐。
 *
 * 运行：npm run seed-i18n
 */
import { db, initSchema } from '../src/db/index.js';

initSchema();

const tenantI18n = {
  en: { company_name: 'Jinglong Electric Sprayers' },
  es: { company_name: 'Pulverizadores Eléctricos Jinglong' },
};

const productI18n = {
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
};

const fieldI18n = {
  brand: { en: 'Brand', es: 'Marca' },
  color: { en: 'Colour', es: 'Color' },
  control: { en: 'Control type', es: 'Tipo de control' },
  wear: { en: 'Carrying style', es: 'Modo de transporte' },
  battery_type: { en: 'Battery type', es: 'Tipo de batería' },
  battery: { en: 'Battery', es: 'Batería' },
  motor: { en: 'Motor', es: 'Motor' },
  battery_gauge: { en: 'Battery level', es: 'Nivel de batería' },
  runtime_display: { en: 'Runtime display', es: 'Duración visible' },
  low_battery: { en: 'Low-battery alert', es: 'Aviso de batería baja' },
};

const groupI18n = {
  basic: { en: 'General', es: 'Datos generales' },
  power: { en: 'Battery & motor', es: 'Batería y motor' },
};

const highlightI18n = [
  { zh: '智能遥控', en: 'Smart remote control', es: 'Control remoto inteligente' },
  { zh: '12V 14Ah 锂电池', en: '12V 14Ah lithium battery', es: 'Batería de litio 12V 14Ah' },
  { zh: '电量查看', en: 'Battery level display', es: 'Nivel de batería' },
  { zh: '低电量提醒', en: 'Low-battery alert', es: 'Aviso de batería baja' },
  { zh: '双滚珠隔膜泵', en: 'Dual-ball diaphragm pump', es: 'Bomba de diafragma de doble bola' },
];

const tenant = db.prepare('SELECT id, company_name FROM tenant ORDER BY id LIMIT 1').get();
if (tenant) {
  db.prepare('UPDATE tenant SET i18n = ? WHERE id = ?').run(JSON.stringify(tenantI18n), tenant.id);
  console.log(`租户「${tenant.company_name}」已写入 en / es 名称`);
}

const models = db.prepare('SELECT id, model_name, param_template_id FROM product_model').all();
for (const m of models) {
  db.prepare('UPDATE product_model SET i18n = ?, highlights = ? WHERE id = ?').run(
    JSON.stringify(productI18n),
    JSON.stringify(highlightI18n),
    m.id
  );
  console.log(`型号「${m.model_name}」已写入 en / es 名称、描述与卖点`);

  if (m.param_template_id) {
    const tpl = db.prepare('SELECT fields, groups FROM param_template WHERE id = ?').get(
      m.param_template_id
    );
    if (tpl?.fields) {
      const fields = JSON.parse(tpl.fields).map((f) =>
        fieldI18n[f.key] ? { ...f, i18n: fieldI18n[f.key] } : f
      );
      const groups = (tpl.groups ? JSON.parse(tpl.groups) : []).map((g) =>
        groupI18n[g.key] ? { ...g, i18n: groupI18n[g.key] } : g
      );
      db.prepare('UPDATE param_template SET fields = ?, groups = ? WHERE id = ?').run(
        JSON.stringify(fields),
        JSON.stringify(groups),
        m.param_template_id
      );
      console.log(`参数模板已写入 ${Object.keys(fieldI18n).length} 个字段名、${groups.length} 个分组名`);
    }
  }
}

console.log('\n完成。启动服务后打开扫码页，右上角可切换 中文 / EN / ES。');
