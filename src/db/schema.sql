-- ============================================================
-- 一物一码防伪追溯平台 · 数据库结构（SQLite）
-- 时间字段统一用本地时间字符串，便于直接查看数据
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- 租户（公司） ----------
CREATE TABLE IF NOT EXISTS tenant (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_key     TEXT    NOT NULL UNIQUE,          -- 唯一标识，创建后禁止修改
  company_name   TEXT    NOT NULL,
  contact_name   TEXT,
  contact_phone  TEXT,
  logo_url       TEXT,
  brand_color    TEXT    DEFAULT '#1D9E75',        -- 扫码页主题色
  service_phone  TEXT,
  service_hours  TEXT,                             -- 客服服务时间，如 9:00-21:00
  registered_address TEXT,                         -- 注册地址（电池合规页 / DoC 用）
  trademark      TEXT,                             -- 注册商标（电池合规页 / DoC 用）
  domain         TEXT    UNIQUE,                   -- 可选：客户自有域名
  i18n           TEXT,                             -- JSON: {en:{company_name},es:{company_name}}
  quota_codes    INTEGER NOT NULL DEFAULT 0,       -- 剩余可用码数
  status         INTEGER NOT NULL DEFAULT 1,       -- 1 正常 0 停用
  expire_at      TEXT,
  remark         TEXT,
  created_at     TEXT    DEFAULT (datetime('now','localtime'))
);

-- ---------- 后台用户 ----------
CREATE TABLE IF NOT EXISTS sys_user (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 0,          -- 0 = 平台运营方
  username    TEXT    NOT NULL,
  password    TEXT    NOT NULL,                    -- bcrypt
  real_name   TEXT,
  role        TEXT    NOT NULL,                    -- PLATFORM_ADMIN / TENANT_ADMIN / OPERATOR / VIEWER
  status      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (tenant_id, username)
);

-- ---------- 参数模板（吸收不同客户的产品差异） ----------
CREATE TABLE IF NOT EXISTS param_template (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  fields     TEXT    NOT NULL,                     -- JSON: [{key,label,unit,required,sort,group,wide,i18n}]
  groups     TEXT,                                 -- JSON: [{key,label,i18n}]，参数分组及顺序
  created_at TEXT    DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_tpl_tenant ON param_template(tenant_id);

-- ---------- 产品型号 ----------
CREATE TABLE IF NOT EXISTS product_model (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL,
  model_code        TEXT    NOT NULL,              -- 客户内部型号编码
  model_name        TEXT    NOT NULL,
  category          TEXT,
  brand             TEXT,
  gtin              TEXT,                          -- GS1 GTIN（14 位，含校验位）；为空则沿用 /s/ 短链
  cover_img         TEXT,
  images            TEXT,                          -- JSON 数组
  price             REAL,                          -- 官方零售价（元）
  market_price      REAL,                          -- 参考价 / 划线价
  currency          TEXT    DEFAULT 'CNY',
  highlights        TEXT,                          -- JSON: [{zh,en,es}] 核心卖点
  param_template_id INTEGER,
  params            TEXT,                          -- JSON: {key: value}
  description       TEXT,
  i18n              TEXT,                          -- JSON: {en:{model_name,description,category},es:{...}}
  status            INTEGER NOT NULL DEFAULT 1,    -- 1 上架 0 下架
  created_at        TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (tenant_id, model_code)                   -- 租户内唯一，不与其他公司冲突
);
CREATE INDEX IF NOT EXISTS idx_model_tenant ON product_model(tenant_id);

-- ---------- 生产批次 ----------
CREATE TABLE IF NOT EXISTS production_batch (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL,
  batch_no        TEXT    NOT NULL,
  model_id        INTEGER NOT NULL,
  production_date TEXT,
  expiry_date     TEXT,
  quantity        INTEGER NOT NULL DEFAULT 0,
  remark          TEXT,
  created_at      TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (tenant_id, batch_no)
);
CREATE INDEX IF NOT EXISTS idx_batch_tenant ON production_batch(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batch_model  ON production_batch(model_id);

-- ---------- 打标任务 ----------
CREATE TABLE IF NOT EXISTS mark_job (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id    INTEGER NOT NULL,
  batch_id     INTEGER NOT NULL,
  job_no       TEXT    NOT NULL,
  device_sn    TEXT,
  package_size INTEGER NOT NULL DEFAULT 2000,      -- 一个码包多少个码
  total_count  INTEGER NOT NULL,
  cursor       INTEGER NOT NULL DEFAULT 0,         -- 游标：已成功取码的最大 seq_no，断点续打靠它
  marked_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status       INTEGER NOT NULL DEFAULT 0,         -- 0待开始 1进行中 2已完成 3已暂停
  started_at   TEXT,
  finished_at  TEXT,
  created_at   TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (tenant_id, job_no)
);
CREATE INDEX IF NOT EXISTS idx_job_tenant ON mark_job(tenant_id);

-- ---------- 核心：一物一码 ----------
CREATE TABLE IF NOT EXISTS qr_code (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  code              TEXT    NOT NULL UNIQUE,       -- 16 位，全平台唯一
  tenant_id         INTEGER NOT NULL,
  model_id          INTEGER NOT NULL,
  batch_id          INTEGER NOT NULL,
  job_id            INTEGER,
  seq_no            INTEGER,                       -- 在任务中的序号，断点续打依赖此字段
  package_no        INTEGER,                       -- 属于第几个码包
  box_code          TEXT,                          -- 箱码，装箱时回填
  dealer_id         INTEGER,                       -- 二期：经销商归属
  mark_status       INTEGER NOT NULL DEFAULT 0,    -- 0待打标 1已打标 2打标失败
  marked_at         TEXT,
  status            INTEGER NOT NULL DEFAULT 0,    -- 0未激活 1正常 2已作废
  scan_count        INTEGER NOT NULL DEFAULT 0,
  first_scan_at     TEXT,
  first_scan_ip     TEXT,
  first_scan_region TEXT,
  last_scan_at      TEXT,
  created_at        TEXT    DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_code_job   ON qr_code(job_id, seq_no);
CREATE INDEX IF NOT EXISTS idx_code_batch ON qr_code(batch_id);
CREATE INDEX IF NOT EXISTS idx_code_model ON qr_code(model_id);
CREATE INDEX IF NOT EXISTS idx_code_tenant ON qr_code(tenant_id);

-- ---------- 扫码日志 ----------
CREATE TABLE IF NOT EXISTS scan_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  code_id  INTEGER NOT NULL,
  code     TEXT    NOT NULL,
  ip       TEXT,
  region   TEXT,
  ua       TEXT,
  scan_at  TEXT    DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_log_code ON scan_log(code_id);
CREATE INDEX IF NOT EXISTS idx_log_time ON scan_log(scan_at);

-- ---------- 操作审计 ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER NOT NULL,
  user_id    INTEGER,
  username   TEXT,
  action     TEXT    NOT NULL,                     -- GEN_CODES / EXPORT_PACKAGE / VOID_CODE / LOGIN ...
  target     TEXT,
  detail     TEXT,
  ip         TEXT,
  created_at TEXT    DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);

-- ============================================================
-- 电池合规二维码（Regulation (EU) 2023/1542, Article 13(6)，2027-02-18 起适用）
-- 二维码指向的落地页须包含 5 个模块：产品信息 / 制造商信息 /
-- 关键原材料 / 废弃处理说明 / EU 符合性声明（DoC）
-- ============================================================

-- ---------- 电池型号（「一型号一码」的单位；qr_mode=serial 时为「一序列号一码」的母体） ----------
CREATE TABLE IF NOT EXISTS battery_model (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL,
  model_code      TEXT    NOT NULL,                -- 电池型号，如 JL-1214
  model_name      TEXT    NOT NULL,
  category        TEXT    NOT NULL DEFAULT 'portable', -- portable / ev / lmt / industrial
  chemistry       TEXT    NOT NULL DEFAULT 'li-ion',   -- 化学体系 key，展示文案在多语言字典
  rated_voltage   TEXT,                            -- 额定电压，如 12V
  rated_capacity  TEXT,                            -- 额定容量，如 14Ah（168Wh）
  qr_mode         TEXT    NOT NULL DEFAULT 'model',-- model=一型号一码 / serial=一序列号一码
  doc_id          INTEGER,                         -- 关联 EU 符合性声明
  materials       TEXT,                            -- JSON: [{key, share}] 关键原材料及回收含量占比
  i18n            TEXT,                            -- JSON: {en:{model_name},...}
  status          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (tenant_id, model_code)
);
CREATE INDEX IF NOT EXISTS idx_bmodel_tenant ON battery_model(tenant_id);

-- ---------- 电池序列号（一序列号一码模式下打印的单位） ----------
CREATE TABLE IF NOT EXISTS battery_serial (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL,
  model_id        INTEGER NOT NULL,
  serial          TEXT    NOT NULL,
  batch_no        TEXT,
  production_date TEXT,
  status          INTEGER NOT NULL DEFAULT 1,      -- 1 正常 0 作废
  scan_count      INTEGER NOT NULL DEFAULT 0,
  first_scan_at   TEXT,
  created_at      TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (model_id, serial)
);
CREATE INDEX IF NOT EXISTS idx_bserial_model ON battery_serial(model_id);

-- ---------- EU 符合性声明（Annex VI Part B，demo 简化字段） ----------
CREATE TABLE IF NOT EXISTS battery_doc (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL,
  doc_no      TEXT    NOT NULL,
  issued_at   TEXT,
  standards   TEXT,                                -- JSON 数组：引用的标准
  signer_name TEXT,
  signer_role TEXT,
  place       TEXT,
  created_at  TEXT    DEFAULT (datetime('now','localtime')),
  UNIQUE (tenant_id, doc_no)
);

-- ---------- 电池码扫码日志（后台流量统计的数据源） ----------
CREATE TABLE IF NOT EXISTS battery_scan_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  model_id  INTEGER NOT NULL,
  serial    TEXT,
  ip        TEXT,
  region    TEXT,
  ua        TEXT,
  scan_at   TEXT    DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_blog_model ON battery_scan_log(model_id);
CREATE INDEX IF NOT EXISTS idx_blog_time  ON battery_scan_log(scan_at);
