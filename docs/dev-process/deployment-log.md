# 部署记录 / Deployment Log

> 香港服务器（OpenCloudOS 9，1.9GB 内存，宝塔面板，已跑 blog）首次部署实录。
> 2026-06-25 凌晨自动部署。

## 当前状态：⚠️ 基础设施 + HTTPS 就绪，应用因一个生产期 bug 未上线

- **`https://udes1gn.com` 当前显示**：品牌化「即将上线 / Coming soon」维护页。
- **HTTPS 已上线（2026-06-26）**：用户把 DNS 收敛为只指香港后，certbot webroot 签发 Let's Encrypt 证书成功（udes1gn.com + www，有效期至 2026-09-24），nginx 443 + http→301→https 已配置，Mac 端验证 `ssl_verify=0`（受信）。
- **应用服务已 stop+disable**：因下述 bug 会自我请求风暴、威胁这台 1.9GB 共享机（还跑着 blog），故主动停用止血。blog 全程未受影响。

## 2026-06-26 更新：bug 在干净 DNS 服务器上确认，多个修复尝试失败

- **排除「本地 VPN 毒化 DNS 致误判」**：直接在服务器（干净 DNS）以 `next start` 临时端口 + fd 看门狗复测，`/zh` 仍在数秒内把 fd 冲到 3000+（看门狗杀），**循环真实存在、与 DNS 无关**。
- **静态文案 fix 无效**：把 i18n 从「每请求查 DB」改为构建期静态 JSON（commit `b68fd94`）后，服务器上 `/zh` 仍循环。→ 根因不是 per-request DB 调用（但静态化本身是合理改进，保留）。
- **去 `output:standalone` 无效**：仍循环。
- **现象精确化**：生产 SSR 时 Node 用 Next 内置 RSC flight fetcher（`new URL('http://localhost:'+PORT)` + `Next-Router-Prefetch`/RSC 头 + cacheBusting）**自取自身端口**，递归爆炸。`next dev` 正常。
- **累计已排除**：Nav/`auth()`、i18n 的 `unstable_cache`、next-intl middleware、`next/font` Inter、per-request DB 文案、`output:standalone`。
- **结论**：这是 Next.js 15.3.4 + App Router 的生产 RSC 自取递归，非本项目业务代码可定位的单点。**正经修法**（按优先级）：
  1. 升/降 `next` 版本（15.3.4 → 15.5.x 或 14.2.x），最可能一击解决；
  2. 造最小复现（仅 [locale]+layout+一个页）upstream 提 issue / 验证版本；
  3. 重构渲染：去 `generateStaticParams`（真正去掉，之前正则没匹配上）试全动态；或把 i18n provider 改为顶层静态注入。
- **不在生产机继续 brute-force**：避免反复 fd 风暴威胁同机 blog。下一步应在隔离环境做版本矩阵测试。

## ✅ 已完成的基础设施

| 项 | 状态 |
|---|---|
| SSH 接入（复用 blog 的 `~/.ssh/id_ed25519_nestwork` → `root@119.28.24.129`） | ✓ |
| DNS：`udes1gn.com`/`www` 服务器侧解析含本机 119.28.24.129 | ✓（见下注意） |
| swap +2G（防 1.9GB 构建 OOM） | ✓ |
| PostgreSQL 15 安装 + 建库 `udes1gn` + scram 密码认证 | ✓ |
| 仓库 `git clone` 到 `/opt/udes1gn` + `npm ci` + `prisma migrate deploy` + seed（admin/中英文案/示例提案） | ✓ |
| 服务器侧 `next build`（standalone，56s，无 OOM） | ✓ |
| systemd 服务 `udes1gn`（端口 3100，避开已被占用的 3000） | ✓（已 disable） |
| nginx 反代 vhost（宝塔 `/www/server/panel/vhost/nginx/udes1gn.conf`，不碰 blog） | ✓ |
| 维护页 + ACME challenge 路径预留 | ✓ |
| 密钥/口令仅存服务器 `/root/.udes1gn_*` 与 `/opt/udes1gn/.env.production`（600，不进 git） | ✓ |

## 部署中踩的坑（已解决）

1. **端口 3000 被另一个 `next-server`（疑似 mingtu）占用** → 改用 3100。
2. **`.env.production` 含 `NODE_ENV=production` 导致 `npm ci` 跳过 devDeps**（tsx/tsc/tailwind 缺失）→ `npm ci --include=dev`。
3. **seed 的 `tsx` 不在 PATH** → 用 `./node_modules/.bin/tsx`。
4. **systemd EnvironmentFile 用 `sed` 生成时丢了 DATABASE_URL/SECRET 行**（值含 `/`/`=`/`://`）→ 改用 bash `source` 后逐行 echo 生成。
5. **宝塔 nginx 在 `/www/server/...` 而非 `/etc/nginx`**，reload 用 `/etc/init.d/nginx` 或 `sbin/nginx -s reload`。

## ❌ 阻塞上线的 bug：生产期 RSC 自我请求死循环

**症状**：生产模式（`next start` 与 standalone `node server.js` 均如此）下，任意 `[locale]` 页面（`/zh`、`/en`、`/zh/login`…）请求**永久挂起不返回**；Node 进程向**自身** `http://localhost:$PORT` 发起海量出站连接（携带 `Next-Router-Prefetch`/`RSC` 等头 + cacheBusting 参数的 flight fetcher），fd 以约 1000/秒 暴涨（实测单请求 20s 涨到 22000+ fd）。**`next dev` 模式正常渲染**（本地约 8s，慢但完成）。

**已用本地二分排除**（每次改一处 + 重建 + 测）：
- ❌ 不是 `Nav`/`auth()`（移除后仍循环）
- ❌ 不是 i18n loader 的 `unstable_cache`（直通后仍循环）
- ❌ 不是 next-intl `middleware`（移除后仍循环）
- ❌ 不是 `next/font/google` Inter 字体（移除后仍循环）
- ⏳ 未能干净隔离 next-intl 的 server 渲染（`getMessages`/`NextIntlClientProvider`）——移除 provider 会让 build 预渲染 admin 页报 `MISSING_MESSAGE` 而失败

**重要 caveat**：本地复现环境的 DNS 被常驻美国 VPN 毒化（`udes1gn.com`→`198.18.0.x`，可能影响一切外部 fetch），故本地 hang **未必完全等同**服务器；但服务器（干净 DNS）也出现了同样的「自连 localhost:PORT 风暴」，故核心 bug 真实且仅生产期出现。

**最可能方向（待干净环境验证）**：Next.js 15.3.4 生产 RSC prefetch/flight 自我请求循环，疑与 next-intl 的 per-request 配置或路由结构交互。

**建议下一步**：
1. 在**干净 DNS** 环境（无 VPN 的机器，或直接在香港服务器上以 `next start` + 临时高端口复现）重测，排除本地 VPN 干扰。
2. 升级 `next` 与 `next-intl` 到最新 patch，查 next-intl × Next 15.3 已知 issue。
3. 用 stub messages 让 build 预渲染不失败，从而干净二分 `NextIntlClientProvider`。
4. 备选：去掉 `output: 'standalone'`，或换 `localePrefix` 策略，或把 i18n provider 改为静态 messages（不走 DB per-request）做对照。

## 服务器关键坐标（接手用）

- 应用目录 `/opt/udes1gn`，env `/opt/udes1gn/.env.production`（600）
- systemd `udes1gn.service`（当前 disabled；`ExecStart` 跑 `next start -p 3100`）
- nginx vhost `/www/server/panel/vhost/nginx/udes1gn.conf`（当前指向维护页 `/var/www/udes1gn-maintenance`）
- DB：本地 PostgreSQL 15，库/角色 `udes1gn`，口令 `/root/.udes1gn_db_pass`
- admin 口令 `/root/.udes1gn_admin`（部署上线后用）
- 证书未签：`udes1gn.com` 有**两条 A 记录**（HK 119.28.24.129 + 广州 106.55.9.135 轮询），HTTP-01 会因 LE 可能命中广州节点而失败；需 ① 把 udes1gn.com 收敛为仅 HK，或 ② 用 DNSPod DNS-01（需 API 凭证），再签证书。
