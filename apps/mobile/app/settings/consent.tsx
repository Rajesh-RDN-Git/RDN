import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView, Switch, View, ActivityIndicator, Alert } from 'react-native';
import { Card } from '@/components/ui/Card';
import { consentApi, type ConsentPurpose } from '@/lib/api/consent';

type ConsentRow = {
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt?: string;
  withdrawnAt?: string | null;
};

const ROWS: Array<{
  purpose: ConsentPurpose;
  label: string;
  description: string;
  mandatory?: boolean;
}> = [
  {
    purpose: 'CORE_SERVICE',
    label: 'Core service',
    description: 'Account, listings, leads, chat. Required for RDN to function.',
    mandatory: true,
  },
  {
    purpose: 'MARKETING',
    label: 'Marketing communications',
    description: 'Promotions, new society launches, dealer offers. Email/SMS/WhatsApp.',
  },
  {
    purpose: 'ANALYTICS',
    label: 'Product analytics',
    description: 'Anonymized usage telemetry to improve the app.',
  },
  {
    purpose: 'THIRD_PARTY',
    label: 'Third-party integrations',
    description: 'Razorpay (payments), MSG91 (OTP), Exotel (calls), Interakt (WhatsApp).',
  },
];

export default function ConsentScreen() {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ConsentPurpose | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await consentApi.current();
      const rows: ConsentRow[] = data?.data || data || [];
      const map: Record<string, boolean> = {};
      for (const r of rows) {
        map[r.purpose] = r.granted && !r.withdrawnAt;
      }
      setState(map);
    } catch {
      /* fallback to defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onToggle = async (purpose: ConsentPurpose, granted: boolean, mandatory?: boolean) => {
    if (mandatory && !granted) {
      Alert.alert(
        'Required',
        'Core service consent cannot be withdrawn while your account is active.',
      );
      return;
    }
    setSaving(purpose);
    setState((s) => ({ ...s, [purpose]: granted }));
    try {
      await consentApi.grant(purpose, granted);
    } catch {
      setState((s) => ({ ...s, [purpose]: !granted }));
      Alert.alert('Error', 'Failed to update consent. Try again.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Manage consent</Text>
      <Text style={styles.intro}>
        Granular consent under DPDP Act 2023. Toggle individual purposes. Withdrawal is effective
        immediately and recorded for audit.
      </Text>
      {ROWS.map((row) => (
        <Card key={row.purpose} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{row.label}</Text>
            <Switch
              value={!!state[row.purpose] || row.mandatory === true}
              onValueChange={(v) => onToggle(row.purpose, v, row.mandatory)}
              disabled={saving === row.purpose || row.mandatory}
            />
          </View>
          <Text style={styles.rowDesc}>{row.description}</Text>
          {row.mandatory && <Text style={styles.required}>Required</Text>}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  intro: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  row: { padding: 16, marginBottom: 8 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowDesc: { fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 18 },
  required: { fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: '600' },
});
