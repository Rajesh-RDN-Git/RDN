import { useState, useEffect, useCallback } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionSheet, SheetAction } from '@/components/ui/ActionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/stores/auth-store';
import { grievanceApi } from '@/lib/api/grievance';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  ESCALATED: '#ef4444',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const CATEGORY_LABEL: Record<string, string> = {
  DEALER_CONDUCT: 'Dealer Conduct',
  PROPERTY_MISMATCH: 'Property Mismatch',
  COMMISSION: 'Commission',
  SERVICE: 'Service',
  SAFETY: 'Safety',
  KEY_ARRANGEMENT: 'Key Arrangement',
  VISIT_TIME: 'Visit Time',
  MEETING_AVAILABILITY: 'Meeting Availability',
  OTHER: 'Other',
};

const TERMINAL_STATUSES = new Set(['RESOLVED', 'CLOSED']);

export default function GrievanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [grievance, setGrievance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Admin action state
  const [sheet, setSheet] = useState<null | 'manage' | 'resolve' | 'close'>(null);
  const [notesInput, setNotesInput] = useState('');

  const fetchGrievance = useCallback(() => {
    if (!id) return;
    setLoading(true);
    grievanceApi
      .getById(id)
      .then(({ data }) => setGrievance(data.data || data))
      .catch(() => Alert.alert('Error', 'Failed to load grievance'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchGrievance();
  }, [fetchGrievance]);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'RWA_ADMIN';
  const isTerminal = grievance ? TERMINAL_STATUSES.has(grievance.status) : false;
  const canEscalate = !!grievance && !isTerminal;

  // ─── Escalate ────────────────────────────────────────────────────────────────

  const handleEscalate = async () => {
    if (!id) return;
    Alert.alert('Escalate grievance', 'This will escalate the grievance to a higher level.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Escalate',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await grievanceApi.escalate(id);
            fetchGrievance();
          } catch (err: unknown) {
            /* show error to user */
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to escalate');
          }
          setActionLoading(false);
        },
      },
    ]);
  };

  // ─── Admin: Mark In Progress ─────────────────────────────────────────────────

  const handleMarkInProgress = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await grievanceApi.update(id, { status: 'IN_PROGRESS' });
      fetchGrievance();
    } catch (err: unknown) {
      /* show error to user */
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to update');
    }
    setActionLoading(false);
  };

  // ─── Admin: Resolve ──────────────────────────────────────────────────────────

  const handleResolve = async () => {
    if (!id) return;
    if (notesInput.trim().length < 5) {
      Alert.alert('Required', 'Please add a resolution note (at least 5 characters).');
      return;
    }
    setActionLoading(true);
    try {
      await grievanceApi.update(id, { status: 'RESOLVED', resolutionNotes: notesInput.trim() });
      setSheet(null);
      setNotesInput('');
      fetchGrievance();
    } catch (err: unknown) {
      /* show error to user */
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to resolve');
    }
    setActionLoading(false);
  };

  // ─── Admin: Close ────────────────────────────────────────────────────────────

  const handleClose = async () => {
    if (!id) return;
    if (notesInput.trim().length < 5) {
      Alert.alert('Required', 'Please provide a reason (at least 5 characters).');
      return;
    }
    setActionLoading(true);
    try {
      await grievanceApi.update(id, { status: 'CLOSED', resolutionNotes: notesInput.trim() });
      setSheet(null);
      setNotesInput('');
      fetchGrievance();
    } catch (err: unknown) {
      /* show error to user */
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to close');
    }
    setActionLoading(false);
  };

  // ─── Admin ActionSheet actions ───────────────────────────────────────────────

  const adminSheetActions: SheetAction[] = [];
  if (grievance?.status === 'OPEN') {
    adminSheetActions.push({ label: 'Mark In Progress', onPress: handleMarkInProgress });
  }
  if (!isTerminal) {
    adminSheetActions.push({
      label: 'Resolve',
      onPress: () => {
        setNotesInput('');
        setSheet('resolve');
      },
    });
    adminSheetActions.push({
      label: 'Close',
      onPress: () => {
        setNotesInput('');
        setSheet('close');
      },
      destructive: true,
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!grievance) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Grievance not found.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[grievance.status] || '#6b7280';
  const severityColor = SEVERITY_COLORS[grievance.severity] || '#6b7280';
  const category = CATEGORY_LABEL[grievance.category] || grievance.category || '';

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      /* invalid date string — fall back to raw value */
      return iso;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Status / severity header */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {(grievance.status || '').replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: severityColor + '20', marginLeft: 8 }]}>
          <Text style={[styles.badgeText, { color: severityColor }]}>
            {grievance.severity || ''}
          </Text>
        </View>
      </View>

      {/* Main details card */}
      <Card style={styles.card}>
        <Text style={styles.fieldLabel}>Category</Text>
        <Text style={styles.fieldValue}>{category}</Text>

        <Text style={styles.fieldLabel}>Description</Text>
        <Text style={styles.descriptionText}>{grievance.description || '—'}</Text>

        {grievance.filer?.name ? (
          <>
            <Text style={styles.fieldLabel}>Filed by</Text>
            <Text style={styles.fieldValue}>{grievance.filer.name}</Text>
          </>
        ) : null}

        {grievance.society?.name ? (
          <>
            <Text style={styles.fieldLabel}>Society</Text>
            <Text style={styles.fieldValue}>{grievance.society.name}</Text>
          </>
        ) : null}

        <Text style={styles.fieldLabel}>Filed on</Text>
        <Text style={styles.fieldValue}>
          {grievance.createdAt ? formatDate(grievance.createdAt) : '—'}
        </Text>

        {grievance.updatedAt && grievance.updatedAt !== grievance.createdAt ? (
          <>
            <Text style={styles.fieldLabel}>Last updated</Text>
            <Text style={styles.fieldValue}>{formatDate(grievance.updatedAt)}</Text>
          </>
        ) : null}
      </Card>

      {/* Resolution notes */}
      {grievance.resolutionNotes ? (
        <Card style={styles.card}>
          <Text style={styles.resolutionTitle}>Resolution note</Text>
          <Text style={styles.resolutionText}>{grievance.resolutionNotes}</Text>
        </Card>
      ) : null}

      {/* Evidence */}
      {Array.isArray(grievance.evidenceUrls) && grievance.evidenceUrls.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Evidence ({grievance.evidenceUrls.length})</Text>
          {(grievance.evidenceUrls as string[]).map((url: string, i: number) => (
            <TouchableOpacity key={i} style={styles.evidenceRow}>
              <Text style={styles.evidenceLink} numberOfLines={1}>
                {url}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Escalate — any authenticated user, non-terminal */}
        {canEscalate ? (
          <Button
            title={actionLoading ? 'Please wait…' : 'Escalate'}
            onPress={handleEscalate}
            variant="outline"
            disabled={actionLoading}
            style={styles.actionButton}
          />
        ) : null}

        {/* Admin triage */}
        {isAdmin && adminSheetActions.length > 0 ? (
          <Button
            title="Manage"
            onPress={() => setSheet('manage')}
            disabled={actionLoading}
            style={styles.actionButton}
          />
        ) : null}
      </View>

      <View style={styles.bottomSpacer} />

      {/* Admin ActionSheet */}
      <ActionSheet
        visible={sheet === 'manage'}
        onClose={() => setSheet(null)}
        title="Manage grievance"
        actions={adminSheetActions}
      />

      {/* Resolve BottomSheet */}
      <BottomSheet
        visible={sheet === 'resolve'}
        onClose={() => {
          if (!actionLoading) {
            setSheet(null);
            setNotesInput('');
          }
        }}
        title="Resolve grievance"
      >
        <Text style={styles.sheetHint}>Add a resolution note to inform the filer.</Text>
        <TextInput
          style={styles.notesInput}
          value={notesInput}
          onChangeText={setNotesInput}
          placeholder="Describe how the issue was resolved…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
        />
        <Button
          title={actionLoading ? 'Resolving…' : 'Resolve'}
          onPress={handleResolve}
          disabled={actionLoading}
          style={styles.sheetButton}
        />
      </BottomSheet>

      {/* Close BottomSheet */}
      <BottomSheet
        visible={sheet === 'close'}
        onClose={() => {
          if (!actionLoading) {
            setSheet(null);
            setNotesInput('');
          }
        }}
        title="Close grievance"
      >
        <Text style={styles.sheetHint}>Provide a reason for closing this grievance.</Text>
        <TextInput
          style={styles.notesInput}
          value={notesInput}
          onChangeText={setNotesInput}
          placeholder="Reason for closure…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
        />
        <Button
          title={actionLoading ? 'Closing…' : 'Close grievance'}
          onPress={handleClose}
          disabled={actionLoading}
          style={styles.sheetButton}
        />
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 16, color: '#6b7280' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  card: { marginHorizontal: 16, marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 2,
  },
  fieldValue: { fontSize: 15, color: '#111827' },
  descriptionText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 8 },
  resolutionTitle: { fontSize: 15, fontWeight: '600', color: '#059669', marginBottom: 6 },
  resolutionText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  evidenceRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  evidenceLink: { fontSize: 13, color: '#2563eb', textDecorationLine: 'underline' },
  actions: { padding: 16, gap: 8 },
  actionButton: { width: '100%' },
  bottomSpacer: { height: 24 },
  // Sheet internals
  sheetHint: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  notesInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  sheetButton: { marginTop: 4 },
});
