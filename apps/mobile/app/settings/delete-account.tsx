import { useCallback, useState } from 'react';
import { Text, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { unregisterDeviceForPush } from '@/lib/push';

const CONFIRM_TEXT = 'DELETE';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [confirmInput, setConfirmInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = useCallback(() => {
    if (confirmInput.trim() !== CONFIRM_TEXT) {
      Alert.alert('Confirmation required', `Type ${CONFIRM_TEXT} to confirm.`);
      return;
    }
    Alert.alert(
      'Delete account permanently?',
      'This will scrub your profile, sign you out, and cannot be undone. Active leads and past transactions are retained for legal/audit per applicable law.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await unregisterDeviceForPush();
              await authApi.deleteAccount();
              await logout();
              Alert.alert('Account deleted', 'Your account has been removed.');
              router.replace('/(tabs)');
            } catch (err: any) {
              const msg =
                err?.response?.data?.message || err?.message || 'Failed to delete account';
              Alert.alert('Error', msg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [confirmInput, logout, router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.paragraph}>Deleting your account will:</Text>
        <Text style={styles.bullet}>• Remove your name, phone, email, and avatar</Text>
        <Text style={styles.bullet}>• Sign you out on this and all devices</Text>
        <Text style={styles.bullet}>• Cancel push notifications</Text>
        <Text style={styles.bullet}>
          • Anonymize your chat messages (counterparties keep history)
        </Text>
        <Text style={styles.paragraph}>
          Active leads, transactions, and legal records are retained per DPDP Act Section 8(7) and
          purged after the regulatory retention period.
        </Text>
        <Text style={styles.paragraph}>
          To confirm, type <Text style={styles.bold}>{CONFIRM_TEXT}</Text> below.
        </Text>
        <TextInput
          value={confirmInput}
          onChangeText={setConfirmInput}
          placeholder={CONFIRM_TEXT}
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <Button
          title={submitting ? 'Deleting…' : 'Delete my account'}
          onPress={onConfirm}
          disabled={submitting || confirmInput.trim() !== CONFIRM_TEXT}
          variant="outline"
          style={styles.deleteBtn}
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
  bullet: { fontSize: 14, color: '#374151', marginTop: 4, lineHeight: 20 },
  bold: { fontWeight: 'bold', color: '#ef4444' },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  deleteBtn: { marginTop: 16, borderColor: '#ef4444' },
});
