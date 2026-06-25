'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Button, Input, MessageBox } from '@/components';
import { registerUser, type ActionResult } from '@/lib/actions/auth';

/**
 * 注册表单（E7）—— 移植 v1 视觉，tailwind + 设计系统组件重写。
 * 字段错误（fieldErrors）映射 i18n key；成功显示成功条 + 去登录入口。
 * 文案全走 auth namespace key，零硬编码。
 */
export function RegisterForm() {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState<
    ActionResult | undefined,
    FormData
  >(registerUser, undefined);

  const fieldError = (name: string) => {
    if (!state || state.ok) return undefined;
    const code = state.fieldErrors?.[name];
    if (!code) return undefined;
    if (name === 'email') {
      return code === 'email.taken' ? t('emailTaken') : t('emailRequired');
    }
    if (name === 'password') return t('passwordTooShort');
    if (name === 'displayName') return t('displayNameRequired');
    return undefined;
  };

  if (state?.ok) {
    return (
      <div className="flex w-full flex-col gap-5">
        <h1 className="text-2xl font-semibold">{t('registerTitle')}</h1>
        <MessageBox tone="success">{t('registerSuccess')}</MessageBox>
        <Link href="/login">
          <Button variant="primary" fullWidth>
            {t('goLogin')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t('registerTitle')}</h1>

      <Input
        name="displayName"
        label={t('displayName')}
        required
        maxLength={40}
        autoComplete="nickname"
        error={fieldError('displayName')}
      />

      <Input
        name="email"
        type="email"
        label={t('email')}
        required
        autoComplete="email"
        error={fieldError('email')}
      />

      <Input
        name="password"
        type="password"
        label={t('password')}
        required
        minLength={8}
        autoComplete="new-password"
        showPasswordLabel={t('showPassword')}
        hidePasswordLabel={t('hidePassword')}
        error={fieldError('password')}
      />

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {t('register')}
      </Button>

      <div className="text-sm">
        <Link href="/login" className="text-ud-blue hover:underline">
          {t('hasAccount')}
        </Link>
      </div>
    </form>
  );
}
