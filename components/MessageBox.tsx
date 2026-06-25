import type { ReactNode } from 'react';

/**
 * MessageBox —— 表单/页面级反馈条（成功 / 错误 / 提示 / 警告）。
 * 配色走设计 token：success → ud-green，error → ud-red，info → ud-blue。
 * 文案（children）由调用方以 i18n key 渲染后传入，组件不硬编码文案。
 *
 * role 按语义：error/warning → alert（即时播报）；其余 → status。
 */

type Tone = 'info' | 'success' | 'error' | 'warning';

const TONES: Record<Tone, string> = {
  info: 'border-ud-blue/30 bg-ud-blue/10 text-ud-blue',
  success: 'border-ud-green/30 bg-ud-green/10 text-ud-green',
  error: 'border-ud-red/30 bg-ud-red/10 text-ud-red',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
};

export type MessageBoxProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

export function MessageBox({
  tone = 'info',
  children,
  className,
}: MessageBoxProps) {
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={[
        'w-full rounded-ud border px-4 py-3 text-sm',
        TONES[tone],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
