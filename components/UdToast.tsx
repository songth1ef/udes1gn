'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

/**
 * UdToast —— 1:1 还原 v1 的 MessageBox。
 * 顶部居中浮层：emoji 类型图标（✅❌⚠💬）+ 内容 + X 关闭，3 秒自动消失。
 * 命令式 show(type, content) 触发（v1 是 ref.show()）。
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type UdToastHandle = { show: (type: ToastType, content: string) => void };

const ICON: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: '💬',
};

export const UdToast = forwardRef<UdToastHandle>(function UdToast(_props, ref) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<ToastType>('info');
  const [content, setContent] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    show: (t, c) => {
      if (timer.current) clearTimeout(timer.current);
      setType(t);
      setContent(c);
      setVisible(true);
      timer.current = setTimeout(() => setVisible(false), 3000);
    },
  }));

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 top-[10%] z-[9999] flex min-h-[38px] min-w-[300px] max-w-[80vw] -translate-x-1/2 items-center gap-3 rounded-ud border border-foreground/80 bg-background px-3 py-2 shadow-lg">
      <span className="text-base leading-none">{ICON[type]}</span>
      <span className="flex-1 text-sm text-foreground">{content}</span>
      <span
        onClick={() => setVisible(false)}
        className="cursor-pointer select-none px-1 text-sm text-foreground/50 hover:text-foreground"
        role="button"
        aria-label="close"
      >
        ✕
      </span>
    </div>
  );
});
