/**
 * 组件桶（barrel）—— 设计系统统一出口。
 * 页面从 '@/components' import 复用组件，避免散落的相对路径。
 */
export { Button, type ButtonProps } from './Button';
export { Input, type InputProps } from './Input';
export { MessageBox, type MessageBoxProps } from './MessageBox';
export { StatusBadge } from './StatusBadge';
export { Nav } from './Nav';
export { LanguageSwitcher, type LocaleOption } from './LanguageSwitcher';
export { LogoutButton } from './LogoutButton';
export { ProposalCard, type ProposalCardData } from './ProposalCard';
