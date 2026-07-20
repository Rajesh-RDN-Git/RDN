import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { ActionSheet, SheetAction } from '@/components/ui/ActionSheet';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/lib/api/users';
import { ROLE_LABELS } from '@rdn/shared';

const STANDALONE_ROLES = ['SUPER_ADMIN', 'OWNER', 'BUYER_TENANT'] as const;

const roleColors: Record<string, string> = {
  SUPER_ADMIN: '#2563eb',
  RWA_ADMIN: '#0891b2',
  DEALER: '#10b981',
  OWNER: '#f59e0b',
  BUYER_TENANT: '#6b7280',
};

const roleLabel = (role: string) => ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;

interface UserDetail {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  status: string;
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [target, setTarget] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isSelf = currentUser?.id === id;

  const loadUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await usersApi.getById(id);
      setTarget(data.data ?? data);
    } catch {
      /* failed to load user */
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const runAction = async (action: () => Promise<unknown>) => {
    setActionPending(true);
    try {
      await action();
      await loadUser();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Action failed. Please try again.';
      Alert.alert('Error', msg);
    }
    setActionPending(false);
  };

  const confirmRole = (role: string) => {
    if (!target) return;
    Alert.alert(
      'Change role',
      `Change ${target.name} from ${roleLabel(target.role)} to ${roleLabel(role)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => runAction(() => usersApi.updateRole(target.id, role)) },
      ],
    );
  };

  const buildActions = (): SheetAction[] => {
    if (!target || !isSuperAdmin || isSelf) return [];
    const actions: SheetAction[] = [];

    for (const role of STANDALONE_ROLES) {
      if (role !== target.role) {
        actions.push({ label: `Make ${roleLabel(role)}`, onPress: () => confirmRole(role) });
      }
    }
    // DEALER / RWA_ADMIN need linked society records — route to the dedicated flows.
    actions.push({
      label: 'Make Dealer (opens Add Dealer)…',
      onPress: () => router.push('/manage/dealers' as never),
    });
    actions.push({
      label: 'Make RWA Admin (opens Societies)…',
      onPress: () => router.push('/manage/societies' as never),
    });
    return actions;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!target) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>User not found</Text>
      </View>
    );
  }

  const actions = buildActions();
  const roleColor = roleColors[target.role] ?? '#6b7280';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <Text style={styles.userName}>{target.name || 'Unknown'}</Text>
          {target.email ? <Text style={styles.userEmail}>{target.email}</Text> : null}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: roleColor + '20' }]}>
              <Text style={[styles.badgeText, { color: roleColor }]}>{roleLabel(target.role)}</Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: (target.status === 'ACTIVE' ? '#10b981' : '#9ca3af') + '20' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: target.status === 'ACTIVE' ? '#10b981' : '#9ca3af' },
                ]}
              >
                {target.status}
              </Text>
            </View>
          </View>
        </Card>

        {isSelf && <Text style={styles.selfNote}>You cannot change your own role.</Text>}

        {isSuperAdmin && !isSelf && actions.length > 0 && (
          <TouchableOpacity
            style={[styles.manageBtn, actionPending && styles.manageBtnDisabled]}
            disabled={actionPending}
            onPress={() => setSheetVisible(true)}
          >
            {actionPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.manageBtnText}>Change Role</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Change Role"
        actions={actions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 32 },

  profileCard: { marginBottom: 12 },
  userName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 8 },

  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  selfNote: { fontSize: 13, color: '#6b7280', marginBottom: 12, paddingHorizontal: 4 },

  manageBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  manageBtnDisabled: { opacity: 0.6 },
  manageBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  emptyText: { fontSize: 16, color: '#9ca3af' },
});
