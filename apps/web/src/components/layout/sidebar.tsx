'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@rdn/shared';
import {
  DashboardIcon,
  HomeIcon,
  BuildingIcon,
  UsersIcon,
  ChatIcon,
  SettingsIcon,
  HeartIcon,
  BarChartIcon,
  FileTextIcon,
  CloseIcon,
  BriefcaseIcon,
  CheckIcon,
  BellIcon,
  ShieldIcon,
  LogoutIcon,
} from '@/components/ui/icons';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

interface NavItem {
  href: string;
  label: string;
  icon: IconComponent;
}

const CHAT_LINK: NavItem = {
  href: '/dashboard/chat',
  label: 'Chat',
  icon: ChatIcon,
};

const NOTIFICATIONS_LINK: NavItem = {
  href: '/dashboard/notifications',
  label: 'Notifications',
  icon: BellIcon,
};

const GRIEVANCES_LINK: NavItem = {
  href: '/dashboard/grievances',
  label: 'Grievances',
  icon: ShieldIcon,
};

const RAISE_GRIEVANCE_LINK: NavItem = {
  href: '/dashboard/grievances/new',
  label: 'Raise Grievance',
  icon: ShieldIcon,
};

const SOCIETIES_LINK: NavItem = {
  href: '/dashboard/societies',
  label: 'Societies',
  icon: BuildingIcon,
};

const navByRole: Record<string, NavItem[]> = {
  [Role.SUPER_ADMIN]: [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    CHAT_LINK,
    SOCIETIES_LINK,
    { href: '/dashboard/properties', label: 'Properties', icon: HomeIcon },
    { href: '/dashboard/verification-queue', label: 'Verification Queue', icon: CheckIcon },
    { href: '/dashboard/dealers', label: 'Dealers', icon: UsersIcon },
    { href: '/dashboard/leads', label: 'Leads', icon: BriefcaseIcon },
    { href: '/dashboard/commissions', label: 'Commissions', icon: FileTextIcon },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChartIcon },
    GRIEVANCES_LINK,
    NOTIFICATIONS_LINK,
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ],
  [Role.RWA_ADMIN]: [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/dashboard/properties', label: 'Properties', icon: HomeIcon },
    { href: '/dashboard/verification-queue', label: 'Verification Queue', icon: CheckIcon },
    { href: '/dashboard/dealers', label: 'Dealers', icon: UsersIcon },
    { href: '/dashboard/leads', label: 'Leads', icon: BriefcaseIcon },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChartIcon },
    GRIEVANCES_LINK,
    NOTIFICATIONS_LINK,
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ],
  [Role.DEALER]: [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    CHAT_LINK,
    { href: '/dashboard/leads', label: 'Leads', icon: BriefcaseIcon },
    { href: '/dashboard/properties', label: 'Properties', icon: HomeIcon },
    { href: '/dashboard/commissions', label: 'Commissions', icon: FileTextIcon },
    NOTIFICATIONS_LINK,
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ],
  [Role.OWNER]: [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/dashboard/properties', label: 'My Properties', icon: HomeIcon },
    { href: '/dashboard/leads', label: 'Tracking', icon: BriefcaseIcon },
    RAISE_GRIEVANCE_LINK,
    NOTIFICATIONS_LINK,
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ],
  [Role.BUYER_TENANT]: [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    CHAT_LINK,
    { href: '/dashboard/properties', label: 'Saved', icon: HeartIcon },
    { href: '/dashboard/leads', label: 'My Inquiries', icon: FileTextIcon },
    RAISE_GRIEVANCE_LINK,
    NOTIFICATIONS_LINK,
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ],
};

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role || Role.BUYER_TENANT;
  const items = navByRole[role] || navByRole[Role.BUYER_TENANT];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${
        mobile ? 'w-full' : 'hidden w-64 lg:flex'
      } h-full flex-col border-r border-border bg-muted`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-base font-bold text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground">
            <HomeIcon size={18} />
          </span>
          <span>RDN</span>
        </Link>
        {mobile && onClose && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-subtle hover:text-foreground lg:hidden"
            aria-label="Close menu"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>
      {role && (
        <div className="px-4 pb-2 pt-4">
          <p className="text-overline text-muted-foreground">{role.replace('_', ' ')}</p>
        </div>
      )}
      <nav className="flex-1 space-y-0.5 px-2 pb-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast ${
                active ? 'bg-brand-subtle text-brand-text' : 'text-foreground hover:bg-subtle'
              }`}
            >
              <Icon size={18} className={active ? 'text-brand' : 'text-muted-foreground'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-2 py-3">
        {user?.name && (
          <p className="truncate px-3 pb-2 text-caption-md text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.name}</span>
          </p>
        )}
        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors duration-fast hover:bg-subtle"
        >
          <LogoutIcon size={18} className="text-muted-foreground" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
