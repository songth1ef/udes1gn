import staticData from './_static-messages.json';

export const I18N_CACHE_TAG = 'i18n';
export type Messages = Record<string, Record<string, string>>;
export type LocaleInfo = { code: string; name: string; isDefault: boolean; sortOrder: number };

type StaticShape = {
  locales: { code: string; name: string; isDefault: boolean; sortOrder: number; enabled: boolean }[];
  messages: Record<string, Messages>;
};
const data = staticData as StaticShape;

export async function getLocales(): Promise<LocaleInfo[]> {
  return data.locales
    .filter((l) => l.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, name, isDefault, sortOrder }) => ({ code, name, isDefault, sortOrder }));
}

export async function getDefaultLocale(): Promise<string> {
  const def = data.locales.find((l) => l.isDefault) ?? data.locales.find((l) => l.enabled);
  return def?.code ?? 'zh';
}

function mergeFallback(base: Messages, fallback: Messages): Messages {
  const out: Messages = {};
  for (const ns of new Set([...Object.keys(fallback), ...Object.keys(base)])) {
    out[ns] = { ...(fallback[ns] ?? {}), ...(base[ns] ?? {}) };
  }
  return out;
}

export async function loadMessages(locale: string): Promise<Messages> {
  const defaultLocale = await getDefaultLocale();
  const base = data.messages[locale] ?? {};
  if (locale === defaultLocale) return base;
  const fallback = data.messages[defaultLocale] ?? {};
  return mergeFallback(base, fallback);
}
