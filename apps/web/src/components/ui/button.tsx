import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Spinner } from './spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-active',
      secondary: 'bg-muted text-foreground hover:bg-subtle active:bg-subtle',
      outline:
        'border border-border-strong bg-card text-foreground hover:bg-muted active:bg-subtle',
      ghost: 'text-foreground hover:bg-muted active:bg-subtle',
      danger: 'bg-error text-error-foreground hover:opacity-90 active:opacity-80',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-9 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
