import { defineRouting } from 'next-intl/routing';

/**
 * 路由层 locale 配置。
 * 注意：运行期可选语言以 DB 的 Locale 表为准（后台可增删），
 * 这里仅声明路由层"可识别"的 locale 与默认值，作为兜底基线。
 * 后续 F1 接入 middleware 时复用此处。
 */
export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
});

export type AppLocale = (typeof routing.locales)[number];
