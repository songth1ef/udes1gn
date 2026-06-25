'use client';

import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

/**
 * Input —— 移植 v1 输入框视觉，tailwind 重写。
 * 规范（v1-reference §组件规范）：
 * - padding 12px、圆角 12px、1px 边框，聚焦/hover 变主蓝。
 * - 密码框右侧带 eye 切换（type='password' 时自动出现）。
 * - 错误信息红字 14px、左缩进 12px。
 *
 * label / error 文案由调用方传入（i18n key 渲染后的字符串），组件不硬编码文案。
 * eye 按钮的 aria-label 也由调用方传入（showPasswordLabel / hidePasswordLabel），
 * 保证可访问性文案同样走 i18n。
 */

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  error?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  /** 密码可见/隐藏切换按钮的无障碍文案（i18n 渲染后的字符串）。 */
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    type = 'text',
    showPasswordLabel,
    hidePasswordLabel,
    className,
    id,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword && revealed ? 'text' : type;

  const fieldBorder = error
    ? 'border-ud-red focus:border-ud-red'
    : 'border-foreground/20 hover:border-ud-blue/60 focus:border-ud-blue';

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-foreground/80">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          aria-invalid={error ? true : undefined}
          className={[
            'w-full rounded-ud border bg-transparent p-3 text-foreground outline-none transition-colors duration-150 placeholder:text-foreground/40',
            isPassword ? 'pr-11' : '',
            fieldBorder,
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? hidePasswordLabel : showPasswordLabel}
            className="absolute inset-y-0 right-0 flex w-11 select-none items-center justify-center text-foreground/50 hover:text-ud-blue"
            tabIndex={-1}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>

      {error && (
        <p className="pl-3 text-[14px] leading-tight text-ud-red">{error}</p>
      )}
    </div>
  );
});

/** 内联 eye 图标（开），16px，currentColor。 */
function Eye() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 内联 eye 图标（关）。 */
function EyeOff() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
