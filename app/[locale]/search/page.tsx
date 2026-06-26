import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

/**
 * 搜索（还原 v1 的 🔍 模块）。
 * v1 当年是空占位页；这里给搜索框占位 + 引导去浏览全部提案，待接入真实搜索。
 */
export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('search');

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <div className="flex items-center gap-2">
        <input
          placeholder={t('placeholder')}
          disabled
          className="h-[38px] flex-1 rounded-ud border border-foreground/25 bg-background px-3 text-[15px] outline-none placeholder:text-foreground/35 focus:border-ud-blue"
        />
        <span className="flex h-[38px] items-center rounded-ud border border-foreground/25 px-4 text-sm text-foreground/40 select-none">
          {t('button')}
        </span>
      </div>

      <p className="text-sm text-foreground/55">{t('comingSoon')}</p>

      <Link href="/proposals" className="text-ud-blue hover:underline">
        {t('browseAll')} →
      </Link>
    </section>
  );
}
