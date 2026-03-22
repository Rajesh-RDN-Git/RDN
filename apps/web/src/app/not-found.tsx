import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <span className="text-4xl text-gray-400">404</span>
      </div>
      <h1 className="text-display-sm text-gray-900">Page not found</h1>
      <p className="mt-2 max-w-md text-body-lg text-gray-500">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary-600 px-6 py-3 text-label-md text-white transition-colors hover:bg-primary-700"
        >
          Go Home
        </Link>
        <Link
          href="/search"
          className="rounded-lg border border-gray-300 px-6 py-3 text-label-md text-gray-700 transition-colors hover:bg-gray-50"
        >
          Browse Properties
        </Link>
      </div>
    </div>
  );
}
