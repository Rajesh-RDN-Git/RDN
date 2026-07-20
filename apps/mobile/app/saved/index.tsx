import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SaveButton } from '@/components/ui/SaveButton';
import { getShortlist } from '@/lib/shortlist';
import { propertiesApi } from '@/lib/api/properties';
import { ScreenState } from '@/components/ui/ScreenState';

export default function SavedPropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const ids = await getShortlist();
      if (ids.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }
      const results = await Promise.allSettled(ids.map((id) => propertiesApi.getById(id)));
      const resolved: any[] = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value.data?.data || r.value.data)
        .filter(Boolean);
      setProperties(resolved);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSaved();
    setRefreshing(false);
  };

  const renderProperty = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/property/${item.id}` as never)}>
      <Card style={styles.propertyCard}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.badge,
              item.transactionType === 'SALE' ? styles.saleBadge : styles.rentBadge,
            ]}
          >
            <Text style={styles.badgeText}>{item.transactionType}</Text>
          </View>
          <Text style={styles.bhk}>{item.bhk} BHK</Text>
          <SaveButton propertyId={item.id} />
        </View>
        <Text style={styles.propertyType}>{item.type}</Text>
        <Text style={styles.location}>
          {item.society?.name}, {item.society?.city}
        </Text>
        <Text style={styles.price}>
          {item.transactionType === 'SALE'
            ? `₹${(Number(item.priceSale) / 100000).toFixed(1)}L`
            : `₹${Number(item.priceRent).toLocaleString('en-IN')}/mo`}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <FlatList
      data={properties}
      renderItem={renderProperty}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, properties.length === 0 && styles.emptyContainer]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadSaved}
          emptyText="No saved properties yet. Tap the heart on any listing to save it here."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  list: { padding: 16, backgroundColor: '#f9fafb', flexGrow: 1 },
  emptyContainer: { flex: 1 },
  propertyCard: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  saleBadge: { backgroundColor: '#dbeafe' },
  rentBadge: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#1e40af' },
  bhk: { fontSize: 13, color: '#6b7280' },
  propertyType: { fontSize: 16, fontWeight: '600', color: '#111827' },
  location: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#059669', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, color: '#d1d5db', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});
