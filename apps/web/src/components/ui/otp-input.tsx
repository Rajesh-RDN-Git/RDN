'use client';

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({ length = 6, onComplete, error, disabled }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const digit = value.slice(-1);
      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }

      const otp = newValues.join('');
      if (otp.length === length && newValues.every((v) => v !== '')) {
        onComplete(otp);
      }
    },
    [values, length, onComplete, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !values[index] && index > 0) {
        focusInput(index - 1);
      }
    },
    [values, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;

      const newValues = [...values];
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i];
      }
      setValues(newValues);

      if (pasted.length === length) {
        onComplete(pasted);
      } else {
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [values, length, onComplete, focusInput],
  );

  return (
    <div>
      <div className="flex justify-center gap-2.5">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className={`h-12 w-12 rounded-md border bg-card text-center text-lg font-semibold text-foreground tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 ${
              error
                ? 'border-error focus-visible:border-error'
                : 'border-border focus-visible:border-ring'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-center text-sm text-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
