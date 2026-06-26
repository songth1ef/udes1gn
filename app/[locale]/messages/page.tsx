import { setRequestLocale, getTranslations } from 'next-intl/server';

/**
 * 消息（还原 v1 的 💬 模块）。
 * v1 当年是空占位页；这里给空状态，待接入通知系统。
 */
export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('messages');

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <div className="flex flex-col items-center gap-3 rounded-ud border border-dashed border-foreground/15 px-4 py-16 text-center">
        <span className="text-4xl">💬</span>
        <p className="text-sm text-foreground/55">{t('empty')}</p>
        <p className="max-w-sm text-xs text-foreground/40">{t('intro')}</p>
      </div>
    </section>
  );
}
