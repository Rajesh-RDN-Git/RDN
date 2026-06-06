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
import { grievanceApi } from '@/lib/api/grievance';

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  ESCALATED: '#ef4444',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const CATEGORY_LABEL: Record<string, string> = {
  DEALER_CONDUCT: 'Dealer Conduct',
  PROPERTY_MISMATCH: 'Property Mismatch',
  COMMISSION: 'Commission',
  SERVICE: 'Service',
  SAFETY: 'Safety',
  KEY_ARRANGEMENT: 'Key Arrangement',
  VISIT_TIME: 'Visit Time',
  MEETING_AVAILABILITY: 'Meeting Availability',
  OTHER: 'Other',
};

export default function GrievancesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadGrievances = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '20' };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await grievanceApi.list(params);
      const result = data.data || data;
      setGrievances(result.data || []);
      setTotal(result.total || 0);
    } catch {
      /* network error — ignore, user can pull-to-refresh */
    }
    setLoading(false);
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    loadGrievances();
  }, [loadGrievances]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGrievances();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to view grievances</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'RWA_ADMIN';

  const renderGrievance = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.status] || '#6b7280';
    const severityColor = SEVERITY_COLORS[item.severity] || '#6b7280';
    const category = CATEGORY_LABEL[item.category] || item.category || '';

    return (
      <TouchableOpacity onPress={() => router.push(`/grievances/${item.id}` as never)}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {(item.status || '').replace(/_/g, ' ')}
                </Text>
              </View>
              <View
                style={[styles.badge, { backgroundColor: severityColor + '20', marginLeft: 6 }]}
              >
                <Text style={[styles.badgeText, { color: severityColor }]}>
                  {item.severity || ''}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}
            </Text>
          </View>

          <Text style={styles.category}>{category}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || ''}
          </Text>

          {isAdmin && item.filer?.name ? (
            <Text style={styles.filerName}>Filed by: {item.filer.name}</Text>
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
        data={STATUSES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, statusFilter === item && styles.chipActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.chipText, statusFilter === item && styles.chipTextActive]}>
              {item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Header row: count + file button */}
      <View style={styles.headerRow}>
        <Text style={styles.totalText}>
          {total} grievance{total !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.fileButton}
          onPress={() => router.push('/grievances/new' as never)}
        >
          <Text style={styles.fileButtonText}>+ File grievance</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={grievances}
        renderItem={renderGrievance}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.loader} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No grievances found</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  totalText: { fontSize: 13, color: '#6b7280' },
  fileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  fileButtonText: { fontSize: 13, color: '#fff', fontWeight: '600' },
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
  cardDate: { fontSize: 12, color: '#9ca3af' },
  category: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2 },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  filerName: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
