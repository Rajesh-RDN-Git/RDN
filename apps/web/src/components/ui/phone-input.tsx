'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'maxLength'
> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="flex">
          <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground tabular-nums">
            +91
          </span>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            maxLength={10}
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[0-9]*"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`block h-10 w-full rounded-r-md border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
              error
                ? 'border-error focus-visible:border-error'
                : 'border-border focus-visible:border-ring'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error-text">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';
