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
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { searchApi } from '@/lib/api/search';

const TRANSACTION_TYPES = ['ALL', 'RENT', 'SALE'] as const;
const PROPERTY_TYPES = ['ALL', 'APARTMENT', 'VILLA', 'PENTHOUSE', 'STUDIO'] as const;
const BHK_OPTIONS = ['ALL', '1', '2', '3', '4', '5+'] as const;

type SortKey = 'recent' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: Array<{ key: SortKey; label: string; sortBy: string; sortDir: string }> = [
  { key: 'recent', label: 'Most recent', sortBy: 'createdAt', sortDir: 'desc' },
  { key: 'price_asc', label: 'Price: low to high', sortBy: 'price', sortDir: 'asc' },
  { key: 'price_desc', label: 'Price: high to low', sortBy: 'price', sortDir: 'desc' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string>('ALL');
  const [propertyType, setPropertyType] = useState<string>('ALL');
  const [bhk, setBhk] = useState<string>('ALL');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const buildParams = useCallback(
    (targetPage: number): Record<string, string> => {
      const sortOpt = SORT_OPTIONS.find((s) => s.key === sort) ?? SORT_OPTIONS[0];
      const params: Record<string, string> = {
        page: String(targetPage),
        limit: '20',
        sortBy: sortOpt.sortBy,
        sortDir: sortOpt.sortDir,
      };
      if (query) params.city = query;
      if (transactionType !== 'ALL') params.transactionType = transactionType;
      if (propertyType !== 'ALL') params.type = propertyType;
      if (bhk !== 'ALL') params.bhk = bhk.replace('+', '');
      return params;
    },
    [query, transactionType, propertyType, bhk, sort],
  );

  const searchProperties = useCallback(
    async (resetPage: boolean) => {
      setLoading(true);
      try {
        const targetPage = resetPage ? 1 : page;
        const { data } = await searchApi.search(buildParams(targetPage));
        const result = data.data || data;
        if (resetPage) {
          setProperties(result.data || []);
          setPage(1);
        } else {
          setProperties((prev) => [...prev, ...(result.data || [])]);
        }
        setTotal(result.total || 0);
      } catch {
        /* network error */
      }
      setLoading(false);
    },
    [buildParams, page],
  );

  useEffect(() => {
    const timeout = setTimeout(() => searchProperties(true), 400);
    return () => clearTimeout(timeout);
  }, [query, transactionType, propertyType, bhk, sort, searchProperties]);

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

  const currentSort = SORT_OPTIONS.find((s) => s.key === sort) ?? SORT_OPTIONS[0];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

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
      <View style={styles.filters}>
        <ScrollChips items={BHK_OPTIONS} selected={bhk} onSelect={setBhk} labelPrefix="BHK " />
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.resultCount}>{total} properties</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalOpen(true)}>
          <Text style={styles.sortBtnText}>Sort: {currentSort.label}</Text>
        </TouchableOpacity>
      </View>

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

      <Modal
        transparent
        visible={sortModalOpen}
        animationType="fade"
        onRequestClose={() => setSortModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSortModalOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.modalOption}
                onPress={() => {
                  setSort(opt.key);
                  setSortModalOpen(false);
                }}
              >
                <Text
                  style={[styles.modalOptionText, sort === opt.key && styles.modalOptionActive]}
                >
                  {opt.label}
                </Text>
                {sort === opt.key && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ScrollChips({
  items,
  selected,
  onSelect,
  labelPrefix,
}: {
  items: readonly string[];
  selected: string;
  onSelect: (item: string) => void;
  labelPrefix?: string;
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
          <Text style={[styles.chipText, selected === item && styles.chipTextActive]}>
            {labelPrefix && item !== 'ALL' ? `${labelPrefix}${item}` : item}
          </Text>
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: { fontSize: 13, color: '#6b7280' },
  sortBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  sortBtnText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  modalOptionText: { fontSize: 15, color: '#374151' },
  modalOptionActive: { color: '#2563eb', fontWeight: '600' },
  modalCheck: { color: '#2563eb', fontSize: 18, fontWeight: 'bold' },
});
