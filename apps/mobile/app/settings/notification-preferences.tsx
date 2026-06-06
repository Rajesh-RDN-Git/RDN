/**
 * Notification Preferences screen.
 *
 * Persistence strategy: LOCAL-ONLY via AsyncStorage (key: rdn_notif_prefs).
 * The API's UpdateUserDto and the User Prisma model have no notificationPreferences
 * field as of 2026-06-07.  When the API adds such a field, replace the
 * AsyncStorage load/save calls with usersApi.me() / usersApi.updateMe({notificationPreferences}).
 */

import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'rdn_notif_prefs';

type PrefKey = 'leadUpdates' | 'deals' | 'commissions' | 'visits' | 'announcements';

interface NotifPrefs {
  leadUpdates: boolean;
  deals: boolean;
  commissions: boolean;
  visits: boolean;
  announcements: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  leadUpdates: true,
  deals: true,
  commissions: true,
  visits: true,
  announcements: true,
};

const ROWS: Array<{ key: PrefKey; label: string; description: string }> = [
  {
    key: 'leadUpdates',
    label: 'Lead Updates',
    description: 'Get notified when leads are assigned or updated',
  },
  {
    key: 'deals',
    label: 'Deal Notifications',
    description: 'Alerts when deals are closed or updated',
  },
  {
    key: 'commissions',
    label: 'Commission Alerts',
    description: 'Commission payout notifications',
  },
  {
    key: 'visits',
    label: 'Visit Reminders',
    description: 'Reminders for scheduled property visits',
  },
  {
    key: 'announcements',
    label: 'System Announcements',
    description: 'Platform updates and announcements',
  },
];

export default function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch {
      /* AsyncStorage read failed — fall back to defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onToggle = (key: PrefKey, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      Alert.alert('Saved', 'Notification preferences updated.');
    } catch {
      /* AsyncStorage write failed */
      Alert.alert('Error', 'Could not save preferences. Please try again.');
    } finally {
      setSaving(false);
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
      <Text style={styles.heading}>Notification Preferences</Text>
      <Text style={styles.intro}>Configure how you receive notifications from RDN.</Text>

      {ROWS.map((row) => (
        <Card key={row.key} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{row.label}</Text>
            <Switch
              value={prefs[row.key]}
              onValueChange={(v) => onToggle(row.key, v)}
              trackColor={{ true: '#2563eb', false: '#d1d5db' }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.rowDesc}>{row.description}</Text>
        </Card>
      ))}

      <View style={styles.saveContainer}>
        <Button
          title={saving ? 'Saving…' : 'Save preferences'}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  intro: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  row: { padding: 16, marginBottom: 8 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  rowDesc: { fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 18 },
  saveContainer: { marginTop: 8 },
});
