'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { notificationsApi } from '@/lib/api/notifications.api';
import { useAuth } from '@/hooks/use-auth';
import { BellIcon } from '@/components/ui/icons';

const POLL_MS = 30_000;

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const { data } = await notificationsApi.list({ unreadOnly: true, limit: 1 });
        if (!cancelled) setUnreadCount(data?.unreadCount ?? 0);
      } catch {
        // Silently ignore fetch failures so the bell never breaks the layout.
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // Re-fetch when the user navigates within the dashboard so the badge stays fresh.
  }, [isAuthenticated, pathname]);

  if (!isAuthenticated) return null;

  const display = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className={`relative grid h-9 w-9 place-items-center rounded-md text-foreground transition-colors duration-fast hover:bg-muted ${className}`}
    >
      <BellIcon size={20} />
      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white"
          aria-hidden="true"
        >
          {display}
        </span>
      )}
    </Link>
  );
}
