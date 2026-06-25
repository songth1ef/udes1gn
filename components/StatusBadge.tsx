'use client';

import { useTranslations } from 'next-intl';
import type { ProposalStatus } from '@prisma/client';

/**
 * StatusBadge —— 提案状态机徽章（domain.md 命门）。
 * 把 ProposalStatus 枚举映射为「配色 + i18n 文案」的小徽章。
 *
 * 配色语义（沿用设计 token）：
 *  COLLECTING  收集中  → 中性（前景描边）
 *  ADOPTED     已采纳  → ud-blue（被选中、进入流程）
 *  IN_PROGRESS 开发中  → amber（进行中）
 *  SHIPPED     已上线  → ud-green（成功兑现）
 *  REJECTED    已否决  → ud-red（否决）
 *
 * 文案走 proposal.statusXxx key（seed 已含中英），组件零硬编码文案。
 */

const STYLES: Record<ProposalStatus, string> = {
  COLLECTING: 'border-foreground/20 text-foreground/70 bg-foreground/5',
  ADOPTED: 'border-ud-blue/30 text-ud-blue bg-ud-blue/10',
  IN_PROGRESS: 'border-amber-500/30 text-amber-600 bg-amber-500/10',
  SHIPPED: 'border-ud-green/30 text-ud-green bg-ud-green/10',
  REJECTED: 'border-ud-red/30 text-ud-red bg-ud-red/10',
};

/** 枚举 → proposal namespace 下的 key。 */
const KEYS: Record<ProposalStatus, string> = {
  COLLECTING: 'statusCollecting',
  ADOPTED: 'statusAdopted',
  IN_PROGRESS: 'statusInProgress',
  SHIPPED: 'statusShipped',
  REJECTED: 'statusRejected',
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProposalStatus;
  className?: string;
}) {
  const t = useTranslations('proposal');
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STYLES[status],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {t(KEYS[status])}
    </span>
  );
}
