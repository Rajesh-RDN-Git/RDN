import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/stores/auth-store';
import { societiesApi } from '@/lib/api/societies';
import { verificationApi } from '@/lib/api/verification';

type SocietyVerification = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
type SocietyStatus = 'IN_PROGRESS' | 'ONBOARDED' | 'INACTIVE';
type VerifyDecision = 'VERIFIED' | 'FLAGGED' | 'REJECTED';

interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  address?: string;
  pincode?: string;
  totalUnits?: number;
  status: SocietyStatus;
  verificationStatus: SocietyVerification;
  amenities?: string[];
  rwaAdminId?: string | null;
  rwaAdmin?: { id: string; name: string } | null;
  createdAt?: string;
}

interface UserCandidate {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

const verificationColors: Record<SocietyVerification, string> = {
  PENDING: '#f59e0b',
  VERIFIED: '#10b981',
  FLAGGED: '#f97316',
  REJECTED: '#ef4444',
};

const statusColors: Record<SocietyStatus, string> = {
  ONBOARDED: '#10b981',
  IN_PROGRESS: '#f59e0b',
  INACTIVE: '#9ca3af',
};

const VERIFY_OPTIONS: VerifyDecision[] = ['VERIFIED', 'FLAGGED', 'REJECTED'];
const verifyOptionColors: Record<VerifyDecision, string> = {
  VERIFIED: '#10b981',
  FLAGGED: '#f97316',
  REJECTED: '#ef4444',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function SocietyDetailScreen() {
  const { id, slug } = useLocalSearchParams<{ id: string; slug?: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Verify sheet
  const [verifySheetOpen, setVerifySheetOpen] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState<VerifyDecision>('VERIFIED');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  // Assign RWA sheet
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [candidates, setCandidates] = useState<UserCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Fetch society: uses getBySlug if slug is available, otherwise fetches the list and finds by id.
  // This avoids needing a dedicated GET /societies/:id endpoint (not in mobile API client).
  const fetchSociety = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      if (slug) {
        const { data } = await societiesApi.getBySlug(slug);
        // getBySlug may return the object directly or wrapped in data
        const s: Society = data.data ?? data;
        setSociety(s);
      } else {
        // Fallback: fetch list and find by id
        const { data } = await societiesApi.list({ limit: '200' });
        const result = data.data || data;
        const list: Society[] = result.data || [];
        const found = list.find((s) => s.id === id) ?? null;
        setSociety(found);
        if (!found) setLoadError('Society not found.');
      }
    } catch {
      /* network error */
      setLoadError('Could not load society details.');
    }
  }, [id, slug]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchSociety();
    setLoading(false);
  }, [fetchSociety]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSociety();
    setRefreshing(false);
  }, [fetchSociety]);

  useEffect(() => {
    load();
  }, [load]);

  // ----- Verify -----
  const openVerify = () => {
    setVerifyDecision('VERIFIED');
    setVerifyNotes('');
    setVerifySheetOpen(true);
  };

  const submitVerify = async () => {
    if (!society) return;
    setVerifySubmitting(true);
    try {
      await verificationApi.verifySociety(society.id, {
        status: verifyDecision,
        ...(verifyNotes.trim() ? { notes: verifyNotes.trim() } : {}),
      });
      setVerifySheetOpen(false);
      await fetchSociety();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update verification.';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setVerifySubmitting(false);
    }
  };

  // ----- Assign RWA -----
  const openAssign = async () => {
    setSelectedUserId(society?.rwaAdminId || '');
    setAssignSheetOpen(true);
    setCandidatesLoading(true);
    try {
      const { data } = await societiesApi.getRwaCandidates({ role: 'RWA_ADMIN', limit: 50 });
      // GET /users returns {data: {data: [...], pagination}} — unwrap both layers
      const result = data.data || data;
      setCandidates(result.data || []);
    } catch {
      /* non-fatal — candidate list will be empty, fallback to manual entry */
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const submitAssign = async () => {
    if (!society) return;
    if (!selectedUserId.trim()) {
      Alert.alert('Validation', 'Please select or enter a user ID.');
      return;
    }
    setAssignSubmitting(true);
    try {
      await societiesApi.assignRwaAdmin(society.id, selectedUserId.trim());
      setAssignSheetOpen(false);
      await fetchSociety();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to assign RWA admin.';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const submitClearRwa = async () => {
    if (!society) return;
    setAssignSubmitting(true);
    try {
      await societiesApi.assignRwaAdmin(society.id, null);
      setAssignSheetOpen(false);
      await fetchSociety();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to clear RWA admin.';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setAssignSubmitting(false);
    }
  };

  // ----- Guards -----
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sign in to view society details</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login' as never)} />
      </View>
    );
  }

  if (!isSuperAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Access restricted to Super Admins</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (loadError || !society) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{loadError || 'Society not found.'}</Text>
        <Button title="Retry" onPress={load} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header card */}
        <Card style={styles.headerCard}>
          <Text style={styles.societyName}>{society.name}</Text>
          <Text style={styles.societySlug}>{society.slug}</Text>

          <View style={styles.badgeRow}>
            <Badge
              label={society.verificationStatus}
              color={verificationColors[society.verificationStatus] ?? '#6b7280'}
            />
            <Badge label={society.status} color={statusColors[society.status] ?? '#6b7280'} />
          </View>

          <View style={styles.infoBlock}>
            <InfoRow label="City" value={society.city} />
            <InfoRow label="State" value={society.state} />
            <InfoRow label="Address" value={society.address} />
            <InfoRow label="Pincode" value={society.pincode} />
            <InfoRow label="Total units" value={society.totalUnits?.toString()} />
            <InfoRow
              label="RWA Admin"
              value={society.rwaAdmin?.name ?? (society.rwaAdminId ? society.rwaAdminId : null)}
            />
          </View>

          {society.amenities && society.amenities.length > 0 && (
            <View style={styles.amenitiesBlock}>
              <Text style={styles.infoLabel}>Amenities</Text>
              <View style={styles.amenitiesRow}>
                {society.amenities.map((a) => (
                  <View key={a} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actionsBlock}>
          <Button title="Verify / Update status" onPress={openVerify} />
          <View style={styles.actionGap} />
          <Button
            title={society.rwaAdminId ? 'Reassign RWA Admin' : 'Assign RWA Admin'}
            onPress={openAssign}
          />
        </View>
      </ScrollView>

      {/* ----- Verify BottomSheet ----- */}
      <BottomSheet
        visible={verifySheetOpen}
        onClose={() => setVerifySheetOpen(false)}
        title="Update verification status"
      >
        <Text style={styles.sheetLabel}>Current status</Text>
        <Badge
          label={society.verificationStatus}
          color={verificationColors[society.verificationStatus] ?? '#6b7280'}
        />

        <Text style={[styles.sheetLabel, { marginTop: 16 }]}>Decision</Text>
        <View style={styles.optionRow}>
          {VERIFY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionChip,
                verifyDecision === opt && {
                  backgroundColor: verifyOptionColors[opt] + '20',
                  borderColor: verifyOptionColors[opt],
                },
              ]}
              onPress={() => setVerifyDecision(opt)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  verifyDecision === opt && { color: verifyOptionColors[opt], fontWeight: '700' },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sheetLabel, { marginTop: 16 }]}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={verifyNotes}
          onChangeText={setVerifyNotes}
          placeholder="Reason or context…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
        />

        <View style={styles.sheetActions}>
          <Button
            title={verifySubmitting ? 'Saving…' : 'Submit'}
            onPress={submitVerify}
            disabled={verifySubmitting}
          />
        </View>
      </BottomSheet>

      {/* ----- Assign RWA BottomSheet ----- */}
      <BottomSheet
        visible={assignSheetOpen}
        onClose={() => setAssignSheetOpen(false)}
        title={society.rwaAdminId ? 'Reassign RWA Admin' : 'Assign RWA Admin'}
      >
        {society.rwaAdmin?.name && (
          <Text style={styles.currentRwa}>Currently: {society.rwaAdmin.name}</Text>
        )}

        {candidatesLoading ? (
          <ActivityIndicator color="#2563eb" style={{ marginVertical: 12 }} />
        ) : candidates.length > 0 ? (
          <>
            <Text style={styles.sheetLabel}>Select user</Text>
            <ScrollView style={styles.candidateList} nestedScrollEnabled>
              {candidates.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.candidateRow,
                    selectedUserId === c.id && styles.candidateRowActive,
                  ]}
                  onPress={() => setSelectedUserId(c.id)}
                >
                  <Text style={styles.candidateName}>{c.name || '(unnamed)'}</Text>
                  {c.email ? <Text style={styles.candidateEmail}>{c.email}</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            <Text style={styles.sheetLabel}>No RWA_ADMIN users found — enter user ID manually</Text>
            <TextInput
              style={styles.input}
              value={selectedUserId}
              onChangeText={setSelectedUserId}
              placeholder="User UUID"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
          </>
        )}

        <View style={styles.sheetActions}>
          {society.rwaAdminId && (
            <TouchableOpacity
              onPress={submitClearRwa}
              disabled={assignSubmitting}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Clear assignment</Text>
            </TouchableOpacity>
          )}
          <Button
            title={assignSubmitting ? 'Saving…' : 'Assign'}
            onPress={submitAssign}
            disabled={assignSubmitting}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  headerCard: { padding: 16, marginBottom: 16 },
  societyName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  societySlug: { fontSize: 12, color: '#9ca3af', marginTop: 2, marginBottom: 10 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  infoBlock: { gap: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  infoLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1, textAlign: 'right' },

  amenitiesBlock: { marginTop: 12 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  amenityText: { fontSize: 11, color: '#374151' },

  actionsBlock: { gap: 0 },
  actionGap: { height: 10 },

  // Sheet
  sheetLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  currentRwa: { fontSize: 13, color: '#374151', marginBottom: 12 },

  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  optionChipText: { fontSize: 13, color: '#374151' },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },

  candidateList: { maxHeight: 200, marginBottom: 8 },
  candidateRow: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  candidateRowActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  candidateName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  candidateEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  sheetActions: { marginTop: 16, gap: 8 },
  clearBtn: { alignItems: 'center', paddingVertical: 8 },
  clearBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },

  emptyText: { fontSize: 16, color: '#9ca3af', marginBottom: 16 },
});
