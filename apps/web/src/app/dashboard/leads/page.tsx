'use client';

import { useState, useEffect } from 'react';
import { leadsApi } from '@/lib/api/leads.api';
import { communicationApi } from '@/lib/api/communication.api';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { CheckIcon, PhoneIcon } from '@/components/ui/icons';
import { showToast } from '@/stores/toast-store';

// Maps the current lead status to the next allowed status + button label.
// Excludes CLOSED (handled by close-deal endpoint) and terminal states.
const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  NEW: { next: 'CONTACTED', label: 'Mark Contacted' },
  CONTACTED: { next: 'VISIT_SCHEDULED', label: 'Schedule Visit' },
  VISIT_SCHEDULED: { next: 'VISITED', label: 'Mark Visited' },
  VISITED: { next: 'NEGOTIATING', label: 'Start Negotiation' },
  NEGOTIATING: { next: 'CLOSING', label: 'Move to Closing' },
};

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const statusVariant = (s: string) => {
  switch (s) {
    case 'NEW':
      return 'info';
    case 'CONTACTED':
    case 'VISIT_SCHEDULED':
    case 'VISITED':
      return 'warning';
    case 'NEGOTIATING':
    case 'CLOSING':
      return 'info';
    case 'CLOSED':
      return 'success';
    case 'LOST':
      return 'error';
    default:
      return 'default';
  }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'HOT', color: 'bg-error-bg text-error-text' },
  CONTACTED: { label: 'WARM', color: 'bg-warning-bg text-warning-text' },
  VISIT_SCHEDULED: { label: 'WARM', color: 'bg-warning-bg text-warning-text' },
  NEGOTIATING: { label: 'HOT', color: 'bg-error-bg text-error-text' },
  CLOSING: { label: 'URGENT', color: 'bg-error-bg text-error-text font-bold' },
  VISITED: { label: 'FOLLOW UP', color: 'bg-info-bg text-info-text' },
  CLOSED: { label: 'DONE', color: 'bg-success-bg text-success-text' },
  LOST: { label: 'COLD', color: 'bg-subtle text-muted-foreground' },
};

export default function LeadsPage() {
  const { user } = useAuthStore();
  // Buyers see their own enquiries ("My Inquiries"): no internal CRM columns
  // (assigned dealer, lead priority) and no status-advancing actions.
  const isBuyer = user?.role === 'BUYER_TENANT';
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [closeDealModal, setCloseDealModal] = useState<any>(null);
  const [dealType, setDealType] = useState('RENT');
  const [dealValue, setDealValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closeDealError, setCloseDealError] = useState<string | null>(null);
  // Lead id -> tracks inline date-picker state for the Schedule Visit flow.
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>(tomorrowISO());
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await leadsApi.list(params);
      setLeads(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setLeads([]);
      setError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : 'Failed to load leads.',
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const handleAdvanceStatus = async (
    leadId: string,
    nextStatus: string,
    extra?: Record<string, unknown>,
  ) => {
    setAdvancingId(leadId);
    try {
      await leadsApi.update(leadId, { status: nextStatus, ...(extra || {}) });
      showToast.success(`Lead moved to ${nextStatus.replace('_', ' ').toLowerCase()}`);
      setScheduleFor(null);
      setScheduleDate(tomorrowISO());
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast.error(err?.response?.data?.message || 'Failed to update lead status');
    }
    setAdvancingId(null);
  };

  const handleCloseDeal = async () => {
    if (!closeDealModal || !dealValue) return;
    setSubmitting(true);
    setCloseDealError(null);
    try {
      await leadsApi.closeDeal(closeDealModal.id, { type: dealType, dealValue: Number(dealValue) });
      setCloseDealModal(null);
      setDealValue('');
      fetchLeads();
    } catch (err: any) {
      setCloseDealError(err?.response?.data?.message || 'Failed to close deal. Please try again.');
    }
    setSubmitting(false);
  };

  const columns = [
    {
      key: 'property',
      header: 'Property',
      render: (item: any) => (
        <div>
          <p className="text-label-md text-foreground">
            {item.property?.flatNumber}, {item.property?.towerBlock}
          </p>
          <p className="text-caption-md text-muted-foreground">
            {item.property?.bhk || '-'} BHK {item.property?.type || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer',
      render: (item: any) => <span className="text-body-md">{item.buyer?.name || '-'}</span>,
    },
    {
      key: 'dealer',
      header: 'Dealer',
      render: (item: any) => <span className="text-body-md">{item.dealer?.user?.name || '-'}</span>,
    },
    {
      key: 'society',
      header: 'Society',
      render: (item: any) => <span className="text-body-md">{item.society?.name || '-'}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: any) => {
        const p = priorityConfig[item.status] || {
          label: '-',
          color: 'bg-subtle text-muted-foreground',
        };
        return (
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${p.color}`}
          >
            {p.label}
          </span>
        );
      },
    },
    { key: 'source', header: 'Source', render: (item: any) => <Badge>{item.source}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge variant={statusVariant(item.status)}>{item.status}</Badge>,
    },
    {
      key: 'date',
      header: 'Created',
      render: (item: any) => (
        <span className="text-body-sm text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => {
        const canAdvance = user?.role === 'DEALER' || user?.role === 'SUPER_ADMIN';
        const nextStep = NEXT_STATUS[item.status];
        const isScheduling = scheduleFor === item.id;
        const isAdvancing = advancingId === item.id;
        // Dealers can place a masked call to the buyer on any open lead.
        const canCall =
          user?.role === 'DEALER' &&
          item.status !== 'CLOSED' &&
          item.status !== 'LOST' &&
          item.buyer?.id;

        return (
          <div className="flex flex-wrap items-center gap-2">
            {canCall && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<PhoneIcon size={14} />}
                isLoading={callingId === item.id}
                onClick={async () => {
                  setCallingId(item.id);
                  try {
                    await communicationApi.initiateCall({
                      leadId: item.id,
                      toUserId: item.buyer.id,
                    });
                    showToast.success('Connecting your masked call…');
                  } catch (e: unknown) {
                    const err = e as { response?: { data?: { message?: string } } };
                    showToast.error(
                      err?.response?.data?.message || 'Could not place call right now',
                    );
                  }
                  setCallingId(null);
                }}
              >
                Call
              </Button>
            )}
            {canAdvance && nextStep && (
              <>
                {item.status === 'CONTACTED' && isScheduling ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      min={todayISO()}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-body-sm text-foreground"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAdvanceStatus(item.id, 'VISIT_SCHEDULED', {
                          visitDate: new Date(scheduleDate).toISOString(),
                        })
                      }
                      isLoading={isAdvancing}
                      disabled={!scheduleDate}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setScheduleFor(null);
                        setScheduleDate(tomorrowISO());
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : item.status === 'VISIT_SCHEDULED' && !item.visitApprovedByOwner ? (
                  <span className="text-caption-md text-muted-foreground">
                    Awaiting owner approval
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (item.status === 'CONTACTED') {
                        setScheduleFor(item.id);
                        setScheduleDate(tomorrowISO());
                      } else {
                        handleAdvanceStatus(item.id, nextStep.next);
                      }
                    }}
                    isLoading={isAdvancing && !isScheduling}
                  >
                    {nextStep.label}
                  </Button>
                )}
              </>
            )}
            {(item.status === 'NEGOTIATING' || item.status === 'CLOSING') &&
              (user?.role === 'DEALER' || user?.role === 'SUPER_ADMIN') && (
                <Button size="sm" onClick={() => setCloseDealModal(item)}>
                  Close Deal
                </Button>
              )}
            {(user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN') &&
              item.status === 'VISIT_SCHEDULED' &&
              (item.visitApprovedByOwner ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success-text">
                  <CheckIcon size={14} className="text-success-icon" />
                  Visit approved
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await leadsApi.approveVisit(item.id);
                      showToast.success('Visit approved');
                      fetchLeads();
                    } catch (e: unknown) {
                      const err = e as { response?: { data?: { message?: string } } };
                      showToast.error(err?.response?.data?.message || 'Failed to approve visit');
                    }
                  }}
                >
                  Approve Visit
                </Button>
              ))}
          </div>
        );
      },
    },
  ];

  // For buyers, hide internal CRM columns and the actions column.
  const visibleColumns = isBuyer
    ? columns.filter((c) => ['property', 'society', 'status', 'date'].includes(c.key))
    : columns;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-foreground">{isBuyer ? 'My Inquiries' : 'Leads'}</h1>
          {total > 0 && (
            <p className="mt-0.5 text-body-sm text-muted-foreground">
              {isBuyer
                ? `${total} ${total === 1 ? 'inquiry' : 'inquiries'}`
                : `${total} leads total`}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="VISIT_SCHEDULED">Visit Scheduled</option>
          <option value="VISITED">Visited</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="CLOSING">Closing</option>
          <option value="CLOSED">Closed</option>
          <option value="LOST">Lost</option>
        </Select>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-bg">
            <svg
              className="h-7 w-7 text-error-icon"
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
          <h3 className="text-heading-md text-foreground">Failed to load leads</h3>
          <p className="mt-2 max-w-sm text-body-md text-muted-foreground">{error}</p>
          <Button onClick={fetchLeads} className="mt-6">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable
            columns={visibleColumns}
            data={leads}
            isLoading={loading}
            keyExtractor={(item: any) => item.id}
            emptyMessage={isBuyer ? 'No inquiries yet' : 'No leads found'}
          />
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={setPage}
        className="mt-4"
      />

      <Modal isOpen={!!closeDealModal} onClose={() => setCloseDealModal(null)} title="Close Deal">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-body-md text-foreground">
              Close deal for{' '}
              <span className="font-medium">
                {closeDealModal?.property?.flatNumber}, {closeDealModal?.property?.towerBlock}
              </span>
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-foreground">Transaction Type</label>
            <Select value={dealType} onChange={(e) => setDealType(e.target.value)}>
              <option value="RENT">Rent</option>
              <option value="SALE">Sale</option>
              <option value="RENEWAL">Renewal</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-foreground">Deal Value (INR)</label>
            <Input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Enter deal value"
            />
          </div>
          {closeDealError && (
            <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
              {closeDealError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCloseDealModal(null);
                setCloseDealError(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloseDeal}
              isLoading={submitting}
              disabled={!dealValue}
              className="flex-1"
            >
              Close Deal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
