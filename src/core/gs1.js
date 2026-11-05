/**
 * GS1 Digital Link 兼容层（demo）
 *
 * 只做三件事，够 demo 用，也不是「已认证的 DPP」：
 *   1. GTIN 校验位计算与校验（GTIN-8/12/13/14，GS1 通用模 10 算法）
 *   2. 拼 Digital Link URI：{base}/01/{gtin}/21/{serial}
 *   3. 从请求路径里反解 GTIN 与序列号
 *
 * 真正的欧盟 DPP 还需要：GS1 前缀（厂商识别码）、注册中心、DPP 数据模型与
 * delegated act 要求的字段。这里只是把「码」的语法先对齐。
 */

/** GS1 模 10 校验位：从主体最右一位开始权重 3、1 交替 */
export function gtinCheckDigit(body) {
  const s = String(body ?? '');
  if (!/^\d+$/.test(s)) throw new Error(`GTIN 主体必须是数字: ${body}`);
  let sum = 0;
  for (let i = s.length - 1, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
    sum += Number(s[i]) * weight;
  }
  return String((10 - (sum % 10)) % 10);
}

const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

/** 校验完整 GTIN（含校验位），只接受 8 / 12 / 13 / 14 位 */
export function isValidGtin(gtin) {
  const s = String(gtin ?? '');
  if (!GTIN_LENGTHS.has(s.length) || !/^\d+$/.test(s)) return false;
  return gtinCheckDigit(s.slice(0, -1)) === s[s.length - 1];
}

/** 补一位校验位，把 13 位主体变成 GTIN-14 */
export function withCheckDigit(body) {
  return `${body}${gtinCheckDigit(body)}`;
}

const GTIN_AI = '01';
const SERIAL_AI = '21';

/**
 * Digital Link URI（path 形式）
 * 例：https://demo.example.cn/01/06912345678902/21/KWW6ZE9D5CQWBHDJ
 */
export function digitalLinkUrl(baseUrl, gtin, serial) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  return `${base}/${GTIN_AI}/${encodeURIComponent(gtin)}/${SERIAL_AI}/${encodeURIComponent(serial)}`;
}

/**
 * 从路径或完整 URL 反解 { gtin, serial }
 * 支持 path 形式 /01/{gtin}/21/{serial}，也兼容 ?01=...&21=...
 */
export function parseDigitalLink(input) {
  let url;
  try {
    url = new URL(String(input || ''), 'https://placeholder.local');
  } catch {
    return { gtin: null, serial: null, valid: false };
  }

  const segs = url.pathname.split('/').filter(Boolean);
  const aiValue = (ai) => {
    const i = segs.indexOf(ai);
    return i >= 0 && i + 1 < segs.length ? decodeURIComponent(segs[i + 1]) : null;
  };

  const gtin = url.searchParams.get(GTIN_AI) || aiValue(GTIN_AI);
  const serial = url.searchParams.get(SERIAL_AI) || aiValue(SERIAL_AI);

  return {
    gtin,
    serial,
    valid: isValidGtin(gtin) && Boolean(serial),
  };
}

export default {
  gtinCheckDigit,
  isValidGtin,
  withCheckDigit,
  digitalLinkUrl,
  parseDigitalLink,
};
