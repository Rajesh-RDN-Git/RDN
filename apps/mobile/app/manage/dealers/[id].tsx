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
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { ActionSheet, SheetAction } from '@/components/ui/ActionSheet';
import { useAuthStore } from '@/stores/auth-store';
import { dealersApi } from '@/lib/api/dealers';
import { KYCStatus, ApprovalStatus, TrainingStatus } from '@rdn/shared';

// CertificationStatus not yet in shared dist — mirror types/dealer.ts exactly
const CertificationStatus = {
  NOT_CERTIFIED: 'NOT_CERTIFIED',
  CERTIFIED: 'CERTIFIED',
  REVOKED: 'REVOKED',
} as const;

const kycColors: Record<string, string> = {
  [KYCStatus.APPROVED]: '#10b981',
  [KYCStatus.REJECTED]: '#ef4444',
  [KYCStatus.PENDING]: '#f59e0b',
};

const approvalColors: Record<string, string> = {
  [ApprovalStatus.APPROVED]: '#10b981',
  [ApprovalStatus.REJECTED]: '#ef4444',
  [ApprovalStatus.PENDING]: '#f59e0b',
};

const trainingColors: Record<string, string> = {
  [TrainingStatus.COMPLETED]: '#10b981',
  [TrainingStatus.PENDING]: '#f59e0b',
};

const certColors: Record<string, string> = {
  CERTIFIED: '#2563eb',
  REVOKED: '#ef4444',
  NOT_CERTIFIED: '#9ca3af',
};

function StatusRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={[styles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.badgeText, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function DealerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isRwaAdmin = user?.role === 'RWA_ADMIN';
  const isAdmin = isSuperAdmin || isRwaAdmin;

  const loadDealer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await dealersApi.getById(id);
      setDealer(data);
    } catch {
      /* failed to load dealer */
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadDealer();
  }, [loadDealer]);

  const runAction = async (action: () => Promise<unknown>) => {
    setActionPending(true);
    try {
      await action();
      await loadDealer();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Action failed. Please try again.';
      Alert.alert('Error', msg);
    }
    setActionPending(false);
  };

  const confirmThenRun = (title: string, message: string, action: () => Promise<unknown>) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: () => runAction(action),
      },
    ]);
  };

  const buildActions = (): SheetAction[] => {
    if (!dealer || !isAdmin) return [];
    const actions: SheetAction[] = [];

    // Approve / Reject application — SUPER_ADMIN and RWA_ADMIN when PENDING
    if (dealer.rwaApprovalStatus === ApprovalStatus.PENDING && (isSuperAdmin || isRwaAdmin)) {
      actions.push({
        label: 'Approve Application',
        onPress: () => runAction(() => dealersApi.approve(dealer.id)),
      });
      actions.push({
        label: 'Reject Application',
        destructive: true,
        onPress: () =>
          confirmThenRun(
            'Reject Application',
            'This will reject the dealer application. Continue?',
            () => dealersApi.reject(dealer.id),
          ),
      });
    }

    // KYC actions — SUPER_ADMIN only
    if (isSuperAdmin && dealer.kycStatus === KYCStatus.PENDING) {
      actions.push({
        label: 'Approve KYC',
        onPress: () => runAction(() => dealersApi.updateKyc(dealer.id, { kycStatus: 'APPROVED' })),
      });
      actions.push({
        label: 'Reject KYC',
        destructive: true,
        onPress: () =>
          confirmThenRun('Reject KYC', 'This will reject the KYC submission. Continue?', () =>
            dealersApi.updateKyc(dealer.id, { kycStatus: 'REJECTED' }),
          ),
      });
    }

    // Training — SUPER_ADMIN only, only when not already COMPLETED
    if (isSuperAdmin && dealer.trainingStatus !== TrainingStatus.COMPLETED) {
      actions.push({
        label: 'Mark Training Complete',
        onPress: () => runAction(() => dealersApi.trainingComplete(dealer.id)),
      });
    }

    // Activate / Deactivate — SUPER_ADMIN only
    if (isSuperAdmin) {
      if (dealer.isActive) {
        actions.push({
          label: 'Deactivate Dealer',
          destructive: true,
          onPress: () =>
            confirmThenRun(
              'Deactivate Dealer',
              'The dealer will lose access to new leads. Continue?',
              () => dealersApi.setActive(dealer.id, { isActive: false }),
            ),
        });
      } else if (
        dealer.kycStatus === KYCStatus.APPROVED &&
        dealer.rwaApprovalStatus === ApprovalStatus.APPROVED &&
        dealer.trainingStatus === TrainingStatus.COMPLETED
      ) {
        actions.push({
          label: 'Activate Dealer',
          onPress: () => runAction(() => dealersApi.setActive(dealer.id, { isActive: true })),
        });
      }
    }

    // Certify / Revoke — SUPER_ADMIN only
    if (isSuperAdmin) {
      if (dealer.certificationStatus === CertificationStatus.CERTIFIED) {
        actions.push({
          label: 'Revoke Certification',
          destructive: true,
          onPress: () =>
            confirmThenRun(
              'Revoke Certification',
              "The dealer's certification will be revoked. Continue?",
              () => dealersApi.revokeCertification(dealer.id),
            ),
        });
      } else if (dealer.trainingStatus === TrainingStatus.COMPLETED) {
        actions.push({
          label: 'Certify Dealer',
          onPress: () => runAction(() => dealersApi.certify(dealer.id)),
        });
      }
    }

    return actions;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!dealer) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Dealer not found</Text>
      </View>
    );
  }

  const actions = buildActions();
  const certLabel =
    dealer.certificationStatus === CertificationStatus.CERTIFIED
      ? 'Certified'
      : dealer.certificationStatus === CertificationStatus.REVOKED
        ? 'Revoked'
        : 'Not Certified';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <Text style={styles.dealerName}>{dealer.user?.name || 'Unknown Dealer'}</Text>
          {dealer.user?.email ? <Text style={styles.dealerEmail}>{dealer.user.email}</Text> : null}
          {dealer.society?.name ? (
            <Text style={styles.societyName}>{dealer.society.name}</Text>
          ) : null}
        </Card>

        {/* Status card */}
        <Card style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Status</Text>
          <StatusRow
            label="KYC"
            value={dealer.kycStatus}
            color={kycColors[dealer.kycStatus] ?? '#6b7280'}
          />
          <StatusRow
            label="RWA Approval"
            value={dealer.rwaApprovalStatus}
            color={approvalColors[dealer.rwaApprovalStatus] ?? '#6b7280'}
          />
          <StatusRow
            label="Training"
            value={dealer.trainingStatus}
            color={trainingColors[dealer.trainingStatus] ?? '#6b7280'}
          />
          <StatusRow
            label="Active"
            value={dealer.isActive ? 'Yes' : 'No'}
            color={dealer.isActive ? '#10b981' : '#9ca3af'}
          />
          <StatusRow
            label="Certification"
            value={certLabel}
            color={certColors[dealer.certificationStatus] ?? '#9ca3af'}
          />
        </Card>

        {/* Stats card */}
        {(dealer._count?.leads != null || dealer._count?.commissions != null) && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dealer._count?.leads ?? 0}</Text>
                <Text style={styles.statLabel}>Leads</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dealer._count?.commissions ?? 0}</Text>
                <Text style={styles.statLabel}>Commissions</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Manage button */}
        {isAdmin && actions.length > 0 && (
          <TouchableOpacity
            style={[styles.manageBtn, actionPending && styles.manageBtnDisabled]}
            disabled={actionPending}
            onPress={() => setSheetVisible(true)}
          >
            {actionPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.manageBtnText}>Manage</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Manage Dealer"
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
  dealerName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  dealerEmail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  societyName: { fontSize: 14, color: '#374151' },

  statusCard: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusLabel: { fontSize: 14, color: '#374151' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  statsCard: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 2 },

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
