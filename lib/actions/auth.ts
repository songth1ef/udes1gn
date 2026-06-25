'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthError as NextAuthError } from 'next-auth';
import { prisma } from '@/lib/db';
import { signIn, signOut } from '@/lib/auth';

/**
 * 认证相关 Server Action：注册 / 登录 / 登出。
 *
 * 返回约定（供前端 + i18n 用）：
 * - 成功：{ ok: true }
 * - 失败：{ ok: false, error: <稳定英文 code>, fieldErrors?: {...} }
 *   前端按 error code 映射 translation key（auth.invalidCredentials 等），
 *   不在此处拼任何语言的可见文案（遵守 i18n 硬约束）。
 */

export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
    };

// ── 注册 ─────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72), // bcrypt 上限 72 字节
  displayName: z.string().min(1).max(40),
});

export async function registerUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !fieldErrors[field]) {
        // code 形如 'email.invalid' / 'password.tooShort'，前端映射文案
        fieldErrors[field] = `${field}.${issue.code}`;
      }
    }
    return { ok: false, error: 'VALIDATION_FAILED', fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();

  // 邮箱唯一
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: 'EMAIL_TAKEN',
      fieldErrors: { email: 'email.taken' },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: parsed.data.displayName,
      role: 'USER',
    },
  });

  return { ok: true };
}

// ── 登录 ─────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_CREDENTIALS',
      fieldErrors: { email: 'auth.invalidCredentials' },
    };
  }

  const callbackUrl = formData.get('callbackUrl');

  try {
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: typeof callbackUrl === 'string' && callbackUrl ? callbackUrl : '/',
    });
  } catch (err) {
    // signIn 在成功时会抛 NEXT_REDIRECT —— 必须重新抛出让 Next 处理跳转。
    if (isRedirectError(err)) throw err;
    if (err instanceof NextAuthError) {
      // CredentialsSignin 等：统一作为凭证错误（含被封禁，authorize 返回 null）
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }
    throw err;
  }

  return { ok: true };
}

// ── 登出 ─────────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

/** Next.js 的 redirect 通过抛特定错误实现，需放行而非吞掉。 */
function isRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}
