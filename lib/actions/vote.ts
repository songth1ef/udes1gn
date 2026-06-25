'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireActiveUser, AuthError } from '@/lib/auth-guard';

/**
 * 投票 Server Action（D2）。
 *
 * 规则（domain.md）：1 人 1 票，可取消。靠 DB 唯一约束 @@unique([proposalId,userId])
 * 强保证唯一性，action 层做幂等 toggle：
 *   - 未投 → 投票（写入；并发重复写撞唯一约束 P2002 时静默视为已投，保持幂等）。
 *   - 已投 → 取消（按唯一键删除；并发重复删撞 P2025 时静默视为已取消，保持幂等）。
 * 被封禁用户不能投票（requireActiveUser 查库校验）。
 */

export type VoteResult =
  | { ok: true; voted: boolean; voteCount: number }
  | { ok: false; error: string };

export async function toggleVote(proposalId: string): Promise<VoteResult> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  // 提案需存在且未被隐藏（隐藏内容不接受互动）
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true, hiddenAt: true },
  });
  if (!proposal || proposal.hiddenAt) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  const existing = await prisma.vote.findUnique({
    where: { proposalId_userId: { proposalId, userId: user.id } },
    select: { id: true },
  });

  let voted: boolean;
  if (existing) {
    try {
      await prisma.vote.delete({
        where: { proposalId_userId: { proposalId, userId: user.id } },
      });
      voted = false;
    } catch (err) {
      // 并发下记录已被另一请求删除（P2025）→ 视为已取消，保持幂等
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        voted = false;
      } else {
        throw err;
      }
    }
  } else {
    try {
      await prisma.vote.create({ data: { proposalId, userId: user.id } });
      voted = true;
    } catch (err) {
      // 并发下唯一约束冲突 → 视为已投，保持幂等
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        voted = true;
      } else {
        throw err;
      }
    }
  }

  const voteCount = await prisma.vote.count({ where: { proposalId } });

  revalidatePath('/proposals');
  revalidatePath(`/proposals/${proposalId}`);
  return { ok: true, voted, voteCount };
}
