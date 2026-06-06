/**
 * Security settings screen — read-only informational view.
 *
 * Active sessions: no API endpoint exists for session listing as of 2026-06-07.
 * The auth module only stores a hashed refreshToken on the User row (not a
 * separate sessions table), so we display a "Current session only" note.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/Card';

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
}

export default function SecurityScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Security</Text>
      <Text style={styles.intro}>Manage your account security settings.</Text>

      {/* Phone OTP Authentication */}
      <Card style={styles.card}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconBg}>
            {/* Shield icon */}
            <Text style={styles.iconText}>🔒</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Phone OTP Authentication</Text>
            <Text style={styles.cardDesc}>
              Your account is secured with phone OTP. No password is required — each login sends a
              one-time code to your registered phone number.
            </Text>
            {user?.phone ? <Text style={styles.phoneDisplay}>{maskPhone(user.phone)}</Text> : null}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Active Sessions */}
      <Card style={styles.card}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconBg, styles.iconBgInfo]}>
            {/* Device icon */}
            <Text style={styles.iconText}>📱</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Active Sessions</Text>
            <Text style={styles.cardDesc}>
              Session management is not yet available in the app. You are currently logged in on
              this device only.
            </Text>
            <View style={[styles.badge, styles.badgeInfo]}>
              <Text style={[styles.badgeText, styles.badgeTextInfo]}>Current session only</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* OTP info note */}
      <Card style={[styles.card, styles.noteCard]}>
        <Text style={styles.noteTitle}>How OTP authentication works</Text>
        <Text style={styles.noteText}>
          When you log in, RDN sends a 6-digit OTP via SMS to your registered phone number. The code
          expires in 10 minutes. Your phone number can only be changed by contacting support.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  intro: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  card: { padding: 16, marginBottom: 12 },
  iconWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBgInfo: { backgroundColor: '#dbeafe' },
  iconText: { fontSize: 18 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardDesc: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 18 },
  phoneDisplay: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#111827',
    marginTop: 8,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#15803d' },
  badgeInfo: { backgroundColor: '#dbeafe' },
  badgeTextInfo: { color: '#1d4ed8' },
  noteCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  noteTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 6 },
  noteText: { fontSize: 13, color: '#78350f', lineHeight: 18 },
});
