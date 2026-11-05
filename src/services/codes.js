/**
 * 码生命周期服务：生成、作废、补发、核销
 */
import { db } from '../db/index.js';
import { generateBatch } from '../core/codegen.js';

const MAX_SINGLE = 200000;   // 单次生成上限，防止误操作
const INSERT_CHUNK = 5000;   // 分批插入，控制内存峰值

function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/**
 * 创建打标任务并生成码
 *
 * 事务顺序（顺序不能调）：
 *   校验批次归属 → 原子扣配额 → 建任务 → 插入码
 * 任何一步失败整体回滚，不会出现「扣了配额没生成码」或「生成了码没扣配额」。
 *
 * @returns {{ jobNo: string, jobId: number, count: number, packageSize: number, packages: number }}
 */
export function createMarkJob({ tenantId, batchId, count, packageSize = 2000, deviceSn = null }) {
  if (!Number.isInteger(count) || count <= 0) throw new Error('生成数量必须是正整数');
  if (count > MAX_SINGLE) throw new Error(`单次生成不能超过 ${MAX_SINGLE.toLocaleString()} 个`);
  if (!Number.isInteger(packageSize) || packageSize <= 0) throw new Error('码包大小必须是正整数');

  const tx = db.transaction(() => {
    // 1. 批次必须属于当前租户（防越权：不能拿别人的 batchId 生成码）
    const batch = db
      .prepare('SELECT * FROM production_batch WHERE id = ? AND tenant_id = ?')
      .get(batchId, tenantId);
    if (!batch) throw new Error('批次不存在或无权访问');

    // 2. 配额原子扣减：靠 changes 判断，先查再改会在并发下超发
    const quota = db
      .prepare('UPDATE tenant SET quota_codes = quota_codes - ? WHERE id = ? AND quota_codes >= ?')
      .run(count, tenantId, count);
    if (quota.changes === 0) {
      const t = db.prepare('SELECT quota_codes FROM tenant WHERE id = ?').get(tenantId);
      throw new Error(`配额不足，剩余 ${t ? t.quota_codes : 0} 个，本次需要 ${count} 个`);
    }

    // 3. 任务号：日期 + 租户内当日序号，靠唯一索引兜底重试
    const prefix = `MK${todayKey()}`;
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM mark_job
         WHERE tenant_id = ? AND job_no LIKE ?`
      )
      .get(tenantId, `${prefix}%`);
    const jobNo = `${prefix}-${String(row.c + 1).padStart(3, '0')}`;

    const jobInfo = db
      .prepare(
        `INSERT INTO mark_job (tenant_id, batch_id, job_no, device_sn, package_size, total_count)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(tenantId, batchId, jobNo, deviceSn, packageSize, count);
    const jobId = Number(jobInfo.lastInsertRowid);

    // 4. 分批生成并插入
    const insert = db.prepare(
      `INSERT INTO qr_code (code, tenant_id, model_id, batch_id, job_id, seq_no, package_no)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    let done = 0;
    while (done < count) {
      const size = Math.min(INSERT_CHUNK, count - done);
      const codes = generateBatch(size);
      for (let i = 0; i < size; i++) {
        const seq = done + i + 1;
        insert.run(
          codes[i], tenantId, batch.model_id, batchId, jobId,
          seq, Math.ceil(seq / packageSize)
        );
      }
      done += size;
    }

    return { jobNo, jobId, count, packageSize, packages: Math.ceil(count / packageSize) };
  });

  return tx();
}

/**
 * 取某任务的下一个码（给设备用），自动推进游标
 * @param {string} jobNo
 * @returns {string|null} 无可用码时返回 null
 */
export function nextCode(jobNo) {
  const tx = db.transaction(() => {
    const job = db.prepare('SELECT * FROM mark_job WHERE job_no = ?').get(jobNo);
    if (!job) throw new Error(`任务不存在: ${jobNo}`);

    const row = db
      .prepare(
        `SELECT id, code, seq_no FROM qr_code
         WHERE job_id = ? AND mark_status = 0 AND seq_no > ?
         ORDER BY seq_no LIMIT 1`
      )
      .get(job.id, job.cursor);

    if (!row) return null;

    db.prepare('UPDATE mark_job SET cursor = ?, status = 1, started_at = COALESCE(started_at, datetime(\'now\',\'localtime\')) WHERE id = ?')
      .run(Math.max(job.cursor, row.seq_no), job.id);

    return row.code;
  });

  return tx();
}

/**
 * 设备确认打标成功（幂等：重复提交不重复计数）
 */
export function confirmMarked(jobNo, code) {
  const tx = db.transaction(() => {
    const r = db
      .prepare(
        `UPDATE qr_code
         SET mark_status = 1, marked_at = datetime('now','localtime')
         WHERE code = ? AND mark_status = 0`
      )
      .run(code);

    if (r.changes > 0) {
      db.prepare(
        `UPDATE mark_job SET marked_count = marked_count + 1 WHERE job_no = ?`
      ).run(jobNo);
    }
    return r.changes > 0;
  });
  return tx();
}

/**
 * 设备报打标失败
 */
export function markFailed(jobNo, code) {
  const tx = db.transaction(() => {
    const r = db
      .prepare(`UPDATE qr_code SET mark_status = 2 WHERE code = ? AND mark_status = 0`)
      .run(code);
    if (r.changes > 0) {
      db.prepare('UPDATE mark_job SET failed_count = failed_count + 1 WHERE job_no = ?').run(jobNo);
    }
    return r.changes > 0;
  });
  return tx();
}

/**
 * 作废码（重打场景必用）
 * 作废而非删除：扫码时要能识别并提示「此码已作废」
 */
export function voidCode(tenantId, code, reason = '') {
  const r = db
    .prepare(
      `UPDATE qr_code SET status = 2
       WHERE code = ? AND tenant_id = ? AND status <> 2`
    )
    .run(code, tenantId);
  if (r.changes === 0) throw new Error('码不存在、无权操作或已作废');
  return true;
}

/**
 * 任务进度统计
 */
export function jobProgress(tenantId, jobId) {
  const job = db
    .prepare('SELECT * FROM mark_job WHERE id = ? AND tenant_id = ?')
    .get(jobId, tenantId);
  if (!job) throw new Error('任务不存在或无权访问');

  const stat = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN mark_status = 1 THEN 1 ELSE 0 END) AS marked,
         SUM(CASE WHEN mark_status = 2 THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN mark_status = 0 THEN 1 ELSE 0 END) AS pending
       FROM qr_code WHERE job_id = ?`
    )
    .get(jobId);

  return { job, stat };
}

export default { createMarkJob, nextCode, confirmMarked, markFailed, voidCode, jobProgress };
