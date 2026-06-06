import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { propertiesApi } from '@/lib/api/properties';

// Real PropertyStatus values from packages/shared/src/types/property.ts
const STATUSES = ['ALL', 'ACTIVE', 'DELISTED', 'CLOSED'] as const;
type StatusFilter = (typeof STATUSES)[number];

const statusColors: Record<string, string> = {
  ACTIVE: '#10b981',
  DELISTED: '#f59e0b',
  CLOSED: '#6b7280',
};

// Verification status badge colors (PropertyVerificationStatus)
const verificationColors: Record<string, string> = {
  PENDING: '#f59e0b',
  RWA_APPROVED: '#10b981',
  VERIFIED: '#2563eb',
  FLAGGED: '#ef4444',
  REJECTED: '#dc2626',
};

// Roles that can edit and delist properties
const CAN_EDIT_ROLES = ['OWNER', 'SUPER_ADMIN', 'RWA_ADMIN'] as const;
type CanEditRole = (typeof CAN_EDIT_ROLES)[number];

function canEditRole(role: string | undefined): role is CanEditRole {
  return CAN_EDIT_ROLES.includes(role as CanEditRole);
}

export default function ManagePropertiesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  // Search is client-side: the /properties list endpoint does not expose a
  // free-text `search`/`q` param — we filter the loaded page locally.
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [delistingId, setDelistingId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const { data } = await propertiesApi.list(params);
      // API returns {data: {data: [...], pagination}} — unwrap both layers
      const result = data.data || data;
      setProperties(result.data || []);
      setTotal(result.total ?? result.pagination?.total ?? (result.data?.length || 0));
    } catch {
      /* network error — list stays empty */
    }
    setLoading(false);
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const handleDelist = (id: string, label: string) => {
    Alert.alert(
      'Delist property?',
      `"${label}" will be removed from active listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delist',
          style: 'destructive',
          onPress: async () => {
            setDelistingId(id);
            try {
              // propertiesApi.delist signature: (id: string) => apiClient.patch(`/properties/${id}/delist`)
              await propertiesApi.delist(id);
              await loadProperties();
            } catch {
              /* delist failed — silently ignore, list will still refresh */
              await loadProperties();
            }
            setDelistingId(null);
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to manage properties</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  // Client-side search filter on flat number, tower, or society name
  const visibleProperties = searchQuery.trim()
    ? properties.filter(
        (p) =>
          p.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.towerBlock?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.society?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : properties;

  const screenTitle =
    user?.role === 'DEALER'
      ? 'Assigned Properties'
      : user?.role === 'OWNER'
        ? 'My Properties'
        : 'All Properties';

  const renderProperty = ({ item }: { item: any }) => {
    const statusColor = statusColors[item.status] ?? '#6b7280';
    const vColor = verificationColors[item.verificationStatus] ?? '#6b7280';
    const label = [item.flatNumber, item.towerBlock].filter(Boolean).join(', ');
    const isDelisting = delistingId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/property/${item.id}` as never)}
      >
        <Card style={styles.propCard}>
          {/* Row 1: status badge + verification badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status?.replace(/_/g, ' ')}
              </Text>
            </View>
            {item.verificationStatus && (
              <View style={[styles.statusBadge, { backgroundColor: vColor + '20', marginLeft: 6 }]}>
                <Text style={[styles.statusText, { color: vColor }]}>
                  {item.verificationStatus?.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
            {item.viewsCount != null && (
              <Text style={styles.viewCount}>{item.viewsCount} views</Text>
            )}
          </View>

          {/* Row 2: flat / tower */}
          <Text style={styles.flatLabel}>{label || 'Property'}</Text>

          {/* Row 3: society */}
          {item.society?.name ? (
            <Text style={styles.society}>
              {item.society.name}
              {item.society.city ? `, ${item.society.city}` : ''}
            </Text>
          ) : null}

          {/* Row 4: type + transaction type */}
          <View style={styles.metaRow}>
            {item.bhk ? <Text style={styles.metaChip}>{item.bhk} BHK</Text> : null}
            {item.type ? <Text style={styles.metaChip}>{item.type}</Text> : null}
            {item.transactionType ? (
              <View
                style={[
                  styles.txBadge,
                  item.transactionType === 'SALE' ? styles.saleBadge : styles.rentBadge,
                ]}
              >
                <Text style={styles.txBadgeText}>{item.transactionType}</Text>
              </View>
            ) : null}
          </View>

          {/* Actions: only OWNER, SUPER_ADMIN, RWA_ADMIN */}
          {canEditRole(user?.role) && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/property/${item.id}/edit` as never)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              {item.status !== 'DELISTED' && (
                <TouchableOpacity
                  style={[styles.delistBtn, isDelisting && styles.delistBtnDisabled]}
                  disabled={isDelisting}
                  onPress={() => handleDelist(item.id, label)}
                >
                  {isDelisting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text style={styles.delistBtnText}>Delist</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen title */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{screenTitle}</Text>
        {total > 0 && <Text style={styles.totalCount}>{total} total</Text>}
      </View>

      {/* Search input (client-side filtering) */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search flat, tower, or society..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
          clearButtonMode="while-editing"
        />
      </View>

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
              {item === 'ALL' ? 'All' : item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Result count (after client-side search) */}
      <Text style={styles.resultCount}>
        {visibleProperties.length} {visibleProperties.length === 1 ? 'property' : 'properties'}
        {searchQuery.trim() ? ' matching' : ''}
      </Text>

      {/* Property list */}
      <FlatList
        data={visibleProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No properties found</Text>
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  totalCount: { fontSize: 13, color: '#6b7280' },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },

  filterRow: { paddingHorizontal: 16, paddingVertical: 8 },
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

  resultCount: { paddingHorizontal: 16, fontSize: 13, color: '#6b7280', marginBottom: 4 },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  propCard: { marginBottom: 12 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  viewCount: { marginLeft: 'auto', fontSize: 12, color: '#9ca3af' },

  flatLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  society: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaChip: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  saleBadge: { backgroundColor: '#dbeafe' },
  rentBadge: { backgroundColor: '#d1fae5' },
  txBadgeText: { fontSize: 11, fontWeight: '600', color: '#1e40af' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
  },
  editBtnText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  delistBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delistBtnDisabled: { opacity: 0.5 },
  delistBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  footerSpinner: { padding: 16 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
