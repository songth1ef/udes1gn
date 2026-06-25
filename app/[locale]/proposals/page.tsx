import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Button, ProposalCard } from '@/components';
import { listProposals } from '@/lib/actions/proposal';
import { CategoryFilter } from './category-filter';

/**
 * 提案列表页（E4）。
 * - 数据：listProposals 已按票数降序（同票按时间新→旧），排除隐藏内容。
 * - 分类筛选：?category= 走 server 过滤；筛选项从「全部提案」的分类去重得出
 *   （筛选项要稳定，故先取全量算分类，再按当前分类过滤）。
 * - 响应式：标题 + 工具条在 sm 起横排；卡片 grid 1→2→3 列。
 * - 文案全走 i18n key。
 */
export default async function ProposalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { category } = await searchParams;

  const [tProposal, tCommon] = await Promise.all([
    getTranslations('proposal'),
    getTranslations('common'),
  ]);

  // 全量算可用分类（筛选项稳定），再按当前分类过滤展示。
  const all = await listProposals();
  const categories = Array.from(new Set(all.map((p) => p.category))).sort();
  const proposals = category
    ? all.filter((p) => p.category === category)
    : all;

  return (
    <div className="flex flex-col gap-6">
      {/* 标题 + 工具条 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {tProposal('listTitle')}
          </h1>
          <p className="text-sm text-foreground/50">
            {tProposal('sortByVotes')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              current={category}
              label={tProposal('filterByCategory')}
              allLabel={tCommon('all')}
            />
          )}
          <Link href="/proposals/new">
            <Button variant="primary">{tProposal('create')}</Button>
          </Link>
        </div>
      </div>

      {/* 列表 */}
      {proposals.length === 0 ? (
        <p className="rounded-ud border border-dashed border-foreground/15 px-4 py-16 text-center text-sm text-foreground/50">
          {tProposal('empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}
