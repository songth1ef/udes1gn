'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Button, Input, MessageBox } from '@/components';

/**
 * 忘记密码表单（E7, 视觉移植 v1 forgetPS）。
 *
 * 注意：密码重置后端（C5）本期标记为「暂不做」，故此页仅有 UI：
 * 提交后给出「功能开发中」提示（forgotPending），不调用任何 action。
 * 待 C5 落地后接入对应 server action 即可。文案全走 auth namespace key。
 */
export function ForgetForm() {
  const t = useTranslations('auth');
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex w-full flex-col gap-5"
    >
      <h1 className="text-2xl font-semibold">{t('forgotTitle')}</h1>
      <p className="text-sm text-foreground/60">{t('forgotIntro')}</p>

      {submitted && (
        <MessageBox tone="warning">{t('forgotPending')}</MessageBox>
      )}

      <Input
        name="email"
        type="email"
        label={t('email')}
        required
        autoComplete="email"
      />

      <Button type="submit" variant="primary" fullWidth>
        {t('forgotSubmit')}
      </Button>

      <div className="text-sm">
        <Link href="/login" className="text-ud-blue hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    </form>
  );
}
