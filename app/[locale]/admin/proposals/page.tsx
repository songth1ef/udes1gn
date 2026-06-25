import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { StatusBadge } from '@/components';
import { listProposalsForAdmin } from '@/lib/actions/admin';
import { StatusControls } from './status-controls';

/**
 * 提案状态管理（G2）。
 * 列出全部提案（含隐藏），逐行可推进状态机 / 隐藏切换。
 * 响应式：桌面为表格；移动端（< sm）退化为卡片堆叠，避免横向溢出。
 * 文案全走 admin / proposal key。
 */
export default async function AdminProposalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, rows] = await Promise.all([
    getTranslations('admin'),
    listProposalsForAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {t('proposalsTitle')}
        </h1>
        <p className="text-sm text-foreground/50">{t('proposalsIntro')}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-ud border border-dashed border-foreground/15 px-4 py-16 text-center text-sm text-foreground/50">
          {t('noProposals')}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-ud border border-foreground/10 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/proposals/${p.id}`}
                      className="truncate font-medium text-foreground hover:text-ud-blue"
                    >
                      {p.title}
                    </Link>
                    <StatusBadge status={p.status} />
                    {p.hiddenAt && (
                      <span className="inline-flex items-center rounded-full border border-ud-red/30 bg-ud-red/10 px-2 py-0.5 text-xs font-medium text-ud-red">
                        {t('hiddenTag')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/50">
                    <span>
                      {t('colAuthor')}: {p.author.displayName}
                    </span>
                    <span>
                      {t('colCategory')}: {p.category}
                    </span>
                    <span>
                      {t('colVotes')}: {p.voteCount}
                    </span>
                  </div>
                </div>
              </div>

              <StatusControls
                id={p.id}
                status={p.status}
                hidden={p.hiddenAt != null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
