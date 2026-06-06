'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { BuildingIcon, HomeIcon, ShieldIcon, UsersIcon } from '@/components/ui/icons';

interface Stats {
  totalSocieties?: number;
  totalProperties?: number;
  totalDealers?: number;
  totalUsers?: number;
}

const indicators = [
  { key: 'totalSocieties', label: 'Societies', icon: BuildingIcon, fallback: 50 },
  { key: 'totalProperties', label: 'Properties', icon: HomeIcon, fallback: 500 },
  { key: 'totalDealers', label: 'Verified Dealers', icon: ShieldIcon, fallback: 100 },
  { key: 'totalUsers', label: 'Happy Residents', icon: UsersIcon, fallback: 2000 },
] as const;

export function TrustIndicators() {
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await reportsApi.publicStats();
        setStats(data as Stats);
      } catch {
        // Use fallbacks
      }
    }
    fetchStats();
  }, []);

  return (
    <section className="bg-brand-subtle">
      <div className="mx-auto grid max-w-content grid-cols-2 gap-4 px-4 py-10 md:grid-cols-4 md:gap-8">
        {indicators.map(({ key, label, icon: Icon, fallback }) => (
          <div key={key} className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-subtle">
              <Icon size={24} className="text-brand" />
            </div>
            <p className="text-display-sm text-foreground">
              {(stats[key] ?? fallback).toLocaleString('en-IN')}+
            </p>
            <p className="text-label-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
