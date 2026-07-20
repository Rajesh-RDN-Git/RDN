'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { leadsApi } from '@/lib/api/leads.api';
import { dealersApi } from '@/lib/api/dealers.api';
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

// Full pipeline for the status dropdown. CLOSED routes through the close-deal flow (so a
// transaction + commission are created); VISIT_SCHEDULED opens the date picker first.
const ALL_STATUSES = [
  'NEW',
  'CONTACTED',
  'NOT_PICKED',
  'INTERESTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'VISITED',
  'NEGOTIATING',
  'MEETING_ARRANGED',
  'DEAL_OPEN',
  'CLOSING',
  'CLOSED',
  'LOST',
];
const statusLabel = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

// Human-friendly labels for the lead's origin so admins can tell an in-app
// enquiry from a call-back / manual entry at a glance.
const SOURCE_LABELS: Record<string, string> = {
  APP_SEARCH: 'Enquiry',
  CALLBACK: 'Call Back',
  WHATSAPP: 'WhatsApp',
  REFERRAL: 'Referral',
  WALK_IN: 'Walk-in',
  MANUAL: 'Manual',
};
const sourceLabel = (s?: string) => (s ? (SOURCE_LABELS[s] ?? s) : '-');

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
  // Super admins can add leads by hand, forward them to any dealer, and see the
  // prospect's phone number (the sole role exempted from phone masking).
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [leads, setLeads] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    contactName: '',
    contactPhone: '',
    source: 'CALLBACK',
    dealerId: '',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
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

  // Load active dealers once for the assign dropdown + add-lead modal (SA only).
  useEffect(() => {
    if (!isSuperAdmin) return;
    dealersApi
      .list({ limit: 200 })
      .then(({ data }) => {
        const raw = data?.data ?? data;
        setDealers(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setDealers([]));
  }, [isSuperAdmin]);

  const handleAssign = async (leadId: string, dealerId: string) => {
    if (!dealerId) return;
    setAssigningId(leadId);
    try {
      await leadsApi.assign(leadId, dealerId);
      showToast.success('Lead assigned to dealer');
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast.error(err?.response?.data?.message || 'Failed to assign lead');
    }
    setAssigningId(null);
  };

  const handleAddLead = async () => {
    if (!addForm.contactName.trim() || !addForm.contactPhone.trim()) {
      setAddError('Name and phone are required.');
      return;
    }
    setAddSubmitting(true);
    setAddError(null);
    try {
      await leadsApi.createManual({
        contactName: addForm.contactName.trim(),
        contactPhone: addForm.contactPhone.trim(),
        source: addForm.source,
        ...(addForm.dealerId ? { dealerId: addForm.dealerId } : {}),
      });
      showToast.success('Lead added');
      setAddLeadOpen(false);
      setAddForm({ contactName: '', contactPhone: '', source: 'CALLBACK', dealerId: '' });
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAddError(err?.response?.data?.message || 'Failed to add lead.');
    }
    setAddSubmitting(false);
  };

  const dealerName = (d: any) => d.user?.name || d.name || 'Dealer';

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
      key: 'refId',
      header: 'ID',
      render: (item: any) => (
        <span className="font-mono text-label-md text-foreground">{item.refId || '-'}</span>
      ),
    },
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
      render: (item: any) => (
        <span className="text-body-md">{item.buyer?.name || item.contactName || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item: any) => {
        const phone = item.buyer?.phone || item.contactPhone;
        return phone ? (
          <a href={`tel:${phone}`} className="text-body-md text-brand hover:underline">
            {phone}
          </a>
        ) : (
          <span className="text-body-md text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'dealer',
      header: 'Dealer',
      render: (item: any) => <span className="text-body-md">{item.dealer?.user?.name || '-'}</span>,
    },
    {
      key: 'assign',
      header: 'Assign',
      render: (item: any) => (
        <Select
          value=""
          disabled={assigningId === item.id}
          onChange={(e) => handleAssign(item.id, e.target.value)}
          className="min-w-[140px]"
        >
          <option value="">{item.dealer?.user?.name ? 'Reassign…' : 'Assign dealer…'}</option>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {dealerName(d)}
            </option>
          ))}
        </Select>
      ),
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
    {
      key: 'source',
      header: 'Source',
      render: (item: any) => <Badge>{sourceLabel(item.source)}</Badge>,
    },
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
              canAdvance && (
                <Select
                  aria-label="Change lead status"
                  value={item.status}
                  disabled={isAdvancing}
                  className="min-w-[160px]"
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === item.status) return;
                    // CLOSED goes through the close-deal flow (creates txn + commission);
                    // VISIT_SCHEDULED opens the date picker first.
                    if (next === 'VISIT_SCHEDULED') {
                      setScheduleFor(item.id);
                      setScheduleDate(tomorrowISO());
                    } else if (next === 'CLOSED') {
                      setCloseDealModal(item);
                    } else {
                      handleAdvanceStatus(item.id, next);
                    }
                  }}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </Select>
              )
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
  // Phone (unmasked) + manual Assign are SUPER_ADMIN-only.
  const visibleColumns = isBuyer
    ? columns.filter((c) => ['property', 'society', 'status', 'date', 'message'].includes(c.key))
    : columns.filter(
        (c) => c.key !== 'message' && (isSuperAdmin || (c.key !== 'phone' && c.key !== 'assign')),
      );

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
        {isSuperAdmin && <Button onClick={() => setAddLeadOpen(true)}>Add Lead</Button>}
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

      <Modal isOpen={addLeadOpen} onClose={() => setAddLeadOpen(false)} title="Add Lead">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-label-sm text-foreground">Contact name</label>
            <Input
              value={addForm.contactName}
              onChange={(e) => setAddForm((f) => ({ ...f, contactName: e.target.value }))}
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-foreground">Phone</label>
            <Input
              value={addForm.contactPhone}
              onChange={(e) => setAddForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="e.g. +919876543210"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-foreground">Source</label>
            <Select
              value={addForm.source}
              onChange={(e) => setAddForm((f) => ({ ...f, source: e.target.value }))}
            >
              <option value="CALLBACK">Call Back</option>
              <option value="MANUAL">Manual</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="REFERRAL">Referral</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-foreground">
              Assign to dealer (optional)
            </label>
            <Select
              value={addForm.dealerId}
              onChange={(e) => setAddForm((f) => ({ ...f, dealerId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {dealerName(d)}
                </option>
              ))}
            </Select>
          </div>
          {addError && (
            <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
              {addError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setAddLeadOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddLead} isLoading={addSubmitting} className="flex-1">
              Add Lead
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
