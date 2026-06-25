'use server';

import { ReportTarget } from '@prisma/client';
import type { ProposalStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * 管理后台只读查询（G2/G3）。
 * 写操作复用 proposal.ts（updateStatus）与 report.ts（hideContent / banUser）。
 * 这里只做后台特有的「带隐藏内容 / 待处理举报」聚合，全部先 requireAdmin。
 */

// ── 提案状态管理列表 ─────────────────────────────────────
export type AdminProposalRow = {
  id: string;
  title: string;
  category: string;
  status: ProposalStatus;
  hiddenAt: Date | null;
  createdAt: Date;
  author: { id: string; displayName: string };
  voteCount: number;
};

/** 后台提案列表：含隐藏，按创建时间倒序（运营视角看最新动态）。 */
export async function listProposalsForAdmin(): Promise<AdminProposalRow[]> {
  await requireAdmin();
  const rows = await prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      hiddenAt: true,
      createdAt: true,
      author: { select: { id: true, displayName: true } },
      _count: { select: { votes: true } },
    },
  });
  return rows.map(({ _count, ...r }) => ({ ...r, voteCount: _count.votes }));
}

// ── 审核队列：待处理举报（resolvedAt == null）──────────────
export type ReportQueueItem = {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  createdAt: Date;
  reporter: { id: string; displayName: string };
  /** 被举报对象快照：标题/正文摘要 + 当前隐藏态 + 作者；对象已删则 null。 */
  target:
    | {
        kind: ReportTarget;
        excerpt: string;
        hidden: boolean;
        proposalId: string;
        author: { id: string; displayName: string; role: 'USER' | 'ADMIN' };
      }
    | null;
};

/**
 * 待处理举报队列，按时间倒序。
 * 逐条解析被举报对象（提案/评论）以给出可读摘要与跳转锚点，
 * 并标注当前是否已隐藏（便于一键切换）。
 */
export async function listReportQueue(): Promise<ReportQueueItem[]> {
  await requireAdmin();
  const reports = await prisma.report.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      createdAt: true,
      reporter: { select: { id: true, displayName: true } },
    },
  });

  // 批量取被举报对象，减少 N+1
  const proposalIds = reports
    .filter((r) => r.targetType === ReportTarget.PROPOSAL)
    .map((r) => r.targetId);
  const commentIds = reports
    .filter((r) => r.targetType === ReportTarget.COMMENT)
    .map((r) => r.targetId);

  const [proposals, comments] = await Promise.all([
    proposalIds.length
      ? prisma.proposal.findMany({
          where: { id: { in: proposalIds } },
          select: {
            id: true,
            title: true,
            body: true,
            hiddenAt: true,
            author: { select: { id: true, displayName: true, role: true } },
          },
        })
      : Promise.resolve([]),
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: {
            id: true,
            body: true,
            hiddenAt: true,
            proposalId: true,
            author: { select: { id: true, displayName: true, role: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const pMap = new Map(proposals.map((p) => [p.id, p]));
  const cMap = new Map(comments.map((c) => [c.id, c]));

  return reports.map((r) => {
    let target: ReportQueueItem['target'] = null;
    if (r.targetType === ReportTarget.PROPOSAL) {
      const p = pMap.get(r.targetId);
      if (p) {
        target = {
          kind: ReportTarget.PROPOSAL,
          excerpt: p.title,
          hidden: p.hiddenAt != null,
          proposalId: p.id,
          author: p.author,
        };
      }
    } else {
      const c = cMap.get(r.targetId);
      if (c) {
        target = {
          kind: ReportTarget.COMMENT,
          excerpt: c.body.slice(0, 120),
          hidden: c.hiddenAt != null,
          proposalId: c.proposalId,
          author: c.author,
        };
      }
    }
    return { ...r, target };
  });
}

// ── 用户列表（封禁管理）──────────────────────────────────
export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  bannedAt: Date | null;
  createdAt: Date;
  proposalCount: number;
};

/** 用户列表（最近注册优先），供封禁/解封操作。 */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      bannedAt: true,
      createdAt: true,
      _count: { select: { proposals: true } },
    },
  });
  return rows.map(({ _count, ...r }) => ({
    ...r,
    proposalCount: _count.proposals,
  }));
}

// ── 仪表盘计数 ───────────────────────────────────────────
export type AdminCounts = {
  pendingReports: number;
  proposals: number;
  users: number;
  bannedUsers: number;
  hiddenProposals: number;
};

/** 后台首页计数卡。 */
export async function getAdminCounts(): Promise<AdminCounts> {
  await requireAdmin();
  const [pendingReports, proposals, users, bannedUsers, hiddenProposals] =
    await Promise.all([
      prisma.report.count({ where: { resolvedAt: null } }),
      prisma.proposal.count(),
      prisma.user.count(),
      prisma.user.count({ where: { bannedAt: { not: null } } }),
      prisma.proposal.count({ where: { hiddenAt: { not: null } } }),
    ]);
  return { pendingReports, proposals, users, bannedUsers, hiddenProposals };
}
