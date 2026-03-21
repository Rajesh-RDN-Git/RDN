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
import { leadsApi } from '@/lib/api/leads';

const STATUSES = ['ALL', 'NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'NEGOTIATING', 'CLOSING', 'CLOSED'];

const statusColors: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  VISIT_SCHEDULED: '#f59e0b',
  NEGOTIATING: '#f97316',
  CLOSING: '#ef4444',
  CLOSED: '#10b981',
};

export default function LeadsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeads = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '20' };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const { data } = await leadsApi.list(params);
      const result = data.data || data;
      setLeads(result.data || []);
      setTotal(result.total || 0);
    } catch {
      /\* ignore \*/;
    }
    setLoading(false);
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to view leads</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  const renderLead = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/lead/${item.id}`)}>
      <Card style={styles.leadCard}>
        <View style={styles.leadHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: (statusColors[item.status] || '#6b7280') + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColors[item.status] || '#6b7280' }]}>
              {item.status?.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.leadDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN')}
          </Text>
        </View>

        <Text style={styles.propertyName}>
          {item.property?.flatNumber}, {item.property?.towerBlock}
        </Text>
        <Text style={styles.leadDetail}>
          {item.property?.transactionType} • {item.property?.type}
        </Text>

        {user?.role === 'DEALER' && item.buyer && (
          <Text style={styles.buyerName}>Buyer: {item.buyer.name}</Text>
        )}
        {(user?.role === 'BUYER_TENANT' || user?.role === 'OWNER') && item.dealer?.user && (
          <Text style={styles.buyerName}>Dealer: {item.dealer.user.name}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Filter */}
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
              {item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.totalText}>{total} leads</Text>

      <FlatList
        data={leads}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No leads found</Text>
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
  leadCard: { marginBottom: 10 },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  leadDate: { fontSize: 12, color: '#9ca3af' },
  propertyName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  leadDetail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  buyerName: { fontSize: 13, color: '#374151', marginTop: 4 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
