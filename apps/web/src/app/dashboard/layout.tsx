'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { NotificationBell } from '@/components/layout/notification-bell';
import { MenuIcon, HomeIcon } from '@/components/ui/icons';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Lock body scroll while the drawer is open; close on route change / Escape.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);
  useEffect(() => setSidebarOpen(false), [pathname]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {sidebarOpen && (
        <div className="fixed inset-0 z-overlay lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[var(--color-overlay-backdrop)]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-modal w-72 overflow-y-auto bg-muted shadow-elevation-4">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-sticky flex h-header items-center gap-3 border-b border-border bg-card px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="grid h-11 w-11 place-items-center rounded-md text-foreground transition-colors duration-fast hover:bg-muted lg:hidden"
          >
            <MenuIcon size={20} />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold text-foreground lg:hidden"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground">
              <HomeIcon size={16} />
            </span>
            <span>RDN</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
