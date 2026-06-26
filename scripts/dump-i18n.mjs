// 从 DB 导出全部界面文案为静态 JSON（lib/i18n/_static-messages.json）。
//
// 为什么需要：next-intl 的 getRequestConfig 里做「每请求查 DB 加载文案」会在
// 生产模式触发 Next 的自代理递归（详见 docs/dev-process/deployment-log.md），
// 故改为构建期把 DB 文案落成静态 JSON，运行时直接读，零 per-request DB。
//
// 用法：i18n 后台改完文案后，跑 `node scripts/dump-i18n.mjs` 再 `npm run build`。
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const p = new PrismaClient();
const locales = await p.locale.findMany({ orderBy: { sortOrder: 'asc' } });
const trs = await p.translation.findMany();

const byLocale = {};
for (const t of trs) {
  (byLocale[t.localeCode] ??= {});
  (byLocale[t.localeCode][t.namespace] ??= {})[t.key] = t.value;
}

const out = {
  locales: locales.map((l) => ({
    code: l.code,
    name: l.name,
    isDefault: l.isDefault,
    sortOrder: l.sortOrder,
    enabled: l.enabled,
  })),
  messages: byLocale,
};

writeFileSync(
  new URL('../lib/i18n/_static-messages.json', import.meta.url),
  JSON.stringify(out),
);
console.log(`dumped ${out.locales.length} locales, ${trs.length} translations`);
await p.$disconnect();
