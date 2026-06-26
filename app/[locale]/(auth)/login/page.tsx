import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from './login-form';

/**
 * 登录页（E7）。
 * 响应式壳：移动端表单约 80vw 竖排居中，PC 固定窄卡居中（移植 v1 登录页布局）。
 */
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { callbackUrl } = await searchParams;

  return (
    <section className="flex min-h-[75vh] w-full items-center justify-center py-8">
      <LoginForm callbackUrl={callbackUrl} />
    </section>
  );
}
