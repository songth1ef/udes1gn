'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Button, MessageBox } from '@/components';
import { Link } from '@/lib/i18n/navigation';
import { createComment, type ActionResult } from '@/lib/actions/comment';

/**
 * CommentForm（client, E5）—— 发表评论，接 createComment。
 * 成功后清空输入 + router.refresh()（server 重新渲染评论列表）。
 * 未登录：渲染「登录后评论」链接，不显示表单。文案全走 comment namespace。
 */
export function CommentForm({
  proposalId,
  isAuthed,
}: {
  proposalId: string;
  isAuthed: boolean;
}) {
  const t = useTranslations('comment');
  const tc = useTranslations('common');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | undefined,
    FormData
  >(createComment, undefined);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  if (!isAuthed) {
    return (
      <MessageBox tone="info">
        <Link
          href={`/login?callbackUrl=/proposals/${proposalId}`}
          className="underline hover:no-underline"
        >
          {t('loginToComment')}
        </Link>
      </MessageBox>
    );
  }

  const error =
    state && !state.ok
      ? state.fieldErrors?.body
        ? t('bodyRequired')
        : t('postFailed')
      : undefined;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="proposalId" value={proposalId} />
      {error && <MessageBox tone="error">{error}</MessageBox>}
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder={t('placeholder')}
        className="w-full resize-y rounded-ud border border-foreground/20 bg-transparent p-3 text-foreground outline-none transition-colors duration-150 placeholder:text-foreground/40 hover:border-ud-blue/60 focus:border-ud-blue"
      />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? tc('posting') : t('post')}
        </Button>
      </div>
    </form>
  );
}
