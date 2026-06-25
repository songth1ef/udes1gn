'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireActiveUser, AuthError } from '@/lib/auth-guard';

/**
 * 评论 Server Action（D3）。
 *
 * 规则（domain.md）：
 * - 评论挂在提案下；被封禁用户不能评论（requireActiveUser）。
 * - 隐藏内容（hiddenAt 非空）对普通用户不可见；列表默认排除。
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type CommentItem = {
  id: string;
  body: string;
  createdAt: Date;
  hiddenAt: Date | null;
  author: { id: string; displayName: string };
};

// ── createComment ────────────────────────────────────────
const createSchema = z.object({
  proposalId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

export async function createComment(
  _prev: ActionResult<{ id: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = createSchema.safeParse({
    proposalId: formData.get('proposalId'),
    body: formData.get('body'),
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

  // 提案需存在且对用户可见（未隐藏）
  const proposal = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    select: { id: true, hiddenAt: true },
  });
  if (!proposal || proposal.hiddenAt) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  const comment = await prisma.comment.create({
    data: {
      proposalId: parsed.data.proposalId,
      authorId: user.id,
      body: parsed.data.body,
    },
    select: { id: true },
  });

  revalidatePath(`/proposals/${parsed.data.proposalId}`);
  return { ok: true, data: { id: comment.id } };
}

// ── listComments ─────────────────────────────────────────
/**
 * 列出某提案下评论，时间正序（楼层）。
 * 默认排除隐藏评论；ADMIN 场景传 includeHidden=true 可见全部。
 */
export async function listComments(
  proposalId: string,
  opts: { includeHidden?: boolean } = {},
): Promise<CommentItem[]> {
  return prisma.comment.findMany({
    where: {
      proposalId,
      ...(opts.includeHidden ? {} : { hiddenAt: null }),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      hiddenAt: true,
      author: { select: { id: true, displayName: true } },
    },
  });
}
