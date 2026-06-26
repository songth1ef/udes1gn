import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { Nav } from '@/components/Nav';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * 语言段布局：校验 locale、设置请求 locale、注入 i18n provider、挂顶部 Nav（E1）。
 * Nav 是 server 组件（自取 session/locales/文案），children 渲染在主区。
 * 主区最大宽 max-w-main（1000px）居中，全局深浅色由 globals.css 的 CSS 变量驱动。
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Nav />
        {/* 移动端底部留白避开 tab 栏（pb-24），桌面恢复正常 */}
        <main className="mx-auto w-full max-w-main flex-1 px-4 pb-24 pt-6 sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
