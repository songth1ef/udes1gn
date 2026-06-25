import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

/**
 * 扩展 Auth.js 的 Session / User / JWT 类型，
 * 让 session.user.id 与 session.user.role 在全工程可类型安全访问。
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}
