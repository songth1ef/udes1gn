import type { Config } from 'tailwindcss';

/**
 * UDES1GN 设计 token（沿用 v1 基线）。
 * 配色用 CSS 变量承载（globals.css）以支持深色模式，
 * 同时在此暴露固定品牌色给语义类（text-ud-blue 等）。
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'media', // 深色模式跟随 prefers-color-scheme
  theme: {
    extend: {
      colors: {
        // 语义色：前景/背景跟随 CSS 变量（深色模式自动切换）
        foreground: 'var(--ud-foreground)',
        background: 'var(--ud-background)',
        // 品牌固定色（深浅模式一致）
        'ud-blue': '#1797F0', // 强调 / focus
        'ud-link': '#2997FF', // 正文链接
        'ud-green': '#04C15F', // success
        'ud-red': '#FF4D4F', // error
      },
      borderRadius: {
        ud: '12px', // 输入框 / 按钮统一圆角
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        nav: '60px', // 顶部 Nav 高度
      },
      maxWidth: {
        main: '1000px', // 主区最大宽度
      },
    },
  },
  plugins: [],
};

export default config;
