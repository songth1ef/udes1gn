'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Button, Input, MessageBox } from '@/components';
import { createProposal, type ActionResult } from '@/lib/actions/proposal';

/**
 * 发布提案表单（E6, client）。
 * useActionState 调 createProposal；成功（含新提案 id）后跳详情页。
 * 字段错误（VALIDATION_FAILED.fieldErrors）映射 i18n key；
 * 其余错误（未登录 / 封禁）走顶部 MessageBox。文案全走 key。
 */
export function NewProposalForm() {
  const t = useTranslations('proposal');
  const tc = useTranslations('common');
  const router = useRouter();

  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | undefined,
    FormData
  >(createProposal, undefined);

  useEffect(() => {
    if (state?.ok && state.data) {
      router.push(`/proposals/${state.data.id}`);
    }
  }, [state, router]);

  const fieldError = (name: string) => {
    if (!state || state.ok) return undefined;
    const code = state.fieldErrors?.[name];
    if (!code) return undefined;
    // code 形如 'title.too_small' → 用稳定的 required 文案兜底
    if (name === 'title') return t('titleRequired');
    if (name === 'body') return t('bodyRequired');
    if (name === 'category') return t('categoryRequired');
    return undefined;
  };

  // 顶层错误（非字段级）：未登录 / 封禁 / 其他
  const topError =
    state && !state.ok && state.error !== 'VALIDATION_FAILED'
      ? state.error === 'UNAUTHENTICATED'
        ? t('loginToCreate')
        : t('submitFailed')
      : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {topError && <MessageBox tone="error">{topError}</MessageBox>}

      <Input
        name="title"
        label={t('title')}
        placeholder={t('titlePlaceholder')}
        required
        maxLength={120}
        error={fieldError('title')}
      />

      <Input
        name="category"
        label={t('category')}
        placeholder={t('categoryPlaceholder')}
        required
        maxLength={40}
        error={fieldError('category')}
      />

      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor="body" className="text-sm text-foreground/80">
          {t('body')}
        </label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={5000}
          rows={8}
          placeholder={t('bodyPlaceholder')}
          className="w-full resize-y rounded-ud border border-foreground/20 bg-transparent p-3 text-foreground outline-none transition-colors duration-150 placeholder:text-foreground/40 hover:border-ud-blue/60 focus:border-ud-blue"
        />
        {fieldError('body') && (
          <p className="pl-3 text-[14px] leading-tight text-ud-red">
            {fieldError('body')}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? tc('posting') : t('create')}
        </Button>
      </div>
    </form>
  );
}
