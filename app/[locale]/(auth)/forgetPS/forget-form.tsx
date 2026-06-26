'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { UdField, type UdFieldHandle } from '@/components/UdField';
import { UdToast, type UdToastHandle } from '@/components/UdToast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PWD_RE = /^[\w!@#$%^&*()_+={[\]:;"'<>?,./\\-]{6,32}$/;

/**
 * 忘记密码表单 —— 1:1 还原 v1：LOGO + 邮箱 +（验证码 + 倒计时）+ 新密码 + 确认 + 重设按钮。
 * 后端重置流程尚未实现（同 v1 也是 stub），提交后给提示。
 */
export function ForgetForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const emailRef = useRef<UdFieldHandle>(null);
  const pwdRef = useRef<UdFieldHandle>(null);
  const pwd2Ref = useRef<UdFieldHandle>(null);
  const toast = useRef<UdToastHandle>(null);
  const [pwd, setPwd] = useState('');

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
    if (!pwdRef.current?.valid()) return toast.current?.show('error', t('passwordRM'));
    if (!pwd2Ref.current?.valid()) return toast.current?.show('error', t('passwordTwoRM'));
    toast.current?.show('warning', t('forgotPending'));
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
            className="flex h-[38px] w-[80vw] max-w-[300px] select-none items-center justify-center rounded-ud border border-foreground bg-background text-[15px] text-foreground transition-colors hover:border-ud-blue hover:text-ud-blue sm:w-[300px]"
          >
            {t('resetAction')}
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
