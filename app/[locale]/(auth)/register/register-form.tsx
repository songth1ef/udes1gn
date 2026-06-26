'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { UdField, type UdFieldHandle } from '@/components/UdField';
import { UdToast, type UdToastHandle } from '@/components/UdToast';
import { registerUser } from '@/lib/actions/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[一-龥a-zA-Z0-9]{4,32}$/;
const PWD_RE = /^[\w!@#$%^&*()_+={[\]:;"'<>?,./\\-]{6,32}$/;

/**
 * 注册表单 —— 1:1 还原 v1：LOGO + 邮箱 +（验证码 + 获取验证码倒计时）+ 用户名
 * + 密码（👀）+ 确认密码（👀）+ 注册按钮。
 * 验证码 UI 1:1 还原 v1（带 60s 倒计时），但邮件验证码服务尚未接入，故不强制校验。
 * 真实注册走 registerUser（email / displayName=用户名 / password）；成功跳登录页。
 */
export function RegisterForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const emailRef = useRef<UdFieldHandle>(null);
  const usernameRef = useRef<UdFieldHandle>(null);
  const pwdRef = useRef<UdFieldHandle>(null);
  const pwd2Ref = useRef<UdFieldHandle>(null);
  const toast = useRef<UdToastHandle>(null);
  const [pending, start] = useTransition();
  const [pwd, setPwd] = useState('');
  const [done, setDone] = useState(false);

  // 注册成功后稳定跳转登录页（window.location 兜底，必定跳转；让用户先看到成功 toast）
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => {
      window.location.href = `/${locale}/login`;
    }, 1000);
    return () => clearTimeout(id);
  }, [done, locale]);

  // 验证码倒计时（v1 还原）
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);
  const getCaptcha = () => {
    if (!emailRef.current?.valid()) {
      toast.current?.show('error', t('emailRM'));
      return;
    }
    if (countdown > 0) return;
    setCountdown(60);
    toast.current?.show('info', t('captchaNotice'));
  };

  const submit = () => {
    if (!emailRef.current?.valid()) return toast.current?.show('error', t('emailRM'));
    if (!usernameRef.current?.valid()) return toast.current?.show('error', t('usernameRM'));
    if (!pwdRef.current?.valid()) return toast.current?.show('error', t('passwordRM'));
    if (!pwd2Ref.current?.valid()) return toast.current?.show('error', t('passwordTwoRM'));

    const fd = new FormData();
    fd.set('email', emailRef.current.value());
    fd.set('displayName', usernameRef.current.value());
    fd.set('password', pwdRef.current.value());
    start(async () => {
      const res = await registerUser(undefined, fd);
      if (res.ok) {
        toast.current?.show('success', t('registerSuccess'));
        setDone(true);
      } else if (res.fieldErrors?.email === 'email.taken') {
        toast.current?.show('error', t('emailTaken'));
      } else {
        toast.current?.show('error', t('emailRM'));
      }
    });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
        <Link
          href="/"
          className="select-none text-[32px] font-bold tracking-tight text-foreground sm:mt-2"
        >
          {tCommon('appName')}
        </Link>

        <div className="flex flex-col items-center gap-3">
          <UdField
            ref={emailRef}
            name="email"
            autoComplete="email"
            maxLength={64}
            required
            placeholder={t('emailPH')}
            rule={{ regExp: EMAIL_RE, message: t('emailRM') }}
          />

          {/* 验证码 + 获取验证码（v1 还原） */}
          <div className="flex w-[80vw] max-w-[300px] items-start justify-between gap-2 sm:w-[300px]">
            <UdField
              name="captcha"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t('captchaPH')}
              widthClass="flex-1"
            />
            <button
              type="button"
              onClick={getCaptcha}
              disabled={countdown > 0}
              className="flex h-[38px] w-[110px] shrink-0 select-none items-center justify-center whitespace-nowrap rounded-ud border border-foreground bg-background px-2 text-[13px] text-foreground transition-colors hover:border-ud-blue hover:text-ud-blue disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}${t('second')}` : t('getCaptcha')}
            </button>
          </div>

          <UdField
            ref={usernameRef}
            name="username"
            autoComplete="username"
            maxLength={32}
            required
            placeholder={t('usernamePH')}
            rule={{ regExp: USERNAME_RE, message: t('usernameRM') }}
          />
          <UdField
            ref={pwdRef}
            name="password"
            showEye
            autoComplete="new-password"
            maxLength={32}
            required
            placeholder={t('passwordPH')}
            rule={{ regExp: PWD_RE, message: t('passwordRM') }}
            value={pwd}
            onChange={setPwd}
          />
          <UdField
            ref={pwd2Ref}
            name="passwordConfirm"
            showEye
            autoComplete="new-password"
            maxLength={32}
            required
            placeholder={t('passwordTwoPH')}
            rule={{ matchValue: pwd, message: t('passwordTwoRM') }}
          />

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex h-[38px] w-[80vw] max-w-[300px] select-none items-center justify-center rounded-ud border border-foreground bg-background text-[15px] text-foreground transition-colors hover:border-ud-blue hover:text-ud-blue disabled:opacity-60 sm:w-[300px]"
          >
            {t('registerAction')}
          </button>

          <div className="flex w-[80vw] max-w-[300px] items-center justify-start text-sm sm:w-[300px]">
            <Link href="/login" className="text-ud-link hover:underline">
              👉 {t('login')}
            </Link>
          </div>
        </div>
      </div>
      <UdToast ref={toast} />
    </>
  );
}
