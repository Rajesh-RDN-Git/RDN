'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-[var(--color-overlay-backdrop)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`animate-in relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl border border-border bg-popover p-6 text-popover-foreground shadow-elevation-4 sm:rounded-xl ${className}`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-heading-lg text-foreground">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
