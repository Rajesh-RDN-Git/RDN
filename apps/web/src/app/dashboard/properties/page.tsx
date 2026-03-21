'use client';

import { useState, useEffect } from 'react';
import { propertiesApi } from '@/lib/api/properties.api';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import Link from 'next/link';

const statusVariant = (s: string) => {
  switch (s) {
    case 'ACTIVE':
      return 'success';
    case 'DELISTED':
      return 'warning';
    default:
      return 'default';
  }
};

const verificationVariant = (s: string) => {
  switch (s) {
    case 'VERIFIED':
    case 'RWA_APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
    case 'FLAGGED':
      return 'error';
    default:
      return 'default';
  }
};

export default function PropertiesPage() {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.transactionType = typeFilter;
      const { data } = await propertiesApi.list(params);
      setProperties(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setProperties([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [page, statusFilter, typeFilter]);

  const columns = [
    {
      key: 'property',
      header: 'Property',
      render: (item: any) => (
        <div>
          <p className="font-medium">
            {item.bhk} BHK {item.type}
          </p>
          <p className="text-sm text-gray-500">
            {item.flatNumber}, {item.towerBlock}
          </p>
        </div>
      ),
    },
    { key: 'society', header: 'Society', render: (item: any) => item.society?.name || '-' },
    {
      key: 'transactionType',
      header: 'Type',
      render: (item: any) => (
        <Badge variant={item.transactionType === 'SALE' ? 'success' : 'info'}>
          {item.transactionType}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (item: any) => {
        const price = item.transactionType === 'SALE' ? item.priceSale : item.priceRent;
        if (!price) return '-';
        const num = Number(price);
        if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
        return `${num.toLocaleString('en-IN')}${item.transactionType === 'RENT' ? '/mo' : ''}`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge variant={statusVariant(item.status)}>{item.status}</Badge>,
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (item: any) => (
        <Badge variant={verificationVariant(item.verificationStatus)}>
          {item.verificationStatus}
        </Badge>
      ),
    },
    { key: 'views', header: 'Views', render: (item: any) => item.viewsCount },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Link href={`/property/${item.id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Properties</h1>
        {(user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN') && <Button>Add Property</Button>}
      </div>

      <div className="mb-4 flex gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DELISTED">Delisted</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>

      <div className="rounded-lg border bg-white">
        <DataTable
          columns={columns}
          data={properties}
          isLoading={loading}
          keyExtractor={(item: any) => item.id}
          emptyMessage="No properties found"
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
