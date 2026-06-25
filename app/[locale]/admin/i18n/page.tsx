import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  listAllLocales,
  listNamespaces,
  listTranslations,
} from '@/lib/actions/i18n';
import { LocaleManager } from './locale-manager';
import { TranslationEditor } from './translation-editor';

/**
 * i18n 管理（G4 / F4 / F5）。
 * 上：语言管理（增删/启停/默认）。下：按 namespace 文案编辑，缺翻译高亮。
 * 改后由各 action 内 revalidateTag('i18n') 使前台缓存失效（无需重启）。
 *
 * namespace 选择走 ?ns= 查询参数；默认取第一个 namespace。
 * 文案列以「全部语言」（含未启用，便于补齐）展示；缺值高亮。
 */
export default async function AdminI18nPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ns?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { ns } = await searchParams;

  const [t, locales, namespaces] = await Promise.all([
    getTranslations('admin'),
    listAllLocales(),
    listNamespaces(),
  ]);

  const activeNamespace =
    ns && namespaces.includes(ns) ? ns : (namespaces[0] ?? '');
  const localeCodes = locales.map((l) => l.code);
  const rows = activeNamespace ? await listTranslations(activeNamespace) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t('i18nTitle')}</h1>
        <p className="text-sm text-foreground/50">{t('i18nIntro')}</p>
      </div>

      <LocaleManager locales={locales} />

      {activeNamespace && (
        <TranslationEditor
          namespaces={namespaces}
          activeNamespace={activeNamespace}
          localeCodes={localeCodes}
          rows={rows}
        />
      )}
    </div>
  );
}
