import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          RDN
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/search" className="text-gray-600 hover:text-gray-900">
            Search
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
