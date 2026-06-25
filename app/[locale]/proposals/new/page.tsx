import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from '@/lib/i18n/navigation';
import { NewProposalForm } from './new-proposal-form';

/**
 * 发布提案页（E6）。
 * 未登录直接跳登录页（带 callbackUrl 回流）；登录后渲染表单。
 * 二次校验仍在 createProposal action 内（不靠前端），此跳转仅为体验。
 */
export default async function NewProposalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect({ href: '/login?callbackUrl=/proposals/new', locale });
  }

  const t = await getTranslations('proposal');

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t('newTitle')}</h1>
        <p className="text-sm text-foreground/60">{t('newIntro')}</p>
      </div>
      <NewProposalForm />
    </div>
  );
}
