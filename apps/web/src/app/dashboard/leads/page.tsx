'use client';

import { useState, useEffect } from 'react';
import { leadsApi } from '@/lib/api/leads.api';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';

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
  NEW: { label: 'HOT', color: 'bg-red-100 text-red-700' },
  CONTACTED: { label: 'WARM', color: 'bg-amber-100 text-amber-700' },
  VISIT_SCHEDULED: { label: 'WARM', color: 'bg-amber-100 text-amber-700' },
  NEGOTIATING: { label: 'HOT', color: 'bg-red-100 text-red-700' },
  CLOSING: { label: 'URGENT', color: 'bg-red-100 text-red-800 font-bold' },
  VISITED: { label: 'FOLLOW UP', color: 'bg-blue-100 text-blue-700' },
  CLOSED: { label: 'DONE', color: 'bg-green-100 text-green-700' },
  LOST: { label: 'COLD', color: 'bg-gray-100 text-gray-500' },
};

export default function LeadsPage() {
  const { user } = useAuthStore();
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
          <p className="text-label-md text-gray-900">
            {item.property?.flatNumber}, {item.property?.towerBlock}
          </p>
          <p className="text-caption-md text-gray-500">
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
        const p = priorityConfig[item.status] || { label: '-', color: 'bg-gray-100 text-gray-500' };
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
        <span className="text-body-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex gap-2">
          {(item.status === 'NEGOTIATING' || item.status === 'CLOSING') &&
            (user?.role === 'DEALER' || user?.role === 'SUPER_ADMIN') && (
              <Button size="sm" onClick={() => setCloseDealModal(item)}>
                Close Deal
              </Button>
            )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-gray-900">Leads</h1>
          {total > 0 && <p className="mt-0.5 text-body-sm text-gray-500">{total} leads total</p>}
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <svg
              className="h-7 w-7 text-red-500"
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
          <h3 className="text-heading-md text-gray-900">Failed to load leads</h3>
          <p className="mt-2 max-w-sm text-body-md text-gray-500">{error}</p>
          <Button onClick={fetchLeads} className="mt-6">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            data={leads}
            isLoading={loading}
            keyExtractor={(item: any) => item.id}
            emptyMessage="No leads found"
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
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-body-md text-gray-700">
              Close deal for{' '}
              <span className="font-medium">
                {closeDealModal?.property?.flatNumber}, {closeDealModal?.property?.towerBlock}
              </span>
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-gray-700">Transaction Type</label>
            <Select value={dealType} onChange={(e) => setDealType(e.target.value)}>
              <option value="RENT">Rent</option>
              <option value="SALE">Sale</option>
              <option value="RENEWAL">Renewal</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-gray-700">Deal Value (INR)</label>
            <Input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Enter deal value"
            />
          </div>
          {closeDealError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700">
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
