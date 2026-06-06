import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ActionSheet, SheetAction } from '@/components/ui/ActionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useAuthStore } from '@/stores/auth-store';
import { commissionApi } from '@/lib/api/commission';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  SETTLED: '#10b981',
  DISTRIBUTED: '#3b82f6',
  CANCELLED: '#ef4444',
};

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `Rs ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    /* invalid date */
    return '-';
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

type Sheet = null | 'manage' | 'settle' | 'cancel';

export default function CommissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [commission, setCommission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Sheet state
  const [sheet, setSheet] = useState<Sheet>(null);

  // Settle form
  const [payoutRef, setPayoutRef] = useState('');
  const [settlementDate, setSettlementDate] = useState<Date | null>(null);
  const [settleError, setSettleError] = useState<string | null>(null);

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchCommission = () => {
    if (!id) return;
    setLoading(true);
    commissionApi
      .getById(id)
      .then(({ data }) => setCommission(data.data || data))
      .catch(() => Alert.alert('Error', 'Failed to load commission'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCommission();
  }, [id]);

  // ─── action handlers ──────────────────────────────────────────────────────

  const handleSettle = async () => {
    if (!payoutRef.trim()) {
      setSettleError('Payout reference is required.');
      return;
    }
    setBusy(true);
    setSettleError(null);
    try {
      await commissionApi.settle(id!, {
        payoutReference: payoutRef.trim(),
        settlementDate: settlementDate ? settlementDate.toISOString() : undefined,
      });
      setSheet(null);
      setPayoutRef('');
      setSettlementDate(null);
      fetchCommission();
    } catch (err: any) {
      /* show error from API if present */
      setSettleError(err?.response?.data?.message || 'Failed to settle commission.');
    }
    setBusy(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Reason is required.');
      return;
    }
    setBusy(true);
    setCancelError(null);
    try {
      await commissionApi.cancel(id!, { reason: cancelReason.trim() });
      setSheet(null);
      setCancelReason('');
      fetchCommission();
    } catch (err: any) {
      /* show error from API if present */
      setCancelError(err?.response?.data?.message || 'Failed to cancel commission.');
    }
    setBusy(false);
  };

  const handleDistribute = () => {
    Alert.alert(
      'Mark as Distributed',
      'Confirm that commission has been distributed to the dealer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBusy(true);
            try {
              await commissionApi.distribute(id!);
              fetchCommission();
            } catch (err: any) {
              /* show error to user */
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Failed to distribute commission.',
              );
            }
            setBusy(false);
          },
        },
      ],
    );
  };

  // ─── manage action sheet entries gated by status ──────────────────────────

  const buildManageActions = (): SheetAction[] => {
    if (!commission) return [];
    const actions: SheetAction[] = [];

    if (commission.status === 'PENDING') {
      actions.push({
        label: 'Settle',
        onPress: () => {
          setPayoutRef('');
          setSettlementDate(null);
          setSettleError(null);
          setSheet('settle');
        },
      });
      actions.push({
        label: 'Cancel',
        onPress: () => {
          setCancelReason('');
          setCancelError(null);
          setSheet('cancel');
        },
        destructive: true,
      });
    }

    if (commission.status === 'SETTLED') {
      actions.push({
        label: 'Mark Distributed',
        onPress: handleDistribute,
      });
    }

    return actions;
  };

  // ─── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!commission) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Commission not found.</Text>
      </View>
    );
  }

  const statusColor = statusColors[commission.status] || '#6b7280';
  const net = Number(commission.amount || 0) - Number(commission.gst || 0);
  const manageActions = isAdmin ? buildManageActions() : [];

  return (
    <ScrollView style={styles.container}>
      {/* Status header */}
      <View style={styles.statusHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{commission.status}</Text>
        </View>
        <Text style={styles.dateText}>Created: {formatDate(commission.createdAt)}</Text>
      </View>

      {/* Financial breakdown */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Financial Breakdown</Text>
        <DetailRow label="Amount" value={formatCurrency(commission.amount)} />
        {commission.gst != null && <DetailRow label="GST" value={formatCurrency(commission.gst)} />}
        <View style={styles.divider} />
        <DetailRow label="Net" value={formatCurrency(net)} />
      </Card>

      {/* Settlement details (when settled / distributed) */}
      {(commission.status === 'SETTLED' || commission.status === 'DISTRIBUTED') && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Settlement</Text>
          {commission.payoutReference ? (
            <DetailRow label="Payout Ref" value={commission.payoutReference} />
          ) : null}
          {commission.settlementDate ? (
            <DetailRow label="Settled On" value={formatDate(commission.settlementDate)} />
          ) : null}
        </Card>
      )}

      {/* Cancellation reason */}
      {commission.status === 'CANCELLED' && commission.payoutReference && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Cancellation</Text>
          <Text style={styles.cancelReason}>
            {commission.payoutReference.replace(/^CANCELLED:\s*/, '')}
          </Text>
        </Card>
      )}

      {/* Dealer */}
      {commission.dealer?.user && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Dealer</Text>
          <DetailRow label="Name" value={commission.dealer.user.name || '-'} />
          <DetailRow label="Dealer ID" value={commission.dealer.id?.slice(0, 8) ?? '-'} />
        </Card>
      )}

      {/* Related transaction / property */}
      {commission.transaction && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction</Text>
          <DetailRow label="Txn ID" value={commission.transactionId?.slice(0, 8) ?? '-'} />
          {commission.transaction.type ? (
            <DetailRow label="Type" value={commission.transaction.type} />
          ) : null}
          {commission.transaction.dealValue != null ? (
            <DetailRow
              label="Deal Value"
              value={formatCurrency(commission.transaction.dealValue)}
            />
          ) : null}
          {commission.transaction.property && (
            <DetailRow
              label="Property"
              value={[
                commission.transaction.property.flatNumber,
                commission.transaction.property.towerBlock,
              ]
                .filter(Boolean)
                .join(', ')}
            />
          )}
        </Card>
      )}

      {/* Admin actions */}
      {isAdmin && manageActions.length > 0 && (
        <View style={styles.actions}>
          <Button
            title={busy ? 'Working…' : 'Manage'}
            onPress={() => setSheet('manage')}
            style={styles.actionButton}
          />
        </View>
      )}

      <View style={styles.spacer} />

      {/* Manage action sheet */}
      <ActionSheet
        visible={sheet === 'manage'}
        onClose={() => setSheet(null)}
        title="Manage Commission"
        actions={manageActions}
      />

      {/* Settle bottom sheet */}
      <BottomSheet
        visible={sheet === 'settle'}
        onClose={() => !busy && setSheet(null)}
        title="Settle Commission"
      >
        <View style={styles.sheetSummary}>
          <Text style={styles.sheetSummaryTitle}>
            {commission.dealer?.user?.name || 'Dealer'} · {formatCurrency(commission.amount)}
          </Text>
          <Text style={styles.sheetSummarySubtitle}>
            GST {formatCurrency(commission.gst)} · Txn {commission.transactionId?.slice(0, 8)}
          </Text>
        </View>

        <Input
          label="Payout Reference *"
          placeholder="e.g. Razorpay transfer ID / UTR"
          value={payoutRef}
          onChangeText={setPayoutRef}
          error={settleError ?? undefined}
          editable={!busy}
        />

        <DatePickerField
          label="Settlement Date (optional)"
          value={settlementDate}
          onChange={(d) => setSettlementDate(d)}
        />

        <Button
          title={busy ? 'Settling…' : 'Confirm Settlement'}
          onPress={handleSettle}
          style={styles.sheetButton}
        />
        <TouchableOpacity onPress={() => !busy && setSheet(null)} style={styles.sheetCancelLink}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Cancel bottom sheet */}
      <BottomSheet
        visible={sheet === 'cancel'}
        onClose={() => !busy && setSheet(null)}
        title="Cancel Commission"
      >
        <View style={styles.sheetSummary}>
          <Text style={styles.sheetSummaryTitle}>
            {commission.dealer?.user?.name || 'Dealer'} · {formatCurrency(commission.amount)}
          </Text>
          <Text style={styles.sheetSummarySubtitle}>
            Txn {commission.transactionId?.slice(0, 8)}
          </Text>
        </View>

        <Input
          label="Reason *"
          placeholder="Why is this commission being cancelled?"
          value={cancelReason}
          onChangeText={setCancelReason}
          error={cancelError ?? undefined}
          multiline
          numberOfLines={3}
          editable={!busy}
        />

        <Button
          title={busy ? 'Cancelling…' : 'Confirm Cancellation'}
          onPress={handleCancel}
          style={styles.sheetButton}
        />
        <TouchableOpacity onPress={() => !busy && setSheet(null)} style={styles.sheetCancelLink}>
          <Text style={styles.sheetCancelText}>Back</Text>
        </TouchableOpacity>
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 16, color: '#9ca3af' },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 14, fontWeight: '600' },
  dateText: { fontSize: 13, color: '#6b7280' },
  card: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  divider: { borderTopWidth: 1, borderTopColor: '#f3f4f6', marginVertical: 8 },
  cancelReason: { fontSize: 14, color: '#374151' },
  actions: { padding: 16 },
  actionButton: { width: '100%' },
  spacer: { height: 32 },
  // Sheet internals
  sheetSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sheetSummaryTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  sheetSummarySubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sheetButton: { marginTop: 4 },
  sheetCancelLink: { alignItems: 'center', paddingVertical: 12 },
  sheetCancelText: { fontSize: 14, color: '#6b7280' },
});
