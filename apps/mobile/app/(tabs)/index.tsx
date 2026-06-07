import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SaveButton } from '@/components/ui/SaveButton';
import { useAuthStore } from '@/stores/auth-store';
import { propertiesApi } from '@/lib/api/properties';
import { societiesApi } from '@/lib/api/societies';
import { leadsApi } from '@/lib/api/leads';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

function StatCard({ label, value, color = '#2563eb' }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [societies, setSocieties] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ leads: 0, properties: 0 });

  const loadData = useCallback(async () => {
    try {
      const [socRes, propRes] = await Promise.all([
        societiesApi.list({ limit: '5' }),
        propertiesApi.list({ limit: '6', sortBy: 'created_at', sortOrder: 'desc' }),
      ]);
      setSocieties(socRes.data?.data?.data || []);
      setProperties(propRes.data?.data?.data || []);

      if (isAuthenticated) {
        try {
          const leadsRes = await leadsApi.list({ limit: '1' });
          setStats({
            leads: leadsRes.data?.data?.total || 0,
            properties: propRes.data?.data?.total || 0,
          });
        } catch {
          /\* ignore \*/;
        }
      }
    } catch {
      /\* ignore \*/;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const role = user?.role;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome */}
      <View style={styles.hero}>
        <Text style={styles.welcome}>
          {isAuthenticated ? `Hello, ${user?.name || 'User'}` : 'Welcome to RDN'}
        </Text>
        <Text style={styles.tagline}>Residential Dealer Network</Text>
      </View>

      {/* Stats for authenticated users */}
      {isAuthenticated && (role === 'DEALER' || role === 'SUPER_ADMIN') && (
        <View style={styles.statsRow}>
          <StatCard label="Total Leads" value={stats.leads} />
          <StatCard label="Properties" value={stats.properties} color="#10b981" />
        </View>
      )}

      {/* Login prompt */}
      {!isAuthenticated && (
        <Card style={styles.loginPrompt}>
          <Text style={styles.loginText}>Sign in to enquire about properties</Text>
          <Button title="Login / Register" onPress={() => router.push('/(auth)/login')} />
        </Card>
      )}

      {/* Featured Societies */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Societies</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {societies.map((society: any) => (
            <TouchableOpacity
              key={society.id}
              onPress={() => router.push(`/society/${society.slug}`)}
            >
              <Card style={styles.societyCard}>
                <Text style={styles.societyName} numberOfLines={2}>
                  {society.name}
                </Text>
                <Text style={styles.societyCity} numberOfLines={1}>
                  {society.city}
                </Text>
                <Text style={styles.societyUnits}>{society.totalUnits ?? '—'} units</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Properties</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {properties.map((property: any) => (
          <TouchableOpacity
            key={property.id}
            onPress={() => router.push(`/property/${property.id}`)}
          >
            <Card style={styles.propertyCard}>
              <View style={styles.propertyRow}>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyType}>
                    {property.bhk} BHK {property.type}
                  </Text>
                  <Text style={styles.propertyLocation}>
                    {property.flatNumber}, {property.towerBlock}
                  </Text>
                  <Text style={styles.propertySociety}>
                    {property.society?.name}, {property.society?.city}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.propertyPrice}>
                    {property.transactionType === 'SALE'
                      ? `₹${(Number(property.priceSale) / 100000).toFixed(1)}L`
                      : `₹${Number(property.priceRent).toLocaleString('en-IN')}/mo`}
                  </Text>
                  <Text style={styles.txnType}>{property.transactionType}</Text>
                  <SaveButton propertyId={property.id} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  hero: { backgroundColor: '#2563eb', padding: 24, paddingTop: 8 },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  loginPrompt: { margin: 16, alignItems: 'center', gap: 12 },
  loginText: { fontSize: 15, color: '#374151' },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  viewAll: { fontSize: 14, color: '#2563eb', fontWeight: '500' },
  societyCard: { width: 180, marginRight: 12 },
  societyName: { fontSize: 15, fontWeight: '600', color: '#111827', minHeight: 40, lineHeight: 20 },
  societyCity: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  societyUnits: { fontSize: 12, color: '#2563eb', marginTop: 4 },
  propertyCard: { marginBottom: 10 },
  propertyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  propertyInfo: { flex: 1, marginRight: 12 },
  propertyType: { fontSize: 15, fontWeight: '600', color: '#111827' },
  propertyLocation: { fontSize: 13, color: '#374151', marginTop: 2 },
  propertySociety: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  propertyPrice: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  txnType: { fontSize: 11, color: '#6b7280', marginTop: 2, textTransform: 'uppercase' },
});
