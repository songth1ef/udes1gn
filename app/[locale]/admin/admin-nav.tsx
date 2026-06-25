'use client';

import { Link, usePathname } from '@/lib/i18n/navigation';

/**
 * AdminNav（client）—— 后台侧栏/顶部分段导航。
 * 高亮当前段（locale 无关的 pathname 匹配）。文案由父级以 i18n key 渲染后传入。
 * 响应式：移动端横向滚动的标签条，sm 起为竖向侧栏（由父布局控制容器）。
 */
export type AdminNavItem = { href: string; label: string };

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
      {items.map((it) => {
        const active =
          it.href === '/admin'
            ? pathname === '/admin'
            : pathname === it.href || pathname.startsWith(it.href + '/');
        return (
          <Link
            key={it.href}
            href={it.href}
            className={[
              'whitespace-nowrap rounded-ud px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-ud-blue/10 text-ud-blue'
                : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground',
            ].join(' ')}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
