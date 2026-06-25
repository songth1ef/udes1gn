import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Button —— 移植 v1 `.ud_btn` 视觉，tailwind 重写。
 * 规范（v1-reference §组件规范）：高 38px、圆角 12px、hover → 蓝边 + 蓝字、select-none。
 *
 * 变体：
 * - default：描边按钮（v1 .ud_btn 本体），hover 变蓝。
 * - primary：实心蓝，主操作（提交提案 / 投票 / 登录）。
 * - ghost：无边框，仅文字，用于 Nav / 次级操作。
 * - danger：危险操作（删除 / 否决），hover 变红。
 *
 * 全部响应式无关（按钮自身高度固定），布局由父级控制。文案由调用方传入
 * （必须是 i18n key 渲染后的字符串，组件不硬编码任何文案）。
 */

type Variant = 'default' | 'primary' | 'ghost' | 'danger';

const BASE =
  'inline-flex h-[38px] select-none items-center justify-center gap-2 rounded-ud px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ud-blue/60';

const VARIANTS: Record<Variant, string> = {
  default:
    'border border-foreground/20 text-foreground hover:border-ud-blue hover:text-ud-blue',
  primary:
    'bg-ud-blue text-white hover:bg-ud-blue/90 border border-transparent',
  ghost: 'text-foreground hover:text-ud-blue',
  danger:
    'border border-foreground/20 text-foreground hover:border-ud-red hover:text-ud-red',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'default', fullWidth, className, type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={[
          BASE,
          VARIANTS[variant],
          fullWidth ? 'w-full' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    );
  },
);
