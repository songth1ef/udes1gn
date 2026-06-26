'use client';

import { useRef, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { UdField, type UdFieldHandle } from '@/components/UdField';
import { UdToast, type UdToastHandle } from '@/components/UdToast';
import { loginUser } from '@/lib/actions/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PWD_RE = /^[\w!@#$%^&*()_+={[\]:;"'<>?,./\\-]{6,32}$/;

/**
 * 登录表单 —— 1:1 还原 v1：LOGO 友定 + 邮箱/密码（👀眼睛）+ 白色描边登录按钮
 * + 「👉注册 / 🤔忘记密码」emoji 蓝链；错误用顶部 emoji toast。
 * 接真实 loginUser（成功 signIn 重定向，失败 toast）。
 */
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const emailRef = useRef<UdFieldHandle>(null);
  const pwdRef = useRef<UdFieldHandle>(null);
  const toast = useRef<UdToastHandle>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!emailRef.current?.valid()) {
      toast.current?.show('error', t('emailRM'));
      return;
    }
    if (!pwdRef.current?.valid()) {
      toast.current?.show('error', t('passwordRM'));
      return;
    }
    const fd = new FormData();
    fd.set('email', emailRef.current.value());
    fd.set('password', pwdRef.current.value());
    fd.set('callbackUrl', callbackUrl ?? '/');
    start(async () => {
      const res = await loginUser(undefined, fd);
      if (res && !res.ok) toast.current?.show('error', t('invalidCredentials'));
    });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
        <Link
          href="/"
          className="select-none text-[32px] font-bold tracking-tight text-foreground"
        >
          {tCommon('appName')}
        </Link>

        <div className="flex flex-col items-center gap-3">
          <UdField
            ref={emailRef}
            name="email"
            type="text"
            autoComplete="username"
            maxLength={64}
            required
            placeholder={t('emailPH')}
            rule={{ regExp: EMAIL_RE, message: t('emailRM') }}
          />
          <UdField
            ref={pwdRef}
            name="password"
            showEye
            autoComplete="current-password"
            maxLength={32}
            required
            placeholder={t('passwordPH')}
            rule={{ regExp: PWD_RE, message: t('passwordRM') }}
          />

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex h-[38px] w-[80vw] max-w-[300px] select-none items-center justify-center rounded-ud border border-foreground bg-background text-[15px] text-foreground transition-colors hover:border-ud-blue hover:text-ud-blue disabled:opacity-60 sm:w-[300px]"
          >
            {t('loginAction')}
          </button>

          <div className="flex w-[80vw] max-w-[300px] items-center justify-between text-sm sm:w-[300px]">
            <Link href="/register" className="text-ud-link hover:underline">
              👉 {t('registerLink')}
            </Link>
            <Link href="/forgetPS" className="text-ud-link hover:underline">
              🤔 {t('forgetLink')}
            </Link>
          </div>
        </div>
      </div>
      <UdToast ref={toast} />
    </>
  );
}
