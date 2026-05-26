import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { societiesApi } from '@/lib/api/societies';
import { dealersApi } from '@/lib/api/dealers';

type Society = { id: string; name: string; slug: string; city: string };

type SubmitState = 'idle' | 'submitting' | 'success';

export default function BecomeDealerScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string | null>(null);
  const [residentConfirmed, setResidentConfirmed] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [loadingSocieties, setLoadingSocieties] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSocieties(true);
    societiesApi
      .list({ limit: '100' })
      .then(({ data }) => {
        if (cancelled) return;
        const inner = data?.data?.data || data?.data || data;
        setSocieties(Array.isArray(inner) ? inner : []);
      })
      .catch(() => {
        if (!cancelled) setErrorMessage('Could not load societies. Try again.');
      })
      .finally(() => {
        if (!cancelled) setLoadingSocieties(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(
    () => isAuthenticated && !!selectedSocietyId && residentConfirmed && submitState === 'idle',
    [isAuthenticated, selectedSocietyId, residentConfirmed, submitState],
  );

  const onSubmit = useCallback(async () => {
    if (!canSubmit || !selectedSocietyId) return;
    setSubmitState('submitting');
    setErrorMessage(null);
    try {
      await dealersApi.apply({ societyId: selectedSocietyId });
      setSubmitState('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;
      setErrorMessage(msg || 'Failed to submit. Try again.');
      setSubmitState('idle');
    }
  }, [canSubmit, selectedSocietyId]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Log in to apply</Text>
        <Text style={styles.subtitle}>You need an RDN account to submit a dealer application.</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  if (submitState === 'success') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Application submitted</Text>
        <Text style={styles.subtitle}>
          Your society's RWA admin will review and approve. You'll get a notification.
        </Text>
        <Button title="Done" onPress={() => router.replace('/(tabs)/profile')} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Apply to become a dealer</Text>
        <Text style={styles.subtitle}>
          Applying as {user?.name}. Dealers earn commission on rentals and sales in their society.
        </Text>

        <Text style={styles.label}>Select your society</Text>
        {loadingSocieties ? (
          <ActivityIndicator color="#2563eb" />
        ) : societies.length === 0 ? (
          <Text style={styles.muted}>No societies available.</Text>
        ) : (
          societies.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.option, selectedSocietyId === s.id && styles.optionSelected]}
              onPress={() => setSelectedSocietyId(s.id)}
            >
              <Text style={styles.optionTitle}>{s.name}</Text>
              <Text style={styles.optionCity}>{s.city}</Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setResidentConfirmed((v) => !v)}
        >
          <View style={[styles.checkbox, residentConfirmed && styles.checkboxChecked]}>
            {residentConfirmed && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm I am a resident of this society and agree to RDN dealer terms.
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        <Button
          title={submitState === 'submitting' ? 'Submitting…' : 'Submit application'}
          onPress={onSubmit}
          disabled={!canSubmit}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
  muted: { fontSize: 14, color: '#9ca3af' },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  optionCity: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, marginBottom: 16 },
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
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
});
