import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { propertiesApi } from '@/lib/api/properties';
import { PropertyWizardScreen } from '@/components/property-wizard/PropertyWizard';
import type { WizardData, PhotoState } from '@/components/property-wizard/wizard-types';
import { INITIAL_DATA } from '@/components/property-wizard/wizard-types';

const num = (v: unknown): number | undefined =>
  v === null || v === undefined || v === '' ? undefined : Number(v);

/** Map an API property record into the wizard's WizardData shape for pre-filling. */
function toWizardData(p: any): WizardData {
  // amenities arrive as a JSONB object {key: true|false} — convert to string[]
  const amenities: string[] = p.amenities
    ? Object.entries(p.amenities as Record<string, unknown>)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k)
    : [];

  const photos: PhotoState[] = (p.media || []).map((m: any, i: number) => ({
    id: m.id ?? `existing-${i}`,
    url: m.url,
    isCover: m.order === 0 || i === 0,
    order: m.order ?? i,
  }));

  return {
    ...INITIAL_DATA,
    societyId: p.society?.id ?? p.societyId ?? '',
    flatNumber: p.flatNumber ?? '',
    towerBlock: p.towerBlock ?? '',
    type: p.type ?? '',
    transactionType: p.transactionType ?? '',
    bhk: num(p.bhk),
    carpetArea: num(p.carpetArea),
    superArea: num(p.superArea),
    floor: num(p.floor),
    totalFloors: num(p.totalFloors),
    facing: p.facing ?? undefined,
    furnishing: p.furnishing ?? undefined,
    priceRent: num(p.priceRent),
    priceSale: num(p.priceSale),
    securityDeposit: num(p.securityDeposit),
    maintenance: num(p.maintenance),
    negotiable: p.negotiable ?? undefined,
    brokerageDisclosed: p.brokerageDisclosed ?? undefined,
    amenities,
    restrictions: p.restrictions ?? {},
    photos,
  };
}

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    propertiesApi
      .getById(id)
      .then(({ data }) => {
        // API returns either {data: property} or plain property
        const raw = (data as { data?: unknown }).data ?? data;
        const p = raw as any;

        // Auth-gate: only the listing owner or an admin may edit.
        const isOwner = user?.role === 'OWNER' && p.owner?.id === user.id;
        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'RWA_ADMIN';
        if (!isOwner && !isAdmin) {
          setErrorMsg('You do not have permission to edit this listing.');
          return;
        }

        setWizardData(toWizardData(p));
      })
      .catch(() => setErrorMsg('Failed to load property.'));
  }, [id, user]);

  if (!isAuthenticated) {
    // Redirect to login — happens synchronously before any render work.
    router.replace('/(auth)/login');
    return null;
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!wizardData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleSubmit = async (data: WizardData) => {
    const payload: Record<string, unknown> = {
      societyId: data.societyId,
      flatNumber: data.flatNumber,
      towerBlock: data.towerBlock,
      type: data.type,
      transactionType: data.transactionType,
      bhk: data.bhk,
      carpetArea: data.carpetArea,
      superArea: data.superArea,
      floor: data.floor,
      totalFloors: data.totalFloors,
      facing: data.facing,
      furnishing: data.furnishing,
      priceRent: data.priceRent,
      priceSale: data.priceSale,
      securityDeposit: data.securityDeposit,
      maintenance: data.maintenance,
      negotiable: data.negotiable,
      brokerageDisclosed: data.brokerageDisclosed,
      amenities: data.amenities,
      restrictions: data.restrictions,
      photos: data.photos.map((p) => ({
        url: p.url,
        isCover: p.isCover,
        order: p.order,
      })),
    };
    await propertiesApi.update(id!, payload);
    Alert.alert('Saved', 'Your listing has been updated.', [
      {
        text: 'OK',
        onPress: () => router.replace('/manage/properties' as never),
      },
    ]);
  };

  return <PropertyWizardScreen initialData={wizardData} onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: { fontSize: 15, color: '#ef4444', textAlign: 'center', paddingHorizontal: 24 },
});
