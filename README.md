# 一物一码防伪追溯平台

多租户一物一码系统。Node.js + Express + SQLite，零外部依赖，一条命令启动。

## 快速开始

```bash
npm install          # 首次
npm run init-db      # 建表 + 种子数据（可重复执行）
npm run gen -- --count 50 --mark   # 生成 50 个测试码并标记为在售
npm start            # 启动服务
```

打开 http://localhost:3000/demo 可以看到码列表，点「打开扫码页」直接看效果。

账号（init-db 自动创建）：

| 账号 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 平台运营方 |
| demo | demo123 | 租户管理员（精龙电动喷雾器） |

> 演示数据取自精龙 3WBD-16 型背负式电动喷雾器产品页（zlslc.com/h-pd-86.html）：
> 型号 3WBD-16、零售价 ￥500（参考价 ￥530）、10 项规格参数、5 个核心卖点、客服电话 17131053535。

## 常用命令

```bash
npm run verify                        # 验证码生成算法（10 万码压测）
npm run gen -- --count 2000           # 生成 2000 个码（不标记打标）
npm run gen -- --count 100 --mark     # 生成并标记为已打标 + 在售
npm run gen -- --count 100 --tenant demo
npm start                             # 启动服务，默认 3000 端口
PORT=8080 npm start                   # 换端口
```

## 环境变量

支持 `.env`（`cp .env.example .env`，服务与脚本都会自动加载），也可以直接用环境变量覆盖。

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | 3000 | 服务端口 |
| `BASE_URL` | `http://localhost:3000` | 二维码里写入的域名，上线时改成正式域名 |
| `DB_PATH` | `data/app.db` | 数据库文件路径 |
| `SQLITE_JOURNAL` | `WAL` | 日志模式。WAL 读写并发最好；在禁止删除文件的环境里用 `TRUNCATE` |

> 上线时务必设置 `BASE_URL=https://你的域名`，否则生成的二维码里是 localhost，印出去就废了。
> 这个值决定二维码内容，一旦印刷**不可更改**。

## 部署到 Linux 服务器（演示）

以 Ubuntu 22.04/24.04 + 公网 IP 为例，全程约 5 分钟。示例里 IP 用 `1.2.3.4` 代替。

**0. 前提**

- 服务器能装 Node 20/22（推荐 22 LTS），`better-sqlite3` 是原生模块，x86 有预编译，ARM 需要编译工具
- 云服务器安全组 / 防火墙放行演示端口（3000，或走 Nginx 的 80）

**1. 装 Node 22**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3
node -v    # 应为 v22.x
```

**2. 建运行用户并上传代码**

本地打包（排除依赖和数据库，避免把本机数据带上去）：

```bash
tar --exclude=node_modules --exclude=data --exclude=exports -czf qr-system.tar.gz .
scp qr-system.tar.gz root@1.2.3.4:/tmp/
```

服务器：

```bash
sudo useradd -r -m -d /opt/qr-system qr   # 已存在则跳过
sudo -u qr tar -xzf /tmp/qr-system.tar.gz -C /opt/qr-system
```

**3. 装依赖（只装生产依赖）**

```bash
sudo -u qr bash -lc 'cd /opt/qr-system && npm ci --omit=dev'
```

**4. 配置 .env**

```bash
sudo -u qr cp /opt/qr-system/.env.example /opt/qr-system/.env
sudo -u qr nano /opt/qr-system/.env
```

关键两项（`BASE_URL` 必须是手机能打开的地址，不能是 localhost）：

```ini
PORT=3000
BASE_URL=http://1.2.3.4:3000
NODE_ENV=production
```

**5. 初始化数据 + 生成演示码**

```bash
sudo -u qr bash -lc 'cd /opt/qr-system && npm run init-db && npm run gen -- --count 30 --mark'
```

`gen` 会打印每个码的扫码地址，二维码载荷取决于第 4 步的 `BASE_URL`。

**6. 常驻运行（systemd）**

```bash
sudo cp /opt/qr-system/deploy/qr-demo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now qr-demo
sudo systemctl status qr-demo
sudo journalctl -u qr-demo -f          # 看日志
```

**7. 开放端口并验收**

```bash
sudo ufw allow 3000/tcp                # 云厂商安全组也要放行
curl http://127.0.0.1:3000/health
curl -H 'Accept: application/ld+json' http://127.0.0.1:3000/01/06912345678902/21/<你的码>
```

手机浏览器打开 `http://1.2.3.4:3000/demo`，点任意「GS1 扫码页」，或直接用手机扫卡片上的二维码。

**8. 可选：域名 + Nginx（扫码不用带端口）**

```bash
sudo apt install -y nginx
sudo cp /opt/qr-system/deploy/nginx.conf /etc/nginx/conf.d/qr-demo.conf
sudo nano /etc/nginx/conf.d/qr-demo.conf   # 改 server_name 为你的域名
sudo nginx -t && sudo systemctl reload nginx
```

然后把 `.env` 的 `BASE_URL` 改成 `http://你的域名`，**重新生成码**（旧码里写着 `:3000`，载荷印死后不可改）：

```bash
sudo -u qr bash -lc 'cd /opt/qr-system && npm run gen -- --count 30 --mark'
sudo systemctl restart qr-demo
```

需要 https（微信/iOS 相机更友好），用 Caddy 最省事：

```
demo.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

**9. 数据备份**

```bash
# 有 sqlite3 命令行时（WAL 模式也安全）
sqlite3 /opt/qr-system/data/app.db ".backup '/opt/backup/app-$(date +%F).db'"

# 没有的话：停服拷贝
sudo systemctl stop qr-demo && sudo cp /opt/qr-system/data/app.db* /opt/backup/ && sudo systemctl start qr-demo
```

**演示阶段常见坑**

- 二维码里是 `BASE_URL` 的静态字符串：换 IP / 换域名 / 换端口后，必须重新生成码，旧码不会自动跳转
- `data/`、`exports/` 必须对运行用户 `qr` 可写（PDF 导出、扫码日志都落盘）
- 别用 `root` 跑服务；也不要把 3000 端口直接暴露在公网又加 Nginx，二选一
- 真机扫码打不开时，先确认手机与服务器网络互通，再用手机浏览器直接访问 `BASE_URL` 排查

## 部署到 GitHub + 免费 PaaS（想要一个可点开的链接）

先说清楚 GitHub 能做什么：**它不提供运行 Node 服务的服务器**。

- GitHub Pages 只能托管静态文件，跑不了 Express + SQLite
- GitHub Actions 可以跑命令，但不能常驻、地址也不固定，不适合当演示站
- 仓库只是代码托管，真正运行要交给 PaaS（Render / Railway / Fly.io / Koyeb）

推荐 **Render 免费 Web Service**，从 GitHub 仓库直接部署，自带 https 域名。

**1. 推到 GitHub**

```bash
git init -b main
git add .
git commit -m "一物一码 demo"
gh repo create qr-system --public --source=. --push   # 或用网页建仓后 git remote add
```

**2. Render 建 Web Service**

New → Web Service → 选这个仓库，两种方式任选：

- Runtime 选 **Docker**（仓库已带 `Dockerfile`，无需填命令）
- 或 Runtime 选 **Node**：Build Command `npm ci`，Start Command `npm run start:demo`

环境变量只填一个：

```ini
BASE_URL=https://你的服务名.onrender.com
```

**3. 首次启动会自动初始化**

`scripts/demo-boot.js` 检测到没有数据会执行 `init-db` + 生成 20 个演示码（可用 `DEMO_CODE_COUNT` 改数量），之后再启动不会重复生成。所以不需要在部署平台手工跑脚本。

**免费实例的现实限制**

- 15 分钟无访问会休眠，下次访问冷启动约 30–60 秒。演示前先打开一次 `/health` 预热
- 文件系统是临时的：重新部署或实例回收后数据重建，扫码次数会归零（演示够用）
- 要保留数据：Railway 加 Volume，或 Fly.io 挂 volume 到 `/app/data`；再进一步是换 Postgres / Turso（需要改数据访问层，不属于 demo 范围）

**不想绑卡：用 GitHub Codespaces**

Render 对新账号会要求验证支付方式（即使免费计划）。Codespaces 用 GitHub 自己的机器，不需要卡：

1. 仓库页 → **Code** → **Codespaces** → **Create codespace on main**
2. 等 1–2 分钟：容器会自动 `npm ci` 并启动服务（`.devcontainer/devcontainer.json` 里配的）
3. 端口 3000 已预设为 **Public**，转发后会得到一个 `https://<名称>-3000.app.github.dev` 的链接，直接发给别人也能打开

限制：

- Codespace **30 分钟无活动会自动停止**，链接随即失效；重新打开后域名不变，服务会自动重启
- 个人账号每月 120 core-hours（2 核机器约 60 小时），长期挂着会耗尽
- 适合自己演示或内部评审；要给客户长期可点的链接，还是用 Render 或 Hugging Face Spaces（免费 Docker、无需卡）

**纯静态 Pages 为什么不行**：只能展示渲染好的 HTML，扫码计数、防伪判定、JSON-LD 都会失效。

## 目录结构

```
src/
├── app.js                  服务入口 + 路由
├── core/
│   ├── codegen.js          16 位码生成 + Luhn mod N 校验位
│   └── gs1.js              GTIN 校验位 + Digital Link URI 拼装/反解
├── db/
│   ├── index.js            SQLite 连接（WAL / TRUNCATE 可切换）
│   └── schema.sql          9 张表完整结构
├── services/
│   ├── codes.js            码生成、配额扣减、打标状态、作废
│   ├── scan.js             扫码判定：校验 → 状态判定 → 记录
│   └── battery.js          电池合规码解析（型号/序列号）+ 扫码记录
├── views/
│   ├── scanPage.js         扫码结果页（移动端优先）
│   ├── batteryPage.js      电池合规落地页（5 模块 / 6 语言）
│   ├── docPdf.js           EU 符合性声明 PDF（pdfkit 现场生成）
│   └── passport.js         JSON-LD 商品数据（DPP demo）
scripts/
├── init-db.js              建表 + 种子数据
├── gen-codes.js            命令行生成码
└── verify.js               码生成器验证
deploy/
├── qr-demo.service         systemd 服务示例
└── nginx.conf              80 端口反代示例
```

## 已实现

- [x] 16 位唯一码（32 进制，剔除 `0 O 1 I`）+ 校验位，篡改检测率 100%
- [x] 批量生成（10 万个 112ms）、配额原子扣减、租户隔离
- [x] 码状态机：待打标 / 已打标 / 打标失败 / 未激活 / 在售 / 已作废
- [x] 扫码三种结果展示：首次正品 / 已被查询 / 未找到
- [x] 首查时间、查询次数、首次地点记录（原子更新，并发首扫不会互相覆盖）
- [x] 扫码日志、操作审计表
- [x] 多租户：型号编码租户内唯一、扫码页主题色可配置
- [x] 参数字段模板（不同租户不同产品结构，不用改代码）
- [x] 规格参数分组（整机参数 / 电池与动力，长字段自动占整行）
- [x] 产品卡片：官方零售价 + 参考价、核心卖点标签、品牌
- [x] 批次追溯：扫码页展示生产批次号与生产日期
- [x] 客服信息：电话一键拨号 + 服务时间（如 9:00-21:00）
- [x] GS1 Digital Link 兼容（demo）：`/01/{gtin}/21/{serial}` 解析、内容协商、二维码载荷切换
- [x] 电池合规二维码（EU 2023/1542 Art.13(6) demo）：5 模块落地页、6 语言、DoC PDF、一型号/一序列号一码
- [x] DPP 数字产品护照（ESPR / (EU) 2024/1781 demo）：必填字段齐全、同一 URL 内容协商 HTML/JSON-LD、无障碍双语页
- [x] 二维码图片接口 `/api/qr/:code.png`
- [x] 演示页 `/demo`

## 待开发（按任务清单顺序）

- [ ] 管理后台界面（型号 / 批次 / 任务 / 报表）
- [ ] 码包导出 TXT + PDF（含可读码文）
- [ ] 打标设备对接（TCP 取码 / 串口）
- [ ] 登录鉴权中间件（表已建，接口未接）
- [ ] 扫码数据看板
- [ ] 防刷限流（Nginx 层 + 业务层）
- [ ] IP 地域解析（ip2region）

## 关键设计说明

**GS1 Digital Link 兼容（demo）**

型号填了 `gtin` 后，整条链路自动切换为 GS1 Digital Link：

- 二维码载荷：`{BASE_URL}/01/{gtin}/21/{16位码}`（序列号就是防伪码，GS1 AI 21 合法字符集内）
- 解析路由：`GET /01/{gtin}/21/{serial}`
  - 浏览器（`text/html`）→ 扫码页
  - 机读客户端（`Accept: application/ld+json` 或 `?format=json`）→ JSON-LD（schema.org Product + GS1 标识 + 防伪状态）
  - GTIN 无效或与码不匹配 → 404，不泄露码是否存在
- GTIN 校验位（模 10）在 `npm run verify` 里有一组用例

```bash
curl -H 'Accept: application/ld+json' http://localhost:3000/01/06912345678902/21/KWW6ZE9D5CQWBHDJ  # 序列号见 gen 输出
```

边界要清楚：

- 演示 GTIN `06912345678902` 校验位正确，但**不是真实厂商前缀**，正式印刷前必须换成向 GS1 申请的 GTIN。二维码载荷印上去就改不了。
- 这是「语法兼容 + 机读数据」，还不是通过认证的欧盟 DPP：没有 GS1 注册中心、没有 DPP 标准数据模型（材料/回收/碳足迹等按品类 delegated act 定义）、电池护照（EU 2023/1542，2027-02-18 起）另算。

**电池合规二维码（EU 2023/1542, Article 13(6)，demo）**

按法规要求，2027-02-18 起所有投欧电池须带二维码，扫码落地页包含 5 个模块：

| 模块 | 数据来源 |
|---|---|
| ① 产品信息 | `battery_model`：型号、化学体系、额定电压/容量、类别 + `battery_serial`：批次、生产日期 |
| ② 制造商信息 | `tenant`：名称、注册商标、注册地址、联系方式 |
| ③ 关键原材料 | `battery_model.materials`：材料 + 回收含量占比（示例值） |
| ④ 废弃处理说明 | 内置多语言模板（WEEE 单独收集 + 带叉垃圾桶符号） |
| ⑤ EU 符合性声明 | `battery_doc`：编号、签发日期、标准、签署人；`/b/{model}/doc.pdf` 现场生成 PDF（英文） |

路由与二维码：

- 落地页 `GET /b/{model}`（一型号一码）、`GET /b/{model}/{serial}`（一序列号一码）
- 二维码 `GET /api/qr/battery/{model}.png`、`/api/qr/battery/{model}/{serial}.png`
- 机读数据 `?format=json` 返回合规数据包（含法规引用）
- 多语言：中/英/德/法/西/意，前端切换，无额外请求；扩展语言在 `views/batteryPage.js` 的 DICT 加词条

示例（init-db 自动创建）：`/b/JL-1214`、`/b/JL-1214/JL1214-2026-0001`、`/b/JL-1214/doc.pdf`

边界：演示数据均为示例，不构成合规意见；电池二维码 ≠ 电池护照（Article 77，仅 EV / LMT / >2kWh 工业电池需要护照）；DoC PDF 为英文 demo，正式文件的语言与签发要求按目标成员国规定。

**DPP 数字产品护照（ESPR / (EU) 2024/1781，demo）**

按《可持续产品生态设计法规》要求实现的产品数字档案页：

- **同一 URL 内容协商**：`GET /dpp/{id}` 浏览器给无障碍 HTML；`Accept: application/ld+json` 给 JSON-LD 结构化数据（法规硬要求，HTML 与 JSON 分地址即不合规）
- **必填字段全覆盖**：DPP ID、SKU、型号、批次/序列号、制造商、EORI 号、欧盟授权代表、原产地、BOM、合规证书、维修/拆解/回收指引、版本号、最后更新时间、档案状态（正常/召回/作废）；电池品类额外：化学体系、容量、循环寿命、碳足迹。**没有数据的字段照样渲染占位（— / 未提供），审核时可逐项核对**
- **无障碍（WCAG 2.1 AA 方向）**：语义化 HTML + 跳过导航链接、表格 caption/th scope、状态用「图标 + 文字」不只靠颜色、明显键盘焦点环、页面零 JS
- **中英双语**：`?lang=en` 服务端渲染切换（`hreflang` alternate + `aria-current`），不用前端改写 DOM
- **示例档案**：`/dpp/DPP-JL1214-2026-0001`（电池，字段齐全）、`/dpp/DPP-3WBD16-2026-0001`（多字段留空，演示占位）；二维码 `/api/qr/dpp/{id}.png`

边界（务必知晓）：JSON-LD 的 `@context` 用的是示例命名空间（`example.org/dpp/vocab#`），**正式上报 Registry 必须替换为 EN 18xxx 对应品类的官方 vocabulary**，否则上报会被驳回；Demo PDF 尚未做到 PDF/UA 无障碍格式。

**码不能带租户信息。** 16 位纯随机，租户关系存在数据库里。这样公司改名、数据迁移、客户流失都不影响已经印在实物上的码。

**校验位的作用。** 15 位随机 + 1 位 Luhn mod N 校验。乱输的码 31/32 会在内存里被拦掉，不产生数据库查询，也挡住脚本遍历。

**重打必须作废。** 激光打标重打时如果不作废旧码，两个产品会共用同一个码，两次都是「首次查询」，防伪当场失效。`voidCode()` 只改状态不删记录，扫码时能正确提示「此码已作废」。

**首查记录用一条 SQL 原子完成。** 用 `COALESCE(first_scan_at, NOW())` 而不是「先查再判断再写」，否则并发首扫会互相覆盖。

## SQLite 说明

单机、低并发（每天几千次扫码）场景 SQLite 完全够用，优势是零运维：备份就是复制 `data/app.db` 一个文件。

数据量估算：10 万码约 20MB，100 万码约 200MB，扫码日志每年约 50MB。SQLite 单表千万行无压力。

如果将来要上多实例或更高并发，换 MySQL：表结构基本兼容，主要改 `AUTOINCREMENT` 和 `datetime` 函数。
