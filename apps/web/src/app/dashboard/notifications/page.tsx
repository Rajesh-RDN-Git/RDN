'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { BellIcon } from '@/components/ui/icons';
import { showToast } from '@/stores/toast-store';

const PAGE_SIZE = 20;

const typeVariant = (type: string): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  switch (type) {
    case 'LEAD':
    case 'VISIT':
      return 'info';
    case 'DEAL':
    case 'COMMISSION':
      return 'success';
    case 'GRIEVANCE':
      return 'warning';
    case 'SYSTEM':
    default:
      return 'default';
  }
};

// Best-effort contextual link based on notification.data payload.
const contextualHref = (n: NotificationItem): string | null => {
  const d = n.data || {};
  if (d.leadId) return `/dashboard/leads`;
  if (d.transactionId) return `/dashboard/reports`;
  if (d.propertyId) return `/dashboard/properties`;
  if (d.grievanceId) return `/dashboard/settings`;
  return null;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await notificationsApi.list({ page: targetPage, limit: PAGE_SIZE });
      setItems(data?.data ?? []);
      setTotal(data?.total ?? 0);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const handleMarkRead = async (n: NotificationItem) => {
    if (!n.readAt) {
      // Optimistically mark as read so the click feels instant.
      setItems((curr) =>
        curr.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await notificationsApi.markRead(n.id);
      } catch {
        showToast.error('Could not mark notification as read.');
      }
    }

    const href = contextualHref(n);
    if (href) router.push(href);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setItems((curr) =>
        curr.map((it) => (it.readAt ? it : { ...it, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
      showToast.success('All notifications marked as read.');
    } catch {
      showToast.error('Could not mark all as read.');
    } finally {
      setMarking(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread of ${total} total`
              : `${total} notification${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || marking}
          isLoading={marking}
        >
          Mark all read
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-md border border-error-border bg-error-bg p-4 text-sm text-error-text">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellIcon size={40} />}
          title="No notifications yet"
          description="You'll see updates about leads, visits, and deals here."
        />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {items.map((n) => {
            const unread = !n.readAt;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-fast hover:bg-muted ${
                    unread ? 'bg-brand-subtle/40' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${
                      unread ? 'bg-brand' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm ${
                          unread ? 'font-semibold text-foreground' : 'text-foreground'
                        }`}
                      >
                        {n.title}
                      </span>
                      <Badge variant={typeVariant(n.type)}>{n.type}</Badge>
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatTime(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
