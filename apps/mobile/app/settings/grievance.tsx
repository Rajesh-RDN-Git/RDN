import { useCallback, useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dpdpGrievanceApi, type DpdpCategory } from '@/lib/api/consent';

const CATEGORIES: Array<{ key: DpdpCategory; label: string }> = [
  { key: 'DATA_ACCESS', label: 'Data access / portability' },
  { key: 'DATA_ERASURE', label: 'Data erasure' },
  { key: 'DATA_CORRECTION', label: 'Correction' },
  { key: 'CONSENT_WITHDRAWAL', label: 'Consent withdrawal' },
  { key: 'DPDP_OTHER', label: 'Other' },
];

export default function GrievanceScreen() {
  const [category, setCategory] = useState<DpdpCategory>('DPDP_OTHER');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = useCallback(async () => {
    if (description.trim().length < 10) {
      Alert.alert('Required', 'Please describe your grievance (at least 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await dpdpGrievanceApi.submit(category, description.trim());
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [category, description]);

  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Grievance submitted</Text>
          <Text style={styles.paragraph}>
            Our Grievance Officer will acknowledge within 7 days and resolve within 30 days per DPDP
            Section 8(9).
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Data grievance</Text>
        <Text style={styles.paragraph}>
          Submit DPDP Act 2023 grievances. For property/service complaints, use the in-app grievance
          flow under each listing.
        </Text>

        <Text style={styles.label}>Category</Text>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.option, category === c.key && styles.optionSelected]}
            onPress={() => setCategory(c.key)}
          >
            <Text style={styles.optionText}>{c.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Please describe with as much detail as possible."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          style={styles.textarea}
        />

        <View style={styles.spacer} />
        <Button
          title={submitting ? 'Submitting…' : 'Submit grievance'}
          onPress={onSubmit}
          disabled={submitting}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  card: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  paragraph: { fontSize: 14, color: '#374151', marginTop: 8, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 14, color: '#111827' },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  spacer: { height: 16 },
});
