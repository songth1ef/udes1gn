import { setRequestLocale } from 'next-intl/server';
import { ForgetForm } from './forget-form';

/**
 * 忘记密码页（E7）。
 * 响应式壳：移动端约 80vw 竖排居中，PC 固定窄卡居中（与 login/register 一致）。
 */
export default async function ForgetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center py-8">
      <div className="w-[80vw] max-w-sm">
        <ForgetForm />
      </div>
    </section>
  );
}
