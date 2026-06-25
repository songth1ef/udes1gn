'use client';

import { useTransition } from 'react';
import { logoutUser } from '@/lib/actions/auth';
import { Button } from './Button';

/**
 * LogoutButton —— 触发 logoutUser server action（清 session 并跳回首页）。
 * 文案（label）由调用方以 i18n key 渲染后传入。
 */
export function LogoutButton({
  label,
  fullWidth,
}: {
  label: string;
  fullWidth?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      fullWidth={fullWidth}
      disabled={pending}
      onClick={() => startTransition(() => void logoutUser())}
    >
      {label}
    </Button>
  );
}
