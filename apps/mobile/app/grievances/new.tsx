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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MediaUploader } from '@/components/MediaUploader';
import { useAuthStore } from '@/stores/auth-store';
import { grievanceApi } from '@/lib/api/grievance';

type GrievanceCategory =
  | 'DEALER_CONDUCT'
  | 'PROPERTY_MISMATCH'
  | 'COMMISSION'
  | 'SERVICE'
  | 'SAFETY'
  | 'KEY_ARRANGEMENT'
  | 'VISIT_TIME'
  | 'MEETING_AVAILABILITY'
  | 'OTHER';

type GrievanceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const CATEGORIES: Array<{ key: GrievanceCategory; label: string }> = [
  { key: 'DEALER_CONDUCT', label: 'Dealer Conduct' },
  { key: 'PROPERTY_MISMATCH', label: 'Property Mismatch' },
  { key: 'COMMISSION', label: 'Commission' },
  { key: 'SERVICE', label: 'Service' },
  { key: 'SAFETY', label: 'Safety' },
  { key: 'KEY_ARRANGEMENT', label: 'Key Arrangement' },
  { key: 'VISIT_TIME', label: 'Visit Time' },
  { key: 'MEETING_AVAILABILITY', label: 'Meeting Availability' },
  { key: 'OTHER', label: 'Other' },
];

const SEVERITIES: Array<{ key: GrievanceSeverity; label: string; color: string }> = [
  { key: 'CRITICAL', label: 'Critical', color: '#ef4444' },
  { key: 'HIGH', label: 'High', color: '#f97316' },
  { key: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
  { key: 'LOW', label: 'Low', color: '#10b981' },
];

export default function NewGrievanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    societyId?: string;
    transactionId?: string;
    againstUserId?: string;
  }>();
  const { isAuthenticated } = useAuthStore();

  const [category, setCategory] = useState<GrievanceCategory>('SERVICE');
  const [severity, setSeverity] = useState<GrievanceSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    if (description.trim().length < 10) {
      Alert.alert('Required', 'Please describe your grievance (at least 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      const payload: {
        category: string;
        severity: string;
        description: string;
        evidenceUrls?: string[];
        againstUserId?: string;
        societyId?: string;
        transactionId?: string;
      } = {
        category,
        severity,
        description: description.trim(),
      };

      if (evidenceUrls.length > 0) payload.evidenceUrls = evidenceUrls;
      if (params.societyId) payload.societyId = params.societyId;
      if (params.transactionId) payload.transactionId = params.transactionId;
      if (params.againstUserId) payload.againstUserId = params.againstUserId;

      await grievanceApi.create(payload);
      // /grievances is a new route; cast required until Expo regenerates router types on next `expo start`
      router.replace('/grievances' as never);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message || e?.message || 'Submission failed';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [category, severity, description, evidenceUrls, params, router]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Sign in to raise a grievance</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Raise a grievance</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, category === c.key && styles.chipSelected]}
              onPress={() => setCategory(c.key)}
            >
              <Text style={[styles.chipText, category === c.key && styles.chipTextSelected]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Severity</Text>
        <View style={styles.chipRow}>
          {SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.chip,
                severity === s.key && { borderColor: s.color, backgroundColor: s.color + '18' },
              ]}
              onPress={() => setSeverity(s.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  severity === s.key && { color: s.color, fontWeight: '600' },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened, when, and any context that helps us investigate."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          style={styles.textarea}
        />
        <Text style={styles.charCount}>{description.length} / 5000</Text>

        <Text style={styles.label}>Evidence (optional)</Text>
        <MediaUploader maxItems={5} onChange={setEvidenceUrls} />

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },
  card: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextSelected: { color: '#2563eb', fontWeight: '600' },
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
  charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
  spacer: { height: 16 },
});
