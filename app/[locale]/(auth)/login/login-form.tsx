'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Button, Input, MessageBox } from '@/components';
import { loginUser, type ActionResult } from '@/lib/actions/auth';

/**
 * 登录表单（E7）—— 移植 v1 登录页视觉，tailwind + 设计系统组件重写。
 * 用 Input / Button / MessageBox；错误用 i18n key 渲染（invalidCredentials）。
 * 底部带「注册」「忘记密码」入口。响应式由父级页面壳控制（移动 80vw / PC 居中）。
 */
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState<
    ActionResult | undefined,
    FormData
  >(loginUser, undefined);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t('loginTitle')}</h1>

      {state && !state.ok && (
        <MessageBox tone="error">{t('invalidCredentials')}</MessageBox>
      )}

      <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/'} />

      <Input
        name="email"
        type="email"
        label={t('email')}
        required
        autoComplete="email"
      />

      <Input
        name="password"
        type="password"
        label={t('password')}
        required
        autoComplete="current-password"
        showPasswordLabel={t('showPassword')}
        hidePasswordLabel={t('hidePassword')}
      />

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {t('login')}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/register" className="text-ud-blue hover:underline">
          {t('noAccount')}
        </Link>
        <Link
          href="/forgetPS"
          className="text-foreground/50 hover:text-ud-blue"
        >
          {t('forgotPassword')}
        </Link>
      </div>
    </form>
  );
}
