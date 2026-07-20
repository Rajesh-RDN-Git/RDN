import { Image } from 'expo-image';
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SaveButton } from '@/components/ui/SaveButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { searchApi } from '@/lib/api/search';
import { societiesApi } from '@/lib/api/societies';
import { AMENITIES_OPTIONS } from '@/components/property-wizard/wizard-types';

const TRANSACTION_TYPES = ['ALL', 'RENT', 'SALE'] as const;
const PROPERTY_TYPES = ['ALL', 'APARTMENT', 'VILLA', 'PENTHOUSE', 'STUDIO'] as const;
const BHK_OPTIONS = ['ALL', '1', '2', '3', '4', '5+'] as const;
const FURNISHING_OPTIONS = ['FURNISHED', 'SEMI', 'UNFURNISHED'] as const;

type SortKey = 'recent' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: Array<{ key: SortKey; label: string; sortBy: string; sortDir: string }> = [
  { key: 'recent', label: 'Most recent', sortBy: 'createdAt', sortDir: 'desc' },
  { key: 'price_asc', label: 'Price: low to high', sortBy: 'price', sortDir: 'asc' },
  { key: 'price_desc', label: 'Price: high to low', sortBy: 'price', sortDir: 'desc' },
];

interface AdvancedFilters {
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  furnishing: string;
  amenities: string[];
  societyId: string;
  societyName: string;
}

const EMPTY_ADVANCED: AdvancedFilters = {
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
  furnishing: '',
  amenities: [],
  societyId: '',
  societyName: '',
};

interface Society {
  id: string;
  name: string;
  city: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string>('ALL');
  const [propertyType, setPropertyType] = useState<string>('ALL');
  const [bhk, setBhk] = useState<string>('ALL');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortModalOpen, setSortModalOpen] = useState(false);

  // Advanced filter state (draft = what the sheet shows; applied = what's active)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<AdvancedFilters>(EMPTY_ADVANCED);
  const [applied, setApplied] = useState<AdvancedFilters>(EMPTY_ADVANCED);

  // Societies for society picker
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyPickerOpen, setSocietyPickerOpen] = useState(false);

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load societies once for the picker
  useEffect(() => {
    societiesApi
      .list({ limit: '100' })
      .then(({ data }) => {
        const list = data?.data?.data ?? data?.data ?? [];
        setSocieties(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        /* society list unavailable */
      });
  }, []);

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

      // Advanced filters
      if (applied.priceMin) params.priceMin = applied.priceMin;
      if (applied.priceMax) params.priceMax = applied.priceMax;
      if (applied.areaMin) params.areaMin = applied.areaMin;
      if (applied.areaMax) params.areaMax = applied.areaMax;
      if (applied.furnishing) params.furnishing = applied.furnishing;
      if (applied.amenities.length) params.amenities = applied.amenities.join(',');
      if (applied.societyId) params.societyId = applied.societyId;

      return params;
    },
    [query, transactionType, propertyType, bhk, sort, applied],
  );

  const searchProperties = useCallback(
    async (resetPage: boolean) => {
      setLoading(true);
      setError(false);
      try {
        const targetPage = resetPage ? 1 : page + 1;
        const { data } = await searchApi.search(buildParams(targetPage));
        const result = data.data || data;
        if (resetPage) {
          setProperties(result.data || []);
          setPage(1);
        } else {
          setProperties((prev) => [...prev, ...(result.data || [])]);
          setPage(targetPage);
        }
        setTotal(result.total || 0);
      } catch {
        setError(true);
      }
      setLoading(false);
    },
    [buildParams, page],
  );

  useEffect(() => {
    const timeout = setTimeout(() => searchProperties(true), 400);
    return () => clearTimeout(timeout);
  }, [query, transactionType, propertyType, bhk, sort, applied, searchProperties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await searchProperties(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (properties.length < total && !loading) {
      // searchProperties(false) computes + commits the next page itself.
      searchProperties(false);
    }
  };

  // Open filters sheet — pre-populate draft from currently applied values
  const openFilters = () => {
    setDraft({ ...applied });
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setApplied({ ...draft });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(EMPTY_ADVANCED);
    setApplied(EMPTY_ADVANCED);
    setFiltersOpen(false);
  };

  const toggleDraftAmenity = (a: string) => {
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  };

  // Count active advanced filters for badge
  const advancedCount = [
    applied.priceMin || applied.priceMax,
    applied.areaMin || applied.areaMax,
    applied.furnishing,
    applied.amenities.length > 0,
    applied.societyId,
  ].filter(Boolean).length;

  const renderProperty = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/property/${item.id}`)}>
      <Card style={styles.propertyCard}>
        {item.media?.[0]?.url ? (
          <Image
            source={{ uri: item.media[0].url }}
            style={styles.cardImage}
            contentFit="cover"
            transition={150}
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImagePlaceholderText}>No photo</Text>
          </View>
        )}
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

  const currentSort = SORT_OPTIONS.find((s) => s.key === sort) ?? SORT_OPTIONS[0];

  // Applied filter removal chips
  const removeApplied = (key: keyof AdvancedFilters) => {
    setApplied((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? [] : '',
      // Clear companion field for ranges
      ...(key === 'priceMin' ? { priceMax: '' } : {}),
      ...(key === 'priceMax' ? { priceMin: '' } : {}),
      ...(key === 'areaMin' ? { areaMax: '' } : {}),
      ...(key === 'areaMax' ? { areaMin: '' } : {}),
      ...(key === 'societyId' ? { societyName: '' } : {}),
    }));
  };

  const removeAppliedAmenity = (a: string) => {
    setApplied((prev) => ({ ...prev, amenities: prev.amenities.filter((x) => x !== a) }));
  };

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
      <View style={styles.filtersRow}>
        <View style={styles.filtersChips}>
          <ScrollChips items={BHK_OPTIONS} selected={bhk} onSelect={setBhk} labelPrefix="BHK " />
        </View>
        <TouchableOpacity
          style={[styles.filtersBtn, advancedCount > 0 && styles.filtersBtnActive]}
          onPress={openFilters}
        >
          <Text style={[styles.filtersBtnText, advancedCount > 0 && styles.filtersBtnTextActive]}>
            Filters{advancedCount > 0 ? ` (${advancedCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Applied advanced filter chips */}
      {applied.priceMin ||
      applied.priceMax ||
      applied.areaMin ||
      applied.areaMax ||
      applied.furnishing ||
      applied.amenities.length > 0 ||
      applied.societyId ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.appliedChipsRow}
        >
          {(applied.priceMin || applied.priceMax) && (
            <DismissChip
              label={`₹${applied.priceMin || '0'}–${applied.priceMax || '∞'}`}
              onRemove={() => {
                setApplied((prev) => ({ ...prev, priceMin: '', priceMax: '' }));
              }}
            />
          )}
          {(applied.areaMin || applied.areaMax) && (
            <DismissChip
              label={`${applied.areaMin || '0'}–${applied.areaMax || '∞'} sqft`}
              onRemove={() => {
                setApplied((prev) => ({ ...prev, areaMin: '', areaMax: '' }));
              }}
            />
          )}
          {applied.furnishing && (
            <DismissChip label={applied.furnishing} onRemove={() => removeApplied('furnishing')} />
          )}
          {applied.amenities.map((a) => (
            <DismissChip key={a} label={a} onRemove={() => removeAppliedAmenity(a)} />
          ))}
          {applied.societyId && applied.societyName && (
            <DismissChip
              label={applied.societyName}
              onRemove={() => {
                setApplied((prev) => ({ ...prev, societyId: '', societyName: '' }));
              }}
            />
          )}
        </ScrollView>
      ) : null}

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
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Couldn&apos;t load properties.</Text>
              <TouchableOpacity onPress={() => searchProperties(true)} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No properties found</Text>
            </View>
          )
        }
      />

      {/* Sort modal */}
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

      {/* Advanced Filters bottom sheet */}
      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
          {/* Price range */}
          <Text style={styles.sectionLabel}>Price range</Text>
          <View style={styles.rangeRow}>
            <TextInput
              style={styles.rangeInput}
              placeholder="Min ₹"
              value={draft.priceMin}
              onChangeText={(v) => setDraft((p) => ({ ...p, priceMin: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.rangeSep}>–</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="Max ₹"
              value={draft.priceMax}
              onChangeText={(v) => setDraft((p) => ({ ...p, priceMax: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Area range */}
          <Text style={styles.sectionLabel}>Carpet area (sq ft)</Text>
          <View style={styles.rangeRow}>
            <TextInput
              style={styles.rangeInput}
              placeholder="Min sqft"
              value={draft.areaMin}
              onChangeText={(v) => setDraft((p) => ({ ...p, areaMin: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.rangeSep}>–</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="Max sqft"
              value={draft.areaMax}
              onChangeText={(v) => setDraft((p) => ({ ...p, areaMax: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Furnishing */}
          <Text style={styles.sectionLabel}>Furnishing</Text>
          <View style={styles.chipWrap}>
            {FURNISHING_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, draft.furnishing === f && styles.filterChipActive]}
                onPress={() => setDraft((p) => ({ ...p, furnishing: p.furnishing === f ? '' : f }))}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    draft.furnishing === f && styles.filterChipTextActive,
                  ]}
                >
                  {f === 'SEMI'
                    ? 'Semi-furnished'
                    : f === 'FURNISHED'
                      ? 'Furnished'
                      : 'Unfurnished'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amenities */}
          <Text style={styles.sectionLabel}>Amenities</Text>
          <View style={styles.chipWrap}>
            {AMENITIES_OPTIONS.map((a) => {
              const active = draft.amenities.includes(a);
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleDraftAmenity(a)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Society */}
          <Text style={styles.sectionLabel}>Society</Text>
          <TouchableOpacity style={styles.societyPicker} onPress={() => setSocietyPickerOpen(true)}>
            <Text
              style={draft.societyId ? styles.societyPickerText : styles.societyPickerPlaceholder}
            >
              {draft.societyName || 'Select society...'}
            </Text>
            <Text style={styles.societyPickerArrow}>›</Text>
          </TouchableOpacity>
          {draft.societyId ? (
            <TouchableOpacity
              onPress={() => setDraft((p) => ({ ...p, societyId: '', societyName: '' }))}
            >
              <Text style={styles.clearSociety}>Clear society</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Society picker modal */}
      <Modal
        transparent
        visible={societyPickerOpen}
        animationType="slide"
        onRequestClose={() => setSocietyPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSocietyPickerOpen(false)}>
          <View style={[styles.modalSheet, styles.societyModal]}>
            <Text style={styles.modalTitle}>Select society</Text>
            <ScrollView>
              {societies.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.societyItem}
                  onPress={() => {
                    setDraft((p) => ({ ...p, societyId: s.id, societyName: s.name }));
                    setSocietyPickerOpen(false);
                  }}
                >
                  <Text style={styles.societyItemName}>{s.name}</Text>
                  <Text style={styles.societyItemCity}>{s.city}</Text>
                </TouchableOpacity>
              ))}
              {societies.length === 0 && (
                <Text style={styles.emptyText}>No societies available</Text>
              )}
            </ScrollView>
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

function DismissChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.dismissChip}>
      <Text style={styles.dismissChipText}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={6}>
        <Text style={styles.dismissChipX}>✕</Text>
      </TouchableOpacity>
    </View>
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filtersChips: { flex: 1 },
  filtersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginLeft: 8,
  },
  filtersBtnActive: { backgroundColor: '#2563eb' },
  filtersBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  filtersBtnTextActive: { color: '#fff' },
  appliedChipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 6,
  },
  dismissChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  dismissChipText: { fontSize: 12, color: '#1e40af', fontWeight: '500' },
  dismissChipX: { fontSize: 11, color: '#1e40af', fontWeight: '700' },
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
  cardImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
  },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardImagePlaceholderText: { color: '#9ca3af', fontSize: 13 },
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
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  retryText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
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
  // Advanced filter sheet
  sheetScroll: { maxHeight: 520 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  rangeSep: { fontSize: 16, color: '#9ca3af' },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#374151' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  societyPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  societyPickerText: { fontSize: 14, color: '#111827' },
  societyPickerPlaceholder: { fontSize: 14, color: '#9ca3af' },
  societyPickerArrow: { fontSize: 18, color: '#6b7280' },
  clearSociety: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  applyBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  societyModal: { maxHeight: 400 },
  societyItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  societyItemName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  societyItemCity: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
