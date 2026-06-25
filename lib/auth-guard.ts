import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Role } from '@prisma/client';

/**
 * Server Action 层的鉴权工具。
 * conventions.md：涉及权限的写操作必须在 action 内校验，不靠前端隐藏。
 *
 * 设计：抛错而非返回 null —— action 用 try/catch 或让其冒泡为统一错误。
 * 错误 message 用稳定的英文 code，前端按 key 映射 i18n 文案，避免硬编码语言。
 */

export class AuthError extends Error {}

export type SessionUser = {
  id: string;
  role: Role;
  email?: string | null;
  name?: string | null;
};

/** 必须已登录。返回 session.user，否则抛 AuthError('UNAUTHENTICATED')。 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError('UNAUTHENTICATED');
  }
  return session.user as SessionUser;
}

/**
 * 必须已登录且未被封禁。
 * 投票/提案/评论等写操作用这个（domain.md：被封禁用户不能提案/投票/评论）。
 * 需查库确认 bannedAt 当前状态（token 可能滞后于封禁动作）。
 */
export async function requireActiveUser(): Promise<SessionUser> {
  const user = await requireUser();
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { bannedAt: true },
  });
  if (!fresh || fresh.bannedAt) {
    throw new AuthError('BANNED');
  }
  return user;
}

/** 必须是 ADMIN。否则抛 AuthError('FORBIDDEN')。 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new AuthError('FORBIDDEN');
  }
  return user;
}
