'use client';

import { Link, usePathname } from '@/lib/i18n/navigation';
import { LanguageSwitcher, type LocaleOption } from './LanguageSwitcher';
import { LogoutButton } from './LogoutButton';
import { Button } from './Button';

/**
 * NavShell —— 还原 v1 的双布局导航：
 *  - 桌面（md+）：顶部固定栏，LOGO + slogan + 横向链接 + 语言 + 登录/用户。
 *  - 移动（<md）：① 顶部极简栏（LOGO + 语言 + 登录/退出）；
 *                ② **底部 tab 栏**（emoji 图标，选中放大高亮、其余灰度）—— v1 的招牌。
 *  - 在登录/注册/忘记密码页隐藏整个 Nav（同 v1 白名单）。
 *
 * 数据由 Nav（server）注入；本组件不取数据、不硬编码文案。
 */

export type NavLink = { href: string; label: string };
export type NavTab = { href: string; label: string; icon: string };

export type NavLabels = {
  appName: string;
  slogan: string;
  language: string;
  login: string;
  register: string;
  logout: string;
  menu: string;
  settings: string;
};

export type NavUser = { name: string } | null;

const AUTH_PATHS = ['/login', '/register', '/forgetPS'];

export function NavShell({
  links,
  tabs,
  locales,
  labels,
  user,
  showSettings = false,
}: {
  links: NavLink[];
  tabs: NavTab[];
  locales: LocaleOption[];
  labels: NavLabels;
  user: NavUser;
  showSettings?: boolean;
}) {
  const pathname = usePathname();

  // 白名单页面隐藏 Nav（与 v1 一致）
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ───── 桌面顶栏（md+） ───── */}
      <header className="sticky top-0 z-40 hidden border-b border-foreground/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
        <div className="mx-auto flex h-nav max-w-main items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="flex shrink-0 items-baseline gap-2 select-none"
          >
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {labels.appName}
            </span>
            <span className="text-xs text-foreground/50">{labels.slogan}</span>
          </Link>

          <nav className="flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  'text-sm transition-colors hover:text-ud-blue',
                  isActive(l.href) ? 'text-ud-blue' : 'text-foreground/80',
                ].join(' ')}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher locales={locales} label={labels.language} />
            {showSettings && (
              <Link
                href="/settings"
                title={labels.settings}
                aria-label={labels.settings}
                className="text-lg leading-none text-foreground/70 transition-colors hover:text-ud-blue"
              >
                ⚙
              </Link>
            )}
            {user ? (
              <>
                <span className="max-w-[12ch] truncate text-sm text-foreground/70">
                  {user.name}
                </span>
                <LogoutButton label={labels.logout} />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">{labels.login}</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary">{labels.register}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ───── 移动顶部极简栏（<md）：LOGO + 语言 + 登录/退出 ───── */}
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur md:hidden">
        <div className="flex h-nav items-center justify-between px-4">
          <Link
            href="/"
            className="select-none text-lg font-semibold tracking-tight text-foreground"
          >
            {labels.appName}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locales={locales} label={labels.language} />
            {user ? (
              <LogoutButton label={labels.logout} />
            ) : (
              <Link href="/login" className="text-sm text-ud-blue">
                {labels.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ───── 移动底部 tab 栏（<md）—— v1 招牌 ───── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-main items-stretch">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                <span
                  className={[
                    'leading-none transition-all',
                    active ? 'text-2xl' : 'text-xl grayscale',
                  ].join(' ')}
                >
                  {t.icon}
                </span>
                <span
                  className={[
                    'text-[10px] leading-none',
                    active ? 'text-ud-blue' : 'text-foreground/55',
                  ].join(' ')}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* iOS 安全区适配 */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
