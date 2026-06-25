'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Button, Input, MessageBox } from '@/components';
import {
  type AdminLocale,
  createLocale,
  toggleLocale,
  setDefaultLocale,
  deleteLocale,
} from '@/lib/actions/i18n';

/**
 * LocaleManager（client）—— 语言增删 / 启停 / 设默认。
 * 全量语言（含未启用）由父级 server 传入；任一写动作成功后 router.refresh
 * 拉取最新列表，并因 action 内 revalidateTag('i18n') 使前台文案缓存失效。
 *
 * 约束（与 lib/actions/i18n.ts 对齐）：
 * - 默认语言不可停用 / 删除（按钮禁用 + action 二次拒绝）。
 * - 新增语言 code 唯一、BCP-47 字母数字连字符。
 */
export function LocaleManager({ locales }: { locales: AdminLocale[] }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; key: string } | null>(
    null,
  );

  // 新增表单
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const errorKey = (err: string) => {
    switch (err) {
      case 'LOCALE_EXISTS':
        return 'localeExists';
      case 'CANNOT_DISABLE_DEFAULT':
        return 'cannotDisableDefault';
      case 'CANNOT_DELETE_DEFAULT':
        return 'cannotDeleteDefault';
      default:
        return 'actionFailed';
    }
  };

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    if (pending) return;
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMsg({ tone: 'success', key: 'saved' });
        onOk?.();
        router.refresh();
      } else {
        setMsg({ tone: 'error', key: errorKey(res.error ?? '') });
      }
    });
  }

  function onAdd() {
    run(
      () =>
        createLocale({
          code: code.trim(),
          name: name.trim(),
          enabled: true,
          sortOrder: Number(sortOrder) || 0,
        }),
      () => {
        setCode('');
        setName('');
        setSortOrder('0');
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('languagesSection')}</h2>

      {msg && (
        <MessageBox tone={msg.tone}>
          {msg.tone === 'success' ? t('saved') : t(msg.key)}
        </MessageBox>
      )}

      <ul className="flex flex-col gap-2">
        {locales.map((l) => (
          <li
            key={l.code}
            className="flex flex-col gap-2 rounded-ud border border-foreground/10 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-foreground/60">
                {l.code}
              </span>
              <span className="font-medium">{l.name}</span>
              {l.isDefault && (
                <span className="inline-flex items-center rounded-full border border-ud-blue/30 bg-ud-blue/10 px-2 py-0.5 text-xs font-medium text-ud-blue">
                  {t('isDefaultTag')}
                </span>
              )}
              {!l.enabled && (
                <span className="inline-flex items-center rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/50">
                  {t('disable')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                disabled={pending || l.isDefault}
                onClick={() => run(() => toggleLocale(l.code, !l.enabled))}
              >
                {l.enabled ? t('disable') : t('enable')}
              </Button>
              <Button
                variant="default"
                disabled={pending || l.isDefault}
                onClick={() => run(() => setDefaultLocale(l.code))}
              >
                {t('setDefault')}
              </Button>
              <Button
                variant="danger"
                disabled={pending || l.isDefault}
                onClick={() => {
                  if (window.confirm(t('confirmDelete'))) {
                    run(() => deleteLocale(l.code));
                  }
                }}
              >
                {t('deleteLabel')}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* 新增语言 */}
      <div className="flex flex-col gap-3 rounded-ud border border-dashed border-foreground/15 p-4">
        <h3 className="text-sm font-medium text-foreground/70">
          {t('addLanguage')}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label={t('localeCode')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('codePlaceholder')}
          />
          <Input
            label={t('localeName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
          />
          <Input
            label={t('localeSort')}
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div>
          <Button
            variant="primary"
            disabled={pending || !code.trim() || !name.trim()}
            onClick={onAdd}
          >
            {t('addLanguage')}
          </Button>
        </div>
      </div>
    </div>
  );
}
