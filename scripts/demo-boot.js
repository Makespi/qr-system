/**
 * 演示环境启动器（PaaS / 容器）
 *
 * 免费 PaaS 的文件系统通常是临时的：每次部署或实例回收后 data/ 会被清空。
 * 这里在启动前检测数据库，没有数据就自动建表 + 生成演示码，保证点开链接就能用。
 * 已有数据时什么都不做，直接启动服务（挂持久盘时不会重复生成）。
 */
import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'app.db');

function hasCodes() {
  if (!fs.existsSync(DB_PATH)) return false;
  let db;
  try {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    return db.prepare('SELECT COUNT(*) AS n FROM qr_code').get().n > 0;
  } catch {
    return false;   // 表不存在或文件损坏，交给 init-db 重建
  } finally {
    try { db?.close(); } catch { /* ignore */ }
  }
}

function run(script, args = []) {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
}

if (!hasCodes()) {
  console.log('[boot] 未检测到演示数据，自动初始化…');
  run('init-db.js');
  run('gen-codes.js', ['--count', process.env.DEMO_CODE_COUNT || '20', '--mark']);
  console.log('[boot] 演示数据就绪');
}

await import('../src/app.js');
