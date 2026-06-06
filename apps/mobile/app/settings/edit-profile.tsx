import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MediaUploader } from '@/components/MediaUploader';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/lib/api/users';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.id;
  // Refresh fields when the logged-in user identity changes (e.g. store rehydrates)
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [userId]); // intentional: seed only when user ID changes, not on every property update

  const onAvatarUploaded = useCallback((urls: string[]) => {
    if (urls.length > 0) setAvatarUrl(urls[0] ?? null);
  }, []);

  const onSave = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Basic validation
    if (!trimmedName) {
      Alert.alert('Validation error', 'Name is required.');
      return;
    }
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      Alert.alert('Validation error', 'Please enter a valid email address.');
      return;
    }

    // Build payload — only include changed / non-empty fields
    const payload: { name?: string; email?: string; avatarUrl?: string } = {};
    if (trimmedName !== (user?.name ?? '')) payload.name = trimmedName;
    if (trimmedEmail !== (user?.email ?? '')) payload.email = trimmedEmail;
    if (avatarUrl && avatarUrl !== user?.avatarUrl) payload.avatarUrl = avatarUrl;

    // Always include name (required field) when anything else changes,
    // and always send name if it differs; fallback: send current name so it's never cleared.
    if (!payload.name) {
      // name hasn't changed but we still include it to keep PATCH idempotent
      payload.name = trimmedName;
    }

    setSubmitting(true);
    try {
      const { data: response } = await usersApi.updateMe(payload);
      // Merge the returned user into the store; unwrap one or two data envelopes
      const updated = response?.data?.data ?? response?.data ?? response;
      if (updated && typeof updated === 'object' && 'id' in updated) {
        setUser(updated);
      } else {
        // Fallback: patch the store user manually with what we sent
        if (user) {
          setUser({
            ...user,
            name: trimmedName,
            email: trimmedEmail || user.email,
            avatarUrl: avatarUrl ?? user.avatarUrl,
          });
        }
      }
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [name, email, avatarUrl, user, setUser, router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Avatar</Text>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarPreview} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <MediaUploader maxItems={1} onChange={onAvatarUploaded} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.label}>Full name *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Phone (read-only)</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyText}>{user?.phone ?? '—'}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title={submitting ? 'Saving…' : 'Save changes'}
          onPress={onSave}
          disabled={submitting}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f3f4f6',
  },
  readOnlyText: { fontSize: 16, color: '#6b7280' },
  actions: { marginTop: 8 },
});
