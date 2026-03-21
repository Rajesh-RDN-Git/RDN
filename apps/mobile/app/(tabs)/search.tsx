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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { searchApi } from '@/lib/api/search';

const TRANSACTION_TYPES = ['ALL', 'RENT', 'SALE'];
const PROPERTY_TYPES = ['ALL', 'APARTMENT', 'VILLA', 'PENTHOUSE', 'STUDIO'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [transactionType, setTransactionType] = useState('ALL');
  const [propertyType, setPropertyType] = useState('ALL');
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const searchProperties = useCallback(
    async (resetPage = false) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: resetPage ? '1' : String(page),
          limit: '20',
        };
        if (query) params.city = query;
        if (transactionType !== 'ALL') params.transactionType = transactionType;
        if (propertyType !== 'ALL') params.type = propertyType;

        const { data } = await searchApi.search(params);
        const result = data.data || data;

        if (resetPage) {
          setProperties(result.data || []);
          setPage(1);
        } else {
          setProperties((prev) => [...prev, ...(result.data || [])]);
        }
        setTotal(result.total || 0);
      } catch {
        /\* ignore \*/;
      }
      setLoading(false);
    },
    [query, transactionType, propertyType, page],
  );

  useEffect(() => {
    const timeout = setTimeout(() => searchProperties(true), 500);
    return () => clearTimeout(timeout);
  }, [query, transactionType, propertyType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await searchProperties(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (properties.length < total && !loading) {
      setPage((p) => p + 1);
      searchProperties(false);
    }
  };

  const renderProperty = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/property/${item.id}`)}>
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

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filters}>
        <ScrollChips
          items={TRANSACTION_TYPES}
          selected={transactionType}
          onSelect={setTransactionType}
        />
      </View>
      <View style={styles.filters}>
        <ScrollChips items={PROPERTY_TYPES} selected={propertyType} onSelect={setPropertyType} />
      </View>

      {/* Results */}
      <Text style={styles.resultCount}>{total} properties found</Text>

      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No properties found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function ScrollChips({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={items}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.chip, selected === item && styles.chipActive]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.chipText, selected === item && styles.chipTextActive]}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: { padding: 16, backgroundColor: '#fff' },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  filters: { paddingHorizontal: 16, paddingVertical: 4 },
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
  resultCount: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, color: '#6b7280' },
  list: { paddingHorizontal: 16 },
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
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
