import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { Link } from '@/lib/i18n/navigation';
import { AdminNav, type AdminNavItem } from './admin-nav';

/**
 * 管理后台布局（G1）—— 布局层鉴权 + 后台导航骨架。
 *
 * 鉴权：仅 ADMIN 可进。非登录或非管理员一律 notFound()（不暴露后台存在性，
 * 比 redirect 更克制；action 层另有 requireAdmin 二次校验，纵深防御）。
 *
 * 布局：移动端导航在上方横向标签条，sm 起为左侧 220px 侧栏 + 右侧内容。
 * 全部文案走 admin namespace key；响应式由 tailwind 断点控制。
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    notFound();
  }

  const t = await getTranslations('admin');

  const items: AdminNavItem[] = [
    { href: '/admin', label: t('dashboard') },
    { href: '/admin/proposals', label: t('proposalsNav') },
    { href: '/admin/review', label: t('reviewNav') },
    { href: '/admin/users', label: t('usersNav') },
    { href: '/admin/i18n', label: t('i18nNav') },
  ];

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
      <aside className="sm:w-[200px] sm:shrink-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
        </div>
        <AdminNav items={items} />
        <Link
          href="/"
          className="mt-4 hidden text-sm text-foreground/50 hover:text-ud-blue sm:inline-block"
        >
          ← {t('backToSite')}
        </Link>
      </aside>

      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
