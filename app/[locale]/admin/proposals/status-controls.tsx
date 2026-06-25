'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ReportTarget, type ProposalStatus } from '@prisma/client';
import { Button } from '@/components';
import { updateStatus } from '@/lib/actions/proposal';
import { hideContent } from '@/lib/actions/report';

/**
 * StatusControls（client）—— 单条提案的状态机推进 + 隐藏切换。
 *
 * 状态机合法迁移与 lib/actions/proposal.ts 的 ALLOWED_TRANSITIONS 对齐；
 * 这里据当前状态算出「可推进到的下一态」按钮。终态（SHIPPED/REJECTED）
 * 不显示推进按钮，显示「终态」标记。
 * 隐藏切换调 hideContent（同时会解决相关举报）。
 * 任一动作走 useTransition，失败显示 admin.actionFailed。
 */

const NEXT: Record<ProposalStatus, ProposalStatus[]> = {
  COLLECTING: ['ADOPTED', 'REJECTED'],
  ADOPTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SHIPPED'],
  SHIPPED: [],
  REJECTED: [],
};

const STATUS_LABEL_KEY: Record<ProposalStatus, string> = {
  COLLECTING: 'statusCollecting',
  ADOPTED: 'statusAdopted',
  IN_PROGRESS: 'statusInProgress',
  SHIPPED: 'statusShipped',
  REJECTED: 'statusRejected',
};

export function StatusControls({
  id,
  status,
  hidden,
}: {
  id: string;
  status: ProposalStatus;
  hidden: boolean;
}) {
  const tAdmin = useTranslations('admin');
  const tProposal = useTranslations('proposal');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const nextStates = NEXT[status];

  function advance(next: ProposalStatus) {
    if (pending) return;
    setError(false);
    startTransition(async () => {
      const res = await updateStatus(id, next);
      if (!res.ok) setError(true);
    });
  }

  function toggleHide() {
    if (pending) return;
    setError(false);
    startTransition(async () => {
      const res = await hideContent(ReportTarget.PROPOSAL, id, !hidden);
      if (!res.ok) setError(true);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {nextStates.length === 0 ? (
          <span className="text-xs text-foreground/40">
            {tAdmin('terminalState')}
          </span>
        ) : (
          nextStates.map((s) => (
            <Button
              key={s}
              variant="default"
              disabled={pending}
              onClick={() => advance(s)}
            >
              {tAdmin('advanceTo')} · {tProposal(STATUS_LABEL_KEY[s])}
            </Button>
          ))
        )}
        <Button
          variant={hidden ? 'default' : 'danger'}
          disabled={pending}
          onClick={toggleHide}
        >
          {hidden ? tAdmin('unhide') : tAdmin('hide')}
        </Button>
      </div>
      {error && (
        <span className="text-xs text-ud-red">{tAdmin('actionFailed')}</span>
      )}
    </div>
  );
}
