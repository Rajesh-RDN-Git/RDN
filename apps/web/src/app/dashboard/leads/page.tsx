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

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await leadsApi.list(params);
      setLeads(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setLeads([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const handleCloseDeal = async () => {
    if (!closeDealModal || !dealValue) return;
    setSubmitting(true);
    try {
      await leadsApi.closeDeal(closeDealModal.id, { type: dealType, dealValue: Number(dealValue) });
      setCloseDealModal(null);
      setDealValue('');
      fetchLeads();
    } catch {
      /\* ignore \*/;
    }
    setSubmitting(false);
  };

  const columns = [
    {
      key: 'property',
      header: 'Property',
      render: (item: any) => (
        <div>
          <p className="font-medium">
            {item.property?.flatNumber}, {item.property?.towerBlock}
          </p>
          <p className="text-sm text-gray-500">
            {item.property?.bhk || '-'} BHK {item.property?.type || ''}
          </p>
        </div>
      ),
    },
    { key: 'buyer', header: 'Buyer', render: (item: any) => item.buyer?.name || '-' },
    { key: 'dealer', header: 'Dealer', render: (item: any) => item.dealer?.user?.name || '-' },
    { key: 'society', header: 'Society', render: (item: any) => item.society?.name || '-' },
    { key: 'source', header: 'Source', render: (item: any) => <Badge>{item.source}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge variant={statusVariant(item.status)}>{item.status}</Badge>,
    },
    {
      key: 'date',
      header: 'Created',
      render: (item: any) => new Date(item.createdAt).toLocaleDateString('en-IN'),
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
      <h1 className="mb-6 text-3xl font-bold">Leads</h1>

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

      <div className="rounded-lg border bg-white">
        <DataTable
          columns={columns}
          data={leads}
          isLoading={loading}
          keyExtractor={(item: any) => item.id}
          emptyMessage="No leads found"
        />
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={setPage}
        className="mt-4"
      />

      <Modal isOpen={!!closeDealModal} onClose={() => setCloseDealModal(null)} title="Close Deal">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Close deal for {closeDealModal?.property?.flatNumber},{' '}
            {closeDealModal?.property?.towerBlock}
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Transaction Type</label>
            <Select value={dealType} onChange={(e) => setDealType(e.target.value)}>
              <option value="RENT">Rent</option>
              <option value="SALE">Sale</option>
              <option value="RENEWAL">Renewal</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Deal Value (INR)</label>
            <Input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Enter deal value"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCloseDealModal(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCloseDeal}
              disabled={submitting || !dealValue}
              className="flex-1"
            >
              {submitting ? 'Processing...' : 'Close Deal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
