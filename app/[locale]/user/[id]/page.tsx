import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations, getFormatter } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { StatusBadge } from '@/components';
import { getUserProfile } from '@/lib/actions/user';

/**
 * 用户主页（E8）。
 * 公开档案 + 贡献记录：昵称、角色徽章、加入时间、提案/评论计数，及发起的提案列表。
 * 数据走 getUserProfile（只读、公开字段）；不存在 → notFound。
 * 文案全走 i18n key（user/proposal）；响应式：统计区 sm 起横排，提案列表纵向。
 */
export default async function UserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getUserProfile(id);
  if (!profile) notFound();

  const [tUser, format] = await Promise.all([
    getTranslations('user'),
    getFormatter(),
  ]);

  const joined = format.dateTime(profile.createdAt, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-8">
      {/* 档案头 */}
      <header className="flex flex-col gap-4 border-b border-foreground/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ud-blue/10 text-xl font-semibold text-ud-blue">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              {profile.displayName}
              {profile.role === 'ADMIN' && (
                <span className="rounded-full bg-ud-blue/10 px-2 py-0.5 text-xs font-medium text-ud-blue">
                  {tUser('adminBadge')}
                </span>
              )}
            </h1>
            <p className="text-sm text-foreground/50">
              {tUser('joinedAt', { date: joined })}
            </p>
          </div>
        </div>

        {/* 统计 */}
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-foreground">
              {profile.proposalsCount}
            </span>
            <span className="text-sm text-foreground/50">
              {tUser('proposalsCount')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-foreground">
              {profile.commentsCount}
            </span>
            <span className="text-sm text-foreground/50">
              {tUser('commentsCount')}
            </span>
          </div>
        </div>
      </header>

      {/* 贡献记录：发起的提案 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{tUser('contributions')}</h2>

        {profile.proposals.length === 0 ? (
          <p className="rounded-ud border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
            {tUser('noProposals')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-foreground/10">
            {profile.proposals.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-ud-blue"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="flex items-center gap-2 text-xs text-foreground/50">
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5">
                        {p.category}
                      </span>
                      {format.dateTime(p.createdAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={p.status} />
                    <span className="text-sm font-medium text-ud-blue">
                      {p.voteCount}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
