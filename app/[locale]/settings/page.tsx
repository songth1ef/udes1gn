import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from '@/lib/i18n/navigation';
import { LogoutButton } from '@/components';

/**
 * 设置（还原 v1 的 ⚙ 模块）。
 * v1 当年是空占位页；这里展示账号信息（只读）+ 语言提示 + 退出，改昵称/密码待实现。
 * 需登录，未登录跳登录页。
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) {
    redirect({ href: '/login?callbackUrl=/settings', locale });
  }
  const t = await getTranslations('settings');
  const user = session!.user;
  const isAdmin = user.role === 'ADMIN';

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between border-b border-foreground/10 py-3 text-sm last:border-0">
      <span className="text-foreground/55">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <div className="rounded-ud border border-foreground/10 px-4">
        <Row label={t('email')} value={user.email ?? '—'} />
        <Row label={t('displayName')} value={user.name ?? '—'} />
        <Row label={t('role')} value={isAdmin ? 'ADMIN' : 'USER'} />
        <Row label={t('language')} value={t('languageHint')} />
      </div>

      <p className="text-sm text-foreground/55">{t('comingSoon')}</p>

      <div className="w-[200px]">
        <LogoutButton label={t('logout')} />
      </div>
    </section>
  );
}
