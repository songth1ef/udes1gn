'use client';

import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ChangeEvent,
} from 'react';

/**
 * UdField —— 1:1 还原 v1 的表单输入框（components/form/input）。
 * 行为：
 *  - placeholder 占位（无外置标签），固定 38px 高、12px 圆角、1px 边框。
 *  - 交互后校验：通过边框变绿（ud-green）、不通过变红（ud-red）；未交互为中性灰。
 *  - showEye 时右侧 👀/🙈 切换密码可见（与 v1 一致）。
 *  - 不通过时下方红色错误提示。
 *  - 暴露 valid() 供父级提交前校验（v1 的 ref.valid()）。
 * 宽度：默认移动 80vw / sm 起 300px（v1 的响应式）。
 */

export type UdRule = {
  regExp?: RegExp;
  /** 与某值相等才算通过（密码二次确认用） */
  matchValue?: string;
  message: string;
};

export type UdFieldHandle = { valid: () => boolean; value: () => string };

export const UdField = forwardRef<
  UdFieldHandle,
  {
    name: string;
    type?: string;
    placeholder: string;
    autoComplete?: string;
    maxLength?: number;
    showEye?: boolean;
    required?: boolean;
    rule?: UdRule;
    widthClass?: string;
    value?: string;
    onChange?: (v: string) => void;
  }
>(function UdField(
  {
    name,
    type = 'text',
    placeholder,
    autoComplete,
    maxLength,
    showEye = false,
    required = false,
    rule,
    widthClass = 'w-[80vw] max-w-[300px] sm:w-[300px]',
    value: controlled,
    onChange,
  },
  ref,
) {
  const [inner, setInner] = useState('');
  const value = controlled ?? inner;
  const [touched, setTouched] = useState(false);
  const [reveal, setReveal] = useState(false);

  const check = (v: string) => {
    if (rule?.regExp) return rule.regExp.test(v);
    if (rule?.matchValue !== undefined) return v !== '' && rule.matchValue === v;
    if (required) return v.trim() !== '';
    return true;
  };
  const ok = check(value);

  useImperativeHandle(ref, () => ({
    valid: () => {
      setTouched(true);
      return check(value);
    },
    value: () => value,
  }));

  const border = !touched
    ? 'border-foreground/25 focus:border-ud-blue'
    : ok
      ? 'border-ud-green'
      : 'border-ud-red';

  const inputType = showEye ? (reveal ? 'text' : 'password') : type;

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!touched) setTouched(true);
    if (controlled === undefined) setInner(v);
    onChange?.(v);
  };

  return (
    <div className={`relative ${widthClass}`}>
      <input
        name={name}
        type={inputType}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={handle}
        onBlur={() => setTouched(true)}
        className={[
          'h-[38px] w-full rounded-ud border bg-background px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-foreground/35',
          border,
          showEye ? 'pr-10' : '',
        ].join(' ')}
      />
      {showEye && (
        <span
          onClick={() => setReveal((r) => !r)}
          className="absolute right-2 top-1.5 cursor-pointer select-none text-lg leading-none"
          role="button"
          aria-label={reveal ? 'hide' : 'show'}
        >
          {reveal ? '🙈' : '👀'}
        </span>
      )}
      {rule?.message && touched && !ok && (
        <div className="mt-1 pl-3 text-[13px] text-ud-red">{rule.message}</div>
      )}
    </div>
  );
});
