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
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('');

  const fetchDealers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (activeFilter) params.isActive = activeFilter;
      const { data } = await dealersApi.list(params);
      setDealers(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setDealers([]);
      setError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : 'Failed to load dealers.',
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDealers();
  }, [page, activeFilter]);

  const handleApprove = async (id: string) => {
    setActionError(null);
    try {
      await dealersApi.approve(id);
      fetchDealers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to approve dealer.');
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    try {
      await dealersApi.reject(id);
      fetchDealers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reject dealer.');
    }
  };

  const handleKycUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    try {
      await dealersApi.updateKyc(id, status);
      fetchDealers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to update KYC status.');
    }
  };

  const handleCompleteTraining = async (id: string) => {
    setActionError(null);
    try {
      await dealersApi.completeTraining(id);
      fetchDealers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to mark training complete.');
    }
  };

  const handleSetActive = async (id: string, isActive: boolean) => {
    setActionError(null);
    try {
      await dealersApi.setActive(id, isActive);
      fetchDealers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to update dealer status.');
    }
  };

  const handleCertify = async (id: string, certify: boolean) => {
    setActionError(null);
    try {
      if (certify) await dealersApi.certify(id);
      else await dealersApi.revokeCertification(id);
      fetchDealers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to update certification.');
    }
  };

  const columns = [
    {
      key: 'dealer',
      header: 'Dealer',
      render: (item: any) => (
        <div>
          <p className="font-medium">{item.user?.name}</p>
          <p className="text-sm text-muted-foreground">{item.user?.email}</p>
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
      key: 'certification',
      header: 'Certification',
      render: (item: any) => (
        <Badge
          variant={
            item.certificationStatus === 'CERTIFIED'
              ? 'success'
              : item.certificationStatus === 'REVOKED'
                ? 'error'
                : 'default'
          }
        >
          {item.certificationStatus === 'CERTIFIED'
            ? 'Certified'
            : item.certificationStatus === 'REVOKED'
              ? 'Revoked'
              : 'Not certified'}
        </Badge>
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
        <div className="flex flex-wrap gap-2">
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
          {user?.role === 'SUPER_ADMIN' && item.kycStatus === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => handleKycUpdate(item.id, 'APPROVED')}>
                Approve KYC
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleKycUpdate(item.id, 'REJECTED')}
              >
                Reject KYC
              </Button>
            </>
          )}
          {user?.role === 'SUPER_ADMIN' && item.trainingStatus !== 'COMPLETED' && (
            <Button size="sm" variant="secondary" onClick={() => handleCompleteTraining(item.id)}>
              Mark Training Complete
            </Button>
          )}
          {user?.role === 'SUPER_ADMIN' &&
            (item.isActive ? (
              <Button size="sm" variant="outline" onClick={() => handleSetActive(item.id, false)}>
                Deactivate
              </Button>
            ) : (
              item.kycStatus === 'APPROVED' &&
              item.rwaApprovalStatus === 'APPROVED' &&
              item.trainingStatus === 'COMPLETED' && (
                <Button size="sm" onClick={() => handleSetActive(item.id, true)}>
                  Activate
                </Button>
              )
            ))}
          {user?.role === 'SUPER_ADMIN' &&
            (item.certificationStatus === 'CERTIFIED' ? (
              <Button size="sm" variant="outline" onClick={() => handleCertify(item.id, false)}>
                Revoke Cert
              </Button>
            ) : (
              item.trainingStatus === 'COMPLETED' && (
                <Button size="sm" variant="secondary" onClick={() => handleCertify(item.id, true)}>
                  Certify
                </Button>
              )
            ))}
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

      {actionError && (
        <div className="mb-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
          {actionError}
        </div>
      )}

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
          <h3 className="text-heading-md text-foreground">Failed to load dealers</h3>
          <p className="mt-2 max-w-sm text-body-md text-muted-foreground">{error}</p>
          <Button onClick={fetchDealers} className="mt-6">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <DataTable
            columns={columns}
            data={dealers}
            isLoading={loading}
            keyExtractor={(item: any) => item.id}
            emptyMessage="No dealers found"
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
