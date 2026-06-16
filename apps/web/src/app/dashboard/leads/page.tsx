'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { CheckIcon, PhoneIcon, ChatIcon, SearchIcon } from '@/components/ui/icons';
import { showToast } from '@/stores/toast-store';

// The dealer CRM pipeline. Each status maps to the actions available from it.
// CLOSED/LOST are terminal; closing the deal uses the close-deal endpoint.
// "Plan Visit" (-> VISIT_SCHEDULED) opens an inline date picker.
type LeadAction = { next: string; label: string };
const NEXT_ACTIONS: Record<string, LeadAction[]> = {
  NEW: [{ next: 'CONTACTED', label: 'Mark Called' }],
  CONTACTED: [
    { next: 'QUALIFIED', label: 'Qualified' },
    { next: 'INTERESTED', label: 'Interested' },
    { next: 'NOT_PICKED', label: 'Not Picked' },
  ],
  NOT_PICKED: [{ next: 'CONTACTED', label: 'Call Again' }],
  INTERESTED: [{ next: 'QUALIFIED', label: 'Qualified' }],
  QUALIFIED: [{ next: 'VISIT_SCHEDULED', label: 'Plan Visit' }],
  VISIT_SCHEDULED: [{ next: 'VISITED', label: 'Mark Visit Done' }],
  VISITED: [{ next: 'NEGOTIATING', label: 'Start Negotiation' }],
  NEGOTIATING: [{ next: 'MEETING_ARRANGED', label: 'Arrange Meeting' }],
  MEETING_ARRANGED: [{ next: 'DEAL_OPEN', label: 'Open Deal' }],
};

// Statuses from which a deal can be closed (creates txn + commission).
const CLOSEABLE = ['NEGOTIATING', 'MEETING_ARRANGED', 'DEAL_OPEN', 'CLOSING'];

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const statusVariant = (s: string) => {
  switch (s) {
    case 'NEW':
    case 'INTERESTED':
      return 'info';
    case 'CONTACTED':
    case 'QUALIFIED':
    case 'VISIT_SCHEDULED':
    case 'VISITED':
      return 'warning';
    case 'NEGOTIATING':
    case 'MEETING_ARRANGED':
    case 'DEAL_OPEN':
    case 'CLOSING':
      return 'info';
    case 'CLOSED':
      return 'success';
    case 'NOT_PICKED':
    case 'LOST':
      return 'error';
    default:
      return 'default';
  }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'HOT', color: 'bg-error-bg text-error-text' },
  CONTACTED: { label: 'WARM', color: 'bg-warning-bg text-warning-text' },
  NOT_PICKED: { label: 'RETRY', color: 'bg-warning-bg text-warning-text' },
  INTERESTED: { label: 'WARM', color: 'bg-warning-bg text-warning-text' },
  QUALIFIED: { label: 'HOT', color: 'bg-error-bg text-error-text' },
  VISIT_SCHEDULED: { label: 'WARM', color: 'bg-warning-bg text-warning-text' },
  VISITED: { label: 'FOLLOW UP', color: 'bg-info-bg text-info-text' },
  NEGOTIATING: { label: 'HOT', color: 'bg-error-bg text-error-text' },
  MEETING_ARRANGED: { label: 'HOT', color: 'bg-error-bg text-error-text' },
  DEAL_OPEN: { label: 'URGENT', color: 'bg-error-bg text-error-text font-bold' },
  CLOSING: { label: 'URGENT', color: 'bg-error-bg text-error-text font-bold' },
  CLOSED: { label: 'DONE', color: 'bg-success-bg text-success-text' },
  LOST: { label: 'COLD', color: 'bg-subtle text-muted-foreground' },
};

export default function LeadsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  // Buyers see their own enquiries ("My Inquiries"): no internal CRM columns
  // (assigned dealer, lead priority) and no status-advancing actions.
  const isBuyer = user?.role === 'BUYER_TENANT';
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
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
  const [messagingId, setMessagingId] = useState<string | null>(null);

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

  // Buyer-initiated chat: open (or resume) a masked conversation with the
  // assigned dealer for this lead, then jump to the chat screen.
  const handleMessageDealer = async (lead: any) => {
    const dealerUserId = lead.dealer?.user?.id;
    if (!dealerUserId) return;
    setMessagingId(lead.id);
    try {
      await communicationApi.createConversation({
        leadId: lead.id,
        participantId: dealerUserId,
      });
      router.push('/dashboard/chat');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast.error(err?.response?.data?.message || 'Could not start chat right now');
      setMessagingId(null);
    }
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
      key: 'message',
      header: '',
      render: (item: any) =>
        item.dealer?.user?.id ? (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ChatIcon size={14} />}
            isLoading={messagingId === item.id}
            onClick={() => handleMessageDealer(item)}
          >
            Message
          </Button>
        ) : (
          <span className="text-caption-md text-muted-foreground">Awaiting dealer</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => {
        const canAdvance = user?.role === 'DEALER' || user?.role === 'SUPER_ADMIN';
        const actions = NEXT_ACTIONS[item.status] || [];
        const isScheduling = scheduleFor === item.id;
        const isAdvancing = advancingId === item.id;
        const isTerminal = item.status === 'CLOSED' || item.status === 'LOST';
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
            {canAdvance && isScheduling ? (
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
            ) : (
              canAdvance &&
              actions.map((a) => (
                <Button
                  key={a.next}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (a.next === 'VISIT_SCHEDULED') {
                      setScheduleFor(item.id);
                      setScheduleDate(tomorrowISO());
                    } else {
                      handleAdvanceStatus(item.id, a.next);
                    }
                  }}
                  isLoading={isAdvancing}
                >
                  {a.label}
                </Button>
              ))
            )}
            {canAdvance && CLOSEABLE.includes(item.status) && (
              <Button size="sm" onClick={() => setCloseDealModal(item)}>
                Close Deal
              </Button>
            )}
            {canAdvance && !isTerminal && !isScheduling && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAdvanceStatus(item.id, 'LOST')}
              >
                Lost
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
    ? columns.filter((c) => ['property', 'society', 'status', 'date', 'message'].includes(c.key))
    : columns.filter((c) => c.key !== 'message');

  const q = search.trim().toLowerCase();
  const filteredLeads = q
    ? leads.filter((l: any) =>
        [
          l.property?.flatNumber,
          l.property?.towerBlock,
          l.property?.society?.name,
          l.society?.name,
          l.name,
          l.contactName,
          l.enquirerName,
          l.dealer?.user?.name,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
    : leads;

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

      <div className="relative mb-4 max-w-md">
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by property, society, or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-body-md outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-ring"
        />
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
          <option value="CONTACTED">Called</option>
          <option value="NOT_PICKED">Not Picked</option>
          <option value="INTERESTED">Interested</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="VISIT_SCHEDULED">Visit Planned</option>
          <option value="VISITED">Visit Done</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="MEETING_ARRANGED">Meeting Arranged</option>
          <option value="DEAL_OPEN">Deal Open</option>
          <option value="CLOSED">Deal Closed</option>
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
            data={filteredLeads}
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
