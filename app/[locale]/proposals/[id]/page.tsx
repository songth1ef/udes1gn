import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations, getFormatter } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { Link } from '@/lib/i18n/navigation';
import { StatusBadge } from '@/components';
import { getProposal } from '@/lib/actions/proposal';
import { listComments } from '@/lib/actions/comment';
import { VoteButton } from './vote-button';
import { CommentForm } from './comment-form';

/**
 * 提案详情页（E5）。
 * 装配：正文 + 状态徽章 + 发起人/时间 + 投票按钮（接 toggleVote）+ 评论区（列表 + 发表）。
 * - 隐藏提案对非 ADMIN 返回 null → notFound（getProposal 已处理可见性）。
 * - viewerHasVoted 来自 getProposal（带 viewerId），决定投票按钮初始态。
 * - 评论 server 端拉取（listComments）；发表后 client 触发 refresh 重渲染。
 * 文案全走 i18n key；响应式：标题区在 sm 起横排，正文/评论纵向铺满主区。
 */
export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  const proposal = await getProposal(id, {
    viewerId: session?.user?.id,
    isAdmin,
  });
  if (!proposal) notFound();

  const [comments, tProposal, tComment, format] = await Promise.all([
    listComments(id, { includeHidden: isAdmin }),
    getTranslations('proposal'),
    getTranslations('comment'),
    getFormatter(),
  ]);

  const fmtDate = (d: Date) =>
    format.dateTime(d, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <article className="flex flex-col gap-8">
      {/* 返回 */}
      <Link
        href="/proposals"
        className="inline-flex w-fit items-center gap-1 text-sm text-foreground/50 hover:text-ud-blue"
      >
        ← {tProposal('backToList')}
      </Link>

      {/* 头部：标题 + 状态 + 元信息 */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {proposal.title}
          </h1>
          <StatusBadge status={proposal.status} className="shrink-0" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/50">
          <span className="rounded-full bg-foreground/5 px-2.5 py-0.5">
            {proposal.category}
          </span>
          <Link
            href={`/user/${proposal.author.id}`}
            className="hover:text-ud-blue"
          >
            {tProposal('postedBy', { name: proposal.author.displayName })}
          </Link>
          <span>{fmtDate(proposal.createdAt)}</span>
        </div>
      </header>

      {/* 正文 */}
      <div className="whitespace-pre-wrap break-words text-base leading-relaxed text-foreground/90">
        {proposal.body}
      </div>

      {/* 投票 */}
      <div className="flex items-center gap-4 border-y border-foreground/10 py-5">
        <VoteButton
          proposalId={proposal.id}
          initialVoted={proposal.viewerHasVoted}
          initialCount={proposal.voteCount}
          isAuthed={!!session?.user}
        />
      </div>

      {/* 评论区 */}
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">
          {comments.length > 0
            ? tComment('count', { count: comments.length })
            : tComment('title')}
        </h2>

        <CommentForm proposalId={proposal.id} isAuthed={!!session?.user} />

        {comments.length === 0 ? (
          <p className="rounded-ud border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/50">
            {tComment('empty')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-foreground/10">
            {comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-1.5 py-4">
                <div className="flex items-center gap-2 text-sm text-foreground/50">
                  <Link
                    href={`/user/${c.author.id}`}
                    className="font-medium text-foreground/80 hover:text-ud-blue"
                  >
                    {c.author.displayName}
                  </Link>
                  <span>·</span>
                  <span>{fmtDate(c.createdAt)}</span>
                  {c.hiddenAt && isAdmin && (
                    <span className="rounded-full bg-ud-red/10 px-2 py-0.5 text-xs text-ud-red">
                      {tProposal('report')}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
