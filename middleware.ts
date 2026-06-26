import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/lib/i18n/routing';

/**
 * 组合中间件：
 *  1. next-intl 处理 [locale] 路由（重写/重定向、默认语言）。
 *  2. 在 intl 之上做登录保护：未登录访问受保护路由 → 跳登录页（带 callbackUrl）。
 *
 * 角色级（ADMIN）校验**不在这里**做——按 conventions.md，角色校验在 action 层
 * （见 lib/auth-guard.ts 的 requireAdmin）。中间件只拦"必须登录"这层。
 *
 * Edge 兼容：用 next-auth/jwt 的 getToken 直接解 session token，
 * 不引入 prisma / bcrypt（它们只在 Node 运行时的 route/action 中跑）。
 */

const intlMiddleware = createMiddleware(routing);

// 受保护路径（去掉 locale 前缀后的 pathname 片段）。
// 需登录：发起提案、管理后台。
const PROTECTED_PATTERNS = [/^\/proposals\/new(\/.*)?$/, /^\/admin(\/.*)?$/];

/** 去掉可识别的 locale 前缀，返回逻辑 pathname（如 /zh/admin → /admin）。 */
function stripLocale(pathname: string): string {
  const segments = pathname.split('/');
  // segments[0] === '' ；segments[1] 可能是 locale
  if (segments[1] && routing.locales.includes(segments[1] as never)) {
    const rest = '/' + segments.slice(2).join('/');
    return rest === '/' ? '/' : rest.replace(/\/$/, '');
  }
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}

function detectLocale(pathname: string): string {
  const seg = pathname.split('/')[1];
  return seg && routing.locales.includes(seg as never)
    ? seg
    : routing.defaultLocale;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const logicalPath = stripLocale(pathname);
  const needsAuth = PROTECTED_PATTERNS.some((re) => re.test(logicalPath));

  if (needsAuth) {
    // NextAuth v5 (Auth.js) 默认 cookie 名 `authjs.session-token`，且 JWE 的解密密钥
    // 由 secret + salt 派生，salt == cookie 名。next-auth/jwt 的 getToken 默认按旧 v4
    // 的 `next-auth.session-token` 找 cookie、也不会自动用该 cookie 名当 salt，故需
    // 显式对齐 cookieName + salt，否则已登录用户访问受保护路由会被误判未登录跳登录页。
    //
    // `__Secure-` 前缀只在 https 下出现（取决于实际协议，而非 NODE_ENV）：
    // 生产用 next start 跑在 http://localhost（无 TLS 终止）时 cookie 仍是无前缀的，
    // 按 NODE_ENV 判断会错配前缀。这里用请求协议（含反代 x-forwarded-proto）判定。
    const proto =
      req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
    const useSecure = proto === 'https';
    const cookieName = useSecure
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: useSecure,
      cookieName,
      salt: cookieName,
    });

    if (!token) {
      const locale = detectLocale(pathname);
      // 反代后 req.url 的 host 是内部 localhost:PORT，重定向 Location 会泄漏内部地址。
      // 用转发头里的公网 host + 协议构造跳转基址。
      const fwdHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      const base = fwdHost ? `${proto}://${fwdHost}` : req.url;
      const loginUrl = new URL(`/${locale}/login`, base);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 通过登录检查后，交给 next-intl 处理 locale 路由。
  return intlMiddleware(req);
}

export const config = {
  // 跳过 api、_next、静态资源；其余都过中间件（含根路径重定向到默认 locale）。
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
