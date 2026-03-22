'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { reportsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Role } from '@rdn/shared';
import { HomeIcon, UsersIcon, BuildingIcon, ChatIcon, ArrowRightIcon } from '@/components/ui/icons';

interface DashboardStats {
  totalProperties?: number;
  totalLeads?: number;
  totalDealers?: number;
  totalSocieties?: number;
  conversionRate?: number;
  activeLeads?: number;
  assignedProperties?: number;
  myListings?: number;
  inquiryCount?: number;
  savedProperties?: number;
  activeInquiries?: number;
}

const quickActions: Record<string, Array<{ label: string; href: string; icon: any }>> = {
  SUPER_ADMIN: [
    { label: 'Properties', href: '/dashboard/properties', icon: HomeIcon },
    { label: 'Leads', href: '/dashboard/leads', icon: ArrowRightIcon },
    { label: 'Dealers', href: '/dashboard/dealers', icon: UsersIcon },
    { label: 'Chat', href: '/dashboard/chat', icon: ChatIcon },
  ],
  RWA_ADMIN: [
    { label: 'Properties', href: '/dashboard/properties', icon: HomeIcon },
    { label: 'Leads', href: '/dashboard/leads', icon: ArrowRightIcon },
    { label: 'Dealers', href: '/dashboard/dealers', icon: UsersIcon },
    { label: 'Reports', href: '/dashboard/reports', icon: BuildingIcon },
  ],
  DEALER: [
    { label: 'My Leads', href: '/dashboard/leads', icon: ArrowRightIcon },
    { label: 'Properties', href: '/dashboard/properties', icon: HomeIcon },
    { label: 'Chat', href: '/dashboard/chat', icon: ChatIcon },
  ],
  OWNER: [
    { label: 'My Listings', href: '/dashboard/properties', icon: HomeIcon },
    { label: 'Chat', href: '/dashboard/chat', icon: ChatIcon },
  ],
  BUYER_TENANT: [
    { label: 'Browse', href: '/search', icon: HomeIcon },
    { label: 'Chat', href: '/dashboard/chat', icon: ChatIcon },
  ],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await reportsApi.dashboard();
      setStats(data as DashboardStats);
    } catch (err: any) {
      setError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : 'Failed to load dashboard data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <svg
            className="h-7 w-7 text-red-500"
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
        <h3 className="text-heading-md text-gray-900">Failed to load dashboard</h3>
        <p className="mt-2 max-w-sm text-body-md text-gray-500">{error}</p>
        <Button onClick={fetchStats} className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  const role = user?.role;
  const actions = quickActions[role || ''] || quickActions.BUYER_TENANT;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white shadow-elevation-1 md:p-8">
        <p className="text-body-lg text-primary-200">{getGreeting()},</p>
        <h1 className="mt-1 text-display-sm">{user?.name || 'User'}</h1>
        <p className="mt-2 text-body-md text-primary-200">
          {role === Role.SUPER_ADMIN && 'Managing the RDN platform'}
          {role === Role.RWA_ADMIN && 'Managing your society'}
          {role === Role.DEALER && 'Your lead pipeline at a glance'}
          {role === Role.OWNER && 'Track your property listings'}
          {role === Role.BUYER_TENANT && 'Find your perfect home'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-elevation-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 transition-colors group-hover:bg-primary-100">
              <action.icon size={20} className="text-primary-600" />
            </div>
            <span className="text-label-md text-gray-700 group-hover:text-gray-900">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <h2 className="mb-4 text-heading-md text-gray-900">Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(role === Role.SUPER_ADMIN || role === Role.RWA_ADMIN) && (
          <>
            <StatCard
              label="Total Properties"
              value={stats.totalProperties ?? 0}
              icon={<HomeIcon size={20} />}
            />
            <StatCard
              label="Total Leads"
              value={stats.totalLeads ?? 0}
              icon={<ArrowRightIcon size={20} />}
            />
            <StatCard
              label="Total Dealers"
              value={stats.totalDealers ?? 0}
              icon={<UsersIcon size={20} />}
            />
            {role === Role.SUPER_ADMIN && (
              <StatCard
                label="Societies"
                value={stats.totalSocieties ?? 0}
                icon={<BuildingIcon size={20} />}
              />
            )}
            <StatCard label="Conversion Rate" value={`${stats.conversionRate ?? 0}%`} />
          </>
        )}

        {role === Role.DEALER && (
          <>
            <StatCard
              label="Active Leads"
              value={stats.activeLeads ?? 0}
              icon={<ArrowRightIcon size={20} />}
            />
            <StatCard
              label="Assigned Properties"
              value={stats.assignedProperties ?? 0}
              icon={<HomeIcon size={20} />}
            />
          </>
        )}

        {role === Role.OWNER && (
          <>
            <StatCard
              label="My Listings"
              value={stats.myListings ?? 0}
              icon={<HomeIcon size={20} />}
            />
            <StatCard
              label="Inquiries"
              value={stats.inquiryCount ?? 0}
              icon={<ChatIcon size={20} />}
            />
          </>
        )}

        {role === Role.BUYER_TENANT && (
          <>
            <StatCard
              label="Saved Properties"
              value={stats.savedProperties ?? 0}
              icon={<HomeIcon size={20} />}
            />
            <StatCard
              label="Active Inquiries"
              value={stats.activeInquiries ?? 0}
              icon={<ChatIcon size={20} />}
            />
          </>
        )}
      </div>
    </div>
  );
}
