'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Prisma, ProposalStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireActiveUser, requireAdmin, AuthError } from '@/lib/auth-guard';

/**
 * 提案相关 Server Action（D1 + D4）。
 *
 * 设计约定（见 conventions.md / domain.md）：
 * - 写操作集中于此，权限在 action 内校验。
 * - 返回稳定英文 error code，前端按 key 映射 i18n 文案，不在此拼可见文案。
 * - 隐藏内容（hiddenAt 非空）对普通用户不可见、不参与列表（domain.md）。
 * - 状态机只能由 ADMIN 推进（domain.md），且只允许合法迁移。
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** 把 AuthError 等已知错误转成统一返回；未知错误重新抛出。 */
function toErr(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  throw err;
}

// ── 列表排序投影 ─────────────────────────────────────────
export type ProposalListItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: ProposalStatus;
  createdAt: Date;
  author: { id: string; displayName: string };
  voteCount: number;
};

// ── createProposal ───────────────────────────────────────
const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(5000),
  category: z.string().trim().min(1).max(40),
});

export async function createProposal(
  _prev: ActionResult<{ id: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return toErr(err);
  }

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    category: formData.get('category'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = `${field}.${issue.code}`;
      }
    }
    return { ok: false, error: 'VALIDATION_FAILED', fieldErrors };
  }

  const proposal = await prisma.proposal.create({
    data: { ...parsed.data, authorId: user.id },
    select: { id: true },
  });

  revalidatePath('/proposals');
  return { ok: true, data: { id: proposal.id } };
}

// ── listProposals ────────────────────────────────────────
export type ListProposalsArgs = {
  category?: string;
  /** 是否包含被隐藏内容（仅 ADMIN 场景传 true）。默认 false。 */
  includeHidden?: boolean;
};

/**
 * 列表：排除 hidden（除非 includeHidden）、可按分类过滤、按票数降序
 * （票数相同按创建时间倒序）。
 */
export async function listProposals(
  args: ListProposalsArgs = {},
): Promise<ProposalListItem[]> {
  const where: Prisma.ProposalWhereInput = {};
  if (!args.includeHidden) where.hiddenAt = null;
  if (args.category) where.category = args.category;

  const rows = await prisma.proposal.findMany({
    where,
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      status: true,
      createdAt: true,
      author: { select: { id: true, displayName: true } },
      _count: { select: { votes: true } },
    },
    // 票数排序（赞成数即排序权重，domain.md）；同票按时间新→旧
    orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }],
  });

  return rows.map(({ _count, ...r }) => ({ ...r, voteCount: _count.votes }));
}

// ── getProposal ──────────────────────────────────────────
export type ProposalDetail = ProposalListItem & {
  updatedAt: Date;
  hiddenAt: Date | null;
  viewerHasVoted: boolean;
};

/**
 * 详情：隐藏内容对非 ADMIN 返回 null（domain.md：隐藏内容普通用户不可见）。
 * viewerId 用于标记当前用户是否已投票（前端投票按钮态）。
 */
export async function getProposal(
  id: string,
  opts: { viewerId?: string; isAdmin?: boolean } = {},
): Promise<ProposalDetail | null> {
  const row = await prisma.proposal.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      hiddenAt: true,
      author: { select: { id: true, displayName: true } },
      _count: { select: { votes: true } },
      votes: opts.viewerId
        ? { where: { userId: opts.viewerId }, select: { id: true }, take: 1 }
        : false,
    },
  });
  if (!row) return null;
  if (row.hiddenAt && !opts.isAdmin) return null;

  const { _count, votes, ...rest } = row;
  return {
    ...rest,
    voteCount: _count.votes,
    viewerHasVoted: Array.isArray(votes) ? votes.length > 0 : false,
  };
}

// ── updateStatus（状态机推进，仅 ADMIN）──────────────────
/**
 * 合法状态迁移（domain.md 状态机）：
 *   COLLECTING → ADOPTED | REJECTED
 *   ADOPTED    → IN_PROGRESS
 *   IN_PROGRESS→ SHIPPED
 * SHIPPED / REJECTED 为终态，不可再迁移。
 */
const ALLOWED_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  COLLECTING: ['ADOPTED', 'REJECTED'],
  ADOPTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SHIPPED'],
  SHIPPED: [],
  REJECTED: [],
};

export async function updateStatus(
  proposalId: string,
  next: ProposalStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }

  const current = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { status: true },
  });
  if (!current) return { ok: false, error: 'NOT_FOUND' };

  if (current.status === next) return { ok: true };
  if (!ALLOWED_TRANSITIONS[current.status].includes(next)) {
    return { ok: false, error: 'INVALID_TRANSITION' };
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: next },
  });

  revalidatePath('/proposals');
  revalidatePath(`/proposals/${proposalId}`);
  return { ok: true };
}
