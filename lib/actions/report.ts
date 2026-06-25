'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ReportTarget } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireActiveUser, requireAdmin, AuthError } from '@/lib/auth-guard';

/**
 * 举报 + 审核 Server Action（D5）。
 *
 * 规则（domain.md）：
 * - 任意活跃用户可举报提案/评论，进管理员审核队列。
 * - 隐藏内容 / 封禁用户为 ADMIN 操作（全人工审核）。
 * - 返回稳定英文 error code，前端映射 i18n 文案。
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function toErr(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  throw err;
}

// ── createReport ─────────────────────────────────────────
const reportSchema = z.object({
  targetType: z.nativeEnum(ReportTarget),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});

export async function createReport(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return toErr(err);
  }

  const parsed = reportSchema.safeParse({
    targetType: formData.get('targetType'),
    targetId: formData.get('targetId'),
    reason: formData.get('reason'),
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

  // 被举报对象需存在
  const exists =
    parsed.data.targetType === ReportTarget.PROPOSAL
      ? await prisma.proposal.findUnique({
          where: { id: parsed.data.targetId },
          select: { id: true },
        })
      : await prisma.comment.findUnique({
          where: { id: parsed.data.targetId },
          select: { id: true },
        });
  if (!exists) return { ok: false, error: 'NOT_FOUND' };

  await prisma.report.create({
    data: {
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reporterId: user.id,
      reason: parsed.data.reason,
    },
  });

  return { ok: true };
}

// ── hideContent（ADMIN）──────────────────────────────────
/**
 * 隐藏 / 取消隐藏 提案或评论（hiddenAt 置位/清空）。
 * 同时把相关 Report 标记为已处理（resolvedAt）。
 */
export async function hideContent(
  targetType: ReportTarget,
  targetId: string,
  hidden: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }

  const hiddenAt = hidden ? new Date() : null;

  if (targetType === ReportTarget.PROPOSAL) {
    const found = await prisma.proposal.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!found) return { ok: false, error: 'NOT_FOUND' };
    await prisma.proposal.update({ where: { id: targetId }, data: { hiddenAt } });
    revalidatePath('/proposals');
    revalidatePath(`/proposals/${targetId}`);
  } else {
    const found = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { id: true, proposalId: true },
    });
    if (!found) return { ok: false, error: 'NOT_FOUND' };
    await prisma.comment.update({ where: { id: targetId }, data: { hiddenAt } });
    revalidatePath(`/proposals/${found.proposalId}`);
  }

  // 处理该目标的未决举报
  await prisma.report.updateMany({
    where: { targetType, targetId, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });

  return { ok: true };
}

// ── banUser（ADMIN）──────────────────────────────────────
/**
 * 封禁 / 解封用户（bannedAt 置位/清空）。
 * 被封禁用户不能提案/投票/评论（在 requireActiveUser 处拦截），
 * 且登录即拒（lib/auth.ts authorize）。
 * 不允许封禁 ADMIN（防误伤运营）。
 */
const banSchema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
});

export async function banUser(input: {
  userId: string;
  banned: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }

  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: 'NOT_FOUND' };
  if (target.role === 'ADMIN') return { ok: false, error: 'FORBIDDEN' };

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { bannedAt: parsed.data.banned ? new Date() : null },
  });

  return { ok: true };
}
