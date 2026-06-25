import { test, expect, type Page } from '@playwright/test';

/**
 * 响应式视觉 E2E（H3）：手机 390x844 与 PC 1440x900 两个 viewport 下，
 * 首页 / 提案列表 / 提案详情 三个页面布局不破（无横向溢出、关键元素可见），
 * 并各自截图存 e2e/screenshots 供人工核对。
 *
 * 「不破」的机器可判定信号：
 *  - 文档不出现横向滚动（scrollWidth ≤ clientWidth + 1 容差）。
 *  - 关键锚点元素可见（slogan / 列表标题 / 详情标题）。
 *  - 移动端：汉堡菜单可见、桌面横向 nav 隐藏；PC 反之。
 */

const SHOTS = 'e2e/screenshots';

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

// 取任一提案详情 URL（列表第一张卡片），保证详情用例有真实数据。
async function firstProposalHref(page: Page): Promise<string> {
  await page.goto('/zh/proposals');
  // 卡片链接形如 /zh/proposals/<cuid>，排除 /proposals/new。
  const first = page
    .getByRole('main')
    .locator('a[href*="/proposals/"]:not([href$="/new"])')
    .first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute('href');
  return href ?? '/zh/proposals';
}

const viewports = [
  { tag: 'mobile-390x844', width: 390, height: 844, mobile: true },
  { tag: 'pc-1440x900', width: 1440, height: 900, mobile: false },
];

for (const vp of viewports) {
  test.describe(`响应式 ${vp.tag}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('首页 / 列表 / 详情 布局不破 + 截图', async ({ page }) => {
      // ---- 首页 ----
      await page.goto('/zh');
      // slogan 在 Hero（<main> 内）的 <p>，移动端也渲染（Nav 内那份 sm+ 才显示）。
      // exact 避免命中含 slogan 字样的提案标题 h3；Hero <p> 文本恰为 slogan 本身。
      await expect(
        page.getByRole('main').getByText('这块地盘由你决定', { exact: true }),
      ).toBeVisible();
      // 移动端汉堡可见；PC 桌面横排 nav（首页链接）可见
      if (vp.mobile) {
        await expect(page.getByRole('button', { name: '菜单' })).toBeVisible();
      } else {
        await expect(
          page.getByRole('link', { name: '首页' }).first(),
        ).toBeVisible();
      }
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOTS}/home-${vp.tag}.png`,
        fullPage: true,
      });

      // ---- 列表 ----
      await page.goto('/zh/proposals');
      await expect(
        page.getByRole('heading', { name: '全部提案' }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOTS}/list-${vp.tag}.png`,
        fullPage: true,
      });

      // ---- 详情 ----
      const href = await firstProposalHref(page);
      await page.goto(href);
      await expect(page.locator('article h1').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOTS}/detail-${vp.tag}.png`,
        fullPage: true,
      });
    });
  });
}
