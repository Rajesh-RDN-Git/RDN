'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Role } from '@rdn/shared';
import { useAuth } from '@/hooks/use-auth';
import {
  grievancesApi,
  type Grievance,
  type GrievanceStatus,
  type ListGrievancesParams,
} from '@/lib/api/grievances.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldIcon, SearchIcon } from '@/components/ui/icons';
import { showToast } from '@/stores/toast-store';
import { FileGrievanceModal } from '@/components/grievance/file-grievance-modal';

type StatusFilter = 'ALL' | GrievanceStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const STATUS_LABEL: Record<GrievanceStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const STATUS_VARIANT: Record<
  GrievanceStatus,
  'default' | 'success' | 'warning' | 'error' | 'info' | 'brand'
> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  ESCALATED: 'error',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const SEVERITY_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'error' | 'info' | 'brand'
> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

const CATEGORY_LABEL: Record<string, string> = {
  DEALER_CONDUCT: 'Dealer Conduct',
  PROPERTY_MISMATCH: 'Property Mismatch',
  COMMISSION: 'Commission',
  SERVICE: 'Service',
  SAFETY: 'Safety',
  OTHER: 'Other',
};

interface ListResponse {
  data: Grievance[];
  total: number;
  page: number;
  limit: number;
}

export default function GrievancesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.RWA_ADMIN;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [items, setItems] = useState<Grievance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fileOpen, setFileOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<Grievance | null>(null);
  const [closeTarget, setCloseTarget] = useState<Grievance | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((g) =>
      [g.description, g.filer?.name, CATEGORY_LABEL[g.category] || g.category, g.society?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, search]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListGrievancesParams = { page, limit };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await grievancesApi.list(params);
      const payload = data as ListResponse;
      setItems(payload.data || []);
      setTotal(payload.total || 0);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to load grievances.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFilter = (value: StatusFilter) => {
    setPage(1);
    setStatusFilter(value);
  };

  const handleMarkInProgress = async (g: Grievance) => {
    setActionLoadingId(g.id);
    try {
      await grievancesApi.update(g.id, { status: 'IN_PROGRESS' });
      showToast.success('Marked as in progress');
      await refresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast.error(e?.response?.data?.message || 'Failed to update grievance');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openResolve = (g: Grievance) => {
    setResolveTarget(g);
    setActionNotes('');
    setActionError(null);
  };

  const openClose = (g: Grievance) => {
    setCloseTarget(g);
    setActionNotes('');
    setActionError(null);
  };

  const submitResolve = async () => {
    if (!resolveTarget) return;
    if (actionNotes.trim().length < 5) {
      setActionError('Please add a short resolution note (at least 5 characters).');
      return;
    }
    setActionSubmitting(true);
    setActionError(null);
    try {
      await grievancesApi.update(resolveTarget.id, {
        status: 'RESOLVED',
        resolutionNotes: actionNotes.trim(),
      });
      showToast.success('Grievance resolved');
      setResolveTarget(null);
      setActionNotes('');
      await refresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionError(e?.response?.data?.message || 'Failed to resolve grievance');
    } finally {
      setActionSubmitting(false);
    }
  };

  const submitClose = async () => {
    if (!closeTarget) return;
    if (actionNotes.trim().length < 5) {
      setActionError('Please add a reason (at least 5 characters).');
      return;
    }
    setActionSubmitting(true);
    setActionError(null);
    try {
      await grievancesApi.update(closeTarget.id, {
        status: 'CLOSED',
        resolutionNotes: actionNotes.trim(),
      });
      showToast.success('Grievance closed');
      setCloseTarget(null);
      setActionNotes('');
      await refresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionError(e?.response?.data?.message || 'Failed to close grievance');
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      // Invalid date
      return iso;
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-heading-xl text-foreground">Grievances</h1>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {isAdmin
              ? 'Triage and resolve grievances filed by users.'
              : 'Track grievances you have filed.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setFileOpen(true)}>
          File a Grievance
        </Button>
      </div>

      <div className="relative mb-4 max-w-md">
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by description, filer, category, or society..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-body-md outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={statusFilter === f.value}
            onToggle={() => handleFilter(f.value)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-body-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="border-b border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
            {error}
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            icon={<ShieldIcon size={32} />}
            title="No grievances found"
            description={
              search.trim()
                ? `No grievances match "${search.trim()}".`
                : statusFilter === 'ALL'
                  ? 'Nothing here yet. Filed grievances will appear in this list.'
                  : `No grievances with status ${STATUS_LABEL[statusFilter as GrievanceStatus] || statusFilter}.`
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {visibleItems.map((g) => (
              <li key={g.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_VARIANT[g.status]} size="sm">
                        {STATUS_LABEL[g.status]}
                      </Badge>
                      <Badge variant={SEVERITY_VARIANT[g.severity] || 'default'} size="sm">
                        {g.severity}
                      </Badge>
                      <span className="text-caption-md text-muted-foreground">
                        {CATEGORY_LABEL[g.category] || g.category}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-body-md text-foreground">
                      {g.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption-md text-muted-foreground">
                      <span>Filed by {g.filer?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDate(g.createdAt)}</span>
                      {g.society?.name && (
                        <>
                          <span>•</span>
                          <span>{g.society.name}</span>
                        </>
                      )}
                    </div>
                    {g.resolutionNotes && (
                      <p className="mt-2 rounded-md bg-subtle px-3 py-2 text-body-sm text-foreground">
                        <span className="font-medium">Resolution:</span> {g.resolutionNotes}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col items-end gap-2">
                      {g.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          onClick={() => handleMarkInProgress(g)}
                          isLoading={actionLoadingId === g.id}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {(g.status === 'OPEN' ||
                        g.status === 'IN_PROGRESS' ||
                        g.status === 'ESCALATED') && (
                        <div className="flex gap-2">
                          <Button variant="primary" onClick={() => openResolve(g)}>
                            Resolve
                          </Button>
                          <Button variant="danger" onClick={() => openClose(g)}>
                            Close
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <FileGrievanceModal
        open={fileOpen}
        onClose={() => setFileOpen(false)}
        onSubmitted={refresh}
      />

      <Modal
        isOpen={!!resolveTarget}
        onClose={() => {
          if (!actionSubmitting) {
            setResolveTarget(null);
            setActionNotes('');
            setActionError(null);
          }
        }}
        title="Resolve Grievance"
      >
        <div>
          <p className="mb-3 text-body-sm text-muted-foreground">
            Add a resolution note to inform the filer.
          </p>
          <Textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Describe how the issue was resolved..."
            rows={5}
            error={actionError || undefined}
          />
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setResolveTarget(null);
                setActionNotes('');
                setActionError(null);
              }}
              disabled={actionSubmitting}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={submitResolve} isLoading={actionSubmitting}>
              Resolve
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!closeTarget}
        onClose={() => {
          if (!actionSubmitting) {
            setCloseTarget(null);
            setActionNotes('');
            setActionError(null);
          }
        }}
        title="Close Grievance"
      >
        <div>
          <p className="mb-3 text-body-sm text-muted-foreground">
            Provide a reason for closing this grievance.
          </p>
          <Textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Reason for closure..."
            rows={5}
            error={actionError || undefined}
          />
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCloseTarget(null);
                setActionNotes('');
                setActionError(null);
              }}
              disabled={actionSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={submitClose}
              isLoading={actionSubmitting}
            >
              Close Grievance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
