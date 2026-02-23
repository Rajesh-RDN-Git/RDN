'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { reportsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Spinner } from '@/components/ui/spinner';
import { Role } from '@rdn/shared';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await reportsApi.dashboard();
        setStats(data as DashboardStats);
      } catch {
        // Stats will show defaults
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const role = user?.role;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-gray-500">Welcome back, {user?.name || 'User'}</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(role === Role.SUPER_ADMIN || role === Role.RWA_ADMIN) && (
          <>
            <StatCard label="Total Properties" value={stats.totalProperties ?? 0} />
            <StatCard label="Total Leads" value={stats.totalLeads ?? 0} />
            <StatCard label="Total Dealers" value={stats.totalDealers ?? 0} />
            {role === Role.SUPER_ADMIN && (
              <StatCard label="Societies" value={stats.totalSocieties ?? 0} />
            )}
            <StatCard label="Conversion Rate" value={`${stats.conversionRate ?? 0}%`} />
          </>
        )}

        {role === Role.DEALER && (
          <>
            <StatCard label="Active Leads" value={stats.activeLeads ?? 0} />
            <StatCard label="Assigned Properties" value={stats.assignedProperties ?? 0} />
          </>
        )}

        {role === Role.OWNER && (
          <>
            <StatCard label="My Listings" value={stats.myListings ?? 0} />
            <StatCard label="Inquiries" value={stats.inquiryCount ?? 0} />
          </>
        )}

        {role === Role.BUYER_TENANT && (
          <>
            <StatCard label="Saved Properties" value={stats.savedProperties ?? 0} />
            <StatCard label="Active Inquiries" value={stats.activeInquiries ?? 0} />
          </>
        )}
      </div>
    </div>
  );
}
