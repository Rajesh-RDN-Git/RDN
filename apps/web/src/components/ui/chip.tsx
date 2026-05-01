'use client';

import { CloseIcon } from './icons';

interface ChipProps {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ label, selected, onToggle, onRemove, className = '' }: ChipProps) {
  if (onRemove) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-brand-subtle bg-brand-subtle px-3 py-1 text-label-sm text-brand-text ${className}`}
      >
        {label}
        <button
          onClick={onRemove}
          className="flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-fast hover:bg-brand-subtle-hover"
          aria-label={`Remove ${label}`}
        >
          <CloseIcon size={12} />
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-label-sm transition-colors duration-fast ${
        selected
          ? 'border-brand bg-brand-subtle text-brand-text'
          : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-muted'
      } ${className}`}
    >
      {label}
    </button>
  );
}
