import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';

/**
 * Auth.js (NextAuth v5) 配置 —— 邮箱+密码 Credentials。
 *
 * 关键约束（见 docs/implementation.md §2 / conventions.md）：
 * - 服务端 session，**不用 localStorage token**（与 v1 的方案彻底切割）。
 * - 用 JWT 策略承载 session（单进程全栈、无需 DB session 表）。
 * - 把 user.id / user.role 注入 token → session，供 action 层做权限校验。
 * - 被封禁用户（bannedAt 非空）登录即拒。
 *
 * 注意：本文件会被 middleware（Edge runtime）间接引用，但 authorize 内用到的
 * prisma / bcrypt 仅在 Node 运行时的 API route 与 server action 中执行，
 * middleware 只消费 session token，不触发 authorize，故无 Edge 兼容问题。
 */

// authorize 入参的最小校验（真正的注册校验在 lib/actions/auth.ts）
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    // 自定义登录页（locale 前缀由前端阶段处理；此处给无前缀兜底路径）
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        // 被封禁用户拒绝登录
        if (user.bannedAt) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // 返回的对象会进入 jwt callback 的 user 参数
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // 登录时把 id/role 写入 token；后续请求从 token 还原
    async jwt({ token, user }) {
      if (user) {
        // user.id 在 next-auth 基础类型里是 string | undefined；authorize 必返回 id
        if (user.id) token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // 把 token 上的 id/role 暴露到 session.user，供服务端读取
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
