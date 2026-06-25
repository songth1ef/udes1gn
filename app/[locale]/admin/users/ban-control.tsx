'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components';
import { banUser } from '@/lib/actions/report';

/**
 * BanControl（client）—— 单个用户的封禁/解封切换。
 * ADMIN 用户禁用按钮（action 层也会拒，纵深防御）。
 * banUser 成功后用 router.refresh 拉新状态（action 内未 revalidate 用户列表路由，
 * 这里主动刷新以反映 bannedAt 变化）。
 */
export function BanControl({
  userId,
  banned,
  isAdmin,
}: {
  userId: string;
  banned: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations('admin');
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(banned);
  const [error, setError] = useState(false);

  function toggle() {
    if (pending || isAdmin) return;
    setError(false);
    const next = !state;
    startTransition(async () => {
      const res = await banUser({ userId, banned: next });
      if (res.ok) setState(next);
      else setError(true);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={state ? 'default' : 'danger'}
        disabled={pending || isAdmin}
        onClick={toggle}
      >
        {state ? t('unban') : t('ban')}
      </Button>
      {error && (
        <span className="text-xs text-ud-red">{t('actionFailed')}</span>
      )}
    </div>
  );
}
