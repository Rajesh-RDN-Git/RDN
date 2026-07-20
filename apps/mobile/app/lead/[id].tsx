import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionSheet, SheetAction } from '@/components/ui/ActionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useAuthStore } from '@/stores/auth-store';
import { leadsApi } from '@/lib/api/leads';
import { communicationApi } from '@/lib/api/communication';

const statusColors: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  NOT_PICKED: '#9ca3af',
  INTERESTED: '#06b6d4',
  QUALIFIED: '#7c3aed',
  VISIT_SCHEDULED: '#f59e0b',
  VISITED: '#fb923c',
  NEGOTIATING: '#f97316',
  MEETING_ARRANGED: '#ea580c',
  DEAL_OPEN: '#dc2626',
  CLOSING: '#ef4444',
  CLOSED: '#10b981',
  LOST: '#6b7280',
};

// Full status list — the detail screen lets a dealer/admin pick any status directly
// (parity with the web lead-status dropdown).
const ALL_STATUSES = [
  'NEW',
  'CONTACTED',
  'NOT_PICKED',
  'INTERESTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'VISITED',
  'NEGOTIATING',
  'MEETING_ARRANGED',
  'DEAL_OPEN',
  'CLOSING',
  'CLOSED',
  'LOST',
];
const statusLabel = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

// Statuses from which a deal can be closed.
const CLOSEABLE = new Set(['NEGOTIATING', 'MEETING_ARRANGED', 'DEAL_OPEN', 'CLOSING']);

// Statuses displayed in the timeline strip.
const TIMELINE_FLOW = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'VISITED',
  'NEGOTIATING',
  'DEAL_OPEN',
  'CLOSED',
];

const DEAL_TYPES = ['RENT', 'SALE', 'RENEWAL'];

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Sheet / modal state
  const [sheet, setSheet] = useState<null | 'status' | 'visit' | 'deal'>(null);
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [dealType, setDealType] = useState('RENT');
  const [dealValue, setDealValue] = useState('');

  const fetchLead = () => {
    if (!id) return;
    setLoading(true);
    leadsApi
      .getById(id)
      .then(({ data }) => setLead(data.data || data))
      .catch(() => Alert.alert('Error', 'Failed to load lead'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  // ─── helpers ──────────────────────────────────────────────────────────────

  const handleStatusAction = async (status: string) => {
    if (status === 'VISIT_SCHEDULED') {
      // Route through the Plan Visit sheet so a date can be attached.
      setVisitDate(null);
      setSheet('visit');
      return;
    }
    if (status === 'CLOSED') {
      // Route through the close-deal sheet so a transaction + commission are created.
      setSheet('deal');
      return;
    }
    setUpdating(true);
    try {
      await leadsApi.update(id!, { status });
      fetchLead();
    } catch (err: any) {
      /* show error to user */
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status');
    }
    setUpdating(false);
  };

  const handleScheduleVisit = async () => {
    if (!visitDate) {
      Alert.alert('Select a date', 'Please choose a visit date first.');
      return;
    }
    setUpdating(true);
    try {
      await leadsApi.update(id!, {
        status: 'VISIT_SCHEDULED',
        visitDate: visitDate.toISOString(),
      });
      setSheet(null);
      fetchLead();
    } catch (err: any) {
      /* show error to user */
      Alert.alert('Error', err?.response?.data?.message || 'Failed to schedule visit');
    }
    setUpdating(false);
  };

  const handleCloseDeal = async () => {
    if (!dealValue) {
      Alert.alert('Enter deal value', 'Please enter the deal value before closing.');
      return;
    }
    setUpdating(true);
    try {
      await leadsApi.closeDeal(id!, { type: dealType, dealValue: Number(dealValue) });
      setSheet(null);
      setDealValue('');
      fetchLead();
    } catch (err: any) {
      /* show error to user */
      Alert.alert('Error', err?.response?.data?.message || 'Failed to close deal');
    }
    setUpdating(false);
  };

  const handleApproveVisit = async () => {
    setUpdating(true);
    try {
      await leadsApi.approveVisit(id!);
      fetchLead();
    } catch (err: any) {
      /* show error to user */
      Alert.alert('Error', err?.response?.data?.message || 'Failed to approve visit');
    }
    setUpdating(false);
  };

  const handleMaskedCall = async () => {
    // toUserId is the buyer's user id — lead.buyer.id as returned by the API.
    const buyerUserId = lead?.buyer?.id;
    if (!buyerUserId) {
      Alert.alert('Unavailable', 'Buyer information is not available for this lead.');
      return;
    }
    setUpdating(true);
    try {
      await communicationApi.call({ leadId: id!, toUserId: buyerUserId });
      Alert.alert('Call connecting', 'Connecting your call…');
    } catch (err: any) {
      /* show error to user */
      Alert.alert('Error', err?.response?.data?.message || 'Could not place call right now');
    }
    setUpdating(false);
  };

  // ─── derived state ─────────────────────────────────────────────────────────

  const role = user?.role;
  const isTerminal = lead?.status === 'CLOSED' || lead?.status === 'LOST';
  const canAdvance =
    (role === 'DEALER' || role === 'SUPER_ADMIN' || role === 'RWA_ADMIN') && !isTerminal;
  const canCloseDeal = (role === 'DEALER' || role === 'SUPER_ADMIN') && CLOSEABLE.has(lead?.status);
  const canCall = role === 'DEALER' && !isTerminal && !!lead?.buyer?.id;
  const isOwner = role === 'OWNER';
  const needsOwnerApproval =
    isOwner && lead?.status === 'VISIT_SCHEDULED' && !lead?.visitApprovedByOwner;

  // Full status list — pick any status directly (parity with the web dropdown). CLOSED and
  // VISIT_SCHEDULED are routed to their sheets inside handleStatusAction.
  const statusSheetActions: SheetAction[] = ALL_STATUSES.filter((s) => s !== lead?.status).map(
    (s) => ({
      label: statusLabel(s),
      onPress: () => handleStatusAction(s),
      destructive: s === 'LOST',
    }),
  );

  // ─── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.center}>
        <Text>Lead not found</Text>
      </View>
    );
  }

  const currentIndex = TIMELINE_FLOW.indexOf(lead.status);

  return (
    <ScrollView style={styles.container}>
      {/* Status header */}
      <View style={styles.statusHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (statusColors[lead.status] || '#6b7280') + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColors[lead.status] || '#6b7280' }]}>
            {lead.status?.replace(/_/g, ' ')}
          </Text>
        </View>
        <Text style={styles.date}>
          Created: {new Date(lead.createdAt).toLocaleDateString('en-IN')}
        </Text>
      </View>

      {/* Status Timeline */}
      <Card style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        <View style={styles.timeline}>
          {TIMELINE_FLOW.map((status, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <View key={status} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                />
                <Text style={[styles.timelineLabel, isCompleted && styles.timelineLabelCompleted]}>
                  {status.replace(/_/g, ' ')}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Property Info */}
      {lead.property && (
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Property</Text>
          <Text style={styles.propertyName}>
            {lead.property.flatNumber}, {lead.property.towerBlock}
          </Text>
          {lead.property.society && (
            <Text style={styles.society}>{lead.property.society.name}</Text>
          )}
        </Card>
      )}

      {/* People */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>People</Text>
        {lead.buyer && (
          <View style={styles.personRow}>
            <Text style={styles.personLabel}>Buyer:</Text>
            <Text style={styles.personName}>{lead.buyer.name}</Text>
          </View>
        )}
        {lead.dealer?.user && (
          <View style={styles.personRow}>
            <Text style={styles.personLabel}>Dealer:</Text>
            <Text style={styles.personName}>{lead.dealer.user.name}</Text>
          </View>
        )}
      </Card>

      {/* Notes */}
      {lead.notes && Array.isArray(lead.notes) && lead.notes.length > 0 && (
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {lead.notes.map((note: string, i: number) => (
            <Text key={i} style={styles.noteText}>
              • {note}
            </Text>
          ))}
        </Card>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        {/* Change status (DEALER / SUPER_ADMIN / RWA_ADMIN) */}
        {canAdvance && statusSheetActions.length > 0 && (
          <Button
            title={updating ? 'Updating…' : 'Change status'}
            onPress={() => setSheet('status')}
            style={styles.actionButton}
          />
        )}

        {/* Close deal */}
        {canCloseDeal && (
          <Button
            title="Close Deal"
            onPress={() => {
              setDealType('RENT');
              setDealValue('');
              setSheet('deal');
            }}
            style={styles.actionButton}
          />
        )}

        {/* Approve visit (OWNER) */}
        {needsOwnerApproval && (
          <Button
            title={updating ? 'Approving…' : 'Approve visit'}
            onPress={handleApproveVisit}
            style={styles.actionButton}
          />
        )}

        {/* Masked call (DEALER only — never shows phone number) */}
        {canCall && (
          <Button
            title={updating ? 'Calling…' : 'Call (masked)'}
            onPress={handleMaskedCall}
            variant="outline"
            style={styles.actionButton}
          />
        )}

        {/* Chat */}
        <Button
          title="Chat"
          onPress={() => router.push(`/conversation/${lead.id}`)}
          variant="outline"
          style={styles.actionButton}
        />

        {/* Raise grievance — route may not yet resolve; that's fine */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/grievances/new',
              params: { societyId: lead.property?.societyId ?? lead.societyId ?? '' },
            } as any)
          }
          style={styles.grievanceLink}
        >
          <Text style={styles.grievanceLinkText}>Raise grievance</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />

      {/* ── ActionSheet: status transitions ─────────────────────────── */}
      <ActionSheet
        visible={sheet === 'status'}
        onClose={() => setSheet(null)}
        title="Change status"
        actions={statusSheetActions}
      />

      {/* ── BottomSheet: plan visit ──────────────────────────────────── */}
      <BottomSheet visible={sheet === 'visit'} onClose={() => setSheet(null)} title="Plan Visit">
        <DatePickerField
          label="Visit date"
          value={visitDate}
          onChange={(d) => setVisitDate(d)}
          minimumDate={new Date()}
        />
        <Button
          title={updating ? 'Scheduling…' : 'Schedule visit'}
          onPress={handleScheduleVisit}
          style={styles.sheetButton}
        />
      </BottomSheet>

      {/* ── BottomSheet: close deal ──────────────────────────────────── */}
      <BottomSheet visible={sheet === 'deal'} onClose={() => setSheet(null)} title="Close Deal">
        {/* Deal type chips */}
        <Text style={styles.fieldLabel}>Transaction type</Text>
        <View style={styles.chipRow}>
          {DEAL_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, dealType === t && styles.chipActive]}
              onPress={() => setDealType(t)}
            >
              <Text style={[styles.chipLabel, dealType === t && styles.chipLabelActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Deal value */}
        <Text style={styles.fieldLabel}>Deal value (INR)</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor="#9ca3af"
          value={dealValue}
          onChangeText={setDealValue}
        />

        <Button
          title={updating ? 'Closing…' : 'Close Deal'}
          onPress={handleCloseDeal}
          style={styles.sheetButton}
        />
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 13, color: '#6b7280' },
  timelineCard: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    marginBottom: 4,
  },
  timelineDotCompleted: { backgroundColor: '#10b981' },
  timelineDotCurrent: { backgroundColor: '#2563eb', width: 16, height: 16, borderRadius: 8 },
  timelineLabel: { fontSize: 8, color: '#9ca3af', textAlign: 'center' },
  timelineLabelCompleted: { color: '#374151', fontWeight: '500' },
  infoCard: { marginHorizontal: 16, marginBottom: 12 },
  propertyName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  society: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  personRow: { flexDirection: 'row', marginBottom: 6 },
  personLabel: { fontSize: 14, color: '#6b7280', width: 60 },
  personName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  noteText: { fontSize: 13, color: '#374151', marginBottom: 4 },
  actions: { padding: 16, gap: 8 },
  actionButton: { width: '100%' },
  grievanceLink: { alignItems: 'center', paddingVertical: 10 },
  grievanceLinkText: { fontSize: 14, color: '#6b7280', textDecorationLine: 'underline' },
  // Sheet internals
  sheetButton: { marginTop: 8 },
  fieldLabel: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  chipActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chipLabel: { fontSize: 14, color: '#374151' },
  chipLabelActive: { color: '#2563eb', fontWeight: '600' },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
});
