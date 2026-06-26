import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getLocales } from '@/lib/i18n/messages';
import { NavShell, type NavLink, type NavTab } from './NavShell';

/**
 * Nav（server）—— 顶部导航的数据装配层。
 * 取数据（session、DB 启用语言、i18n 文案）→ 组装 → 交给 NavShell（client）渲染。
 *
 * - 链接：首页 / 提案 / 发起提案；ADMIN 额外多一条「管理后台」。
 * - 登录态：未登录给 登录/注册 入口；已登录给 昵称 + 退出。
 * - 语言：DB Locale 表（enabled）；切换在 LanguageSwitcher 内复用 locale 路由。
 * - 全部文案走 i18n key（nav/auth/common namespace），零硬编码。
 */
export async function Nav() {
  const [session, locales, tNav, tAuth, tCommon] = await Promise.all([
    auth(),
    getLocales(),
    getTranslations('nav'),
    getTranslations('auth'),
    getTranslations('common'),
  ]);

  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN';

  const links: NavLink[] = [
    { href: '/', label: tNav('home') },
    { href: '/proposals', label: tNav('proposals') },
    { href: '/proposals/new', label: tNav('newProposal') },
    ...(isAdmin ? [{ href: '/admin', label: tNav('admin') }] : []),
  ];

  // 移动底部 tab（v1 招牌）：首页 / 提案 / 发起 / 我的（未登录指向登录页）
  const mineHref = user?.id ? `/user/${user.id}` : '/login';
  const tabs: NavTab[] = [
    { href: '/', label: tNav('home'), icon: '🏠' },
    { href: '/proposals', label: tNav('proposals'), icon: '📋' },
    { href: '/proposals/new', label: tNav('newProposal'), icon: '➕' },
    { href: mineHref, label: tNav('mine'), icon: '👤' },
  ];

  return (
    <NavShell
      links={links}
      tabs={tabs}
      locales={locales.map((l) => ({ code: l.code, name: l.name }))}
      labels={{
        appName: tCommon('appName'),
        slogan: tCommon('slogan'),
        language: tNav('language'),
        login: tAuth('login'),
        register: tAuth('register'),
        logout: tAuth('logout'),
        menu: tNav('menu'),
      }}
      user={user ? { name: user.name ?? user.email ?? '' } : null}
    />
  );
}
