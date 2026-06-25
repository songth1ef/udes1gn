'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ReportTarget } from '@prisma/client';
import { Button } from '@/components';
import { hideContent, banUser } from '@/lib/actions/report';

/**
 * ReviewActions（client）—— 单条举报的处理动作。
 *
 * 三类动作：
 * - 隐藏 / 取消隐藏被举报内容（hideContent，会顺带把该目标未决举报标记已处理）。
 * - 忽略举报（dismiss）：内容无问题，仅隐藏后立刻取消隐藏不合适——这里 dismiss
 *   等价于「不隐藏但解决举报」。复用 hideContent(false) 会清空 hiddenAt；为避免误改
 *   已隐藏内容，dismiss 仅在内容当前未隐藏时调用 hideContent(target,false) 来 resolve。
 * - 封禁内容作者（banUser）。
 *
 * 任一成功后 revalidate 由 action 内处理；本组件用 useTransition 控制 pending。
 */
export function ReviewActions({
  targetType,
  targetId,
  hidden,
  authorId,
  authorIsAdmin,
}: {
  targetType: ReportTarget;
  targetId: string;
  hidden: boolean;
  authorId: string;
  authorIsAdmin: boolean;
}) {
  const t = useTranslations('admin');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function run(fn: () => Promise<{ ok: boolean }>) {
    if (pending) return;
    setError(false);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(true);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={hidden ? 'default' : 'danger'}
          disabled={pending}
          onClick={() => run(() => hideContent(targetType, targetId, !hidden))}
        >
          {hidden ? t('unhide') : t('hide')}
        </Button>

        {/* 忽略举报：内容当前未隐藏时，hideContent(false) 会 resolve 举报且不改隐藏态 */}
        <Button
          variant="default"
          disabled={pending || hidden}
          onClick={() => run(() => hideContent(targetType, targetId, false))}
        >
          {t('dismiss')}
        </Button>

        <Button
          variant="danger"
          disabled={pending || authorIsAdmin}
          onClick={() => run(() => banUser({ userId: authorId, banned: true }))}
        >
          {t('banAuthor')}
        </Button>
      </div>
      {error && (
        <span className="text-xs text-ud-red">{t('actionFailed')}</span>
      )}
    </div>
  );
}
