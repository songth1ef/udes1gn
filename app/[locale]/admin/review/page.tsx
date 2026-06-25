import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ReportTarget } from '@prisma/client';
import { Link } from '@/lib/i18n/navigation';
import { listReportQueue } from '@/lib/actions/admin';
import { ReviewActions } from './review-actions';

/**
 * 审核队列（G3）。
 * 列出待处理举报，每条给被举报内容摘要 + 举报理由 + 处理动作。
 * 响应式：卡片堆叠（移动端友好），动作按钮换行。文案全走 admin key。
 */
export default async function AdminReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, queue] = await Promise.all([
    getTranslations('admin'),
    listReportQueue(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {t('reviewTitle')}
        </h1>
        <p className="text-sm text-foreground/50">{t('reviewIntro')}</p>
      </div>

      {queue.length === 0 ? (
        <p className="rounded-ud border border-dashed border-foreground/15 px-4 py-16 text-center text-sm text-foreground/50">
          {t('emptyQueue')}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {queue.map((r) => {
            const isProposal = r.targetType === ReportTarget.PROPOSAL;
            const kindLabel = isProposal
              ? t('reportedProposal')
              : t('reportedComment');
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-ud border border-foreground/10 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/50">
                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 font-medium text-foreground/70">
                    {kindLabel}
                  </span>
                  <span>
                    {t('reporter')}: {r.reporter.displayName}
                  </span>
                  <span>{new Date(r.createdAt).toLocaleString(locale)}</span>
                </div>

                {/* 举报理由 */}
                <p className="rounded-ud bg-foreground/5 px-3 py-2 text-sm">
                  <span className="text-foreground/50">{t('reportReason')}: </span>
                  {r.reason}
                </p>

                {/* 被举报对象 */}
                {r.target ? (
                  <div className="flex flex-col gap-2 border-l-2 border-foreground/15 pl-3">
                    <p className="text-sm text-foreground/80">
                      {r.target.excerpt}
                      {r.target.hidden && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-ud-red/30 bg-ud-red/10 px-2 py-0.5 text-xs font-medium text-ud-red">
                          {t('hiddenTag')}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/50">
                      <span>
                        {t('targetAuthor')}:{' '}
                        <Link
                          href={`/user/${r.target.author.id}`}
                          className="text-ud-link hover:underline"
                        >
                          {r.target.author.displayName}
                        </Link>
                      </span>
                      <Link
                        href={`/proposals/${r.target.proposalId}`}
                        className="text-ud-link hover:underline"
                      >
                        {t('viewTarget')} →
                      </Link>
                    </div>

                    <ReviewActions
                      targetType={r.targetType}
                      targetId={r.targetId}
                      hidden={r.target.hidden}
                      authorId={r.target.author.id}
                      authorIsAdmin={r.target.author.role === 'ADMIN'}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-foreground/40">{t('targetGone')}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
