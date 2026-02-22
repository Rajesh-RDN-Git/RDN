import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">RDN</h1>
      <p className="mb-8 text-lg text-gray-600">
        Residential Dealer Network — Community-driven real estate for societies
      </p>
      <div className="flex gap-4">
        <Link
          href="/search"
          className="rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
        >
          Browse Properties
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
