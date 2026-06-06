import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { reportsApi } from '@/lib/api/reports';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'leads' | 'transactions' | 'commissions';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

// ─── StatCard — identical interface to apps/mobile/app/(tabs)/index.tsx ──────

function StatCard({ label, value, color = '#2563eb' }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(val: number): string {
  if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(2)} Cr`;
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatRate(val: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((val / total) * 100);
}

// ─── Sub-components for each detail section ───────────────────────────────────

function LeadsSection({ data }: { data: any }) {
  if (!data) return <ActivityIndicator style={styles.loader} color="#2563eb" />;

  const byStatus: { status: string; count: number }[] = data.breakdown?.byStatus ?? [];
  const total: number = data.total ?? 0;

  if (byStatus.length === 0 && total === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No lead data available</Text>
      </View>
    );
  }

  return (
    <View>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Leads</Text>
          <Text style={styles.summaryValue}>{total}</Text>
        </View>
      </Card>

      {byStatus.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Leads by Status</Text>
          {byStatus.map((row) => {
            const barPct = formatRate(row.count, total);
            return (
              <View key={row.status} style={styles.rowItem}>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowLabel}>{(row.status ?? '').replace(/_/g, ' ')}</Text>
                  <Text style={styles.rowCount}>{row.count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${barPct}%` as any }]} />
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {Array.isArray(data.breakdown?.bySource) && data.breakdown.bySource.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Leads by Source</Text>
          {data.breakdown.bySource.map((row: { source: string; count: number }, idx: number) => (
            <View key={row.source ?? idx} style={styles.rowItem}>
              <View style={styles.rowMeta}>
                <Text style={styles.rowLabel}>{(row.source ?? '').replace(/_/g, ' ')}</Text>
                <Text style={styles.rowCount}>{row.count}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

function TransactionsSection({ data }: { data: any }) {
  if (!data) return <ActivityIndicator style={styles.loader} color="#2563eb" />;

  const total: number = data.total ?? 0;
  const summary = data.summary ?? {};
  const rows: any[] = data.data ?? [];

  if (total === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No transaction data available</Text>
      </View>
    );
  }

  return (
    <View>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Transactions</Text>
          <Text style={styles.summaryValue}>{summary.count ?? total}</Text>
        </View>
        {summary.totalDealValue != null && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Deal Value</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>
              {formatAmount(Number(summary.totalDealValue ?? 0))}
            </Text>
          </View>
        )}
        {summary.totalBuyerCommission != null && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Buyer Commission</Text>
            <Text style={styles.summaryValue}>
              {formatAmount(Number(summary.totalBuyerCommission ?? 0))}
            </Text>
          </View>
        )}
        {summary.totalSellerCommission != null && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seller Commission</Text>
            <Text style={styles.summaryValue}>
              {formatAmount(Number(summary.totalSellerCommission ?? 0))}
            </Text>
          </View>
        )}
      </Card>

      {rows.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Recent Transactions</Text>
          {rows.slice(0, 10).map((row: any, idx: number) => (
            <View key={row.id ?? idx} style={[styles.rowItem, styles.txnRow]}>
              <View style={styles.rowMeta}>
                <Text style={styles.rowLabel}>
                  {row.property?.flatNumber ?? '-'}
                  {row.property?.towerBlock ? `, ${row.property.towerBlock}` : ''}
                </Text>
                <Text style={styles.rowSubLabel}>{row.type ?? ''}</Text>
              </View>
              <Text style={[styles.rowCount, { color: '#059669' }]}>
                {formatAmount(Number(row.dealValue ?? 0))}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

function CommissionsSection({ data }: { data: any }) {
  if (!data) return <ActivityIndicator style={styles.loader} color="#2563eb" />;

  const total: number = data.total ?? 0;
  const summary = data.summary ?? {};
  const rows: any[] = data.data ?? [];

  const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#3b82f6',
    PAID: '#10b981',
    REJECTED: '#ef4444',
  };

  if (total === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No commission data available</Text>
      </View>
    );
  }

  return (
    <View>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Commissions</Text>
          <Text style={styles.summaryValue}>{summary.count ?? total}</Text>
        </View>
        {summary.totalAmount != null && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>
              {formatAmount(Number(summary.totalAmount ?? 0))}
            </Text>
          </View>
        )}
        {summary.totalGst != null && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total GST</Text>
            <Text style={styles.summaryValue}>{formatAmount(Number(summary.totalGst ?? 0))}</Text>
          </View>
        )}
      </Card>

      {rows.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Recent Commissions</Text>
          {rows.slice(0, 10).map((row: any, idx: number) => {
            const statusColor = STATUS_COLORS[row.status] ?? '#6b7280';
            return (
              <View key={row.id ?? idx} style={[styles.rowItem, styles.txnRow]}>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowLabel}>{row.dealer?.user?.name ?? 'Dealer'}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {(row.status ?? '').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rowCount, { color: '#059669' }]}>
                  {formatAmount(Number(row.amount ?? 0))}
                </Text>
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );
}

// ─── Dashboard stat cards — role-aware mapping ────────────────────────────────

function DashboardStats({ dashData, role }: { dashData: any; role: string }) {
  if (!dashData) return <ActivityIndicator style={styles.loader} color="#2563eb" />;

  // OWNER: myListings, inquiryCount
  if (role === 'OWNER') {
    return (
      <View style={styles.statsGrid}>
        <StatCard label="My Listings" value={dashData.myListings ?? 0} color="#2563eb" />
        <StatCard label="Inquiries" value={dashData.inquiryCount ?? 0} color="#10b981" />
      </View>
    );
  }

  // DEALER: activeLeads, assignedProperties
  if (role === 'DEALER') {
    return (
      <View style={styles.statsGrid}>
        <StatCard label="Active Leads" value={dashData.activeLeads ?? 0} color="#2563eb" />
        <StatCard
          label="Assigned Properties"
          value={dashData.assignedProperties ?? 0}
          color="#10b981"
        />
      </View>
    );
  }

  // BUYER_TENANT: savedProperties, activeInquiries
  if (role === 'BUYER_TENANT') {
    return (
      <View style={styles.statsGrid}>
        <StatCard label="Saved Properties" value={dashData.savedProperties ?? 0} color="#2563eb" />
        <StatCard label="Active Inquiries" value={dashData.activeInquiries ?? 0} color="#10b981" />
      </View>
    );
  }

  // SUPER_ADMIN / RWA_ADMIN: full set
  // Keys: totalProperties, totalLeads, totalDealers, activeDealers, totalSocieties,
  //       activeLeads, closedLeads, conversionRate, totalTransactions,
  //       totalRevenue, pendingCommissions, openGrievances
  const revenueNum = Number(dashData.totalRevenue ?? 0);
  const revenueLabel =
    revenueNum >= 10_000_000
      ? `₹${(revenueNum / 10_000_000).toFixed(2)} Cr`
      : revenueNum >= 100_000
        ? `₹${(revenueNum / 100_000).toFixed(1)} L`
        : `₹${revenueNum.toLocaleString('en-IN')}`;

  const cards: StatCardProps[] = [
    { label: 'Total Properties', value: dashData.totalProperties ?? 0, color: '#2563eb' },
    { label: 'Active Leads', value: dashData.activeLeads ?? 0, color: '#10b981' },
    { label: 'Transactions', value: dashData.totalTransactions ?? 0, color: '#6366f1' },
    { label: 'Revenue', value: revenueLabel, color: '#059669' },
    {
      label: 'Active Dealers',
      value: dashData.activeDealers ?? dashData.totalDealers ?? 0,
      color: '#f59e0b',
    },
    { label: 'Societies', value: dashData.totalSocieties ?? 0, color: '#8b5cf6' },
    { label: 'Pending Commissions', value: dashData.pendingCommissions ?? 0, color: '#ef4444' },
    { label: 'Open Grievances', value: dashData.openGrievances ?? 0, color: '#f97316' },
  ];

  // RWA_ADMIN doesn't have totalSocieties scoped, so still show it but filter out
  // SUPER_ADMIN-only cards for RWA_ADMIN (transactions, revenue remain useful for their scope)
  return (
    <View style={styles.statsGrid}>
      {cards.map((c) => (
        <StatCard key={c.label} label={c.label} value={c.value} color={c.color} />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const role = user?.role ?? '';

  const canSeeLeads = role === 'SUPER_ADMIN' || role === 'RWA_ADMIN';
  const canSeeTransactions = role === 'SUPER_ADMIN';
  const canSeeCommissions = role === 'SUPER_ADMIN';
  const hasDetailTabs = canSeeLeads || canSeeTransactions || canSeeCommissions;

  const firstAvailableTab: TabKey = canSeeLeads
    ? 'leads'
    : canSeeTransactions
      ? 'transactions'
      : 'commissions';

  const [dashData, setDashData] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>(firstAvailableTab);
  const [tabData, setTabData] = useState<Record<TabKey, any>>({
    leads: null,
    transactions: null,
    commissions: null,
  });
  const [tabError, setTabError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    setDashError(null);
    try {
      const res = await reportsApi.dashboard();
      setDashData(res.data?.data ?? res.data ?? null);
    } catch {
      /* network error — show error state */
      setDashError('Failed to load dashboard stats');
    }
    setDashLoading(false);
  }, []);

  const loadTab = useCallback(
    async (tab: TabKey) => {
      if (tabData[tab] !== null) return; // already loaded
      setTabError(null);
      try {
        let res: any;
        if (tab === 'leads') {
          res = await reportsApi.leads();
        } else if (tab === 'transactions') {
          res = await reportsApi.transactions();
        } else {
          res = await reportsApi.commissions();
        }
        const payload = res.data?.data ?? res.data ?? null;
        setTabData((prev) => ({ ...prev, [tab]: payload }));
      } catch {
        /* network error — show inline error */
        setTabError(`Failed to load ${tab} data`);
      }
    },
    [tabData],
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated, loadDashboard]);

  useEffect(() => {
    if (isAuthenticated && hasDetailTabs) {
      loadTab(activeTab);
    }
  }, [activeTab, isAuthenticated, hasDetailTabs, loadTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    setDashData(null);
    setTabData({ leads: null, transactions: null, commissions: null });
    await loadDashboard();
    if (hasDetailTabs) {
      await loadTab(activeTab);
    }
    setRefreshing(false);
  };

  // Auth gate
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to view reports</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  const TABS: { key: TabKey; label: string; visible: boolean }[] = [
    { key: 'leads', label: 'Leads', visible: canSeeLeads },
    { key: 'transactions', label: 'Transactions', visible: canSeeTransactions },
    { key: 'commissions', label: 'Commissions', visible: canSeeCommissions },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        {role ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role.replace(/_/g, ' ')}</Text>
          </View>
        ) : null}
      </View>

      {/* Dashboard stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        {dashLoading && !dashData ? (
          <ActivityIndicator style={styles.loader} color="#2563eb" />
        ) : dashError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{dashError}</Text>
            <TouchableOpacity onPress={loadDashboard} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <DashboardStats dashData={dashData} role={role} />
        )}
      </View>

      {/* Detail tabs — only for roles that can access them */}
      {hasDetailTabs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Reports</Text>

          {/* Segmented chip row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {TABS.filter((t) => t.visible).map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.chip, activeTab === t.key && styles.chipActive]}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={[styles.chipText, activeTab === t.key && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab content */}
          {tabError ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{tabError}</Text>
              <TouchableOpacity
                onPress={() => {
                  setTabData((prev) => ({ ...prev, [activeTab]: null }));
                  setTabError(null);
                  loadTab(activeTab);
                }}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </Card>
          ) : activeTab === 'leads' ? (
            <LeadsSection data={tabData.leads} />
          ) : activeTab === 'transactions' ? (
            <TransactionsSection data={tabData.transactions} />
          ) : (
            <CommissionsSection data={tabData.commissions} />
          )}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },

  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', alignItems: 'center', marginBottom: 2 },
  statValue: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, textAlign: 'center' },

  chipRow: { paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  loader: { padding: 24 },

  summaryCard: { marginBottom: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },

  sectionCard: { marginBottom: 12 },
  sectionCardTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },

  rowItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowMeta: { flex: 1, marginRight: 8 },
  rowLabel: { fontSize: 13, color: '#111827', fontWeight: '500', textTransform: 'capitalize' },
  rowSubLabel: { fontSize: 11, color: '#9ca3af', marginTop: 1, textTransform: 'uppercase' },
  rowCount: { fontSize: 14, fontWeight: '700', color: '#2563eb' },

  barTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  barFill: { height: 4, backgroundColor: '#2563eb', borderRadius: 2 },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },

  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9ca3af' },

  errorCard: { alignItems: 'center', gap: 10 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryText: { fontSize: 13, color: '#fff', fontWeight: '600' },
});
