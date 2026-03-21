import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { societiesApi } from '@/lib/api/societies';
import { propertiesApi } from '@/lib/api/properties';

export default function SocietyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [society, setSociety] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      societiesApi.getBySlug(slug).then(({ data }) => data.data || data),
      propertiesApi.list({ societyId: slug }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([soc, propRes]) => {
        setSociety(soc);
        const propData = propRes.data?.data || propRes;
        setProperties(propData.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!society) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Society not found</Text>
      </View>
    );
  }

  const amenities = Array.isArray(society.amenities) ? society.amenities : [];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{society.name}</Text>
        <Text style={styles.location}>
          {society.address}, {society.city}, {society.state} - {society.pincode}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{society.totalUnits || 0}</Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{society._count?.properties || 0}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{society._count?.dealers || 0}</Text>
          <Text style={styles.statLabel}>Dealers</Text>
        </Card>
      </View>

      {/* Amenities */}
      {amenities.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((amenity: string, i: number) => (
              <View key={i} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Properties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Properties</Text>
        {properties.length === 0 ? (
          <Text style={styles.emptyText}>No properties listed yet</Text>
        ) : (
          properties.map((property: any) => (
            <TouchableOpacity
              key={property.id}
              onPress={() => router.push(`/property/${property.id}`)}
            >
              <Card style={styles.propertyCard}>
                <View style={styles.propRow}>
                  <View style={styles.propInfo}>
                    <Text style={styles.propType}>
                      {property.bhk} BHK {property.type}
                    </Text>
                    <Text style={styles.propLocation}>
                      {property.flatNumber}, {property.towerBlock}
                    </Text>
                  </View>
                  <Text style={styles.propPrice}>
                    {property.transactionType === 'SALE'
                      ? `₹${(Number(property.priceSale) / 100000).toFixed(1)}L`
                      : `₹${Number(property.priceRent).toLocaleString('en-IN')}/mo`}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#ef4444' },
  header: { backgroundColor: '#2563eb', padding: 20 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  location: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#2563eb' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 12 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: { fontSize: 12, color: '#1e40af' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
  propertyCard: { marginBottom: 8 },
  propRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propInfo: { flex: 1 },
  propType: { fontSize: 15, fontWeight: '600', color: '#111827' },
  propLocation: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  propPrice: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
});
