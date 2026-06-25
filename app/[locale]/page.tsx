import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Button, ProposalCard } from '@/components';
import { listProposals } from '@/lib/actions/proposal';

/**
 * 首页（E3）。
 * - Hero：slogan「这块地盘由你决定」+ 一句引导 + 提案入口（浏览 / 发起）。
 * - 最热提案：listProposals 已按票数降序，取前 3。
 * - 最新提案：按创建时间取前 3。
 *
 * 全部文案走 i18n key（common/home/proposal/nav），响应式：
 * hero 居中大留白；提案区 grid 1→2→3 列随断点。
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tCommon, tHome, tProposal] = await Promise.all([
    getTranslations('common'),
    getTranslations('home'),
    getTranslations('proposal'),
  ]);

  const all = await listProposals();
  const hottest = all.slice(0, 3); // 已按票数降序
  const latest = [...all]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-12 text-center sm:py-20">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {tCommon('appName')}
        </h1>
        <p className="text-xl text-foreground/80 sm:text-2xl">
          {tCommon('slogan')}
        </p>
        <p className="max-w-xl text-base text-foreground/60">
          {tHome('heroLead')}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link href="/proposals" className="w-full sm:w-auto">
            <Button variant="primary" fullWidth>
              {tHome('browseProposals')}
            </Button>
          </Link>
          <Link href="/proposals/new" className="w-full sm:w-auto">
            <Button variant="default" fullWidth>
              {tHome('startProposal')}
            </Button>
          </Link>
        </div>
      </section>

      {/* 最热提案 */}
      <ProposalSection
        title={tProposal('hottest')}
        viewAllLabel={tHome('viewAll')}
        emptyLabel={tProposal('empty')}
        proposals={hottest}
      />

      {/* 最新提案 */}
      <ProposalSection
        title={tProposal('latest')}
        viewAllLabel={tHome('viewAll')}
        emptyLabel={tProposal('empty')}
        proposals={latest}
      />
    </div>
  );
}

async function ProposalSection({
  title,
  viewAllLabel,
  emptyLabel,
  proposals,
}: {
  title: string;
  viewAllLabel: string;
  emptyLabel: string;
  proposals: Awaited<ReturnType<typeof listProposals>>;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        <Link
          href="/proposals"
          className="text-sm text-ud-blue hover:underline"
        >
          {viewAllLabel}
        </Link>
      </div>

      {proposals.length === 0 ? (
        <p className="rounded-ud border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </section>
  );
}
