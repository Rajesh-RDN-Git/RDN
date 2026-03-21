'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api/reports.api';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type TabKey = 'dashboard' | 'leads' | 'transactions' | 'commissions';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'dashboard') {
          const { data } = await reportsApi.dashboard();
          setDashboardData(data);
        } else {
          const params: Record<string, unknown> = {};
          if (dateFrom) params.from = dateFrom;
          if (dateTo) params.to = dateTo;
          const api =
            activeTab === 'leads'
              ? reportsApi.leads
              : activeTab === 'transactions'
                ? reportsApi.transactions
                : reportsApi.commissions;
          const { data } = await api(params);
          setReportData(data.data || data || []);
        }
      } catch {
        /\* ignore \*/;
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, dateFrom, dateTo]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'leads', label: 'Leads' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'commissions', label: 'Commissions' },
  ];

  const leadColumns = [
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge>{item.status || item._id}</Badge>,
    },
    { key: 'count', header: 'Count', render: (item: any) => item.count || item._count || '-' },
  ];

  const txnColumns = [
    { key: 'type', header: 'Type', render: (item: any) => item.type || item._id || '-' },
    { key: 'count', header: 'Count', render: (item: any) => item.count || item._count || '-' },
    {
      key: 'totalValue',
      header: 'Total Value',
      render: (item: any) => {
        const val = Number(item.totalValue || item._sum?.dealValue || 0);
        if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
        return val.toLocaleString('en-IN');
      },
    },
  ];

  const commColumns = [
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge>{item.status || item._id}</Badge>,
    },
    { key: 'count', header: 'Count', render: (item: any) => item.count || item._count || '-' },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (item: any) => {
        const val = Number(item.totalAmount || item._sum?.amount || 0);
        return val.toLocaleString('en-IN');
      },
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Reports</h1>

      <div className="mb-6 flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'dashboard' && (
        <div className="mb-4 flex gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Properties" value={dashboardData?.totalProperties || 0} />
          <StatCard label="Active Leads" value={dashboardData?.activeLeads || 0} />
          <StatCard label="Transactions" value={dashboardData?.totalTransactions || 0} />
          <StatCard
            label="Revenue"
            value={`${((dashboardData?.totalRevenue || 0) / 100000).toFixed(1)}L`}
          />
          <StatCard label="Active Dealers" value={dashboardData?.activeDealers || 0} />
          <StatCard label="Societies" value={dashboardData?.totalSocieties || 0} />
          <StatCard label="Pending Commissions" value={dashboardData?.pendingCommissions || 0} />
          <StatCard label="Open Grievances" value={dashboardData?.openGrievances || 0} />
        </div>
      ) : activeTab === 'leads' ? (
        <div className="rounded-lg border bg-white">
          <DataTable
            columns={leadColumns}
            data={reportData}
            keyExtractor={(item: any, i?: number) => item.status || item._id || String(i)}
            emptyMessage="No lead data"
          />
        </div>
      ) : activeTab === 'transactions' ? (
        <div className="rounded-lg border bg-white">
          <DataTable
            columns={txnColumns}
            data={reportData}
            keyExtractor={(item: any, i?: number) => item.type || item._id || String(i)}
            emptyMessage="No transaction data"
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <DataTable
            columns={commColumns}
            data={reportData}
            keyExtractor={(item: any, i?: number) => item.status || item._id || String(i)}
            emptyMessage="No commission data"
          />
        </div>
      )}
    </div>
  );
}
