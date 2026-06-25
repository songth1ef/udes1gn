import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { loadMessages } from './messages';

/**
 * next-intl 每请求配置（D6）。
 * 从 DB 加载文案 → 缓存（unstable_cache, tag 'i18n'）→ 喂 next-intl，
 * 缺 key 回退默认语言（兜底逻辑在 loadMessages 内）。
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as never)
    ? (requested as string)
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
