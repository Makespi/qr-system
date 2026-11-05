import 'dotenv/config';   // 统一在数据层入口加载 .env，所有脚本/服务共用
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
export const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'app.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

/**
 * 日志模式说明：
 *  - WAL：默认推荐。读写不互相阻塞，扫码（读）与写日志可并行。
 *         关闭连接时会删除 -wal / -shm 文件，因此需要文件删除权限。
 *  - TRUNCATE：把日志文件截断为 0 字节而不删除。持久性等同默认模式，
 *             在禁止删除文件的环境（如受限沙箱）里可用。
 * 通过环境变量 SQLITE_JOURNAL 切换，默认 WAL。
 */
const JOURNAL =
  process.env.SQLITE_JOURNAL || (process.env.SANDBOXED === '1' ? 'TRUNCATE' : 'WAL');

let activeJournal = 'unknown';
try {
  activeJournal = db.pragma(`journal_mode = ${JOURNAL}`, { simple: true });
} catch (err) {
  console.warn(`[db] 设置 journal_mode=${JOURNAL} 失败，回退默认模式：${err.message}`);
}

db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export { activeJournal };

/** 执行建表脚本，可重复执行（schema 里都是 IF NOT EXISTS） */
export function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
  migrate();
}

/**
 * 轻量迁移：老库补字段。
 * SQLite 的 ALTER TABLE ADD COLUMN 不支持 IF NOT EXISTS，所以先查表结构再决定加不加。
 * 只做「加列」，绝不做删改，保证已有数据安全。
 */
export function migrate() {
  const columns = (table) =>
    db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);

  const addColumn = (table, column, type) => {
    try {
      if (!columns(table).includes(column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        console.log(`[db] 迁移：${table}.${column} 已添加`);
      }
    } catch (err) {
      console.warn(`[db] 迁移 ${table}.${column} 跳过：${err.message}`);
    }
  };

  addColumn('tenant', 'i18n', 'TEXT');
  addColumn('tenant', 'service_hours', 'TEXT');
  addColumn('product_model', 'i18n', 'TEXT');
  addColumn('product_model', 'brand', 'TEXT');
  addColumn('product_model', 'gtin', 'TEXT');
  addColumn('product_model', 'price', 'REAL');
  addColumn('product_model', 'market_price', 'REAL');
  addColumn('product_model', "currency", "TEXT DEFAULT 'CNY'");
  addColumn('product_model', 'highlights', 'TEXT');
  addColumn('param_template', 'groups', 'TEXT');
}


export default db;
