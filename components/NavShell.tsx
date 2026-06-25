'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { LanguageSwitcher, type LocaleOption } from './LanguageSwitcher';
import { LogoutButton } from './LogoutButton';
import { Button } from './Button';

/**
 * NavShell —— Nav 的客户端外壳：承载响应式布局与移动端汉堡菜单。
 *
 * 数据（链接、文案、登录态、语言选项）由 Nav（server）注入，本组件不取数据、
 * 不硬编码文案。两套布局：
 *  - 桌面（md+）：横向一行，链接 + 语言切换 + 登录/用户入口。
 *  - 移动（<md）：logo + 汉堡；展开后纵向面板，链接/语言/登录入口竖排。
 *
 * 高度固定 60px（h-nav，设计 token），sticky 顶部，主区宽度 max-w-main 居中。
 */

export type NavLink = { href: string; label: string };

export type NavLabels = {
  appName: string;
  slogan: string;
  language: string;
  login: string;
  register: string;
  logout: string;
  menu: string;
};

export type NavUser = { name: string } | null;

export function NavShell({
  links,
  locales,
  labels,
  user,
}: {
  links: NavLink[];
  locales: LocaleOption[];
  labels: NavLabels;
  user: NavUser;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-nav max-w-main items-center justify-between gap-4 px-4 sm:px-6">
        {/* 品牌：logo + slogan（slogan 仅 sm+ 显示，窄屏省空间） */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-baseline gap-2 select-none"
        >
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {labels.appName}
          </span>
          <span className="hidden text-xs text-foreground/50 sm:inline">
            {labels.slogan}
          </span>
        </Link>

        {/* 桌面导航（md+） */}
        <nav className="hidden items-center gap-6 md:flex">
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

        {/* 桌面右侧：语言 + 登录/用户（md+） */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher locales={locales} label={labels.language} />
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

        {/* 移动端汉堡（<md） */}
        <button
          type="button"
          aria-label={labels.menu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-ud text-foreground hover:text-ud-blue md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* 移动端展开面板（<md） */}
      {open && (
        <div className="border-t border-foreground/10 bg-background md:hidden">
          <nav className="mx-auto flex max-w-main flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={[
                  'rounded-ud px-2 py-2.5 text-sm transition-colors hover:bg-foreground/5',
                  isActive(l.href) ? 'text-ud-blue' : 'text-foreground/90',
                ].join(' ')}
              >
                {l.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-foreground/10" />

            <div className="px-2 py-1">
              <LanguageSwitcher locales={locales} label={labels.language} />
            </div>

            <div className="mt-2 flex flex-col gap-2 px-2">
              {user ? (
                <>
                  <span className="truncate text-sm text-foreground/70">
                    {user.name}
                  </span>
                  <LogoutButton label={labels.logout} fullWidth />
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="default" fullWidth>
                      {labels.login}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button variant="primary" fullWidth>
                      {labels.register}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
