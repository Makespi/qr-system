/**
 * DPP 数字产品护照解析（ESPR / Regulation (EU) 2024/1781）
 *
 * 设计原则（对应合规要求）：
 *  1. 必填字段一个不少：数据库里没有值，页面也保留该字段并显示占位，便于审核核对
 *  2. 同一个 URL 内容协商：浏览器给 HTML，机读客户端给 JSON-LD
 *  3. 护照是"档案"不是"营销页"：状态、版本、最后更新时间必须可查
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

/** DPP 状态：正常 / 召回 / 作废（页面必须"文字 + 图标"表达，不能只靠颜色） */
export const DPP_STATUS = {
  normal: { zh: '正常在售', en: 'Active', icon: 'check', tone: 'ok' },
  recalled: { zh: '已召回', en: 'Recalled', icon: 'alert', tone: 'warn' },
  void: { zh: '已作废', en: 'Void', icon: 'cross', tone: 'bad' },
};

export function resolveDpp(dppId, meta = {}) {
  const id = String(dppId || '').trim();
  const row = db
    .prepare(
      `SELECT p.*, t.company_name, t.registered_address, t.trademark,
              t.contact_name, t.service_phone, t.contact_phone, t.logo_url,
              t.brand_color, t.i18n AS tenant_i18n
       FROM dpp_passport p
       LEFT JOIN tenant t ON t.id = p.tenant_id
       WHERE p.dpp_id = ?`
    )
    .get(id);

  if (!row) return { state: 'not_found' };

  const data = {
    state: 'ok',
    dppId: row.dpp_id,
    registryUrl: row.registry_url,
    sku: row.sku,
    modelCode: row.model_code,
    productName: row.product_name,
    batchNo: row.batch_no,
    serial: row.serial,
    category: row.category,
    originCountry: row.origin_country,
    eori: row.eori,
    euRep: {
      name: row.eu_rep_name,
      address: row.eu_rep_address,
      contact: row.eu_rep_contact,
    },
    bom: parseJSON(row.bom, []),
    certificates: parseJSON(row.certificates, []),
    repair: parseJSON(row.repair, null),
    dismantle: parseJSON(row.dismantle, null),
    recycle: parseJSON(row.recycle, null),
    battery: {
      chemistry: row.chemistry,
      capacity: row.capacity,
      cycleLife: row.cycle_life,
      carbonFootprint: row.carbon_footprint,
    },
    version: row.version,
    status: row.status,
    statusNote: row.status_note,
    updatedAt: row.updated_at || row.created_at,
    i18n: parseJSON(row.i18n, null),
    manufacturer: {
      name: row.company_name,
      address: row.registered_address,
      trademark: row.trademark,
      phone: row.service_phone || row.contact_phone,
      logoUrl: row.logo_url,
    },
    tenantI18n: parseJSON(row.tenant_i18n, null),
    scans: 0,
  };

  // 扫码统计（有表才统计，避免老库报错）
  try {
    const n = db.prepare('SELECT COUNT(*) AS n FROM dpp_scan_log WHERE dpp_id = ?').get(id);
    data.scans = n ? n.n : 0;
  } catch {
    data.scans = 0;
  }

  try {
    db.prepare('INSERT INTO dpp_scan_log (tenant_id, dpp_id, ip, region, ua) VALUES (?, ?, ?, ?, ?)')
      .run(row.tenant_id, id, meta.ip || null, resolveRegion(meta.ip || null),
           meta.ua ? String(meta.ua).slice(0, 255) : null);
  } catch {
    // 扫码日志失败不能影响护照页打开
  }

  return data;
}

/**
 * JSON-LD（同 URL，Accept: application/ld+json 时返回）
 *
 * 重要：@context 用示例命名空间占位。真实上报必须换成
 * EN 18xxx 系列对应品类的官方 vocabulary，否则 Registry 会驳回。
 */
export function buildDppJsonLd(data, baseUrl) {
  const url = `${baseUrl}/dpp/${encodeURIComponent(data.dppId)}`;
  const graph = {
    '@context': {
      '@version': 1.1,
      schema: 'https://schema.org/',
      dpp: 'https://example.org/dpp/vocab#', // ← 示例命名空间，正式环境替换为 EN 18xxx
      dppId: 'dpp:dppId',
      version: 'dpp:version',
      passportStatus: 'dpp:status',
      eori: 'dpp:eori',
      carbonFootprint: 'dpp:carbonFootprint',
      cycleLife: 'dpp:cycleLife',
      bom: 'dpp:billOfMaterials',
      repairGuide: 'dpp:repairInstructions',
      dismantleGuide: 'dpp:dismantlingInstructions',
      recyclingInfo: 'dpp:recyclingInformation',
      certificate: 'dpp:conformityDocument',
      euRepresentative: 'dpp:euAuthorisedRepresentative',
    },
    '@id': url,
    '@type': ['schema:Product', 'dpp:DigitalProductPassport'],
    dppId: data.dppId,
    version: data.version,
    passportStatus: data.status,
    lastUpdated: data.updatedAt,
    category: data.category,
    name: data.productName,
    sku: data.sku,
    mpn: data.modelCode,
    serialNumber: data.serial,
    batchNumber: data.batchNo,
    countryOfOrigin: data.originCountry,
    eori: data.eori,
    manufacturer: {
      '@type': 'schema:Organization',
      name: data.manufacturer?.name || null,
      address: data.manufacturer?.address || null,
      telephone: data.manufacturer?.phone || null,
    },
    euRepresentative: data.euRep?.name
      ? {
          '@type': 'schema:Organization',
          name: data.euRep.name,
          address: data.euRep.address || null,
          email: data.euRep.contact || null,
        }
      : null,
    bom: (data.bom || []).map((m) => ({
      '@type': 'dpp:Material',
      material: m.material,
      weight: m.weight,
      recycledShare: m.recycledShare,
      origin: m.origin,
    })),
    certificate: (data.certificates || []).map((c) => ({
      '@type': 'dpp:ConformityDocument',
      name: c.name,
      documentNumber: c.number,
      issuedBy: c.issuer,
      dateIssued: c.issuedAt,
      url: c.url ? new URL(c.url, baseUrl).toString() : null,
    })),
    repairGuide: data.repair
      ? { sparePartsYears: data.repair.sparePartsYears, steps: data.repair.steps || [] }
      : null,
    dismantleGuide: data.dismantle ? { notes: data.dismantle.notes, tools: data.dismantle.tools || [] } : null,
    recyclingInfo: data.recycle ? { takeBack: data.recycle.takeBack, notes: data.recycle.notes } : null,
    carbonFootprint: data.battery?.carbonFootprint || null,
    cycleLife: data.battery?.cycleLife || null,
    chemistry: data.battery?.chemistry || null,
    capacity: data.battery?.capacity || null,
  };

  return graph;
}

export default { resolveDpp, buildDppJsonLd, DPP_STATUS };
