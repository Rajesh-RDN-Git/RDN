'use client';

import { useState } from 'react';
import { useWizard } from '../wizard-context';
import { propertiesApi } from '@/lib/api/properties.api';
import { mediaApi } from '@/lib/api/media.api';
import { clearDraft } from '../use-draft-autosave';

type Props = {
  onPublished: (propertyId: string) => void;
  userId: string;
  mode?: 'create' | 'edit';
  propertyId?: string;
};

const formatCurrency = (n?: number) =>
  typeof n === 'number' ? new Intl.NumberFormat('en-IN').format(n) : '—';

export function ReviewStep({ onPublished, userId, mode = 'create', propertyId }: Props) {
  const { state } = useWizard();
  const { data } = state;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
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
        amenities: Object.fromEntries(data.amenities.map((a) => [a, true])),
        restrictions: data.restrictions,
      };
      let property: { id: string };
      if (isEdit && propertyId) {
        await propertiesApi.update(propertyId, payload);
        property = { id: propertyId };
      } else {
        const propertyResp = await propertiesApi.create(payload);
        property = propertyResp.data as { id: string };
      }
      const cover = data.photos.find((p) => p.isCover);
      const ordered = [...(cover ? [cover] : []), ...data.photos.filter((p) => !p.isCover)];
      for (let i = 0; i < ordered.length; i++) {
        // Only persist newly-uploaded photos (those with a real S3 key);
        // existing media reloaded in edit mode have an empty key.
        if (!ordered[i].key) continue;
        await mediaApi.addMedia({
          propertyId: property.id,
          url: ordered[i].persistUrl,
          type: 'PHOTO',
          order: i,
        });
      }
      if (!isEdit) {
        clearDraft({ userId, societyId: data.societyId, flatNumber: data.flatNumber });
      }
      onPublished(property.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Property</h3>
        <p className="text-sm text-foreground">
          {data.flatNumber}, {data.towerBlock}
        </p>
        <p className="text-sm text-muted-foreground">
          {data.type} · {data.transactionType}
          {data.bhk ? ` · ${data.bhk} BHK` : ''}
        </p>
      </section>
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Pricing</h3>
        {data.priceRent && <p className="text-sm">Rent: ₹{formatCurrency(data.priceRent)}/month</p>}
        {data.priceSale && <p className="text-sm">Sale: ₹{formatCurrency(data.priceSale)}</p>}
        {data.securityDeposit && (
          <p className="text-sm text-muted-foreground">
            Deposit: ₹{formatCurrency(data.securityDeposit)}
          </p>
        )}
      </section>
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Photos ({data.photos.length})</h3>
        <div className="grid grid-cols-4 gap-2">
          {data.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt="" className="w-full h-20 object-cover rounded" />
          ))}
        </div>
      </section>
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Amenities</h3>
        <p className="text-sm text-muted-foreground">{data.amenities.join(', ') || '—'}</p>
      </section>
      {error && <p className="text-error text-sm">{error}</p>}
      <div className="flex gap-3">
        {!isEdit && (
          <button type="button" className="px-4 py-2 border border-border rounded">
            Save draft
          </button>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="px-4 py-2 bg-brand text-white rounded disabled:opacity-50"
        >
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
}
