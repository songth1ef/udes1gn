import { handlers } from '@/lib/auth';

/**
 * Auth.js v5 路由处理器（/api/auth/*）。
 * 承载登录、登出、session、csrf 等内建端点。
 */
export const { GET, POST } = handlers;
