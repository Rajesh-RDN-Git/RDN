import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SaveButton } from '@/components/ui/SaveButton';
import { useAuthStore } from '@/stores/auth-store';
import { propertiesApi } from '@/lib/api/properties';
import { leadsApi } from '@/lib/api/leads';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enquiring, setEnquiring] = useState(false);

  useEffect(() => {
    if (!id) return;
    propertiesApi
      .getById(id)
      .then(({ data }) => setProperty(data.data || data))
      .catch(() => Alert.alert('Error', 'Failed to load property'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnquire = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setEnquiring(true);
    try {
      await leadsApi.create({ propertyId: id!, source: 'MOBILE_APP' });
      Alert.alert('Success', 'Your enquiry has been submitted. A dealer will contact you soon.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit enquiry');
    }
    setEnquiring(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const price =
    property.transactionType === 'SALE'
      ? `₹${(Number(property.priceSale) / 100000).toFixed(1)} Lakhs`
      : `₹${Number(property.priceRent).toLocaleString('en-IN')}/month`;

  const amenities = property.amenities
    ? typeof property.amenities === 'object'
      ? Object.keys(property.amenities).filter((k) => property.amenities[k])
      : []
    : [];

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image Placeholder */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>
            {property.media?.length ? `${property.media.length} Photos` : 'No Photos'}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.badges}>
              <View style={[styles.badge, styles.typeBadge]}>
                <Text style={styles.badgeText}>{property.transactionType}</Text>
              </View>
              <View style={[styles.badge, styles.statusBadge]}>
                <Text style={styles.badgeText}>{property.availabilityStatus || 'AVAILABLE'}</Text>
              </View>
            </View>
            <SaveButton propertyId={id!} />
          </View>
          <Text style={styles.price}>{price}</Text>
          {property.securityDeposit && property.transactionType === 'RENT' && (
            <Text style={styles.deposit}>
              Security Deposit: ₹{Number(property.securityDeposit).toLocaleString('en-IN')}
            </Text>
          )}
          <TouchableOpacity
            style={styles.grievanceLink}
            onPress={() =>
              router.push({
                pathname: '/grievances/new',
                params: property.society?.id ? { societyId: property.society.id } : {},
              } as never)
            }
          >
            <Text style={styles.grievanceLinkText}>Raise a grievance</Text>
          </TouchableOpacity>
        </View>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.detailGrid}>
            <DetailItem label="Type" value={property.type} />
            <DetailItem label="BHK" value={`${property.bhk} BHK`} />
            <DetailItem
              label="Floor"
              value={`${property.floor || '-'} / ${property.totalFloors || '-'}`}
            />
            <DetailItem label="Carpet Area" value={`${property.carpetArea || '-'} sq ft`} />
            <DetailItem label="Super Area" value={`${property.superArea || '-'} sq ft`} />
            <DetailItem label="Furnishing" value={property.furnishing || '-'} />
            <DetailItem label="Facing" value={property.facing || '-'} />
            <DetailItem label="Location" value={`${property.flatNumber}, ${property.towerBlock}`} />
          </View>
        </Card>

        {/* Society */}
        {property.society && (
          <TouchableOpacity onPress={() => router.push(`/society/${property.society.slug}`)}>
            <Card style={styles.societyCard}>
              <Text style={styles.sectionTitle}>Society</Text>
              <Text style={styles.societyName}>{property.society.name}</Text>
              <Text style={styles.societyLocation}>
                {property.society.city}, {property.society.state}
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <Card style={styles.amenitiesCard}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity: string) => (
                <View key={amenity} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed CTA */}
      <View style={styles.ctaBar}>
        <Button
          title={enquiring ? 'Submitting...' : 'Enquire Now'}
          onPress={handleEnquire}
          style={styles.ctaButton}
        />
      </View>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#ef4444' },
  imagePlaceholder: {
    height: 240,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 16, color: '#6b7280' },
  header: { padding: 16 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badges: { flexDirection: 'row', gap: 8 },
  grievanceLink: { marginTop: 10 },
  grievanceLinkText: { fontSize: 13, color: '#2563eb', textDecorationLine: 'underline' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  typeBadge: { backgroundColor: '#dbeafe' },
  statusBadge: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#059669' },
  deposit: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  detailsCard: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: 12 },
  detailLabel: { fontSize: 12, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827', marginTop: 2 },
  societyCard: { marginHorizontal: 16, marginBottom: 12 },
  societyName: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  societyLocation: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  amenitiesCard: { marginHorizontal: 16, marginBottom: 12 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: { fontSize: 12, color: '#374151', textTransform: 'capitalize' },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ctaButton: { width: '100%' },
});
