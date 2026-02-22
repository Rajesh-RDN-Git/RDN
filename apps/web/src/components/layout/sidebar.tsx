import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/properties', label: 'Properties' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/dealers', label: 'Dealers' },
  { href: '/dashboard/chat', label: 'Chat' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-gray-50">
      <div className="p-4">
        <Link href="/" className="text-xl font-bold">
          RDN
        </Link>
      </div>
      <nav className="mt-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
