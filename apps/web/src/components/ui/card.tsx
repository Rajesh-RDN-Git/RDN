import type { HTMLAttributes } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Elevation = 'flat' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  elevation?: Elevation;
  interactive?: boolean;
}

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const elevations: Record<Elevation, string> = {
  flat: '',
  sm: 'shadow-elevation-1',
  md: 'shadow-elevation-2',
  lg: 'shadow-elevation-3',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  elevation = 'sm',
  interactive = false,
  ...props
}: CardProps) {
  const interactiveClasses = interactive
    ? 'transition-shadow duration-fast hover:shadow-elevation-2 cursor-pointer'
    : '';
  return (
    <div
      className={`rounded-lg border border-border bg-card text-foreground ${paddings[padding]} ${elevations[elevation]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
