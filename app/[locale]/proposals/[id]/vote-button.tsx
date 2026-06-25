'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { toggleVote } from '@/lib/actions/vote';

/**
 * VoteButton（client, E5）—— 投票按钮，接 toggleVote。
 * 1 人 1 票可取消：点击 toggle，乐观更新票数 + 已投态（失败回滚）。
 * 未登录：渲染为「登录后投票」链接到登录页（带回流），不调 action。
 *
 * 配色：已投 = 实心蓝（ud-blue）；未投 = 描边。文案走 vote namespace key。
 */
export function VoteButton({
  proposalId,
  initialVoted,
  initialCount,
  isAuthed,
}: {
  proposalId: string;
  initialVoted: boolean;
  initialCount: number;
  isAuthed: boolean;
}) {
  const t = useTranslations('vote');
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  if (!isAuthed) {
    return (
      <Link
        href={`/login?callbackUrl=/proposals/${proposalId}`}
        className="inline-flex h-[38px] select-none items-center justify-center gap-2 rounded-ud border border-foreground/20 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-ud-blue hover:text-ud-blue"
      >
        <UpIcon />
        {t('loginToVote')}
        <span className="font-semibold">{count}</span>
      </Link>
    );
  }

  function onClick() {
    if (pending) return;
    const prevVoted = voted;
    const prevCount = count;
    // 乐观更新
    setVoted(!prevVoted);
    setCount(prevCount + (prevVoted ? -1 : 1));
    startTransition(async () => {
      const res = await toggleVote(proposalId);
      if (res.ok) {
        setVoted(res.voted);
        setCount(res.voteCount);
      } else {
        // 回滚
        setVoted(prevVoted);
        setCount(prevCount);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={voted}
      className={[
        'inline-flex h-[38px] select-none items-center justify-center gap-2 rounded-ud px-4 text-sm font-medium transition-colors disabled:opacity-60',
        voted
          ? 'bg-ud-blue text-white hover:bg-ud-blue/90'
          : 'border border-foreground/20 text-foreground hover:border-ud-blue hover:text-ud-blue',
      ].join(' ')}
    >
      <UpIcon />
      {voted ? t('upvoted') : t('upvote')}
      <span className="font-semibold">{count}</span>
    </button>
  );
}

function UpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
