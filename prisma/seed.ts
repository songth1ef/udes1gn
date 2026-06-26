/**
 * UDES1GN 友定 — 数据库 seed
 * 幂等：可重复运行（用 upsert / 先清后插）。
 * 内容：① admin 用户；② Locale zh(默认)/en；③ UI 文案 Translation（中英）；④ 5 条示例提案。
 */
import { PrismaClient, ProposalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── ② Locale ─────────────────────────────────────────────
const LOCALES = [
  { code: 'zh', name: '中文', enabled: true, isDefault: true, sortOrder: 0 },
  { code: 'en', name: 'English', enabled: true, isDefault: false, sortOrder: 1 },
];

// ── ③ UI 文案（namespace.key → { zh, en }）────────────────
// 所有用户可见界面文案的兜底 seed；后续以 DB 为准、后台可编辑。
const TRANSLATIONS: Record<string, Record<string, { zh: string; en: string }>> = {
  common: {
    appName: { zh: '友定', en: 'UDES1GN' },
    slogan: { zh: '这块地盘由你决定', en: 'This turf is yours to decide' },
    submit: { zh: '提交', en: 'Submit' },
    cancel: { zh: '取消', en: 'Cancel' },
    save: { zh: '保存', en: 'Save' },
    delete: { zh: '删除', en: 'Delete' },
    edit: { zh: '编辑', en: 'Edit' },
    confirm: { zh: '确认', en: 'Confirm' },
    loading: { zh: '加载中…', en: 'Loading…' },
    empty: { zh: '暂无内容', en: 'Nothing here yet' },
    back: { zh: '返回', en: 'Back' },
    search: { zh: '搜索', en: 'Search' },
    all: { zh: '全部', en: 'All' },
    posting: { zh: '提交中…', en: 'Posting…' },
    somethingWrong: { zh: '出错了，请稍后再试', en: 'Something went wrong, please try again' },
  },
  nav: {
    home: { zh: '首页', en: 'Home' },
    proposals: { zh: '提案', en: 'Proposals' },
    newProposal: { zh: '发起提案', en: 'New proposal' },
    admin: { zh: '管理后台', en: 'Admin' },
    language: { zh: '语言', en: 'Language' },
    menu: { zh: '菜单', en: 'Menu' },
    mine: { zh: '我的', en: 'Me' },
    search: { zh: '搜索', en: 'Search' },
    messages: { zh: '消息', en: 'Messages' },
    settings: { zh: '设置', en: 'Settings' },
  },
  auth: {
    login: { zh: '登录', en: 'Log in' },
    logout: { zh: '退出登录', en: 'Log out' },
    register: { zh: '注册', en: 'Sign up' },
    email: { zh: '邮箱', en: 'Email' },
    password: { zh: '密码', en: 'Password' },
    displayName: { zh: '昵称', en: 'Display name' },
    // v1 还原：占位符 / 校验提示 / emoji 链接 / 验证码
    loginAction: { zh: '登 录', en: 'Log in' },
    registerAction: { zh: '注 册', en: 'Sign up' },
    resetAction: { zh: '重新设置密码', en: 'Reset password' },
    emailPH: { zh: '请输入您的邮箱', en: 'Enter your email' },
    emailRM: { zh: '请输入正确的邮箱', en: 'Enter a valid email' },
    usernamePH: { zh: '请输入您的用户名', en: 'Enter your username' },
    usernameRM: { zh: '用户名 4-32 位', en: 'Username 4-32 chars' },
    passwordPH: { zh: '请输入您的密码', en: 'Enter your password' },
    passwordRM: { zh: '密码 6-32 位', en: 'Password 6-32 chars' },
    passwordTwoPH: { zh: '请再次输入密码', en: 'Re-enter your password' },
    passwordTwoRM: { zh: '两次密码不一致', en: 'Passwords do not match' },
    captchaPH: { zh: '请输入验证码', en: 'Enter the code' },
    captchaRM: { zh: '验证码为 6 位', en: 'Code must be 6 chars' },
    getCaptcha: { zh: '获取验证码', en: 'Get code' },
    second: { zh: '秒', en: 's' },
    registerLink: { zh: '注册', en: 'Sign up' },
    forgetLink: { zh: '忘记密码', en: 'Forgot password' },
    captchaNotice: { zh: '验证码功能待接入邮件服务', en: 'Email code service not connected yet' },
    loginTitle: { zh: '登录友定', en: 'Log in to UDES1GN' },
    registerTitle: { zh: '注册友定', en: 'Create your account' },
    noAccount: { zh: '还没有账号？', en: "Don't have an account?" },
    hasAccount: { zh: '已有账号？', en: 'Already have an account?' },
    invalidCredentials: { zh: '邮箱或密码错误', en: 'Invalid email or password' },
    showPassword: { zh: '显示密码', en: 'Show password' },
    hidePassword: { zh: '隐藏密码', en: 'Hide password' },
    forgotPassword: { zh: '忘记密码？', en: 'Forgot password?' },
    registerSuccess: { zh: '注册成功，现在可以登录了', en: 'Account created. You can log in now.' },
    goLogin: { zh: '去登录', en: 'Go to log in' },
    emailRequired: { zh: '请输入有效邮箱', en: 'Enter a valid email' },
    passwordTooShort: { zh: '密码至少 8 位', en: 'Password must be at least 8 characters' },
    displayNameRequired: { zh: '请填写昵称', en: 'Display name is required' },
    emailTaken: { zh: '该邮箱已被注册', en: 'This email is already registered' },
    forgotTitle: { zh: '找回密码', en: 'Reset your password' },
    forgotIntro: {
      zh: '输入注册邮箱，我们将发送重置链接（初始版暂未开放，敬请期待）。',
      en: 'Enter your email and we will send a reset link (not yet available in this early version).',
    },
    forgotSubmit: { zh: '发送重置链接', en: 'Send reset link' },
    forgotPending: {
      zh: '密码重置功能尚在开发中，暂时请联系管理员。',
      en: 'Password reset is still under development. Please contact an admin for now.',
    },
    backToLogin: { zh: '返回登录', en: 'Back to log in' },
  },
  proposal: {
    title: { zh: '标题', en: 'Title' },
    body: { zh: '描述', en: 'Description' },
    category: { zh: '分类', en: 'Category' },
    status: { zh: '状态', en: 'Status' },
    create: { zh: '发起提案', en: 'Create proposal' },
    listTitle: { zh: '全部提案', en: 'All proposals' },
    sortByVotes: { zh: '按赞成数排序', en: 'Sorted by votes' },
    author: { zh: '发起人', en: 'Author' },
    statusCollecting: { zh: '收集中', en: 'Collecting' },
    statusAdopted: { zh: '已采纳', en: 'Adopted' },
    statusInProgress: { zh: '开发中', en: 'In progress' },
    statusShipped: { zh: '已上线', en: 'Shipped' },
    statusRejected: { zh: '已否决', en: 'Rejected' },
    report: { zh: '举报', en: 'Report' },
    empty: { zh: '还没有提案，来发起第一个', en: 'No proposals yet. Start the first one.' },
    filterByCategory: { zh: '按分类筛选', en: 'Filter by category' },
    newTitle: { zh: '发起新提案', en: 'Start a new proposal' },
    newIntro: {
      zh: '清楚地描述你希望被决策的一件事，让大家投票推进。',
      en: 'Describe one thing you want decided, so others can vote it forward.',
    },
    titlePlaceholder: { zh: '一句话说清你的提案', en: 'Sum up your proposal in one line' },
    bodyPlaceholder: { zh: '详细描述背景、动机与期望…', en: 'Describe the context, motivation and what you expect…' },
    categoryPlaceholder: { zh: '如：体验 / 功能 / 性能', en: 'e.g. UX / Feature / Performance' },
    titleRequired: { zh: '请填写标题', en: 'Title is required' },
    bodyRequired: { zh: '请填写描述', en: 'Description is required' },
    categoryRequired: { zh: '请填写分类', en: 'Category is required' },
    submitFailed: { zh: '发起失败，请稍后再试', en: 'Failed to submit, please try again' },
    backToList: { zh: '返回提案列表', en: 'Back to proposals' },
    notFound: { zh: '提案不存在或已被隐藏', en: 'This proposal does not exist or has been hidden' },
    loginToCreate: { zh: '登录后才能发起提案', en: 'Log in to create a proposal' },
    postedBy: { zh: '由 {name} 发起', en: 'Posted by {name}' },
    latest: { zh: '最新提案', en: 'Latest proposals' },
    hottest: { zh: '最热提案', en: 'Most voted' },
  },
  vote: {
    upvote: { zh: '赞成', en: 'Upvote' },
    upvoted: { zh: '已赞成', en: 'Upvoted' },
    count: { zh: '{count} 票', en: '{count} votes' },
    loginToVote: { zh: '登录后才能投票', en: 'Log in to vote' },
  },
  comment: {
    title: { zh: '评论', en: 'Comments' },
    placeholder: { zh: '写下你的想法…', en: 'Share your thoughts…' },
    post: { zh: '发表评论', en: 'Post comment' },
    empty: { zh: '还没有评论，来说两句', en: 'No comments yet. Be the first.' },
    loginToComment: { zh: '登录后才能评论', en: 'Log in to comment' },
    count: { zh: '{count} 条评论', en: '{count} comments' },
    postFailed: { zh: '评论发表失败，请稍后再试', en: 'Failed to post comment, please try again' },
    bodyRequired: { zh: '评论内容不能为空', en: 'Comment cannot be empty' },
  },
  home: {
    heroLead: {
      zh: '用户共创、共享决策的社区。你的投票，真的会改变产品走向。',
      en: 'A community where users co-create and decide. Your vote actually changes the roadmap.',
    },
    browseProposals: { zh: '浏览提案', en: 'Browse proposals' },
    startProposal: { zh: '发起提案', en: 'Start a proposal' },
    viewAll: { zh: '查看全部', en: 'View all' },
  },
  search: {
    title: { zh: '搜索', en: 'Search' },
    placeholder: { zh: '搜索提案…', en: 'Search proposals…' },
    button: { zh: '搜索', en: 'Search' },
    comingSoon: { zh: '搜索功能开发中，先去浏览全部提案吧。', en: 'Search is coming soon — browse all proposals for now.' },
    browseAll: { zh: '浏览全部提案', en: 'Browse all proposals' },
  },
  messages: {
    title: { zh: '消息', en: 'Messages' },
    empty: { zh: '暂无消息', en: 'No messages yet' },
    intro: { zh: '提案被采纳、收到评论等通知将出现在这里（开发中）。', en: 'Notifications about your proposals and comments will appear here (coming soon).' },
  },
  settings: {
    title: { zh: '设置', en: 'Settings' },
    account: { zh: '账号', en: 'Account' },
    email: { zh: '邮箱', en: 'Email' },
    displayName: { zh: '昵称', en: 'Display name' },
    role: { zh: '角色', en: 'Role' },
    language: { zh: '语言', en: 'Language' },
    languageHint: { zh: '右上角切换语言', en: 'Switch language from the top-right' },
    comingSoon: { zh: '改昵称 / 改密码等更多设置开发中。', en: 'Editing profile and password is coming soon.' },
    logout: { zh: '退出登录', en: 'Log out' },
  },
  me: {
    title: { zh: '我的', en: 'Me' },
    pleaseLogin: { zh: '登录后查看你的提案、投票与设置', en: 'Log in to see your proposals, votes and settings' },
    myProfile: { zh: '个人主页', en: 'My profile' },
    myProposals: { zh: '我的提案', en: 'My proposals' },
    settings: { zh: '设置', en: 'Settings' },
    admin: { zh: '管理后台', en: 'Admin' },
    logout: { zh: '退出登录', en: 'Log out' },
  },
  user: {
    profileTitle: { zh: '{name} 的主页', en: "{name}'s profile" },
    proposalsCount: { zh: '发起的提案', en: 'Proposals started' },
    commentsCount: { zh: '发表的评论', en: 'Comments posted' },
    contributions: { zh: '贡献记录', en: 'Contributions' },
    noProposals: { zh: '还没有发起过提案', en: 'No proposals yet' },
    joinedAt: { zh: '加入于 {date}', en: 'Joined {date}' },
    notFound: { zh: '用户不存在', en: 'User not found' },
    adminBadge: { zh: '管理员', en: 'Admin' },
  },
  admin: {
    title: { zh: '管理后台', en: 'Admin' },
    dashboard: { zh: '概览', en: 'Dashboard' },
    proposalsNav: { zh: '提案状态', en: 'Proposals' },
    reviewNav: { zh: '审核队列', en: 'Review queue' },
    usersNav: { zh: '用户', en: 'Users' },
    i18nNav: { zh: '多语言', en: 'Languages' },
    backToSite: { zh: '返回站点', en: 'Back to site' },
    // 概览
    overviewIntro: { zh: '运营与审核入口。', en: 'Operations and moderation hub.' },
    pendingReports: { zh: '待处理举报', en: 'Pending reports' },
    totalProposals: { zh: '提案总数', en: 'Proposals' },
    totalUsers: { zh: '用户总数', en: 'Users' },
    bannedUsers: { zh: '被封禁用户', en: 'Banned users' },
    hiddenProposals: { zh: '已隐藏提案', en: 'Hidden proposals' },
    // 提案状态管理
    proposalsTitle: { zh: '提案状态管理', en: 'Proposal status' },
    proposalsIntro: { zh: '推进状态机、隐藏违规提案。', en: 'Advance the state machine and hide content.' },
    colTitle: { zh: '标题', en: 'Title' },
    colAuthor: { zh: '作者', en: 'Author' },
    colCategory: { zh: '分类', en: 'Category' },
    colVotes: { zh: '票数', en: 'Votes' },
    colStatus: { zh: '状态', en: 'Status' },
    colActions: { zh: '操作', en: 'Actions' },
    advanceTo: { zh: '推进到', en: 'Advance to' },
    terminalState: { zh: '终态', en: 'Final' },
    hide: { zh: '隐藏', en: 'Hide' },
    unhide: { zh: '取消隐藏', en: 'Unhide' },
    hiddenTag: { zh: '已隐藏', en: 'Hidden' },
    noProposals: { zh: '暂无提案', en: 'No proposals' },
    // 审核队列
    reviewTitle: { zh: '审核队列', en: 'Review queue' },
    reviewIntro: { zh: '处理用户举报：隐藏内容或封禁用户。', en: 'Handle reports: hide content or ban users.' },
    reportReason: { zh: '举报理由', en: 'Reason' },
    reporter: { zh: '举报人', en: 'Reporter' },
    reportedProposal: { zh: '被举报提案', en: 'Reported proposal' },
    reportedComment: { zh: '被举报评论', en: 'Reported comment' },
    targetAuthor: { zh: '内容作者', en: 'Author' },
    targetGone: { zh: '内容已不存在', en: 'Content no longer exists' },
    viewTarget: { zh: '查看', en: 'View' },
    dismiss: { zh: '忽略举报', en: 'Dismiss' },
    banAuthor: { zh: '封禁作者', en: 'Ban author' },
    emptyQueue: { zh: '审核队列已清空，没有待处理举报。', en: 'Queue is clear. No pending reports.' },
    // 用户
    usersTitle: { zh: '用户管理', en: 'Users' },
    usersIntro: { zh: '封禁 / 解封违规用户（不可封禁管理员）。', en: 'Ban or unban users (admins cannot be banned).' },
    colEmail: { zh: '邮箱', en: 'Email' },
    colName: { zh: '昵称', en: 'Name' },
    colRole: { zh: '角色', en: 'Role' },
    colJoined: { zh: '注册时间', en: 'Joined' },
    roleAdmin: { zh: '管理员', en: 'Admin' },
    roleUser: { zh: '普通用户', en: 'User' },
    bannedTag: { zh: '已封禁', en: 'Banned' },
    ban: { zh: '封禁', en: 'Ban' },
    unban: { zh: '解封', en: 'Unban' },
    // i18n 管理
    i18nTitle: { zh: '多语言管理', en: 'Languages & translations' },
    i18nIntro: { zh: '增删语言、启停、设默认；按分组编辑文案。', en: 'Add languages, toggle, set default, and edit copy.' },
    languagesSection: { zh: '语言', en: 'Languages' },
    translationsSection: { zh: '文案', en: 'Translations' },
    addLanguage: { zh: '新增语言', en: 'Add language' },
    localeCode: { zh: '语言代码', en: 'Code' },
    localeName: { zh: '显示名', en: 'Name' },
    localeSort: { zh: '排序', en: 'Order' },
    enabledCol: { zh: '启用', en: 'Enabled' },
    defaultCol: { zh: '默认', en: 'Default' },
    enable: { zh: '启用', en: 'Enable' },
    disable: { zh: '停用', en: 'Disable' },
    setDefault: { zh: '设为默认', en: 'Set default' },
    deleteLabel: { zh: '删除', en: 'Delete' },
    isDefaultTag: { zh: '默认', en: 'Default' },
    namespaceLabel: { zh: '分组', en: 'Namespace' },
    keyCol: { zh: '键', en: 'Key' },
    missingTag: { zh: '缺翻译', en: 'Missing' },
    saved: { zh: '已保存', en: 'Saved' },
    saveFailed: { zh: '保存失败', en: 'Save failed' },
    actionFailed: { zh: '操作失败', en: 'Action failed' },
    confirmDelete: { zh: '确认删除该语言及其全部文案？', en: 'Delete this language and all its translations?' },
    cannotDisableDefault: { zh: '不能停用默认语言', en: 'Cannot disable the default language' },
    cannotDeleteDefault: { zh: '不能删除默认语言', en: 'Cannot delete the default language' },
    localeExists: { zh: '该语言代码已存在', en: 'This language code already exists' },
    codePlaceholder: { zh: '如 ja / fr / zh-HK', en: 'e.g. ja / fr / zh-HK' },
    namePlaceholder: { zh: '如 日本語 / Français', en: 'e.g. 日本語 / Français' },
  },
};

// ── ④ 示例提案（不同状态）────────────────────────────────
const PROPOSALS = [
  {
    title: '深色模式跟随系统',
    body: '希望友定的深色模式能自动跟随操作系统的外观设置，而不是只有手动切换。',
    category: '体验',
    status: ProposalStatus.COLLECTING,
  },
  {
    title: '提案支持 Markdown 描述',
    body: '提案描述太长时纯文本很难读，建议支持基本 Markdown（标题、列表、链接、代码块）。',
    category: '功能',
    status: ProposalStatus.ADOPTED,
  },
  {
    title: '提案列表加分类筛选',
    body: '提案多了之后，希望能按分类筛选（体验 / 功能 / 性能 / 其他），方便找到关心的方向。',
    category: '功能',
    status: ProposalStatus.IN_PROGRESS,
  },
  {
    title: '首页展示 slogan「这块地盘由你决定」',
    body: '让第一次来的人一眼明白这是个由用户决定的平台，首页顶部展示 slogan。',
    category: '体验',
    status: ProposalStatus.SHIPPED,
  },
  {
    title: '接入第三方 OAuth 登录',
    body: '希望支持 GitHub / Google 一键登录。',
    category: '功能',
    // 初始版明确不做 OAuth（见 implementation.md §0），作为「已否决」示例。
    status: ProposalStatus.REJECTED,
  },
];

async function main() {
  // ① admin 用户（凭证从 env 读；缺省值仅用于本地 dev，生产务必设 ADMIN_EMAIL/ADMIN_PASSWORD）
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@udes1gn.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    // 不重置已存在管理员的密码（避免重跑 seed 把生产口令冲掉）
    update: { displayName: 'Admin', role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash,
      displayName: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✓ admin user: ${admin.email} (role=${admin.role})`);

  // ② Locale
  for (const loc of LOCALES) {
    await prisma.locale.upsert({
      where: { code: loc.code },
      update: { name: loc.name, enabled: loc.enabled, isDefault: loc.isDefault, sortOrder: loc.sortOrder },
      create: loc,
    });
  }
  console.log(`✓ locales: ${LOCALES.map((l) => l.code).join(', ')}`);

  // ③ Translation
  let tCount = 0;
  for (const [namespace, keys] of Object.entries(TRANSLATIONS)) {
    for (const [key, values] of Object.entries(keys)) {
      for (const localeCode of ['zh', 'en'] as const) {
        await prisma.translation.upsert({
          where: { namespace_key_localeCode: { namespace, key, localeCode } },
          update: { value: values[localeCode] },
          create: { namespace, key, localeCode, value: values[localeCode] },
        });
        tCount++;
      }
    }
  }
  console.log(`✓ translations: ${tCount} rows`);

  // ④ 示例提案（幂等：按标题去重，已存在则跳过创建）
  let pCreated = 0;
  for (const p of PROPOSALS) {
    const existing = await prisma.proposal.findFirst({ where: { title: p.title } });
    if (existing) continue;
    await prisma.proposal.create({
      data: { ...p, authorId: admin.id },
    });
    pCreated++;
  }
  console.log(`✓ proposals: ${pCreated} created (${PROPOSALS.length} total in seed)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
