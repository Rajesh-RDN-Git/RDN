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
import { transactionsApi } from '@/lib/api/transactions';
import { ScreenState } from '@/components/ui/ScreenState';

// PaymentStatus enum values from Prisma / UpdatePaymentStatusDto
const PAYMENT_STATUSES = ['ALL', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] as const;
type PaymentStatusFilter = (typeof PAYMENT_STATUSES)[number];

const paymentStatusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  PARTIAL: '#3b82f6',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
};

// DealTransactionType enum values
const typeColors: Record<string, string> = {
  RENT: '#8b5cf6',
  SALE: '#0ea5e9',
  RENEWAL: '#14b8a6',
};

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
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

export default function TransactionsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const role = user?.role;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAuthorized = role === 'SUPER_ADMIN' || role === 'RWA_ADMIN';

  const loadTransactions = useCallback(async () => {
    if (!isAuthenticated || !isAuthorized) return;
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string> = { limit: '30' };
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;

      const { data } = await transactionsApi.list(params);
      const result = data.data || data;
      setTransactions(result.data || []);
      setTotal(result.total || 0);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [isAuthenticated, isAuthorized, paymentFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to view transactions</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  if (!isAuthorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>You do not have permission to view transactions.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const psColor = paymentStatusColors[item.paymentStatus] || '#6b7280';
    const typeColor = typeColors[item.type] || '#6b7280';

    return (
      <TouchableOpacity onPress={() => router.push(`/transactions/${item.id}` as never)}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              {/* Transaction type badge */}
              <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
                <Text style={[styles.badgeText, { color: typeColor }]}>{item.type}</Text>
              </View>
              {/* Payment status badge */}
              <View style={[styles.badge, { backgroundColor: psColor + '20', marginLeft: 6 }]}>
                <Text style={[styles.badgeText, { color: psColor }]}>
                  {item.paymentStatus?.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>{formatDate(item.closedAt || item.createdAt)}</Text>
          </View>

          {/* Deal value */}
          <Text style={styles.dealValue}>{formatCurrency(item.dealValue)}</Text>

          {/* Property / society info */}
          {item.property && (
            <Text style={styles.propertyText} numberOfLines={1}>
              {[item.property.flatNumber, item.property.towerBlock].filter(Boolean).join(', ')}
              {item.property.society?.name ? ` · ${item.property.society.name}` : ''}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Payment status filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={PAYMENT_STATUSES as unknown as PaymentStatusFilter[]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, paymentFilter === item && styles.chipActive]}
            onPress={() => setPaymentFilter(item)}
          >
            <Text style={[styles.chipText, paymentFilter === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.totalText}>{total} transactions</Text>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.loader} /> : null}
        ListEmptyComponent={
          <ScreenState
            loading={loading}
            error={error}
            onRetry={loadTransactions}
            emptyText="No transactions found"
          />
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
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  dealValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  propertyText: { fontSize: 13, color: '#6b7280' },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
