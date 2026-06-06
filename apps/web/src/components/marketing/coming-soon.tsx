import Link from 'next/link';

// Lightweight placeholder for marketing/info pages that are linked from the
// footer but whose full content is not authored yet. Keeps links from 404ing.
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-content flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-4 inline-flex items-center rounded-full bg-brand-subtle px-3 py-1 text-label-sm text-brand">
        Coming soon
      </span>
      <h1 className="text-display-sm text-foreground">{title}</h1>
      <p className="mt-3 max-w-xl text-body-lg text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/search"
          className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-label-md text-white transition-colors hover:bg-brand-hover"
        >
          Browse Properties
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-label-md text-foreground transition-colors hover:bg-chrome-hover"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
