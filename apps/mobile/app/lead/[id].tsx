import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { leadsApi } from '@/lib/api/leads';

const statusColors: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  VISIT_SCHEDULED: '#f59e0b',
  NEGOTIATING: '#f97316',
  CLOSING: '#ef4444',
  CLOSED: '#10b981',
};

const STATUS_FLOW = ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'NEGOTIATING', 'CLOSING', 'CLOSED'];

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    leadsApi
      .getById(id)
      .then(({ data }) => setLead(data.data || data))
      .catch(() => Alert.alert('Error', 'Failed to load lead'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await leadsApi.update(id!, { status });
      setLead((prev: any) => ({ ...prev, status }));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    }
    setUpdating(false);
  };

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

  const currentIndex = STATUS_FLOW.indexOf(lead.status);
  const nextStatus = currentIndex < STATUS_FLOW.length - 2 ? STATUS_FLOW[currentIndex + 1] : null;
  const isDealerOrAdmin = user?.role === 'DEALER' || user?.role === 'SUPER_ADMIN';

  return (
    <ScrollView style={styles.container}>
      {/* Status */}
      <View style={styles.statusHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (statusColors[lead.status] || '#6b7280') + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColors[lead.status] || '#6b7280' }]}>
            {lead.status?.replace('_', ' ')}
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
          {STATUS_FLOW.map((status, index) => {
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
                  {status.replace('_', ' ')}
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

      {/* Actions */}
      {isDealerOrAdmin && lead.status !== 'CLOSED' && (
        <View style={styles.actions}>
          {nextStatus && (
            <Button
              title={updating ? 'Updating...' : `Move to ${nextStatus.replace('_', ' ')}`}
              onPress={() => updateStatus(nextStatus)}
              style={styles.actionButton}
            />
          )}
          <Button
            title="Chat"
            onPress={() => router.push(`/conversation/${lead.id}`)}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      )}

      <View style={{ height: 24 }} />
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
});
