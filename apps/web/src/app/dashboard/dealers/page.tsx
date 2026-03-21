'use client';

import { useState, useEffect } from 'react';
import { dealersApi } from '@/lib/api/dealers.api';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';

const kycVariant = (s: string) => {
  switch (s) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    default:
      return 'warning';
  }
};

export default function DealersPage() {
  const { user } = useAuthStore();
  const [dealers, setDealers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (activeFilter) params.isActive = activeFilter;
      const { data } = await dealersApi.list(params);
      setDealers(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setDealers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDealers();
  }, [page, activeFilter]);

  const handleApprove = async (id: string) => {
    try {
      await dealersApi.approve(id);
      fetchDealers();
    } catch {
      /\* ignore \*/;
    }
  };

  const handleReject = async (id: string) => {
    try {
      await dealersApi.reject(id);
      fetchDealers();
    } catch {
      /\* ignore \*/;
    }
  };

  const columns = [
    {
      key: 'dealer',
      header: 'Dealer',
      render: (item: any) => (
        <div>
          <p className="font-medium">{item.user?.name}</p>
          <p className="text-sm text-gray-500">{item.user?.email}</p>
        </div>
      ),
    },
    { key: 'society', header: 'Society', render: (item: any) => item.society?.name || '-' },
    {
      key: 'kyc',
      header: 'KYC',
      render: (item: any) => <Badge variant={kycVariant(item.kycStatus)}>{item.kycStatus}</Badge>,
    },
    {
      key: 'approval',
      header: 'RWA Approval',
      render: (item: any) => (
        <Badge variant={kycVariant(item.rwaApprovalStatus)}>{item.rwaApprovalStatus}</Badge>
      ),
    },
    {
      key: 'training',
      header: 'Training',
      render: (item: any) => (
        <Badge variant={item.trainingStatus === 'COMPLETED' ? 'success' : 'warning'}>
          {item.trainingStatus}
        </Badge>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      render: (item: any) => (
        <Badge variant={item.isActive ? 'success' : 'error'}>{item.isActive ? 'Yes' : 'No'}</Badge>
      ),
    },
    {
      key: 'stats',
      header: 'Leads / Commissions',
      render: (item: any) => `${item._count?.leads || 0} / ${item._count?.commissions || 0}`,
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex gap-2">
          {item.rwaApprovalStatus === 'PENDING' &&
            (user?.role === 'RWA_ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <>
                <Button size="sm" onClick={() => handleApprove(item.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReject(item.id)}>
                  Reject
                </Button>
              </>
            )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Dealers</h1>

      <div className="mb-4">
        <Select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive/Pending</option>
        </Select>
      </div>

      <div className="rounded-lg border bg-white">
        <DataTable
          columns={columns}
          data={dealers}
          isLoading={loading}
          keyExtractor={(item: any) => item.id}
          emptyMessage="No dealers found"
        />
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={setPage}
        className="mt-4"
      />
    </div>
  );
}
