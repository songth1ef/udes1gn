# v1 参考 — udes1gn-master（2024-08）

> 用户几年前做的第一版，源码在 `~/Downloads/udes1gn-master`。**未上线、核心功能未实现**，但 UI/设计语言用户明确喜欢，v2 沿用其视觉基线。本文件是 v2 的参考，不是续开发对象。

## v1 实际状态

| 维度 | v1 情况 |
|---|---|
| 框架 | Next.js 14 App Router + TypeScript |
| i18n | next-intl，已做 **zh / en / ru 三语**；slogan「**这块地盘由你决定**」 |
| 样式 | scss + styled-components + tailwind **三套混用**（v2 应收敛） |
| 认证 | localStorage `token` + 请求头带 token + 独立后端 axios（**非** Auth.js/服务端 session） |
| API 层 | `src/api/` + `src/api/request.ts` axios 拦截器（token 注入、错误码处理） |
| 已建页面 | login / register / forgetPS / setting / user + user/[userId] / name —— **全是账号体系的壳** |
| 核心功能 | **完全没有**：提案/投票/评论/状态机一个都没做，首页只有 `home` |

**结论**：v1 把"账号脚手架"开了个头就停了，定义友定的核心是空地。v1 价值 = **设计语言 + 表单组件 + i18n 结构**可参考，逻辑不可续用。

## 设计基线（v2 沿用 ← 用户喜欢这版 UI）

**整体风格**：Apple 风极简白，留白大、圆角、近黑文字，原生支持深色模式。

### 配色（CSS variables，源自 `style/globals.scss`）

| 变量 | 浅色 | 深色 | 用途 |
|---|---|---|---|
| 前景文字 | `#1d1d1f`（29,29,31） | `#f5f5f7`（245,245,247） | Apple 近黑/近白 |
| 背景 | `#ffffff` | `#000000` | 纯白/纯黑 |
| 主蓝（强调/focus） | `#1797F0`（23,151,240） | 同 | 链接、输入聚焦、按钮 hover |
| 链接蓝 | `#2997FF` | 同 | 正文链接（Apple link blue） |
| 成功绿 | `#04C15F`（4,193,95） | 同 | success |
| 错误红 | `#FF4D4F`（255,77,79） | 同 | 校验错误 |

### 组件规范

- **字体**：Inter（拉丁），`next/font/google`
- **圆角**：输入框、按钮统一 `border-radius: 12px`
- **边框**：`1px solid` 前景色，聚焦/hover 变主蓝
- **按钮 `.ud_btn`**：高 38px，圆角 12px，hover → 蓝边 + 蓝字，`user-select: none`
- **输入框**：padding 12px，密码框右侧带 eye 切换；错误信息红字 14px、左缩进 12px
- **Loading**：`spin 0.4s steps(8, end)` 阶梯式旋转（仿 iOS 菊花），`logo.svg`/`loading.svg`，深色模式 `filter: invert(1)`
- **布局**：顶部 Nav 高 60px，主区 `main-layout` 居中、宽 1000px

### ⛔ v1 自制 flex 工具类 —— v2 不沿用

v1 自制了一套 flex 工具类（`flexCC`/`flexB`/`flexA`/`flexL`/`flexUP`/`absoC`/`overell`/`handon` 等）。**v2 全部摈弃，统一用 tailwindcss**（`flex items-center justify-center` 等原生类）。对照参考：

| v1 自制类 | tailwind 等价 |
|---|---|
| `flexCC` / `flexC` | `flex items-center justify-center` |
| `flexB` | `flex items-center justify-between` |
| `flexA` | `flex items-center justify-around` |
| `flexL` | `flex flex-row items-center` |
| `flexUP` | `flex flex-col` |
| `flexW` | `flex flex-wrap` |
| `absoC` | `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` |
| `overell` | `block truncate` |
| `handon` | `cursor-pointer` |
| `unselectable` | `select-none` |

### 响应式断点

手机 `<575px`（输入/按钮转 80vw 竖排）· 平板 `576–767`（竖排居中）· 笔电 `768–991` · 台式 `992–1199` · 大屏 `≥1200`。

## 给 v2 的取舍建议

1. **照搬**：配色变量、圆角/边框规范、按钮/输入样式、Inter 字体、深色模式、slogan「这块地盘由你决定」。
2. **收敛**：样式三套（scss+styled-components+tailwind）→ **全面 tailwindcss**，摈弃 v1 自制 flex 工具类（`flexCC` 等）；仅保留极少量全局 scss 放配色 CSS 变量与深色模式。
3. **重做**：认证。v1 的 localStorage token + 独立后端，与 v2 单进程全栈 + Auth.js 方向冲突——见 `architecture.md` / `lessons.md`。
4. **保留意图**：v1 早早就上了 i18n（zh/en/ru）。v2 是否首版多语言是开放决策，见 `lessons.md`。
