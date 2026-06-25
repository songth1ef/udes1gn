'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';

/**
 * LanguageSwitcher —— 语言切换（F2）。
 * 选项来自 DB（Locale 表，enabled），由 Nav（server）通过 props 注入，
 * 切换时复用 next-intl 的 locale 感知 router：保持当前 pathname，只换 locale 前缀。
 *
 * 「语言」label 文案由调用方传入（nav.language，i18n 渲染后字符串），零硬编码。
 * 语言显示名（中文 / English）来自 DB 的 Locale.name，本身就是各语言原生写法。
 *
 * 移动端与桌面端共用；用原生 <select> 保证窄屏可用、无障碍、零额外依赖。
 */

export type LocaleOption = { code: string; name: string };

export function LanguageSwitcher({
  locales,
  label,
  className,
}: {
  locales: LocaleOption[];
  label: string;
  className?: string;
}) {
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    if (next === current) return;
    startTransition(() => {
      // pathname 已是去 locale 前缀的逻辑路径；router.replace 会重新带上目标 locale。
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <label className={['inline-flex items-center', className ?? ''].join(' ')}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={current}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer select-none rounded-ud border border-foreground/20 bg-transparent py-1.5 pl-2.5 pr-7 text-sm text-foreground outline-none hover:border-ud-blue focus:border-ud-blue disabled:opacity-50"
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code} className="text-black">
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
