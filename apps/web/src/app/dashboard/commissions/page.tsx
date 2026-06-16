'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { commissionsApi, type CommissionStatus } from '@/lib/api/commissions.api';
import { SearchIcon } from '@/components/ui/icons';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@rdn/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type Commission = {
  id: string;
  transactionId: string;
  amount: number | string;
  gst: number | string;
  status: CommissionStatus;
  settlementDate?: string | null;
  payoutReference?: string | null;
  createdAt: string;
  dealer?: { id: string; user?: { id: string; name?: string | null } | null } | null;
  transaction?: {
    id: string;
    type?: string;
    dealValue?: number | string;
    property?: { id: string; flatNumber?: string; towerBlock?: string | null } | null;
  } | null;
};

type FilterKey = 'ALL' | CommissionStatus;

const PAYMENT_METHODS = ['UPI', 'IMPS', 'NEFT', 'RTGS', 'CASH'] as const;

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `Rs ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    /* invalid date */
    return '-';
  }
}

function statusVariant(
  status: CommissionStatus,
): 'default' | 'success' | 'error' | 'warning' | 'info' {
  if (status === 'SETTLED') return 'success';
  if (status === 'DISTRIBUTED') return 'info';
  if (status === 'CANCELLED') return 'error';
  return 'warning';
}

export default function CommissionsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      [
        c.dealer?.user?.name,
        c.transaction?.property?.flatNumber,
        c.transaction?.property?.towerBlock,
        c.payoutReference,
        c.transactionId,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, search]);

  // Settle modal state
  const [settleTarget, setSettleTarget] = useState<Commission | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<Commission | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: CommissionStatus; limit: number } = { limit: 50 };
      if (filter !== 'ALL') params.status = filter;
      const { data } = await commissionsApi.list(params);
      setItems((data?.data ?? data ?? []) as Commission[]);
    } catch (err) {
      const e = err as { code?: string; response?: { data?: { message?: string } } };
      setError(
        e?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : e?.response?.data?.message || 'Failed to load commissions.',
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openSettle = (c: Commission) => {
    setSettleTarget(c);
    setPaymentMethod('UPI');
    setPaymentRef('');
    setSettleError(null);
  };

  const openCancel = (c: Commission) => {
    setCancelTarget(c);
    setCancelReason('');
    setCancelError(null);
  };

  const handleDistribute = async (c: Commission) => {
    try {
      await commissionsApi.distribute(c.id);
      await fetchData();
    } catch {
      /* surfaced by the list refresh; keep UI resilient */
    }
  };

  const handleSettle = async () => {
    if (!settleTarget) return;
    if (!paymentRef.trim()) {
      setSettleError('Payment reference is required.');
      return;
    }
    setSettling(true);
    setSettleError(null);
    try {
      await commissionsApi.settle(settleTarget.id, {
        payoutReference: `${paymentMethod}: ${paymentRef.trim()}`,
      });
      setSettleTarget(null);
      await fetchData();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setSettleError(e?.response?.data?.message || 'Failed to settle commission.');
    } finally {
      setSettling(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      setCancelError('Reason is required.');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await commissionsApi.cancel(cancelTarget.id, { reason: cancelReason.trim() });
      setCancelTarget(null);
      await fetchData();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setCancelError(e?.response?.data?.message || 'Failed to cancel commission.');
    } finally {
      setCancelling(false);
    }
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'SETTLED', label: 'Settled' },
    { key: 'DISTRIBUTED', label: 'Distributed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  const columns = [
    {
      key: 'dealer',
      header: 'Dealer',
      render: (c: Commission) => (
        <div>
          <p className="font-medium text-foreground">{c.dealer?.user?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">
            {c.transaction?.property?.flatNumber
              ? `${c.transaction.property.flatNumber}${
                  c.transaction.property.towerBlock ? `, ${c.transaction.property.towerBlock}` : ''
                }`
              : `Txn ${c.transactionId.slice(0, 8)}`}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (c: Commission) => (
        <div>
          <p className="font-medium text-foreground">{formatCurrency(c.amount)}</p>
          <p className="text-xs text-muted-foreground">GST {formatCurrency(c.gst)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Commission) => <Badge variant={statusVariant(c.status)}>{c.status}</Badge>,
    },
    {
      key: 'detail',
      header: 'Detail',
      render: (c: Commission) => {
        if (c.status === 'SETTLED') {
          return (
            <div className="text-xs">
              <p className="text-foreground">{c.payoutReference || '-'}</p>
              <p className="text-muted-foreground">Settled {formatDate(c.settlementDate)}</p>
            </div>
          );
        }
        if (c.status === 'CANCELLED') {
          return (
            <p className="text-xs text-muted-foreground">
              {c.payoutReference?.replace(/^CANCELLED:\s*/, '') || 'No reason recorded'}
            </p>
          );
        }
        return <p className="text-xs text-muted-foreground">Created {formatDate(c.createdAt)}</p>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Commission) => {
        if (!isSuperAdmin) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        if (c.status === 'SETTLED') {
          return (
            <Button size="sm" onClick={() => handleDistribute(c)}>
              Mark Distributed
            </Button>
          );
        }
        if (c.status !== 'PENDING') {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => openSettle(c)}>
              Settle
            </Button>
            <Button size="sm" variant="outline" onClick={() => openCancel(c)}>
              Cancel
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Commissions</h1>
      </div>

      <div className="relative mb-4 max-w-md">
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by dealer, property, or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-body-md outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onToggle={() => setFilter(f.key)}
          />
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <h3 className="text-heading-md text-foreground">Failed to load commissions</h3>
          <p className="mt-2 max-w-sm text-body-md text-muted-foreground">{error}</p>
          <Button onClick={fetchData} className="mt-6">
            Try Again
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(c: Commission) => c.id}
          emptyMessage="No commissions found"
        />
      )}

      {/* Settle Modal */}
      <Modal
        isOpen={!!settleTarget}
        onClose={() => (settling ? null : setSettleTarget(null))}
        title="Settle Commission"
      >
        {settleTarget && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
              <p className="text-foreground">
                <span className="font-medium">{settleTarget.dealer?.user?.name || 'Dealer'}</span> ·{' '}
                {formatCurrency(settleTarget.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                GST {formatCurrency(settleTarget.gst)} · Txn{' '}
                {settleTarget.transactionId.slice(0, 8)}
              </p>
            </div>
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            />
            <Input
              label="Payment Reference"
              placeholder="e.g. UTR / transaction ID"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              required
              error={settleError ?? undefined}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSettleTarget(null)} disabled={settling}>
                Cancel
              </Button>
              <Button onClick={handleSettle} isLoading={settling}>
                Confirm Settlement
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => (cancelling ? null : setCancelTarget(null))}
        title="Cancel Commission"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
              <p className="text-foreground">
                <span className="font-medium">{cancelTarget.dealer?.user?.name || 'Dealer'}</span> ·{' '}
                {formatCurrency(cancelTarget.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Txn {cancelTarget.transactionId.slice(0, 8)}
              </p>
            </div>
            <Textarea
              label="Reason"
              placeholder="Why is this commission being cancelled?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              error={cancelError ?? undefined}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                Back
              </Button>
              <Button variant="danger" onClick={handleCancel} isLoading={cancelling}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
