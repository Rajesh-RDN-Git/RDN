import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/stores/auth-store';
import { verificationApi } from '@/lib/api/verification';

type PendingProperty = {
  id: string;
  flatNumber: string;
  towerBlock?: string;
  type?: string;
  transactionType?: string;
  createdAt: string;
  society?: { id: string; name: string; city?: string };
  owner?: { name?: string };
};

const ALLOWED_ROLES = ['SUPER_ADMIN', 'RWA_ADMIN'] as const;

export default function VerificationQueueScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reject sheet state
  const [rejectSheet, setRejectSheet] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canAccess =
    isAuthenticated && ALLOWED_ROLES.includes(user?.role as (typeof ALLOWED_ROLES)[number]);

  const loadQueue = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const { data } = await verificationApi.propertyQueue();
      // Unwrap possible envelope shapes: {data: {data: [...]}} or {data: [...]} or bare array
      const outer = data?.data ?? data;
      const list: PendingProperty[] = Array.isArray(outer)
        ? outer
        : Array.isArray(outer?.data)
          ? outer.data
          : [];
      setItems(list);
    } catch {
      /* network error — list stays empty; user can pull-to-refresh */
      Alert.alert('Error', 'Failed to load verification queue. Please try again.');
    }
    setLoading(false);
  }, [canAccess]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const handleApprove = (id: string, label: string) => {
    Alert.alert('Approve listing?', `Approve "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setSubmitting(true);
          try {
            await verificationApi.decideProperty(id, { decision: 'RWA_APPROVED' });
            // Optimistically remove from list, then refetch
            setItems((prev) => prev.filter((p) => p.id !== id));
            await loadQueue();
          } catch {
            /* approve failed — show error */
            Alert.alert('Error', 'Could not approve the listing. Please try again.');
          }
          setSubmitting(false);
        },
      },
    ]);
  };

  const openRejectSheet = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectSheet(true);
  };

  const closeRejectSheet = () => {
    setRejectSheet(false);
    setRejectTargetId(null);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectTargetId) return;
    setSubmitting(true);
    try {
      await verificationApi.decideProperty(rejectTargetId, {
        decision: 'REJECTED',
        reason: rejectReason.trim() || undefined,
      });
      closeRejectSheet();
      setItems((prev) => prev.filter((p) => p.id !== rejectTargetId));
      await loadQueue();
    } catch {
      /* reject failed — show error */
      Alert.alert('Error', 'Could not reject the listing. Please try again.');
    }
    setSubmitting(false);
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.gateTitle}>Sign in to access this screen</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  // Wrong role
  if (!canAccess) {
    return (
      <View style={styles.center}>
        <Text style={styles.gateTitle}>Access restricted</Text>
        <Text style={styles.gateSubtitle}>
          Only RWA admins and super admins can review listings.
        </Text>
        <Button title="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: PendingProperty }) => {
    const label = [item.flatNumber, item.towerBlock].filter(Boolean).join(', ');
    return (
      <Card style={styles.card}>
        {/* Row 1: flat + date */}
        <View style={styles.cardHeader}>
          <Text style={styles.flatLabel}>{label || 'Property'}</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-IN')}
          </Text>
        </View>

        {/* Row 2: society */}
        {item.society?.name ? (
          <Text style={styles.societyText}>
            {item.society.name}
            {item.society.city ? `, ${item.society.city}` : ''}
          </Text>
        ) : null}

        {/* Row 3: type + transaction type */}
        <View style={styles.metaRow}>
          {item.type ? <Text style={styles.metaChip}>{item.type}</Text> : null}
          {item.transactionType ? (
            <View
              style={[
                styles.txBadge,
                item.transactionType === 'SALE' ? styles.saleBadge : styles.rentBadge,
              ]}
            >
              <Text style={styles.txBadgeText}>{item.transactionType}</Text>
            </View>
          ) : null}
        </View>

        {/* Row 4: owner name if present */}
        {item.owner?.name ? <Text style={styles.ownerText}>Owner: {item.owner.name}</Text> : null}

        {/* Row 5: action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.approveBtn, submitting && styles.disabledBtn]}
            disabled={submitting}
            onPress={() => handleApprove(item.id, label)}
          >
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectBtn, submitting && styles.disabledBtn]}
            disabled={submitting}
            onPress={() => openRejectSheet(item.id)}
          >
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Verification Queue</Text>
        {items.length > 0 && <Text style={styles.totalCount}>{items.length} pending</Text>}
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No pending listings</Text>
              <Text style={styles.emptySubtext}>All properties have been reviewed.</Text>
            </View>
          ) : null
        }
      />

      {/* Reject reason bottom sheet */}
      <BottomSheet visible={rejectSheet} onClose={closeRejectSheet} title="Reject listing">
        <Text style={styles.sheetLabel}>Reason (optional)</Text>
        <TextInput
          style={styles.sheetInput}
          placeholder="Enter reason for rejection..."
          placeholderTextColor="#9ca3af"
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={closeRejectSheet}
            disabled={submitting}
          >
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetConfirmBtn, submitting && styles.disabledBtn]}
            onPress={handleRejectConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sheetConfirmText}>Confirm Reject</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  gateSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },

  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  totalCount: { fontSize: 13, color: '#6b7280' },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { marginBottom: 12 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  flatLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  societyText: { fontSize: 13, color: '#6b7280', marginBottom: 6 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaChip: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  saleBadge: { backgroundColor: '#dbeafe' },
  rentBadge: { backgroundColor: '#d1fae5' },
  txBadgeText: { fontSize: 11, fontWeight: '600', color: '#1e40af' },

  ownerText: { fontSize: 13, color: '#374151', marginBottom: 8 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  approveBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  rejectBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  rejectBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  disabledBtn: { opacity: 0.5 },

  footerSpinner: { padding: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },

  // Reject bottom sheet
  sheetLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  sheetInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    marginBottom: 16,
  },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  sheetCancelText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  sheetConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
