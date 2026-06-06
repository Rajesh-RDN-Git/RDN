'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/property/wizard/property-wizard';
import type { WizardData, PhotoState } from '@/components/property/wizard/wizard-types';
import { INITIAL_DATA } from '@/components/property/wizard/wizard-types';
import { propertiesApi } from '@/lib/api/properties.api';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

const num = (v: unknown): number | undefined =>
  v === null || v === undefined || v === '' ? undefined : Number(v);

// Map an API property record into the wizard's data shape for prefilling.
function toWizardData(p: any): WizardData {
  const amenities = p.amenities
    ? Object.entries(p.amenities)
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];
  const photos: PhotoState[] = (p.media || []).map((m: any, i: number) => ({
    id: m.id || `existing-${i}`,
    key: '', // existing media — no S3 key, so not re-persisted on save
    url: m.url,
    persistUrl: m.url,
    isCover: m.order === 0 || i === 0,
    order: m.order ?? i,
  }));
  return {
    ...INITIAL_DATA,
    societyId: p.society?.id || p.societyId || '',
    flatNumber: p.flatNumber || '',
    towerBlock: p.towerBlock || '',
    type: p.type || '',
    transactionType: p.transactionType || '',
    bhk: num(p.bhk),
    carpetArea: num(p.carpetArea),
    superArea: num(p.superArea),
    floor: num(p.floor),
    totalFloors: num(p.totalFloors),
    facing: p.facing || undefined,
    furnishing: p.furnishing || undefined,
    priceRent: num(p.priceRent),
    priceSale: num(p.priceSale),
    securityDeposit: num(p.securityDeposit),
    photos,
    amenities,
    restrictions: p.restrictions || {},
  };
}

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [data, setData] = useState<WizardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    propertiesApi
      .getById(id)
      .then((r) => {
        const prop = (r.data as { data?: unknown }).data ?? r.data;
        const p = prop as any;
        // Authorize: owner of this listing, or an admin.
        const isOwnerOfThis = user?.role === 'OWNER' && p.owner?.id === user.id;
        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'RWA_ADMIN';
        if (!isOwnerOfThis && !isAdmin) {
          setError('You do not have permission to edit this listing.');
          return;
        }
        setData(toWizardData(p));
      })
      .catch(() => setError('Failed to load property.'));
  }, [id, user]);

  if (!user) return null;
  if (error) return <p className="p-6 text-error-text">{error}</p>;
  if (!data)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Property</h1>
      <PropertyWizard
        mode="edit"
        propertyId={id}
        initialData={data}
        userRole={user.role as 'OWNER' | 'SUPER_ADMIN' | 'RWA_ADMIN'}
        userId={user.id}
        primarySocietyId={user.primarySocietyId ?? null}
        onPublished={() => router.push(`/dashboard/properties`)}
      />
    </div>
  );
}
