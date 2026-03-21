import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  RWA_ADMIN: 'RWA Admin',
  DEALER: 'Dealer',
  OWNER: 'Property Owner',
  BUYER_TENANT: 'Buyer / Tenant',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#7c3aed',
  RWA_ADMIN: '#2563eb',
  DEALER: '#059669',
  OWNER: '#d97706',
  BUYER_TENANT: '#6b7280',
};

interface MenuItemProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

function MenuItem({ title, subtitle, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.guestTitle}>Welcome to RDN</Text>
        <Text style={styles.guestSubtitle}>Sign in to access your profile</Text>
        <Button title="Login / Register" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const role = user.role || 'BUYER_TENANT';

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: (ROLE_COLORS[role] || '#6b7280') + '15' },
              ]}
            >
              <Text style={[styles.roleText, { color: ROLE_COLORS[role] || '#6b7280' }]}>
                {ROLE_LABELS[role] || role}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <MenuItem
          title="Notifications"
          subtitle="View your notifications"
          onPress={() => router.push('/notifications')}
        />
        {(role === 'DEALER' || role === 'SUPER_ADMIN') && (
          <MenuItem
            title="My Leads"
            subtitle="View assigned leads"
            onPress={() => router.push('/(tabs)/leads')}
          />
        )}
        {role === 'OWNER' && (
          <MenuItem
            title="My Properties"
            subtitle="Manage your listings"
            onPress={() => router.push('/(tabs)/search')}
          />
        )}
      </Card>

      <Card style={styles.menuCard}>
        <MenuItem title="About RDN" subtitle="Version 1.0.0" onPress={() => {}} />
      </Card>

      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  guestSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  profileCard: { margin: 16, marginBottom: 8 },
  avatarContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: '600' },
  menuCard: { marginHorizontal: 16, marginBottom: 8 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  menuTitle: { fontSize: 15, fontWeight: '500', color: '#111827' },
  menuSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  logoutContainer: { padding: 16 },
  logoutButton: { borderColor: '#ef4444' },
});
