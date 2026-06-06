import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { useAuthStore } from '@/stores/auth-store';
import { transactionsApi } from '@/lib/api/transactions';

// PaymentStatus enum values from Prisma / UpdatePaymentStatusDto
const PAYMENT_STATUS_VALUES = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] as const;
type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

const paymentStatusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  PARTIAL: '#3b82f6',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
};

const typeColors: Record<string, string> = {
  RENT: '#8b5cf6',
  SALE: '#0ea5e9',
  RENEWAL: '#14b8a6',
};

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
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

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchTransaction = () => {
    if (!id) return;
    setLoading(true);
    transactionsApi
      .getById(id)
      .then(({ data }) => setTransaction(data.data || data))
      .catch(() => Alert.alert('Error', 'Failed to load transaction'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const handleUpdatePaymentStatus = (newStatus: PaymentStatus) => {
    Alert.alert('Update Payment Status', `Set payment status to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setBusy(true);
          try {
            await transactionsApi.updatePaymentStatus(id!, { paymentStatus: newStatus });
            fetchTransaction();
          } catch (err: any) {
            /* show API error to user */
            Alert.alert(
              'Error',
              err?.response?.data?.message || 'Failed to update payment status.',
            );
          }
          setBusy(false);
        },
      },
    ]);
  };

  const buildSheetActions = () =>
    PAYMENT_STATUS_VALUES.filter((s) => s !== transaction?.paymentStatus).map((s) => ({
      label: s,
      onPress: () => handleUpdatePaymentStatus(s),
      destructive: s === 'OVERDUE',
    }));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Transaction not found.</Text>
      </View>
    );
  }

  const psColor = paymentStatusColors[transaction.paymentStatus] || '#6b7280';
  const typeColor = typeColors[transaction.type] || '#6b7280';

  return (
    <ScrollView style={styles.container}>
      {/* Status header */}
      <View style={styles.statusHeader}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>{transaction.type}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: psColor + '20', marginLeft: 8 }]}>
            <Text style={[styles.badgeText, { color: psColor }]}>{transaction.paymentStatus}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>Closed: {formatDate(transaction.closedAt)}</Text>
      </View>

      {/* Financial breakdown */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Financial Breakdown</Text>
        <DetailRow label="Deal Value" value={formatCurrency(transaction.dealValue)} />
        {transaction.buyerCommission != null && (
          <DetailRow label="Buyer Commission" value={formatCurrency(transaction.buyerCommission)} />
        )}
        {transaction.sellerCommission != null && (
          <DetailRow
            label="Seller Commission"
            value={formatCurrency(transaction.sellerCommission)}
          />
        )}
        {transaction.gstAmount != null && (
          <DetailRow label="GST Amount" value={formatCurrency(transaction.gstAmount)} />
        )}
        <View style={styles.divider} />
        {transaction.rdnShare != null && (
          <DetailRow label="RDN Share" value={formatCurrency(transaction.rdnShare)} />
        )}
        {transaction.dealerShare != null && (
          <DetailRow label="Dealer Share" value={formatCurrency(transaction.dealerShare)} />
        )}
        {transaction.rwaShare != null && (
          <DetailRow label="RWA Share" value={formatCurrency(transaction.rwaShare)} />
        )}
      </Card>

      {/* Property */}
      {transaction.property && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Property</Text>
          {transaction.property.flatNumber && (
            <DetailRow label="Flat" value={transaction.property.flatNumber} />
          )}
          {transaction.property.towerBlock && (
            <DetailRow label="Tower/Block" value={transaction.property.towerBlock} />
          )}
          {transaction.property.type && (
            <DetailRow label="Type" value={transaction.property.type} />
          )}
          {transaction.property.society?.name && (
            <DetailRow label="Society" value={transaction.property.society.name} />
          )}
        </Card>
      )}

      {/* Lead */}
      {transaction.lead && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Lead</Text>
          <DetailRow label="Lead ID" value={transaction.leadId?.slice(0, 8) ?? '-'} />
          {transaction.lead.status && (
            <DetailRow label="Lead Status" value={transaction.lead.status} />
          )}
          {transaction.lead.dealer?.user?.name && (
            <DetailRow label="Dealer" value={transaction.lead.dealer.user.name} />
          )}
        </Card>
      )}

      {/* Commissions */}
      {transaction.commissions?.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Commissions ({transaction.commissions.length})</Text>
          {transaction.commissions.map((c: any, idx: number) => (
            <View key={c.id || idx} style={idx > 0 ? styles.divider : undefined}>
              <DetailRow label="Amount" value={formatCurrency(c.amount)} />
              {c.status && <DetailRow label="Status" value={c.status} />}
              {c.dealer?.user?.name && <DetailRow label="Dealer" value={c.dealer.user.name} />}
            </View>
          ))}
        </Card>
      )}

      {/* Timestamps */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <DetailRow label="Closed At" value={formatDate(transaction.closedAt)} />
        <DetailRow label="Created" value={formatDate(transaction.createdAt)} />
        <DetailRow label="Updated" value={formatDate(transaction.updatedAt)} />
      </Card>

      {/* SUPER_ADMIN: Update payment status */}
      {isSuperAdmin && (
        <View style={styles.actions}>
          <Button
            title={busy ? 'Updating…' : 'Update Payment Status'}
            onPress={() => setSheetVisible(true)}
            style={styles.actionButton}
          />
        </View>
      )}

      <View style={styles.spacer} />

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Set Payment Status"
        actions={buildSheetActions()}
      />
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
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 13, fontWeight: '600' },
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
  actions: { padding: 16 },
  actionButton: { width: '100%' },
  spacer: { height: 32 },
});
