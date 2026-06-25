'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-guard';
import { I18N_CACHE_TAG } from '@/lib/i18n/messages';

/**
 * i18n 管理 Server Action（G4 / F4 / F5，仅 ADMIN）。
 *
 * 职责（implementation.md §9.2 后台）：
 * - 语言管理：增删 / 启停 / 设默认 / 排序（Locale 表）。
 * - 文案管理：按 namespace 编辑 Translation；缺翻译由前端高亮。
 * - 任一写操作后 revalidateTag('i18n')：让 lib/i18n/messages.ts 的缓存失效，
 *   前台无需重启即生效（§9.2 缓存失效）。
 *
 * 返回稳定英文 error code，前端按 key 映射 i18n 文案，不在此拼可见文案。
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function toErr(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  throw err;
}

function bumpI18n() {
  revalidateTag(I18N_CACHE_TAG);
}

// ── 读取（后台展示用，含 disabled 语言；与前台 getLocales 区分）─────
export type AdminLocale = {
  code: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
};

/** 全部语言（含未启用），按 sortOrder 升序，供后台语言管理列表。 */
export async function listAllLocales(): Promise<AdminLocale[]> {
  await requireAdmin();
  return prisma.locale.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      code: true,
      name: true,
      enabled: true,
      isDefault: true,
      sortOrder: true,
    },
  });
}

export type TranslationRow = {
  namespace: string;
  key: string;
  /** localeCode → value（缺某语言即该语言未翻译，前端高亮）。 */
  values: Record<string, string>;
};

/**
 * 取某 namespace 下全部 key 在各语言的取值，按 key 升序。
 * 不传 namespace 则返回所有 namespace 名称列表用的去重数据另由 listNamespaces 提供。
 */
export async function listTranslations(
  namespace: string,
): Promise<TranslationRow[]> {
  await requireAdmin();
  const rows = await prisma.translation.findMany({
    where: { namespace },
    select: { key: true, localeCode: true, value: true },
    orderBy: { key: 'asc' },
  });
  const map = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const v = map.get(r.key) ?? {};
    v[r.localeCode] = r.value;
    map.set(r.key, v);
  }
  return Array.from(map.entries())
    .map(([key, values]) => ({ namespace, key, values }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** 全部 namespace 名称（去重，升序），供后台分组导航。 */
export async function listNamespaces(): Promise<string[]> {
  await requireAdmin();
  const rows = await prisma.translation.findMany({
    distinct: ['namespace'],
    select: { namespace: true },
    orderBy: { namespace: 'asc' },
  });
  return rows.map((r) => r.namespace);
}

// ── 语言：新增 / 编辑 ─────────────────────────────────────
const localeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(35)
    // BCP-47 粗校验：字母/数字/连字符
    .regex(/^[A-Za-z0-9-]+$/),
  name: z.string().trim().min(1).max(60),
  enabled: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

/** 新增语言（code 唯一）。新增不直接设默认，避免误改兜底。 */
export async function createLocale(input: {
  code: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }
  const parsed = localeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };

  const exists = await prisma.locale.findUnique({
    where: { code: parsed.data.code },
    select: { code: true },
  });
  if (exists) return { ok: false, error: 'LOCALE_EXISTS' };

  await prisma.locale.create({ data: { ...parsed.data, isDefault: false } });
  bumpI18n();
  return { ok: true };
}

/** 编辑语言显示名 / 排序。 */
export async function updateLocale(input: {
  code: string;
  name: string;
  sortOrder: number;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }
  const parsed = z
    .object({
      code: z.string().min(1),
      name: z.string().trim().min(1).max(60),
      sortOrder: z.coerce.number().int().min(0).max(9999),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };

  const found = await prisma.locale.findUnique({
    where: { code: parsed.data.code },
    select: { code: true },
  });
  if (!found) return { ok: false, error: 'NOT_FOUND' };

  await prisma.locale.update({
    where: { code: parsed.data.code },
    data: { name: parsed.data.name, sortOrder: parsed.data.sortOrder },
  });
  bumpI18n();
  return { ok: true };
}

/** 启停语言（enabled）。不允许停用默认语言（否则前台无兜底）。 */
export async function toggleLocale(
  code: string,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }
  const found = await prisma.locale.findUnique({
    where: { code },
    select: { isDefault: true },
  });
  if (!found) return { ok: false, error: 'NOT_FOUND' };
  if (!enabled && found.isDefault) {
    return { ok: false, error: 'CANNOT_DISABLE_DEFAULT' };
  }
  await prisma.locale.update({ where: { code }, data: { enabled } });
  bumpI18n();
  return { ok: true };
}

/**
 * 设为默认（兜底）语言：清掉旧默认、置新默认，并确保其 enabled。
 * 事务保证「同一时刻只有一个默认」。
 */
export async function setDefaultLocale(code: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }
  const found = await prisma.locale.findUnique({
    where: { code },
    select: { code: true },
  });
  if (!found) return { ok: false, error: 'NOT_FOUND' };

  await prisma.$transaction([
    prisma.locale.updateMany({
      where: { isDefault: true, NOT: { code } },
      data: { isDefault: false },
    }),
    prisma.locale.update({
      where: { code },
      data: { isDefault: true, enabled: true },
    }),
  ]);
  bumpI18n();
  return { ok: true };
}

/**
 * 删除语言：连带删除该语言全部 Translation。
 * 不允许删默认语言（兜底安全）。
 */
export async function deleteLocale(code: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }
  const found = await prisma.locale.findUnique({
    where: { code },
    select: { isDefault: true },
  });
  if (!found) return { ok: false, error: 'NOT_FOUND' };
  if (found.isDefault) return { ok: false, error: 'CANNOT_DELETE_DEFAULT' };

  await prisma.$transaction([
    prisma.translation.deleteMany({ where: { localeCode: code } }),
    prisma.locale.delete({ where: { code } }),
  ]);
  bumpI18n();
  return { ok: true };
}

// ── 文案：upsert 单条 ─────────────────────────────────────
const translationSchema = z.object({
  namespace: z.string().trim().min(1).max(60),
  key: z.string().trim().min(1).max(120),
  localeCode: z.string().trim().min(1).max(35),
  value: z.string().max(5000),
});

/**
 * 写入 / 更新某 (namespace,key,localeCode) 的文案值。
 * value 允许空字符串（视为"清空翻译"，前端会高亮为缺翻译）。
 * 校验：localeCode 必须是已存在的语言。
 */
export async function upsertTranslation(input: {
  namespace: string;
  key: string;
  localeCode: string;
  value: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return toErr(err);
  }
  const parsed = translationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };

  const locale = await prisma.locale.findUnique({
    where: { code: parsed.data.localeCode },
    select: { code: true },
  });
  if (!locale) return { ok: false, error: 'LOCALE_NOT_FOUND' };

  await prisma.translation.upsert({
    where: {
      namespace_key_localeCode: {
        namespace: parsed.data.namespace,
        key: parsed.data.key,
        localeCode: parsed.data.localeCode,
      },
    },
    update: { value: parsed.data.value },
    create: parsed.data,
  });
  bumpI18n();
  return { ok: true };
}
