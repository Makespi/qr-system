/**
 * 一物一码生成器
 *
 * 设计要点：
 * 1. 字符集 32 个，剔除易混淆的 0 O 1 I —— 印刷后人工核对不出错
 * 2. 结构 = 15 位随机 + 1 位 Luhn mod N 校验位
 * 3. 校验位让约 31/32 的乱输码在内存里被拦掉，不进数据库，防遍历
 * 4. 随机源用 crypto.randomBytes，byte & 0x1F 取 0-31（256 能被 32 整除，分布均匀）
 */
import crypto from 'node:crypto';

export const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 个字符
const N = ALPHABET.length;
const BODY_LEN = 15;
export const CODE_LEN = 16;

/** 字符 -> 索引，用于 O(1) 反查与合法性判断 */
const INDEX = new Map([...ALPHABET].map((c, i) => [c, i]));

/**
 * 计算校验位（Luhn mod N）
 * @param {string} body 前 15 位
 * @returns {string} 1 位校验字符
 */
function computeCheck(body) {
  let factor = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    const cp = INDEX.get(body[i]);
    if (cp === undefined) {
      throw new Error(`非法字符: ${body[i]}`);
    }
    let addend = factor * cp;
    factor = factor === 2 ? 1 : 2;
    // 进位折叠：把多位数压回单字符范围
    addend = Math.floor(addend / N) + (addend % N);
    sum += addend;
  }
  return ALPHABET[(N - (sum % N)) % N];
}

/**
 * 生成一个唯一码
 * @returns {string} 16 位码，如 2K7M9XQ4TB8NHD5R
 */
export function generate() {
  const buf = crypto.randomBytes(BODY_LEN);
  let body = '';
  for (let i = 0; i < BODY_LEN; i++) {
    body += ALPHABET[buf[i] & 0x1f];
  }
  return body + computeCheck(body);
}

/**
 * 批量生成，保证返回数组内部无重复
 * 碰撞概率极低（32^15 ≈ 3.7e22），但批量场景仍做一次内存去重，
 * 数据库唯一索引作为最后一道防线。
 * @param {number} count
 * @returns {string[]}
 */
export function generateBatch(count) {
  const set = new Set();
  let guard = 0;
  while (set.size < count) {
    set.add(generate());
    if (++guard > count * 10) {
      throw new Error('码生成异常：重复率过高，请检查随机源');
    }
  }
  return [...set];
}

/**
 * 校验码格式与校验位
 * @param {string} code
 * @returns {boolean}
 */
export function isValid(code) {
  if (typeof code !== 'string' || code.length !== CODE_LEN) return false;
  for (const c of code) {
    if (!INDEX.has(c)) return false;
  }
  return computeCheck(code.slice(0, BODY_LEN)) === code[BODY_LEN];
}

/**
 * 把码转成短链路径，供二维码内容使用
 * @param {string} code
 * @param {string} baseUrl
 * @returns {string}
 */
export function toScanUrl(code, baseUrl = 'https://q.example.cn') {
  return `${baseUrl.replace(/\/$/, '')}/s/${code}`;
}

export default { ALPHABET, CODE_LEN, generate, generateBatch, isValid, toScanUrl };
