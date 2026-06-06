import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { societiesApi } from '@/lib/api/societies';

const AMENITY_OPTIONS = [
  'Swimming Pool',
  'Gym',
  'Club House',
  'Playground',
  'Garden',
  'CCTV',
  'Security',
  'Parking',
  'Generator',
  'Lift',
];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

interface FormState {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalUnits: string;
  amenities: string[];
  slugDirty: boolean;
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  totalUnits: '',
  amenities: [],
  slugDirty: false,
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  keyboardType,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
  hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export default function NewSocietyScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onNameChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slugDirty ? prev.slug : slugify(value),
    }));
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Society name is required.');
      return;
    }
    if (!form.slug.trim()) {
      Alert.alert('Validation', 'Slug is required.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Validation', 'City is required.');
      return;
    }
    if (!form.address.trim()) {
      Alert.alert('Validation', 'Address is required.');
      return;
    }
    if (!form.state.trim()) {
      Alert.alert('Validation', 'State is required.');
      return;
    }
    if (!form.pincode.trim()) {
      Alert.alert('Validation', 'Pincode is required.');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      Alert.alert('Validation', 'Pincode must be 6 digits.');
      return;
    }
    if (form.totalUnits) {
      const n = Number(form.totalUnits);
      if (!Number.isFinite(n) || n <= 0) {
        Alert.alert('Validation', 'Total units must be a positive number.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      };
      if (form.totalUnits) payload.totalUnits = Number(form.totalUnits);
      if (form.amenities.length) payload.amenities = form.amenities;

      await societiesApi.create(payload);
      router.replace('/manage/societies' as never);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const text = Array.isArray(msg)
        ? msg.join(', ')
        : typeof msg === 'string'
          ? msg
          : 'Failed to create society.';
      Alert.alert('Error', text);
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.accessDenied}>Access restricted to Super Admins</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Society details</Text>

        <Field
          label="Society name"
          value={form.name}
          onChangeText={onNameChange}
          placeholder="Green Valley Apartments"
          required
        />
        <Field
          label="Slug"
          value={form.slug}
          onChangeText={(v) => {
            setField('slugDirty', true);
            setField('slug', v);
          }}
          placeholder="green-valley-apartments"
          required
          hint="Lowercase alphanumeric with hyphens. Auto-filled from name."
        />
        <Field
          label="Address"
          value={form.address}
          onChangeText={(v) => setField('address', v)}
          placeholder="Street, locality"
          required
        />
        <Field
          label="City"
          value={form.city}
          onChangeText={(v) => setField('city', v)}
          placeholder="Gurugram"
          required
        />
        <Field
          label="State"
          value={form.state}
          onChangeText={(v) => setField('state', v)}
          placeholder="Haryana"
          required
        />
        <Field
          label="Pincode"
          value={form.pincode}
          onChangeText={(v) => setField('pincode', v)}
          placeholder="122018"
          required
          keyboardType="number-pad"
          hint="6 digits"
        />
        <Field
          label="Total units"
          value={form.totalUnits}
          onChangeText={(v) => setField('totalUnits', v)}
          placeholder="e.g. 240"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Amenities</Text>
        <View style={styles.amenitiesWrap}>
          {AMENITY_OPTIONS.map((a) => {
            const selected = form.amenities.includes(a);
            return (
              <TouchableOpacity
                key={a}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => toggleAmenity(a)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title={submitting ? 'Creating…' : 'Create society'}
          onPress={onSubmit}
          disabled={submitting}
        />
        {submitting && <ActivityIndicator style={styles.spinner} color="#2563eb" />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  accessDenied: { fontSize: 16, color: '#9ca3af' },

  card: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },

  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  required: { color: '#ef4444' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 3 },

  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#2563eb', fontWeight: '600' },

  actions: { marginTop: 20, gap: 12 },
  spinner: { alignSelf: 'center' },
});
