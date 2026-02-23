'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@rdn/shared';

interface NavItem {
  href: string;
  label: string;
}

const navByRole: Record<string, NavItem[]> = {
  [Role.SUPER_ADMIN]: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/properties', label: 'Properties' },
    { href: '/dashboard/dealers', label: 'Dealers' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/reports', label: 'Reports' },
    { href: '/dashboard/chat', label: 'Chat' },
    { href: '/dashboard/settings', label: 'Settings' },
  ],
  [Role.RWA_ADMIN]: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/properties', label: 'Properties' },
    { href: '/dashboard/dealers', label: 'Dealers' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/reports', label: 'Reports' },
    { href: '/dashboard/settings', label: 'Settings' },
  ],
  [Role.DEALER]: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/properties', label: 'Properties' },
    { href: '/dashboard/chat', label: 'Chat' },
    { href: '/dashboard/settings', label: 'Settings' },
  ],
  [Role.OWNER]: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/properties', label: 'My Properties' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/settings', label: 'Settings' },
  ],
  [Role.BUYER_TENANT]: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/properties', label: 'Saved' },
    { href: '/dashboard/leads', label: 'My Inquiries' },
    { href: '/dashboard/settings', label: 'Settings' },
  ],
};

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role || Role.BUYER_TENANT;
  const items = navByRole[role] || navByRole[Role.BUYER_TENANT];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${mobile ? 'w-full' : 'hidden w-64 lg:block'} border-r bg-gray-50`}>
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold text-primary-600">
          RDN
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="text-gray-500 lg:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <nav className="mt-4 space-y-1 px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive(item.href)
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
