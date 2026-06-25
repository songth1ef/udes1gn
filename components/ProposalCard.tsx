import { getTranslations } from 'next-intl/server';
import type { ProposalStatus } from '@prisma/client';
import { Link } from '@/lib/i18n/navigation';
import { StatusBadge } from './StatusBadge';

/**
 * ProposalCard（server）—— 提案列表 / 首页 / 用户主页共用的响应式卡片。
 * 展示：标题、状态徽章、分类、发起人、摘要、票数。整卡可点进详情。
 * 文案全部走 i18n key（proposal / vote namespace），零硬编码。
 *
 * 响应式：卡片本身随父级 grid（1 列 → sm 2 列 → lg 3 列）自适应；
 * 内部用 flex 纵向排版，标题截断 2 行，摘要截断 3 行。
 */

export type ProposalCardData = {
  id: string;
  title: string;
  body?: string;
  category: string;
  status: ProposalStatus;
  author?: { id: string; displayName: string } | null;
  voteCount: number;
};

export async function ProposalCard({ proposal }: { proposal: ProposalCardData }) {
  const [tProposal, tVote] = await Promise.all([
    getTranslations('proposal'),
    getTranslations('vote'),
  ]);

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="group flex h-full flex-col gap-3 rounded-ud border border-foreground/10 bg-foreground/[0.02] p-4 transition-colors hover:border-ud-blue/50 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-ud-blue sm:text-lg">
          {proposal.title}
        </h3>
        <StatusBadge status={proposal.status} className="shrink-0" />
      </div>

      {proposal.body && (
        <p className="line-clamp-3 text-sm text-foreground/60">{proposal.body}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/50">
        <span className="rounded-full bg-foreground/5 px-2 py-0.5">
          {proposal.category}
        </span>
        {proposal.author && (
          <span className="truncate">
            {tProposal('author')}: {proposal.author.displayName}
          </span>
        )}
        <span className="ml-auto font-medium text-ud-blue">
          {tVote('count', { count: proposal.voteCount })}
        </span>
      </div>
    </Link>
  );
}
