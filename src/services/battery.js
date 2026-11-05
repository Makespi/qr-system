/**
 * 电池合规二维码解析（Regulation (EU) 2023/1542, Article 13(6)）
 *
 * 两种打印模式：
 *   - 一型号一码（qr_mode=model）：QR 指向 /b/{modelCode}，所有产品共用
 *   - 一序列号一码（qr_mode=serial）：QR 指向 /b/{modelCode}/{serial}，可追溯到单只电池
 *
 * 落地页必须包含 5 个模块：产品信息 / 制造商信息 / 关键原材料 /
 * 废弃处理说明 / EU 符合性声明。数据齐不齐由种子/运营数据决定，
 * 这里负责把「扫到的码」解析成一份完整的合规数据包。
 */
import { db } from '../db/index.js';
import { clientIp, resolveRegion } from './scan.js';

function parseJSON(text, fallback) {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 解析一次电池码访问
 * @param {string} modelCode 电池型号
 * @param {string|null} serial 序列号（可空 = 一型号一码）
 * @param {{ ip?: string, ua?: string }} meta
 */
export function resolveBattery(modelCode, serial = null, meta = {}) {
  const ip = meta.ip || null;
  const ua = meta.ua ? String(meta.ua).slice(0, 255) : null;
  const region = resolveRegion(ip);
  const code = String(modelCode || '').trim();

  const model = db
    .prepare(
      `SELECT b.*, t.company_name, t.registered_address, t.trademark,
              t.contact_name, t.contact_phone, t.service_phone, t.brand_color,
              t.i18n AS tenant_i18n, t.logo_url
       FROM battery_model b
       LEFT JOIN tenant t ON t.id = b.tenant_id
       WHERE b.model_code = ? AND b.status = 1`
    )
    .get(code);

  if (!model) {
    return { state: 'not_found' };
  }

  // 序列号（可选）。查不到时仍展示型号级合规信息，但明确提示序列号未登记。
  let serialInfo = null;
  let state = 'model';
  if (serial) {
    serialInfo = db
      .prepare('SELECT * FROM battery_serial WHERE model_id = ? AND serial = ?')
      .get(model.id, String(serial).trim());
    state = serialInfo ? 'serial' : 'serial_unknown';
    if (serialInfo) {
      db.prepare(
        `UPDATE battery_serial
         SET scan_count = scan_count + 1,
             first_scan_at = COALESCE(first_scan_at, datetime('now','localtime'))
         WHERE id = ?`
      ).run(serialInfo.id);
    }
  }

  db.prepare(
    `INSERT INTO battery_scan_log (tenant_id, model_id, serial, ip, region, ua)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(model.tenant_id, model.id, serialInfo?.serial ?? (serial ? String(serial).trim() : null), ip, region, ua);

  const doc = model.doc_id
    ? db.prepare('SELECT * FROM battery_doc WHERE id = ?').get(model.doc_id)
    : null;

  const totalScans = db
    .prepare('SELECT COUNT(*) AS n FROM battery_scan_log WHERE model_id = ?')
    .get(model.id).n;

  return {
    state,
    model: {
      modelCode: model.model_code,
      modelName: model.model_name,
      category: model.category,
      chemistry: model.chemistry,
      ratedVoltage: model.rated_voltage,
      ratedCapacity: model.rated_capacity,
      qrMode: model.qr_mode,
      materials: parseJSON(model.materials, []),
      i18n: parseJSON(model.i18n, null),
    },
    tenant: {
      companyName: model.company_name,
      registeredAddress: model.registered_address,
      trademark: model.trademark,
      contactName: model.contact_name,
      contactPhone: model.service_phone || model.contact_phone,
      brandColor: model.brand_color || '#1C64F2',
      logoUrl: model.logo_url,
      i18n: parseJSON(model.tenant_i18n, null),
    },
    doc: doc
      ? {
          docNo: doc.doc_no,
          issuedAt: doc.issued_at,
          standards: parseJSON(doc.standards, []),
          signerName: doc.signer_name,
          signerRole: doc.signer_role,
          place: doc.place,
        }
      : null,
    serialInfo: serialInfo
      ? {
          serial: serialInfo.serial,
          batchNo: serialInfo.batch_no,
          productionDate: serialInfo.production_date,
          scanCount: serialInfo.scan_count,
          firstScanAt: serialInfo.first_scan_at,
        }
      : null,
    totalScans,
  };
}

/** 给 /api 与 ?format=json 用的扁平数据包 */
export function batteryComplianceJson(data) {
  if (data.state === 'not_found') {
    return { state: 'not_found' };
  }
  return {
    state: data.state,
    regulation: 'Regulation (EU) 2023/1542, Article 13(6)',
    product: data.model,
    manufacturer: data.tenant,
    materials: data.model.materials,
    declarationOfConformity: data.doc,
    unit: data.serialInfo,
    scans: { total: data.totalScans },
  };
}

export default { resolveBattery, batteryComplianceJson };
