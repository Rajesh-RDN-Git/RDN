'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public page error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-bg">
        <svg
          className="h-8 w-8 text-error-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-heading-xl text-foreground">Failed to load this page</h2>
      <p className="mt-2 max-w-md text-body-md text-muted-foreground">
        We couldn&apos;t load the content you were looking for. This might be a temporary issue.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Link href="/search">
          <Button variant="outline">Browse Properties</Button>
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-caption-md text-muted-foreground">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
