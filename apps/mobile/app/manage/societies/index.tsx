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
import { societiesApi } from '@/lib/api/societies';

type SocietyVerification = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
type SocietyStatus = 'IN_PROGRESS' | 'ONBOARDED' | 'INACTIVE';

interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  status: SocietyStatus;
  verificationStatus: SocietyVerification;
  totalUnits?: number;
  rwaAdmin?: { id: string; name: string } | null;
}

const verificationColors: Record<SocietyVerification, string> = {
  PENDING: '#f59e0b',
  VERIFIED: '#10b981',
  FLAGGED: '#f97316',
  REJECTED: '#ef4444',
};

const statusColors: Record<SocietyStatus, string> = {
  ONBOARDED: '#10b981',
  IN_PROGRESS: '#f59e0b',
  INACTIVE: '#9ca3af',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function ManageSocietiesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadSocieties = useCallback(async () => {
    if (!isAuthenticated || !isSuperAdmin) return;
    setLoading(true);
    try {
      const { data } = await societiesApi.list({ limit: '50' });
      const result = data.data || data;
      setSocieties(result.data || []);
      setTotal(result.total ?? result.pagination?.total ?? (result.data?.length || 0));
    } catch {
      /* network error — list stays empty */
    }
    setLoading(false);
  }, [isAuthenticated, isSuperAdmin]);

  useEffect(() => {
    loadSocieties();
  }, [loadSocieties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSocieties();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to manage societies</Text>
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

  const renderSociety = ({ item }: { item: Society }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/manage/societies/[id]',
          params: { id: item.id, slug: item.slug },
        } as never)
      }
    >
      <Card style={styles.societyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.nameBlock}>
            <Text style={styles.societyName}>{item.name}</Text>
            <Text style={styles.societyCity}>
              {item.city}
              {item.state ? `, ${item.state}` : ''}
            </Text>
          </View>
          {item.totalUnits != null && <Text style={styles.units}>{item.totalUnits} units</Text>}
        </View>
        <View style={styles.badgeRow}>
          <Badge
            label={item.verificationStatus}
            color={verificationColors[item.verificationStatus] ?? '#6b7280'}
          />
          <Badge label={item.status} color={statusColors[item.status] ?? '#6b7280'} />
        </View>
        {item.rwaAdmin?.name ? (
          <Text style={styles.rwaAdmin}>RWA: {item.rwaAdmin.name}</Text>
        ) : (
          <Text style={styles.rwaAdminMissing}>No RWA admin assigned</Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.totalText}>{total} societies</Text>
        <Button title="Add society" onPress={() => router.push('/manage/societies/new' as never)} />
      </View>

      <FlatList
        data={societies}
        renderItem={renderSociety}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No societies found</Text>
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalText: { fontSize: 13, color: '#6b7280' },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  societyCard: { marginBottom: 12 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameBlock: { flex: 1, marginRight: 8 },
  societyName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  societyCity: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  units: { fontSize: 12, color: '#374151', fontWeight: '500' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  rwaAdmin: { fontSize: 12, color: '#374151', marginTop: 2 },
  rwaAdminMissing: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  footerSpinner: { padding: 16 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
