import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
type BadgeSize = 'sm' | 'md';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-muted text-foreground border border-border',
  success: 'bg-success-bg text-success-text border border-success-border',
  warning: 'bg-warning-bg text-warning-text border border-warning-border',
  error: 'bg-error-bg text-error-text border border-error-border',
  info: 'bg-info-bg text-info-text border border-info-border',
  brand: 'bg-brand-subtle text-brand-text border border-brand-subtle',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
