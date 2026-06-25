import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';

/**
 * i18n 文案加载器（D6）。
 *
 * 职责（见 docs/implementation.md §9.2）：
 * - 从 DB Translation 读全量文案 → 按 locale 聚合成 next-intl 的 messages 形状
 *   （{ [namespace]: { [key]: value } }）。
 * - 内存缓存：用 Next 的 unstable_cache + tag 'i18n'，后台改文案后
 *   revalidateTag('i18n') 即失效，无需重启（§9.2 缓存失效）。
 * - 缺 key 回退：请求某 locale 时，先取该 locale 的文案，再用「默认语言」
 *   （Locale.isDefault）的文案补齐缺失 key，保证界面不出现裸 key。
 *
 * 注意：本模块在 next-intl 的 getRequestConfig 中被调用，运行在 Node 运行时
 * （非 Edge），可安全使用 prisma。
 */

export const I18N_CACHE_TAG = 'i18n';

export type Messages = Record<string, Record<string, string>>;

/** 一种语言的元信息（前台语言切换 / 路由用）。 */
export type LocaleInfo = {
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
};

/**
 * 启用语言列表（enabled=true），按 sortOrder 升序。
 * 带 'i18n' tag 缓存：后台增删/启停语言后 revalidateTag('i18n') 失效。
 */
export const getLocales = unstable_cache(
  async (): Promise<LocaleInfo[]> => {
    const locales = await prisma.locale.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, name: true, isDefault: true, sortOrder: true },
    });
    return locales;
  },
  ['i18n-locales'],
  { tags: [I18N_CACHE_TAG] },
);

/** 默认（兜底）语言 code；无显式默认时取第一个启用语言，再兜底 'zh'。 */
export const getDefaultLocale = unstable_cache(
  async (): Promise<string> => {
    const def = await prisma.locale.findFirst({
      where: { isDefault: true },
      select: { code: true },
    });
    if (def) return def.code;
    const first = await prisma.locale.findFirst({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true },
    });
    return first?.code ?? 'zh';
  },
  ['i18n-default-locale'],
  { tags: [I18N_CACHE_TAG] },
);

/**
 * 把某 locale 的 Translation 行聚合成 { namespace: { key: value } }。
 * 内部用，带 tag 缓存（key 含 locale）。
 */
const loadRawMessages = unstable_cache(
  async (locale: string): Promise<Messages> => {
    const rows = await prisma.translation.findMany({
      where: { localeCode: locale },
      select: { namespace: true, key: true, value: true },
    });
    const messages: Messages = {};
    for (const row of rows) {
      (messages[row.namespace] ??= {})[row.key] = row.value;
    }
    return messages;
  },
  ['i18n-raw-messages'],
  { tags: [I18N_CACHE_TAG] },
);

/** 把 fallback 的 key 合并进 base（base 优先，缺失才用 fallback）。 */
function mergeFallback(base: Messages, fallback: Messages): Messages {
  const out: Messages = {};
  // 先铺 fallback，再用 base 覆盖 → base 优先，且补齐 base 缺的 key
  for (const ns of new Set([...Object.keys(fallback), ...Object.keys(base)])) {
    out[ns] = { ...(fallback[ns] ?? {}), ...(base[ns] ?? {}) };
  }
  return out;
}

/**
 * 加载某 locale 的完整 messages（已做默认语言兜底）。
 * next-intl 的 getRequestConfig 直接消费本函数的返回。
 */
export async function loadMessages(locale: string): Promise<Messages> {
  const defaultLocale = await getDefaultLocale();
  const base = await loadRawMessages(locale);
  if (locale === defaultLocale) return base;
  const fallback = await loadRawMessages(defaultLocale);
  return mergeFallback(base, fallback);
}
