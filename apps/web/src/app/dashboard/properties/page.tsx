'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { propertiesApi } from '@/lib/api/properties.api';
import { useAuthStore } from '@/stores/auth-store';
import { SavedProperties } from '@/components/dashboard/saved-properties';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { EyeIcon, SearchIcon } from '@/components/ui/icons';
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
  const router = useRouter();
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const canCreate = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN';
  // Buyers/tenants don't manage properties — this route is their "Saved" list.
  const isBuyer = user?.role === 'BUYER_TENANT';
  // Owners see only their own listings ("My Properties"); dealers see only
  // properties assigned to them; admins see all.
  const isOwner = user?.role === 'OWNER';
  const isDealer = user?.role === 'DEALER';
  const isRwa = user?.role === 'RWA_ADMIN';

  const fetchProperties = async () => {
    if (isBuyer) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.transactionType = typeFilter;
      if (isOwner && user?.id) params.ownerId = user.id;
      if (isDealer && user?.id) params.assignedDealerUserId = user.id;
      if (isRwa && user?.id) params.rwaAdminUserId = user.id;
      const { data } = await propertiesApi.list(params);
      setProperties(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setProperties([]);
      setError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : 'Failed to load properties.',
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [page, statusFilter, typeFilter, isBuyer, isOwner, isDealer, isRwa, user?.id]);

  const filteredProperties = searchQuery
    ? properties.filter(
        (p) =>
          p.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.towerBlock?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.society?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : properties;

  const columns = [
    {
      key: 'property',
      header: 'Property',
      render: (item: any) => (
        <div>
          <p className="text-label-md text-foreground">
            {item.bhk} BHK {item.type}
          </p>
          <p className="text-caption-md text-muted-foreground">
            {item.flatNumber}, {item.towerBlock}
          </p>
        </div>
      ),
    },
    {
      key: 'society',
      header: 'Society',
      render: (item: any) => <span className="text-body-md">{item.society?.name || '-'}</span>,
    },
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
        if (!price) return <span className="text-muted-foreground">-</span>;
        const num = Number(price);
        if (num >= 10000000)
          return <span className="text-label-md">{`₹${(num / 10000000).toFixed(2)} Cr`}</span>;
        if (num >= 100000)
          return <span className="text-label-md">{`₹${(num / 100000).toFixed(1)} L`}</span>;
        return (
          <span className="text-label-md">
            {`₹${num.toLocaleString('en-IN')}${item.transactionType === 'RENT' ? '/mo' : ''}`}
          </span>
        );
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
    {
      key: 'views',
      header: 'Views',
      render: (item: any) => (
        <span className="text-body-sm text-muted-foreground">{item.viewsCount}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/property/${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm text-brand transition-colors hover:bg-brand-subtle"
          >
            <EyeIcon size={16} /> View
          </Link>
          {(isOwner || user?.role === 'SUPER_ADMIN' || user?.role === 'RWA_ADMIN') && (
            <Link
              href={`/dashboard/properties/${item.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm text-foreground transition-colors hover:bg-muted"
            >
              Edit
            </Link>
          )}
        </div>
      ),
    },
  ];

  if (isBuyer) {
    return <SavedProperties />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-foreground">
            {isOwner ? 'My Properties' : isDealer ? 'Assigned Properties' : 'Properties'}
          </h1>
          {total > 0 && (
            <p className="mt-0.5 text-body-sm text-muted-foreground">{total} properties total</p>
          )}
        </div>
        {canCreate && (
          <Button
            leftIcon={<span aria-hidden="true">+</span>}
            onClick={() => router.push('/dashboard/properties/new')}
          >
            Add Property
          </Button>
        )}
      </div>

      {/* Search + Filters bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by flat, tower, or society..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-body-md outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-ring"
          />
        </div>
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
          <h3 className="text-heading-md text-foreground">Failed to load properties</h3>
          <p className="mt-2 max-w-sm text-body-md text-muted-foreground">{error}</p>
          <Button onClick={fetchProperties} className="mt-6">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable
            columns={columns}
            data={filteredProperties}
            isLoading={loading}
            keyExtractor={(item: any) => item.id}
            emptyMessage="No properties found"
          />
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={setPage}
        className="mt-4"
      />
    </div>
  );
}
