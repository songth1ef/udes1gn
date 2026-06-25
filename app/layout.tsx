import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UDES1GN 友定',
  description: '用户共创、共享设计和决策的社区平台 — 这块地盘由你决定',
};

/**
 * 根布局：只挂字体变量与 html/body 骨架。
 * 语言相关（lang 属性、NextIntlClientProvider）放在 app/[locale]/layout.tsx。
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
