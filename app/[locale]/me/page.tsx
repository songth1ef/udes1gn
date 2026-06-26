import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { Link } from '@/lib/i18n/navigation';
import { Button, LogoutButton } from '@/components';

/**
 * 我的（还原 v1 的 👤 模块）。
 * v1 当年是空占位页；这里做用户中心：登录态展示资料 + 入口；未登录给登录引导。
 */
export default async function MePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations('me');
  const tAuth = await getTranslations('auth');
  const user = session?.user;

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-16 text-center">
        <span className="text-5xl">👤</span>
        <p className="text-foreground/60">{t('pleaseLogin')}</p>
        <div className="flex w-[80vw] max-w-[300px] flex-col gap-3 sm:w-[300px]">
          <Link href="/login">
            <Button variant="primary" fullWidth>
              {tAuth('login')}
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="default" fullWidth>
              {tAuth('register')}
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const isAdmin = user.role === 'ADMIN';
  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  const Entry = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className="flex items-center justify-between rounded-ud border border-foreground/10 px-4 py-3 text-sm text-foreground transition-colors hover:border-ud-blue hover:text-ud-blue"
    >
      <span>{label}</span>
      <span className="text-foreground/30">›</span>
    </Link>
  );

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      {/* 用户头部 */}
      <div className="flex items-center gap-4 rounded-ud border border-foreground/10 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ud-blue text-lg font-semibold text-white select-none">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{user.name ?? '—'}</span>
            {isAdmin && (
              <span className="shrink-0 rounded-full bg-ud-blue/10 px-2 py-0.5 text-xs text-ud-blue">
                ADMIN
              </span>
            )}
          </div>
          <div className="truncate text-sm text-foreground/55">{user.email}</div>
        </div>
      </div>

      {/* 入口 */}
      <div className="flex flex-col gap-2">
        <Entry href={`/user/${user.id}`} label={t('myProfile')} />
        <Entry href="/settings" label={t('settings')} />
        {isAdmin && <Entry href="/admin" label={t('admin')} />}
      </div>

      <div className="w-[200px]">
        <LogoutButton label={t('logout')} />
      </div>
    </section>
  );
}
