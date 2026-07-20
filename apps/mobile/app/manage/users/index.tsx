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
import { usersApi } from '@/lib/api/users';
import { ScreenState } from '@/components/ui/ScreenState';
import { ROLE_LABELS } from '@rdn/shared';

const FILTER_OPTIONS = [
  'ALL',
  'SUPER_ADMIN',
  'RWA_ADMIN',
  'DEALER',
  'OWNER',
  'BUYER_TENANT',
] as const;
type UserFilter = (typeof FILTER_OPTIONS)[number];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: '#2563eb',
  RWA_ADMIN: '#0891b2',
  DEALER: '#10b981',
  OWNER: '#f59e0b',
  BUYER_TENANT: '#6b7280',
};

interface User {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  status: string;
}

export default function ManageUsersScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<UserFilter>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadUsers = useCallback(async () => {
    if (!isAuthenticated || !isSuperAdmin) return;
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter !== 'ALL') params.role = filter;
      const { data } = await usersApi.list(params);
      const result = data.data || data;
      setUsers(result.data || []);
      setTotal(result.total ?? result.pagination?.total ?? (result.data?.length || 0));
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [isAuthenticated, isSuperAdmin, filter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to manage users</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  if (!isSuperAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Access restricted to Super Admins</Text>
      </View>
    );
  }

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/manage/users/${item.id}` as never)}
    >
      <Card style={styles.userCard}>
        <View style={styles.cardHeader}>
          <View style={styles.nameBlock}>
            <Text style={styles.userName}>{item.name || 'Unknown'}</Text>
            {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}
          </View>
          <View
            style={[styles.badge, { backgroundColor: (roleColors[item.role] ?? '#6b7280') + '20' }]}
          >
            <Text style={[styles.badgeText, { color: roleColors[item.role] ?? '#6b7280' }]}>
              {ROLE_LABELS[item.role as keyof typeof ROLE_LABELS] ?? item.role}
            </Text>
          </View>
        </View>
        {item.status !== 'ACTIVE' ? <Text style={styles.inactive}>{item.status}</Text> : null}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
              {item === 'ALL' ? 'All' : ROLE_LABELS[item as keyof typeof ROLE_LABELS]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.totalText}>{total} users</Text>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        ListEmptyComponent={
          <ScreenState
            loading={loading}
            error={error}
            onRetry={loadUsers}
            emptyText="No users found"
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
  userCard: { marginBottom: 12 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: { flex: 1, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  inactive: { fontSize: 12, color: '#ef4444', marginTop: 6, fontWeight: '500' },

  footerSpinner: { padding: 16 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
