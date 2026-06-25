import { test, expect } from '@playwright/test';

/**
 * 主链路 E2E（H2）：注册 → 登录 → 发提案 → 列表看到 → 进详情 → 投票 → 切中英 → 登出。
 *
 * 文案断言用 seed 里的稳定中文/英文字面量（appName=友定/UDES1GN，
 * slogan=这块地盘由你决定，login=登录，register=注册...）。
 * 表单字段通过 <label>（getByLabel）定位；提交按钮限定在 <main> 内，
 * 避免与 Nav 里同名的「登录/注册」入口冲突（strict mode）。默认 locale=zh。
 */

const stamp = Date.now();
const email = `e2e_${stamp}@udes1gn.test`;
const password = 'pw_e2e_12345';
// 昵称受 Nav 截断（max-w-[12ch]）影响，控制长度便于断言可见。
const displayName = `E2E${String(stamp).slice(-6)}`;
const proposalTitle = `E2E 提案 ${stamp}`;
const proposalBody = `这是一条由 Playwright E2E 自动创建的提案正文 ${stamp}。`;
const proposalCategory = '测试';

test('注册→登录→发提案→列表→详情→投票→切语言→登出', async ({ page }) => {
  // ---------- 注册 ----------
  await page.goto('/zh/register');
  const main = page.getByRole('main');
  await expect(page.getByRole('heading', { name: '注册友定' })).toBeVisible();

  await page.getByLabel('昵称').fill(displayName);
  await page.getByLabel('邮箱').fill(email);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await main.getByRole('button', { name: '注册' }).click();

  await expect(page.getByText('注册成功，现在可以登录了')).toBeVisible();

  // ---------- 登录 ----------
  await page.goto('/zh/login');
  await expect(page.getByRole('heading', { name: '登录友定' })).toBeVisible();
  await page.getByLabel('邮箱').fill(email);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await main.getByRole('button', { name: '登录' }).click();

  // 登录后 Nav 出现用户昵称（已登录态）
  await expect(page.getByText(displayName).first()).toBeVisible({
    timeout: 15_000,
  });

  // ---------- 发提案 ----------
  await page.goto('/zh/proposals/new');
  await page.getByLabel('标题').fill(proposalTitle);
  await page.getByLabel('分类').fill(proposalCategory);
  await page.getByLabel('描述').fill(proposalBody);
  await main.getByRole('button', { name: '发起提案' }).click();

  // 成功后跳详情页：标题可见、URL 含 /proposals/<id>
  await expect(
    page.getByRole('heading', { name: proposalTitle }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/proposals\/[^/]+$/);
  const detailId = page.url().split('/proposals/')[1];

  // ---------- 列表看到 ----------
  await page.goto('/zh/proposals');
  await expect(page.getByRole('heading', { name: '全部提案' })).toBeVisible();
  const cardLink = page.getByRole('link', { name: new RegExp(proposalTitle) });
  await expect(cardLink).toBeVisible();

  // ---------- 进详情 ----------
  await cardLink.click();
  await expect(
    page.getByRole('heading', { name: proposalTitle }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(detailId));

  // ---------- 投票 ----------
  const voteBtn = page.getByRole('button', { name: /赞成/ });
  await expect(voteBtn).toBeVisible();
  await expect(voteBtn).toHaveAttribute('aria-pressed', 'false');
  await voteBtn.click();
  await expect(page.getByRole('button', { name: /已赞成/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // ---------- 切换中→英 ----------
  await page.getByRole('combobox').selectOption('en');
  await expect(page).toHaveURL(/\/en\//);
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  // 详情页投票按钮英文：Upvoted（已投态保留）
  await expect(page.getByRole('button', { name: /Upvoted/ })).toBeVisible();

  // ---------- 切回英→中 ----------
  await page.getByRole('combobox').selectOption('zh');
  await expect(page).toHaveURL(/\/zh\//);
  await expect(page.getByRole('link', { name: '首页' }).first()).toBeVisible();

  // ---------- 登出 ----------
  await page.getByRole('button', { name: '退出登录' }).click();
  // 登出后 Nav 回到未登录态：出现「登录」入口
  await expect(page.getByRole('link', { name: '登录' }).first()).toBeVisible({
    timeout: 15_000,
  });
});
