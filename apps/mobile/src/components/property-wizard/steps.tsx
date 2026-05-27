import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Field, TextField, NumberField, OptionRow } from './ui';
import { useWizard } from './wizard-context';
import { AMENITIES_OPTIONS, RESTRICTIONS_OPTIONS } from './wizard-types';
import { MediaUploader } from '../MediaUploader';
import { societiesApi } from '@/lib/api/societies';

type SocietyOption = { id: string; name: string; city: string };

export function BasicsStep() {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;
  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(true);

  useEffect(() => {
    let cancelled = false;
    societiesApi
      .list({ limit: '100' })
      .then(({ data: resp }) => {
        if (cancelled) return;
        const inner = resp?.data?.data || resp?.data || resp;
        setSocieties(Array.isArray(inner) ? inner : []);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoadingSocieties(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) =>
    dispatch({ type: 'SET_FIELD', field, value });

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Field label="Society" error={errors.societyId}>
        {loadingSocieties ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          <View>
            {societies.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.societyOption,
                  data.societyId === s.id && styles.societyOptionSelected,
                ]}
                onPress={() => set('societyId', s.id)}
              >
                <Text style={styles.societyName}>{s.name}</Text>
                <Text style={styles.societyCity}>{s.city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Field>

      <Field label="Tower / Block" error={errors.towerBlock}>
        <TextField
          value={data.towerBlock}
          onChangeText={(v) => set('towerBlock', v)}
          placeholder="e.g. A, Tower 3"
        />
      </Field>
      <Field label="Flat number" error={errors.flatNumber}>
        <TextField
          value={data.flatNumber}
          onChangeText={(v) => set('flatNumber', v)}
          placeholder="e.g. 1204"
        />
      </Field>
      <Field label="Property type" error={errors.type}>
        <OptionRow
          options={['APARTMENT', 'VILLA', 'COMMERCIAL'] as const}
          selected={data.type}
          onSelect={(v) => set('type', v)}
        />
      </Field>
      <Field label="Listing for" error={errors.transactionType}>
        <OptionRow
          options={['RENT', 'SALE', 'BOTH'] as const}
          selected={data.transactionType}
          onSelect={(v) => set('transactionType', v)}
        />
      </Field>
    </ScrollView>
  );
}

export function SpecsStep() {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;
  const set = <K extends keyof typeof data>(f: K, v: (typeof data)[K]) =>
    dispatch({ type: 'SET_FIELD', field: f, value: v });

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      {(data.type === 'APARTMENT' || data.type === 'VILLA' || data.type === '') && (
        <Field label="BHK" error={errors.bhk}>
          <NumberField value={data.bhk} onChange={(n) => set('bhk', n)} placeholder="e.g. 2" />
        </Field>
      )}
      <Field label="Carpet area (sq ft)" error={errors.carpetArea}>
        <NumberField
          value={data.carpetArea}
          onChange={(n) => set('carpetArea', n)}
          placeholder="e.g. 950"
        />
      </Field>
      <Field label="Super-built-up area (sq ft, optional)">
        <NumberField value={data.superArea} onChange={(n) => set('superArea', n)} />
      </Field>
      <Field label="Floor">
        <NumberField value={data.floor} onChange={(n) => set('floor', n)} />
      </Field>
      <Field label="Total floors">
        <NumberField value={data.totalFloors} onChange={(n) => set('totalFloors', n)} />
      </Field>
      <Field label="Facing">
        <OptionRow
          options={['N', 'E', 'W', 'S', 'NE', 'NW', 'SE', 'SW'] as const}
          selected={(data.facing as never) ?? ''}
          onSelect={(v) => set('facing', v)}
        />
      </Field>
      <Field label="Furnishing">
        <OptionRow
          options={['FURNISHED', 'SEMI', 'UNFURNISHED'] as const}
          selected={data.furnishing ?? ''}
          onSelect={(v) => set('furnishing', v)}
        />
      </Field>
    </ScrollView>
  );
}

export function PricingStep() {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;
  const set = <K extends keyof typeof data>(f: K, v: (typeof data)[K]) =>
    dispatch({ type: 'SET_FIELD', field: f, value: v });
  const wantsRent = data.transactionType === 'RENT' || data.transactionType === 'BOTH';
  const wantsSale = data.transactionType === 'SALE' || data.transactionType === 'BOTH';

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      {wantsRent && (
        <>
          <Field label="Monthly rent (₹)" error={errors.priceRent}>
            <NumberField value={data.priceRent} onChange={(n) => set('priceRent', n)} />
          </Field>
          <Field label="Security deposit (₹)">
            <NumberField value={data.securityDeposit} onChange={(n) => set('securityDeposit', n)} />
          </Field>
          <Field label="Maintenance (₹/mo)">
            <NumberField value={data.maintenance} onChange={(n) => set('maintenance', n)} />
          </Field>
        </>
      )}
      {wantsSale && (
        <Field label="Sale price (₹)" error={errors.priceSale}>
          <NumberField value={data.priceSale} onChange={(n) => set('priceSale', n)} />
        </Field>
      )}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => set('negotiable', !data.negotiable)}
      >
        <View style={[styles.checkbox, data.negotiable && styles.checkboxOn]}>
          {data.negotiable && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Price negotiable</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => set('brokerageDisclosed', !data.brokerageDisclosed)}
      >
        <View style={[styles.checkbox, data.brokerageDisclosed && styles.checkboxOn]}>
          {data.brokerageDisclosed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Brokerage applicable</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function PhotosStep() {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Field label="Photos (at least 3)" error={errors.photos}>
        <MediaUploader
          maxItems={15}
          onChange={(urls) =>
            dispatch({
              type: 'SET_PHOTOS',
              photos: urls.map((url, idx) => ({
                id: url,
                url,
                isCover: idx === 0,
                order: idx,
              })),
            })
          }
        />
      </Field>
      {data.photos.length > 0 && (
        <Text style={styles.hint}>
          First photo will be used as cover. Tap × on a thumbnail to remove.
        </Text>
      )}
    </ScrollView>
  );
}

export function AmenitiesStep() {
  const { state, dispatch } = useWizard();
  const { data } = state;
  const set = <K extends keyof typeof data>(f: K, v: (typeof data)[K]) =>
    dispatch({ type: 'SET_FIELD', field: f, value: v });

  const toggleAmenity = (a: string) => {
    const next = data.amenities.includes(a)
      ? data.amenities.filter((x) => x !== a)
      : [...data.amenities, a];
    set('amenities', next);
  };
  const toggleRestriction = (r: string) => {
    const next = { ...data.restrictions, [r]: !data.restrictions[r] };
    set('restrictions', next);
  };

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Field label="Amenities">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AMENITIES_OPTIONS.map((a) => {
            const active = data.amenities.includes(a);
            return (
              <TouchableOpacity
                key={a}
                style={[styles.tagChip, active && styles.tagChipOn]}
                onPress={() => toggleAmenity(a)}
              >
                <Text style={[styles.tagText, active && styles.tagTextOn]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>
      <Field label="Restrictions">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {RESTRICTIONS_OPTIONS.map((r) => {
            const active = !!data.restrictions[r];
            return (
              <TouchableOpacity
                key={r}
                style={[styles.tagChip, active && styles.tagChipOn]}
                onPress={() => toggleRestriction(r)}
              >
                <Text style={[styles.tagText, active && styles.tagTextOn]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>
    </ScrollView>
  );
}

export function ReviewStep() {
  const { state } = useWizard();
  const { data } = state;
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Society', value: data.societyId ? '(selected)' : '—' },
    { label: 'Tower / Flat', value: `${data.towerBlock || '—'} / ${data.flatNumber || '—'}` },
    { label: 'Type', value: data.type || '—' },
    { label: 'For', value: data.transactionType || '—' },
    { label: 'BHK', value: data.bhk ? String(data.bhk) : '—' },
    { label: 'Carpet area', value: data.carpetArea ? `${data.carpetArea} sq ft` : '—' },
    { label: 'Floor', value: data.floor ? `${data.floor}/${data.totalFloors ?? '?'}` : '—' },
    { label: 'Furnishing', value: data.furnishing ?? '—' },
    { label: 'Rent', value: data.priceRent ? `₹${data.priceRent.toLocaleString('en-IN')}` : '—' },
    { label: 'Sale', value: data.priceSale ? `₹${data.priceSale.toLocaleString('en-IN')}` : '—' },
    { label: 'Photos', value: String(data.photos.length) },
    { label: 'Amenities', value: data.amenities.length ? data.amenities.join(', ') : '—' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.reviewIntro}>
        Review your listing before submitting for RWA approval.
      </Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{r.label}</Text>
          <Text style={styles.reviewValue}>{r.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepContent: { padding: 16, paddingBottom: 32 },
  societyOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  societyOptionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  societyName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  societyCity: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 14, color: '#374151' },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  tagChipOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tagText: { fontSize: 13, color: '#374151' },
  tagTextOn: { color: '#fff', fontWeight: '600' },
  reviewIntro: { fontSize: 14, color: '#6b7280', marginBottom: 12, lineHeight: 20 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  reviewLabel: { fontSize: 13, color: '#6b7280' },
  reviewValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
