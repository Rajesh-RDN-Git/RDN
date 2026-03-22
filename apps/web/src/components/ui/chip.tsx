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
        className={`inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-label-sm text-primary-700 ${className}`}
      >
        {label}
        <button
          onClick={onRemove}
          className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary-200"
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
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-label-sm transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      } ${className}`}
    >
      {label}
    </button>
  );
}
