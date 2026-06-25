'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/lib/i18n/navigation';

/**
 * CategoryFilter（client）—— 提案列表的分类筛选。
 * 选项由列表页（server）从现有提案的分类去重后注入。切换时改 URL ?category=
 * （locale 感知 router），由 server 重新查询、排序、渲染。空值 = 全部。
 *
 * 用原生 <select>：窄屏可用、无障碍、零依赖。label 文案走 i18n（由父级传入渲染后字符串）。
 */
export function CategoryFilter({
  categories,
  current,
  label,
  allLabel,
}: {
  categories: string[];
  current?: string;
  label: string;
  allLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(() => {
      router.replace(value ? `${pathname}?category=${encodeURIComponent(value)}` : pathname);
    });
  }

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-sm text-foreground/60">{label}</span>
      <select
        aria-label={label}
        value={current ?? ''}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer select-none rounded-ud border border-foreground/20 bg-transparent py-1.5 pl-2.5 pr-7 text-sm text-foreground outline-none hover:border-ud-blue focus:border-ud-blue disabled:opacity-50"
      >
        <option value="" className="text-black">
          {allLabel}
        </option>
        {categories.map((c) => (
          <option key={c} value={c} className="text-black">
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
