import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { getAdminCounts } from '@/lib/actions/admin';

/**
 * 后台概览（Dashboard）—— 计数卡 + 入口。
 * 待处理举报卡高亮（运营第一关注点），点击进审核队列。
 * 响应式：卡片 grid 1→2→3 列。文案全走 admin key。
 */
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, counts] = await Promise.all([
    getTranslations('admin'),
    getAdminCounts(),
  ]);

  const cards: {
    label: string;
    value: number;
    href: string;
    accent?: boolean;
  }[] = [
    {
      label: t('pendingReports'),
      value: counts.pendingReports,
      href: '/admin/review',
      accent: counts.pendingReports > 0,
    },
    { label: t('totalProposals'), value: counts.proposals, href: '/admin/proposals' },
    { label: t('hiddenProposals'), value: counts.hiddenProposals, href: '/admin/proposals' },
    { label: t('totalUsers'), value: counts.users, href: '/admin/users' },
    { label: t('bannedUsers'), value: counts.bannedUsers, href: '/admin/users' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t('dashboard')}</h1>
        <p className="text-sm text-foreground/50">{t('overviewIntro')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={[
              'flex flex-col gap-2 rounded-ud border p-5 transition-colors',
              c.accent
                ? 'border-ud-red/30 bg-ud-red/5 hover:border-ud-red/50'
                : 'border-foreground/10 hover:border-ud-blue/40',
            ].join(' ')}
          >
            <span className="text-sm text-foreground/60">{c.label}</span>
            <span
              className={[
                'text-3xl font-semibold tabular-nums',
                c.accent ? 'text-ud-red' : 'text-foreground',
              ].join(' ')}
            >
              {c.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
