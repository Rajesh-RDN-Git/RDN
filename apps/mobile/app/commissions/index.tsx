import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { commissionApi } from '@/lib/api/commission';

const STATUSES = ['ALL', 'PENDING', 'SETTLED', 'DISTRIBUTED', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUSES)[number];

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  SETTLED: '#10b981',
  DISTRIBUTED: '#3b82f6',
  CANCELLED: '#ef4444',
};

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `Rs ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    /* invalid date */
    return '-';
  }
}

export default function CommissionsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommissions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '30' };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const { data } = await commissionApi.list(params);
      const result = data.data || data;
      setCommissions(result.data || []);
      setTotal(result.total || 0);
    } catch {
      /* network error — list stays empty */
    }
    setLoading(false);
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommissions();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to view commissions</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const color = statusColors[item.status] || '#6b7280';
    const showPayoutRef =
      (item.status === 'SETTLED' || item.status === 'DISTRIBUTED') && item.payoutReference;

    return (
      <TouchableOpacity onPress={() => router.push(`/commissions/${item.id}` as never)}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.statusText, { color }]}>{item.status}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {isAdmin && item.dealer?.user?.name ? (
            <Text style={styles.dealerName}>{item.dealer.user.name}</Text>
          ) : null}

          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            {item.gst ? <Text style={styles.gst}>+ GST {formatCurrency(item.gst)}</Text> : null}
          </View>

          {showPayoutRef ? (
            <Text style={styles.payoutRef} numberOfLines={1}>
              Ref: {item.payoutReference}
            </Text>
          ) : null}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUSES as unknown as StatusFilter[]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, statusFilter === item && styles.chipActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.chipText, statusFilter === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.totalText}>{total} commissions</Text>

      <FlatList
        data={commissions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.loader} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No commissions found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  totalText: { paddingHorizontal: 16, fontSize: 13, color: '#6b7280', marginBottom: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  loader: { padding: 16 },
  card: { marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  dealerName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  amount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  gst: { fontSize: 13, color: '#6b7280' },
  payoutRef: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
