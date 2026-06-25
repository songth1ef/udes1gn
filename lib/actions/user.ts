'use server';

import type { ProposalStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * 用户主页读取（E8）。
 *
 * 公开档案 + 贡献记录：基础信息 + 发起的提案（未隐藏）+ 计数。
 * 只读、无副作用；不含敏感字段（passwordHash/email 仅对本人/管理员场景另议，
 * 此处只暴露公开信息）。被封禁用户仍可被查看其历史（运营透明）。
 */

export type UserProfile = {
  id: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  proposalsCount: number;
  commentsCount: number;
  proposals: {
    id: string;
    title: string;
    category: string;
    status: ProposalStatus;
    createdAt: Date;
    voteCount: number;
  }[];
};

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { comments: true } },
      proposals: {
        where: { hiddenAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
          _count: { select: { votes: true } },
        },
      },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
    proposalsCount: user.proposals.length,
    commentsCount: user._count.comments,
    proposals: user.proposals.map(({ _count, ...p }) => ({
      ...p,
      voteCount: _count.votes,
    })),
  };
}
