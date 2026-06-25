'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { MessageBox } from '@/components';
import { type TranslationRow, upsertTranslation } from '@/lib/actions/i18n';

/**
 * TranslationEditor（client）—— 按 namespace 编辑文案。
 *
 * - namespace 切换：链接到 ?ns=xxx（server 重新取该组数据）。
 * - 每行 = 一个 key；每个启用语言一列。缺翻译（值为空）的输入框高亮红边
 *   并标 missing 徽章，对应 implementation.md §9.2「缺翻译高亮」。
 * - 改某格 → 失焦或点保存调 upsertTranslation；成功后 action 内
 *   revalidateTag('i18n') 使前台缓存失效；本地标该格已保存。
 *
 * 受控状态以 (key|locale) 为索引存草稿值，避免整表 refresh 丢输入。
 */
export function TranslationEditor({
  namespaces,
  activeNamespace,
  localeCodes,
  rows,
}: {
  namespaces: string[];
  activeNamespace: string;
  localeCodes: string[];
  rows: TranslationRow[];
}) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<'saved' | 'saveFailed' | null>(null);

  // 草稿值：`${key}__${locale}` → value
  const [draft, setDraft] = useState<Record<string, string>>({});
  const cellId = (key: string, locale: string) => `${key}__${locale}`;

  function valueOf(row: TranslationRow, locale: string): string {
    const id = cellId(row.key, locale);
    if (id in draft) return draft[id];
    return row.values[locale] ?? '';
  }

  function save(namespace: string, key: string, locale: string, value: string) {
    if (pending) return;
    setMsg(null);
    startTransition(async () => {
      const res = await upsertTranslation({
        namespace,
        key,
        localeCode: locale,
        value,
      });
      if (res.ok) {
        setMsg('saved');
        router.refresh();
      } else {
        setMsg('saveFailed');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('translationsSection')}</h2>

      {/* namespace 选择 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground/50">{t('namespaceLabel')}:</span>
        {namespaces.map((ns) => (
          <button
            key={ns}
            type="button"
            onClick={() => router.replace(`/admin/i18n?ns=${ns}`)}
            className={[
              'rounded-ud px-3 py-1.5 text-sm font-medium transition-colors',
              ns === activeNamespace
                ? 'bg-ud-blue/10 text-ud-blue'
                : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground',
            ].join(' ')}
          >
            {ns}
          </button>
        ))}
      </div>

      {msg && (
        <MessageBox tone={msg === 'saved' ? 'success' : 'error'}>
          {msg === 'saved' ? t('saved') : t('saveFailed')}
        </MessageBox>
      )}

      {/* 文案表 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/15 text-left text-xs text-foreground/50">
              <th className="px-2 py-2 font-medium">{t('keyCol')}</th>
              {localeCodes.map((lc) => (
                <th key={lc} className="px-2 py-2 font-medium">
                  {lc}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-foreground/5 align-top"
              >
                <td className="px-2 py-2 font-mono text-xs text-foreground/70">
                  {row.key}
                </td>
                {localeCodes.map((lc) => {
                  const v = valueOf(row, lc);
                  const missing = v.trim() === '';
                  return (
                    <td key={lc} className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-1">
                          <textarea
                            rows={1}
                            value={v}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                [cellId(row.key, lc)]: e.target.value,
                              }))
                            }
                            className={[
                              'w-full resize-y rounded-ud border bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors',
                              missing
                                ? 'border-ud-red/50 focus:border-ud-red'
                                : 'border-foreground/15 focus:border-ud-blue',
                            ].join(' ')}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {missing && (
                            <span className="text-xs font-medium text-ud-red">
                              {t('missingTag')}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              save(activeNamespace, row.key, lc, v)
                            }
                            className="text-xs text-ud-blue hover:underline disabled:opacity-50"
                          >
                            <SaveLabel />
                          </button>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 保存小标签，复用 common.save key。 */
function SaveLabel() {
  const t = useTranslations('common');
  return <>{t('save')}</>;
}
