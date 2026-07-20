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

const ALL_ROLES = ['SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT'];

interface ManageRow {
  label: string;
  subtitle: string;
  route: string;
  roles: string[];
}

const MANAGE_ROWS: ManageRow[] = [
  {
    label: 'My Properties',
    subtitle: 'Manage your listings',
    route: '/manage/properties',
    roles: ['OWNER', 'DEALER', 'SUPER_ADMIN', 'RWA_ADMIN'],
  },
  {
    label: 'Shortlist',
    subtitle: 'Your saved properties',
    route: '/saved',
    roles: ALL_ROLES,
  },
  {
    label: 'Verification Queue',
    subtitle: 'Review pending verifications',
    route: '/manage/verification-queue',
    roles: ['RWA_ADMIN', 'SUPER_ADMIN'],
  },
  {
    label: 'Dealers',
    subtitle: 'Manage society dealers',
    route: '/manage/dealers',
    roles: ['SUPER_ADMIN', 'RWA_ADMIN'],
  },
  {
    label: 'Societies',
    subtitle: 'Manage societies',
    route: '/manage/societies',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Users',
    subtitle: 'View users and change roles',
    route: '/manage/users',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Commissions',
    subtitle: 'View commission records',
    route: '/commissions',
    roles: ['SUPER_ADMIN', 'DEALER'],
  },
  {
    label: 'Transactions',
    subtitle: 'View transaction history',
    route: '/transactions',
    roles: ['SUPER_ADMIN', 'RWA_ADMIN'],
  },
  {
    label: 'Grievances',
    subtitle: 'View and raise grievances',
    route: '/grievances',
    roles: ALL_ROLES,
  },
  {
    label: 'Reports',
    subtitle: 'Analytics & reports',
    route: '/reports',
    roles: ['SUPER_ADMIN', 'RWA_ADMIN'],
  },
];

const SETTINGS_ROWS: ManageRow[] = [
  {
    label: 'Edit Profile',
    subtitle: 'Update name, email, avatar',
    route: '/settings/edit-profile',
    roles: ALL_ROLES,
  },
  {
    label: 'Notification Preferences',
    subtitle: 'Manage notification settings',
    route: '/settings/notification-preferences',
    roles: ALL_ROLES,
  },
  {
    label: 'Security',
    subtitle: 'Password & security options',
    route: '/settings/security',
    roles: ALL_ROLES,
  },
];

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

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
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

  const visibleManageRows = MANAGE_ROWS.filter((r) => r.roles.includes(role));
  const visibleSettingsRows = SETTINGS_ROWS.filter((r) => r.roles.includes(role));

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

      {/* Notifications */}
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
        {(role === 'OWNER' || role === 'SUPER_ADMIN' || role === 'RWA_ADMIN') && (
          <MenuItem
            title="List a new property"
            subtitle="6-step wizard"
            onPress={() => router.push('/property/new' as never)}
          />
        )}
      </Card>

      {/* Manage section */}
      {visibleManageRows.length > 0 && (
        <>
          <SectionHeader title="Manage" />
          <Card style={styles.menuCard}>
            {visibleManageRows.map((row) => (
              <MenuItem
                key={row.route}
                title={row.label}
                subtitle={row.subtitle}
                onPress={() => router.push(row.route as never)}
              />
            ))}
          </Card>
        </>
      )}

      {/* Settings section */}
      {visibleSettingsRows.length > 0 && (
        <>
          <SectionHeader title="Settings" />
          <Card style={styles.menuCard}>
            {visibleSettingsRows.map((row) => (
              <MenuItem
                key={row.route}
                title={row.label}
                subtitle={row.subtitle}
                onPress={() => router.push(row.route as never)}
              />
            ))}
          </Card>
        </>
      )}

      {/* DPDP & Account */}
      <SectionHeader title="Account & Privacy" />
      <Card style={styles.menuCard}>
        <MenuItem
          title="Become a dealer"
          subtitle="Apply to your society's RWA"
          onPress={() => router.push('/become-dealer' as never)}
        />
        <MenuItem
          title="Manage consent"
          subtitle="DPDP consent preferences"
          onPress={() => router.push('/settings/consent' as never)}
        />
        <MenuItem
          title="Export my data"
          subtitle="DPDP data portability"
          onPress={() => router.push('/settings/data-export' as never)}
        />
        <MenuItem
          title="Data grievance"
          subtitle="Contact our Grievance Officer"
          onPress={() => router.push('/settings/grievance' as never)}
        />
        <MenuItem
          title="Privacy Policy"
          subtitle="How we handle your data"
          onPress={() => router.push('/legal/privacy' as never)}
        />
        <MenuItem
          title="Terms of Service"
          subtitle="Terms & conditions"
          onPress={() => router.push('/legal/terms' as never)}
        />
        <MenuItem
          title="Delete account"
          subtitle="Permanent — DPDP-compliant erasure"
          onPress={() => router.push('/settings/delete-account' as never)}
        />
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
  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
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
