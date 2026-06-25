import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { listUsersForAdmin } from '@/lib/actions/admin';
import { BanControl } from './ban-control';

/**
 * 用户管理（G3 封禁部分）。
 * 列出全部用户，可封禁/解封（ADMIN 除外）。
 * 响应式：卡片堆叠；桌面单条横排。文案全走 admin key。
 */
export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, users] = await Promise.all([
    getTranslations('admin'),
    listUsersForAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t('usersTitle')}</h1>
        <p className="text-sm text-foreground/50">{t('usersIntro')}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {users.map((u) => {
          const isAdmin = u.role === 'ADMIN';
          return (
            <li
              key={u.id}
              className="flex flex-col gap-3 rounded-ud border border-foreground/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/user/${u.id}`}
                    className="font-medium text-foreground hover:text-ud-blue"
                  >
                    {u.displayName}
                  </Link>
                  <span
                    className={[
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      isAdmin
                        ? 'border-ud-blue/30 bg-ud-blue/10 text-ud-blue'
                        : 'border-foreground/15 bg-foreground/5 text-foreground/60',
                    ].join(' ')}
                  >
                    {isAdmin ? t('roleAdmin') : t('roleUser')}
                  </span>
                  {u.bannedAt && (
                    <span className="inline-flex items-center rounded-full border border-ud-red/30 bg-ud-red/10 px-2 py-0.5 text-xs font-medium text-ud-red">
                      {t('bannedTag')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/50">
                  <span>{u.email}</span>
                  <span>
                    {t('totalProposals')}: {u.proposalCount}
                  </span>
                  <span>
                    {t('colJoined')}:{' '}
                    {new Date(u.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
              </div>

              <BanControl
                userId={u.id}
                banned={u.bannedAt != null}
                isAdmin={isAdmin}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
