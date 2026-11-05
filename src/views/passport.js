/**
 * 机读商品数据（demo 版 Digital Product Passport）
 *
 * 内容协商时返回 JSON-LD：schema.org Product + GS1 Digital Link 标识 + 防伪校验状态。
 * 这不是通过欧盟 DPP 认证的数据模型，字段是按「够用、可读、可扩展」选的：
 *   - gtin14 / serialNumber：GS1 体系里的唯一标识
 *   - additionalProperty：规格参数（机读）
 *   - verification：本系统的防伪判定结果（首查 / 重复 / 作废）
 */
import { digitalLinkUrl } from '../core/gs1.js';

export function buildProductJsonLd(data, { baseUrl = '' } = {}) {
  const p = data.product || null;
  const dl = data.digitalLink || null;
  const anchor = dl?.gtin && dl?.serial ? digitalLinkUrl(baseUrl, dl.gtin, dl.serial) : undefined;

  const base = {
    '@context': ['https://schema.org/', { gs1: 'https://gs1.org/voc/' }],
    '@type': 'Product',
    ...(anchor ? { '@id': anchor, 'gs1:digitalLink': anchor } : {}),
  };

  const verification = {
    '@type': 'PropertyValue',
    name: 'Authenticity verification',
    value: data.state,
    ...(data.scanCount != null ? { scanCount: data.scanCount } : {}),
    ...(data.firstScanAt ? { firstScanAt: data.firstScanAt } : {}),
    ...(data.firstScanRegion ? { firstScanRegion: data.firstScanRegion } : {}),
  };

  if (!p) {
    return { ...base, verification };
  }

  const offers =
    p.price != null
      ? {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: p.currency || 'CNY',
          availability: 'https://schema.org/InStock',
          ...(p.marketPrice != null ? { msrp: p.marketPrice } : {}),
        }
      : undefined;

  return {
    ...base,
    gtin14: p.gtin || dl?.gtin || undefined,
    serialNumber: data.code || dl?.serial || undefined,
    name: p.modelName,
    model: p.modelCode,
    category: p.category || undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    manufacturer: data.tenant?.companyName
      ? {
          '@type': 'Organization',
          name: data.tenant.companyName,
          ...(data.tenant.servicePhone ? { telephone: data.tenant.servicePhone } : {}),
        }
      : undefined,
    description: p.description || undefined,
    offers,
    additionalProperty: (p.params || []).map((x) => ({
      '@type': 'PropertyValue',
      name: x.label,
      value: x.text,
      ...(x.unit ? { unitCode: x.unit } : {}),
    })),
    ...(data.batch?.batch_no
      ? {
          productionBatch: {
            batchNumber: data.batch.batch_no,
            productionDate: data.batch.production_date || undefined,
          },
        }
      : {}),
    verification,
  };
}

export default { buildProductJsonLd };
