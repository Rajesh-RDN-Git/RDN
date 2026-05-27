import { useCallback, useState } from 'react';
import { Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { consentApi } from '@/lib/api/consent';

export default function DataExportScreen() {
  const [loading, setLoading] = useState(false);

  const onExport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await consentApi.exportData();
      const json = JSON.stringify(data?.data || data, null, 2);
      await Share.share({
        title: 'RDN data export',
        message: json,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to export data';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Data portability</Text>
        <Text style={styles.paragraph}>
          Under DPDP Act 2023 Section 11(c) you may request a copy of your personal data. This
          export bundles your profile, properties, leads, messages, notifications, and consent
          history into a JSON file you can share or save.
        </Text>
        <Text style={styles.paragraph}>
          Encrypted fields (KYC, bank details) are not included raw — contact the Grievance Officer
          if you need those.
        </Text>
        <Button
          title={loading ? 'Preparing…' : 'Export my data'}
          onPress={onExport}
          isLoading={loading}
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
  paragraph: { fontSize: 14, color: '#374151', marginTop: 12, lineHeight: 20 },
});
