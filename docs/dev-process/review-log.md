# 自审记录 / Review Log

> 每轮 code-review 发现的问题。格式：[严重度] 文件:行 — 问题描述 → 处理（见 fix-log）。
> 严重度：🔴 必修 · 🟡 应修 · 🔵 可选。

## 2026-06-25 — i18n 维度自审

- 🟡 `app/layout.tsx:12-13` — 根布局 `metadata.title` / `metadata.description` 硬编码中文字面量（`'UDES1GN 友定'` / `'用户共创…这块地盘由你决定'`），未走 translation key 且仅 zh 单语。这是**用户可见文案**（浏览器标签页标题、SEO/社交分享卡片），英文用户也只会看到中文标题。`app/[locale]/layout.tsx` 未导出 `generateMetadata` 覆盖，故全站 metadata 恒为中文。建议：在 `app/[locale]/layout.tsx` 用 `generateMetadata({params})` + `getTranslations({locale, namespace:'common'})` 渲染 `common.appName` / 站点描述（需在 seed 的 `common` 下补 `siteDescription` 键 ×中英），根 layout 移除写死的 metadata。
- 🔵 `app/[locale]/(auth)/register/register-form.tsx:26-30` — 字段错误映射较粗：`email` 仅区分 `email.taken` 与「其余一律 emailRequired」，`password` 任何 zod 错误恒映射 `passwordTooShort`，`displayName` 恒映射 `displayNameRequired`。当前每分支都命中真实 key（不会裸露 code），但若 zod 规则扩展（email 过长、displayName 非法字符等）文案会答非所问。属可接受折中，记录备查；扩校验时同步细化映射 + 补 key。

> 通过项（i18n 维度）：① 全量界面文案走 `namespace.key`——`grep` 全 `app/`、`components/` 在 JSX 文本位/`placeholder`/`aria-label`/`label`/`title` 属性**零硬编码字面量**（仅 `app/layout.tsx` metadata 例外，见上）；展示型组件（Button/Input/MessageBox/LogoutButton/NavShell/AdminNav/CategoryFilter/LanguageSwitcher）一律由父级以渲染后字符串经 props 注入，不自带文案。② seed `prisma/seed.ts` 对 9 个 namespace 的每个 key **逐 locale 循环 `['zh','en']` upsert**，zh/en 双语**无缺漏**。③ 代码中所有 `t('key')`（含 StatusBadge / status-controls 的状态枚举动态 key、locale-manager 的 errorKey 动态映射）经脚本交叉核对**均存在于 seed**，无「用了但 seed 缺」的键。④ 缺 key 回退链完整：`lib/i18n/messages.ts` `loadMessages` 取请求 locale 后用 `getDefaultLocale()`（`Locale.isDefault` → 首个 enabled → 'zh'）`mergeFallback` 补齐，界面不裸露 key；后台 `translation-editor` 缺值红边 + missing 徽章（§9.2）。⑤ action 层返回错误**代码**（`EMAIL_TAKEN`/`INVALID_TRANSITION`/`LOCALE_EXISTS`…）而非展示串，client 映射到 i18n key，符合「文案不进 server 逻辑」原则。

## 2026-06-25 — correctness 维度自审

- 🟡 `lib/actions/vote.ts:47` — toggleVote 取消投票走「先查 existing 再 delete by id」非事务路径。两个并发取消请求会都查到 existing，第二个 `prisma.vote.delete` 抛 P2025（记录不存在）且未捕获，冒泡为未处理异常。建议：改用 `prisma.vote.delete({ where: { proposalId_userId } })` + 捕获 P2025 视为已取消，与投票路径的 P2002 幂等处理对称。
- 🟡 `lib/auth-guard.ts:49` — requireAdmin 只校验 role，不校验 bannedAt。被封禁的 ADMIN（虽 banUser 禁止封 ADMIN，但若历史数据/直接改库存在）仍可执行 updateStatus/hideContent/banUser 等。纵深防御建议 requireAdmin 复用 requireActiveUser 的封禁检查。
- 🔵 `lib/actions/user.ts:62` — proposalsCount 取自 `user.proposals.length`，而 proposals 已 `where:{hiddenAt:null}` 过滤，故该计数实为「可见提案数」而非总数，字段名有歧义；若意图即可见数则可保留，建议改名或注释。
- 🔵 `lib/actions/report.ts:34` — createReport 无「同一用户对同一对象重复举报」约束，也不拒绝对已隐藏内容举报。Report 表无 `@@unique`，可被刷队列。建议加 (reporterId,targetType,targetId) 唯一约束或 action 层去重。
- 🔵 `lib/auth.ts:71` — jwt callback 中 `token.role = user.role` 在 token 已存在但 user 为 undefined 的刷新场景不会重置；封禁/改角色后 token 内 role 滞后（已由 requireActiveUser 查库兜底 banned，但 role 提权/降权在 session 过期前不生效）。属已知 JWT 策略局限，记录备查。

## 2026-06-25 — security 维度自审

- 🟡 `lib/auth.ts:27` — NextAuth v5 主配置未显式传 `secret`，v5 默认读环境变量 `AUTH_SECRET`，但 .env 只设了 `NEXTAUTH_SECRET`；而 middleware.ts:50 的 `getToken` 又显式读 `NEXTAUTH_SECRET`。签发端（route handlers）与校验端（middleware）密钥来源不一致，缺省时 v5 可能自动生成临时 secret，导致 token 签名校验不一致 / session 失效或重启后全员掉线。建议在 `NextAuth({ secret: process.env.NEXTAUTH_SECRET, ... })` 显式传同一密钥，或全栈统一改用 `AUTH_SECRET`。
- 🔵 `lib/actions/auth.ts:109` — 登录 `callbackUrl` 取自 URL query（login/page.tsx `searchParams`）原样塞进 `signIn` 的 `redirectTo`，存在开放重定向面。NextAuth v5 默认会把外站 URL 收敛到 baseUrl，当前风险有限；建议显式只放行以单个 `/` 开头的站内相对路径（拒绝 `//host`、`http(s)://`、反斜杠等），纵深防御。
- 🔵 `prisma/seed.ts:272` — 种子内硬编码弱口令管理员 `admin@udes1gn.local` / `admin12345`，且 upsert 的 `update` 分支每次重跑都会把密码重置回该弱口令。仅本地 dev 可接受；若误跑到共享/预发库即为已知凭证后门。建议管理员口令从 env 读（缺省随机），并让 update 分支不重置已有密码。

> 通过项：所有 ADMIN 写操作（admin.ts / i18n.ts / proposal.updateStatus / report.hideContent+banUser）均在 action 层先 `requireAdmin`；admin layout 另有 `notFound` 纵深防御；投票/评论/提案走 `requireActiveUser` 查库复核封禁态（规避 token 滞后）；全部 DB 访问经 Prisma 参数化，无字符串拼接注入面；密码 bcrypt(10)、email 统一 toLowerCase；banUser 禁封 ADMIN；隐藏内容对非 ADMIN 不可见且不接受互动；`includeHidden` 仅由 server 组件按 isAdmin 传入。


## Review — responsive 维度（自审, 2026-06-25）

总评：响应式与 token 一致性整体优秀。统一走 tailwind，无 inline style / styled-components / v1 自制 flex 工具类（flexCC 等）；品牌色全部走语义类（text-ud-blue 等），唯一 hex 字面量在 globals.css 的配色 CSS 变量（符合规范）。Nav 双布局 + 汉堡菜单、列表 grid 1→2→3、admin 表格 overflow-x-auto、详情/正文 break-words 均到位。仅以下小项：

- 🔵 `app/[locale]/proposals/category-filter.tsx:44`、`app/[locale]/admin/i18n/...`/`components/LanguageSwitcher.tsx:53` — 原生 `<option>` 用 `text-black` 硬编码字面色而非设计 token，目的是规避深色模式下原生下拉 option 继承透明背景导致深底深字。建议统一为可读的中性方案（如包一层注释说明，或接受为浏览器原生 option 限制），保持 token 一致性原则的例外可见。
- 🔵 `app/[locale]/proposals/category-filter.tsx:35` / `components/LanguageSwitcher.tsx:43` — 分类/语言 `<select>` 无 max-width；分类名很长时在窄屏可能撑宽。父级 `flex flex-wrap` 已能换行兜底，实际溢出风险低，建议给 select 加 `max-w-full` 或 `truncate` 容器以更稳。
- 🔵 `app/[locale]/(auth)/login/page.tsx:21`（register/forgetPS 同款壳）— 用 `w-[80vw] max-w-sm` 还原 v1「移动端 80vw」手感，符合 v1-reference §响应式；仅提示该写法在超大屏被 max-w-sm 收敛、无功能问题，记录备查。
