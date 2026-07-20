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
import { dealersApi } from '@/lib/api/dealers';
import { ScreenState } from '@/components/ui/ScreenState';
import { KYCStatus, ApprovalStatus, TrainingStatus } from '@rdn/shared';

// CertificationStatus not yet in shared dist — mirror types/dealer.ts exactly
const CertificationStatus = {
  NOT_CERTIFIED: 'NOT_CERTIFIED',
  CERTIFIED: 'CERTIFIED',
  REVOKED: 'REVOKED',
} as const;

const FILTER_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
type DealerFilter = (typeof FILTER_OPTIONS)[number];

const kycColors: Record<string, string> = {
  [KYCStatus.APPROVED]: '#10b981',
  [KYCStatus.REJECTED]: '#ef4444',
  [KYCStatus.PENDING]: '#f59e0b',
};

const approvalColors: Record<string, string> = {
  [ApprovalStatus.APPROVED]: '#10b981',
  [ApprovalStatus.REJECTED]: '#ef4444',
  [ApprovalStatus.PENDING]: '#f59e0b',
};

const trainingColors: Record<string, string> = {
  [TrainingStatus.COMPLETED]: '#10b981',
  [TrainingStatus.PENDING]: '#f59e0b',
};

const certColors: Record<string, string> = {
  CERTIFIED: '#2563eb',
  REVOKED: '#ef4444',
  NOT_CERTIFIED: '#9ca3af',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function ManageDealersScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [dealers, setDealers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<DealerFilter>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'RWA_ADMIN';

  const loadDealers = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter === 'ACTIVE') params.isActive = 'true';
      if (filter === 'INACTIVE') params.isActive = 'false';

      const { data } = await dealersApi.list(params);
      // API returns {data: {data: [...], pagination}} — unwrap both layers
      const result = data.data || data;
      setDealers(result.data || []);
      setTotal(result.total ?? result.pagination?.total ?? (result.data?.length || 0));
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [isAuthenticated, isAdmin, filter]);

  useEffect(() => {
    loadDealers();
  }, [loadDealers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDealers();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to manage dealers</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Access restricted to admins</Text>
      </View>
    );
  }

  const renderDealer = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/manage/dealers/${item.id}` as never)}
    >
      <Card style={styles.dealerCard}>
        {/* Name + Society */}
        <Text style={styles.dealerName}>{item.user?.name || 'Unknown Dealer'}</Text>
        {item.society?.name ? <Text style={styles.societyName}>{item.society.name}</Text> : null}

        {/* Status badges */}
        <View style={styles.badgeRow}>
          <Badge label={`KYC: ${item.kycStatus}`} color={kycColors[item.kycStatus] ?? '#6b7280'} />
          <Badge
            label={`RWA: ${item.rwaApprovalStatus}`}
            color={approvalColors[item.rwaApprovalStatus] ?? '#6b7280'}
          />
        </View>
        <View style={styles.badgeRow}>
          <Badge
            label={`Train: ${item.trainingStatus}`}
            color={trainingColors[item.trainingStatus] ?? '#6b7280'}
          />
          <Badge
            label={item.isActive ? 'Active' : 'Inactive'}
            color={item.isActive ? '#10b981' : '#9ca3af'}
          />
          {item.certificationStatus && (
            <Badge
              label={
                item.certificationStatus === CertificationStatus.CERTIFIED
                  ? 'Certified'
                  : item.certificationStatus === CertificationStatus.REVOKED
                    ? 'Revoked'
                    : 'Not Certified'
              }
              color={certColors[item.certificationStatus] ?? '#9ca3af'}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTER_OPTIONS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, filter === item && styles.chipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.totalText}>{total} dealers</Text>

      <FlatList
        data={dealers}
        renderItem={renderDealer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        ListEmptyComponent={
          <ScreenState
            loading={loading}
            error={error}
            onRetry={loadDealers}
            emptyText="No dealers found"
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  totalText: { paddingHorizontal: 16, fontSize: 13, color: '#6b7280', marginBottom: 4 },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  dealerCard: { marginBottom: 12 },

  dealerName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  societyName: { fontSize: 13, color: '#6b7280', marginBottom: 8 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  footerSpinner: { padding: 16 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
