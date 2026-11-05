/**
 * 扫码服务：校验 → 判定 → 记录 → 返回展示数据
 *
 * 状态判定优先级（顺序不能乱）：
 *   格式非法 → 查不到 → 租户停用 → 已作废 → 打标异常 → 未激活 → 正常
 */
import { db } from '../db/index.js';
import { isValid } from '../core/codegen.js';
import { isValidGtin } from '../core/gs1.js';

/** 简化的地域解析，后续接入 ip2region 时只需改这里 */
export function resolveRegion(ip) {
  if (!ip) return null;
  const local = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')
    || ip.startsWith('10.') || ip.startsWith('172.16.')
    || ip === '::ffff:127.0.0.1';
  return local ? '本地网络' : null;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

/**
 * 执行一次扫码
 * @param {string} code
 * @param {{ ip?: string, ua?: string }} meta
 * @returns {object} 展示用数据
 */
export function scan(code, meta = {}) {
  const ip = meta.ip || null;
  const ua = meta.ua ? String(meta.ua).slice(0, 255) : null;
  const region = resolveRegion(ip);

  // 1. 校验位拦截：31/32 的乱输码在此结束，不产生任何数据库查询
  if (!isValid(code)) {
    return { state: 'invalid' };
  }

  // 2. 全局查码（二维码是全平台唯一，不带租户条件）
  const row = db.prepare('SELECT * FROM qr_code WHERE code = ?').get(code);
  if (!row) {
    return { state: 'invalid' };
  }

  // 3. 租户有效性
  const tenant = db.prepare('SELECT * FROM tenant WHERE id = ?').get(row.tenant_id);
  if (!tenant || tenant.status === 0) {
    return { state: 'disabled', tenant: tenant || null };
  }

  const brand = {
    companyName: tenant.company_name,
    brandColor: tenant.brand_color || '#1D9E75',
    servicePhone: tenant.service_phone,
    serviceHours: tenant.service_hours || null,
    logoUrl: tenant.logo_url,
    i18n: parseJSON(tenant.i18n, null),
  };

  // 4. 已作废：明确告知，不误导为正品也不误导为假货
  if (row.status === 2) {
    logScan(row, ip, region, ua);
    return { state: 'voided', tenant: brand, code: row.code };
  }

  // 5. 打标状态异常
  if (row.mark_status === 2) {
    logScan(row, ip, region, ua);
    return { state: 'mark_failed', tenant: brand, code: row.code };
  }

  // 6. 原子更新：计数 +1，首查字段仅在为空时写入
  //    必须一条 SQL 完成，否则并发首扫会互相覆盖，出现「两次都是首次」
  db.prepare(
    `UPDATE qr_code
     SET scan_count = scan_count + 1,
         last_scan_at = datetime('now','localtime'),
         first_scan_at = COALESCE(first_scan_at, datetime('now','localtime')),
         first_scan_ip = COALESCE(first_scan_ip, ?),
         first_scan_region = COALESCE(first_scan_region, ?)
     WHERE code = ?`
  ).run(ip, region, code);

  // 7. 重新读取最新状态
  const fresh = db.prepare('SELECT * FROM qr_code WHERE code = ?').get(code);

  logScan(fresh, ip, region, ua);

  // 8. 型号信息
  const model = db.prepare('SELECT * FROM product_model WHERE id = ?').get(fresh.model_id);
  const template = model?.param_template_id
    ? db.prepare('SELECT * FROM param_template WHERE id = ?').get(model.param_template_id)
    : null;

  const product = model ? buildProduct(model, template) : null;
  // 批次追溯：批次号 + 生产日期，是「这瓶/这台从哪来」的最小可信信息
  const batch = db
    .prepare('SELECT batch_no, production_date, expiry_date FROM production_batch WHERE id = ?')
    .get(fresh.batch_id);

  // 9. 未出厂：码已打在产品上但还没激活，正常提示，不算异常
  if (fresh.status === 0 && fresh.mark_status === 1) {
    return {
      state: 'not_activated',
      tenant: brand,
      code: fresh.code,
      product,
      batch: batch || null,
      firstScanAt: fresh.first_scan_at,
      scanCount: fresh.scan_count,
      lastScanAt: fresh.last_scan_at,
    };
  }

  // 10. 正常在售：区分首次 / 重复
  const isFirst = fresh.scan_count === 1;
  return {
    state: isFirst ? 'genuine_first' : 'genuine_repeat',
    tenant: brand,
    code: fresh.code,
    product,
    batch: batch || null,
    scanCount: fresh.scan_count,
    firstScanAt: fresh.first_scan_at,
    firstScanRegion: fresh.first_scan_region,
    lastScanAt: fresh.last_scan_at,
  };
}

/** 组装展示用商品信息，参数按模板分组 + 排序渲染 */
function buildProduct(model, template) {
  let params = [];
  let groups = [];
  try {
    const values = model.params ? JSON.parse(model.params) : {};
    const fields = template?.fields ? JSON.parse(template.fields) : [];
    groups = parseJSON(template?.groups, []) || [];
    params = fields
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .filter((f) => values[f.key] !== undefined && values[f.key] !== '')
      .map((f) => ({
        key: f.key,
        label: f.label,
        group: f.group || '',           // 分组 key，对应 groups[].key
        wide: f.wide === true,          // 长文本占整行
        i18n: f.i18n || null,           // 参数名多语言：{en:'Tank capacity',es:'Capacidad'}
        value: String(values[f.key]),
        unit: f.unit || '',
        text: `${values[f.key]}${f.unit || ''}`,   // 兼容旧字段
      }));
  } catch {
    params = [];
  }

  let images = [];
  try {
    images = model.images ? JSON.parse(model.images) : [];
  } catch {
    images = [];
  }

  return {
    modelCode: model.model_code,
    modelName: model.model_name,
    category: model.category,
    brand: model.brand || null,
    gtin: model.gtin || null,
    price: model.price != null ? Number(model.price) : null,
    marketPrice: model.market_price != null ? Number(model.market_price) : null,
    currency: model.currency || 'CNY',
    highlights: parseJSON(model.highlights, []) || [],
    coverImg: model.cover_img,
    images,
    params,
    groups,
    description: model.description,
    i18n: parseJSON(model.i18n, null),   // {en:{model_name,description,category}}
  };
}

function parseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function logScan(row, ip, region, ua) {
  db.prepare(
    `INSERT INTO scan_log (tenant_id, code_id, code, ip, region, ua)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(row.tenant_id, row.id, row.code, ip, region, ua);
}

/**
 * GS1 Digital Link 解析：/01/{gtin}/21/{serial}
 *
 * 与 scan() 的差别只有一条：先确认 GTIN 与码的型号归属一致。
 * GTIN 错误或与码不匹配时按「查无此商品」处理，不泄露该码是否存在。
 */
export function resolveDigitalLink(gtin, serial, meta = {}) {
  const code = String(serial || '').toUpperCase();
  const dl = { gtin: String(gtin || ''), serial: code, valid: false };

  if (!isValidGtin(gtin)) {
    return { state: 'invalid', digitalLink: { ...dl, reason: 'gtin_invalid' } };
  }

  const binding = db
    .prepare(
      `SELECT m.gtin FROM qr_code c
       LEFT JOIN product_model m ON m.id = c.model_id
       WHERE c.code = ?`
    )
    .get(code);

  if (!binding || !binding.gtin || String(binding.gtin) !== String(gtin)) {
    return {
      state: 'invalid',
      digitalLink: { ...dl, reason: binding ? 'gtin_mismatch' : 'code_not_found' },
    };
  }

  const data = scan(code, meta);
  return { ...data, digitalLink: { ...dl, valid: true } };
}

export { clientIp };
export default { scan, clientIp, resolveRegion, resolveDigitalLink };
