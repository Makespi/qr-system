/**
 * 命令行生成码（用于测试与首期手工运营）
 *
 * 用法：
 *   npm run gen -- --count 200              # 生成 200 个码
 *   npm run gen -- --count 2000 --mark      # 生成并标记为「已打标 + 在售」，可直接扫码看效果
 *   npm run gen -- --count 100 --tenant demo
 */
import { db } from '../src/db/index.js';
import { createMarkJob, jobProgress } from '../src/services/codes.js';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const key = a.slice(2);
  const next = argv[i + 1];
  args[key] = next && !next.startsWith('--') ? (i++, next) : true;
}

const count = Number(args.count || 200);
const tenantKey = args.tenant || 'demo';
const mark = Boolean(args.mark);

const tenant = db.prepare('SELECT * FROM tenant WHERE tenant_key = ?').get(tenantKey);
if (!tenant) {
  console.error(`找不到租户: ${tenantKey}`);
  process.exit(1);
}

// 找一个可用批次，没有就建一个
let batch = db
  .prepare('SELECT * FROM production_batch WHERE tenant_id = ? ORDER BY id DESC LIMIT 1')
  .get(tenant.id);

if (!batch) {
  const model = db
    .prepare('SELECT * FROM product_model WHERE tenant_id = ? LIMIT 1')
    .get(tenant.id);
  if (!model) {
    console.error('该租户下没有产品型号，请先初始化（npm run init-db）');
    process.exit(1);
  }
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const batchNo = `B${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-01`;
  const info = db
    .prepare(
      `INSERT INTO production_batch (tenant_id, batch_no, model_id, production_date, quantity)
       VALUES (?, ?, ?, date('now','localtime'), ?)`
    )
    .run(tenant.id, batchNo, model.id, count);
  batch = db.prepare('SELECT * FROM production_batch WHERE id = ?').get(info.lastInsertRowid);
  console.log(`已创建批次 ${batchNo}`);
}

console.log(`租户：${tenant.company_name}（剩余配额 ${tenant.quota_codes}）`);
console.log(`批次：${batch.batch_no}`);

const t0 = performance.now();
const job = createMarkJob({
  tenantId: tenant.id,
  batchId: batch.id,
  count,
  packageSize: 2000,
});
const ms = performance.now() - t0;

if (mark) {
  db.prepare(
    `UPDATE qr_code SET mark_status = 1, marked_at = datetime('now','localtime'), status = 1
     WHERE job_id = ?`
  ).run(job.jobId);
  db.prepare(
    `UPDATE mark_job SET marked_count = total_count, status = 2,
       started_at = datetime('now','localtime'), finished_at = datetime('now','localtime')
     WHERE id = ?`
  ).run(job.jobId);
}

const { stat } = jobProgress(tenant.id, job.jobId);
const samples = db
  .prepare('SELECT code FROM qr_code WHERE job_id = ? ORDER BY seq_no LIMIT 3')
  .all(job.jobId);
const model = db.prepare('SELECT gtin FROM product_model WHERE id = ?').get(batch.model_id);
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

console.log(`\n✓ 任务 ${job.jobNo} 已创建`);
console.log(`  本次生成 ${job.count} 个码，耗时 ${ms.toFixed(0)}ms`);
console.log(`  拆分为 ${job.packages} 个码包（每包 ${job.packageSize} 个）`);
console.log(`  待打标 ${stat.pending} / 已打标 ${stat.marked} / 失败 ${stat.failed}`);
console.log(`\n样例码：`);
samples.forEach((s) => {
  console.log(`  ${s.code}`);
  if (model?.gtin) {
    // 二维码里写入的就是这个 Digital Link
    console.log(`    Digital Link  ${BASE_URL}/01/${model.gtin}/21/${s.code}`);
  }
  console.log(`    短链          ${BASE_URL}/s/${s.code}`);
});
const t = db.prepare('SELECT quota_codes FROM tenant WHERE id = ?').get(tenant.id);
console.log(`\n剩余配额：${t.quota_codes}`);
console.log(`打开 http://localhost:3000/demo 查看全部`);
