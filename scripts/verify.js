/**
 * 码生成器验证脚本
 * 用法：npm run verify
 *
 * 验证项：
 *   1. 格式与字符集合法性
 *   2. 批量唯一性（10 万个无重复）
 *   3. 校验位有效性（100% 通过）
 *   4. 篡改检测率（随机改一位能被拦掉多少）
 *   5. 字符分布均匀性
 *   6. 生成性能
 *   7. GS1 Digital Link：GTIN 校验位、URI 拼装与反解
 */
import { generateBatch, isValid, generate, ALPHABET, CODE_LEN } from '../src/core/codegen.js';
import {
  gtinCheckDigit,
  isValidGtin,
  withCheckDigit,
  digitalLinkUrl,
  parseDigitalLink,
} from '../src/core/gs1.js';

const COUNT = 100000;
let pass = 0;
let fail = 0;

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}${detail ? '  ' + detail : ''}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? '  ' + detail : ''}`);
  }
}

console.log('\n===== 一物一码生成器验证 =====\n');

// ---------- 1. 批量生成 + 性能 ----------
console.log(`[1] 批量生成 ${COUNT.toLocaleString()} 个码`);
const t0 = performance.now();
const codes = generateBatch(COUNT);
const elapsed = performance.now() - t0;
check('生成完成', codes.length === COUNT,
  `耗时 ${elapsed.toFixed(0)}ms（${(COUNT / elapsed * 1000).toFixed(0)} 个/秒）`);

// ---------- 2. 格式与字符集 ----------
console.log('\n[2] 格式与字符集');
const alphabetSet = new Set(ALPHABET);
let badLen = 0;
let badChar = 0;
for (const c of codes) {
  if (c.length !== CODE_LEN) badLen++;
  for (const ch of c) {
    if (!alphabetSet.has(ch)) { badChar++; break; }
  }
}
check('长度均为 16 位', badLen === 0, badLen ? `异常 ${badLen} 个` : '');
check('字符均在合法字符集内', badChar === 0, badChar ? `异常 ${badChar} 个` : '');
check('不含易混淆字符 0 O 1 I',
  !codes.some(c => /[0O1I]/.test(c)));

// ---------- 3. 唯一性 ----------
console.log('\n[3] 唯一性');
const unique = new Set(codes);
check('10 万个码无重复', unique.size === COUNT,
  unique.size === COUNT ? '' : `重复 ${COUNT - unique.size} 个`);

// ---------- 4. 校验位 ----------
console.log('\n[4] 校验位');
let validCount = 0;
for (const c of codes) if (isValid(c)) validCount++;
check('合法码校验通过率 100%', validCount === COUNT,
  `${(validCount / COUNT * 100).toFixed(2)}%`);

// 篡改测试：随机改一位
const tamperRounds = 10000;
let rejected = 0;
for (let i = 0; i < tamperRounds; i++) {
  const code = codes[i];
  const pos = Math.floor(Math.random() * CODE_LEN);
  let ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  while (ch === code[pos]) ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  const tampered = code.slice(0, pos) + ch + code.slice(pos + 1);
  if (!isValid(tampered)) rejected++;
}
const rejectRate = rejected / tamperRounds;
check('随机改一位能被拦掉', rejectRate > 0.95,
  `${(rejectRate * 100).toFixed(2)}%（${tamperRounds} 次测试）`);

// 长度不符 / 含非法字符必须快速拒绝
check('长度错误即刻拒绝', isValid('ABC') === false && isValid('') === false);
check('含非法字符即刻拒绝', isValid('0000000000000000') === false);

// ---------- 5. 字符分布 ----------
console.log('\n[5] 字符分布均匀性');
const freq = new Map([...ALPHABET].map(c => [c, 0]));
let total = 0;
for (const c of codes) {
  for (const ch of c) { freq.set(ch, freq.get(ch) + 1); total++; }
}
const expected = total / ALPHABET.length;
let maxDev = 0;
for (const [, v] of freq) {
  maxDev = Math.max(maxDev, Math.abs(v - expected) / expected);
}
check('各字符分布偏差 < 2%', maxDev < 0.02,
  `最大偏差 ${(maxDev * 100).toFixed(2)}%（期望每字符 ${expected.toFixed(0)} 次）`);

// ---------- 6. GS1 Digital Link ----------
console.log('\n[6] GS1 Digital Link');
check('已知 GTIN 校验位正确',
  isValidGtin('06912345678902') && isValidGtin('09506000134352') && isValidGtin('00012345600012'));
check('校验位错误能被拒绝', isValidGtin('06912345678901') === false);
check('长度 / 非数字能被拒绝',
  isValidGtin('123') === false && isValidGtin('0691234567890A') === false && isValidGtin('') === false);
check('补校验位可复现', withCheckDigit('0691234567890') === '06912345678902',
  `算得 ${gtinCheckDigit('0691234567890')}`);

const dlUrl = digitalLinkUrl('https://demo.example.cn/', '06912345678902', codes[0]);
const parsed = parseDigitalLink(dlUrl);
check('Digital Link URI 拼装', dlUrl === `https://demo.example.cn/01/06912345678902/21/${codes[0]}`,
  dlUrl);
check('Digital Link 可反解', parsed.gtin === '06912345678902' && parsed.serial === codes[0]);
check('反解后校验通过', parsed.valid === true);
check('错误 GTIN 的链接判定无效',
  parseDigitalLink('https://demo.example.cn/01/06912345678901/21/ABC').valid === false);

// ---------- 7. 采样展示 ----------
console.log('\n[7] 样例');
for (let i = 0; i < 4; i++) {
  console.log(`  ${codes[i]}`);
  console.log(`    短链        https://q.example.cn/s/${codes[i]}`);
  console.log(`    Digital Link ${digitalLinkUrl('https://q.example.cn', '06912345678902', codes[i])}`);
}

// ---------- 汇总 ----------
console.log('\n===== 结果 =====');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
process.exit(fail === 0 ? 0 : 1);
