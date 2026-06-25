import { redirect } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';

/**
 * 根路径重定向到默认 locale。
 * F1 接入 next-intl middleware 后可改为由 middleware 处理；
 * 此处保证 A 基建阶段无 middleware 时 `/` 也可访问。
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
