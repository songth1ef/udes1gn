import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * locale 感知的导航原语（next-intl）。
 * 用这里导出的 Link / usePathname / useRouter，自动带上当前 locale 前缀
 * （/zh/proposals、/en/proposals），切语言时也复用同一逻辑。
 *
 * 全工程的内部跳转都应从这里 import，而不是 next/link / next/navigation，
 * 以保证 locale 前缀一致。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
