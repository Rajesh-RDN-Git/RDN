'use client';

// Deprecated: superseded by PropertyWizard at /dashboard/properties/new (Path B). Kept for reference; remove once PR merged.

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPropertySchema, type CreatePropertyInput } from '@rdn/shared';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { propertiesApi } from '@/lib/api/properties.api';
import { societiesApi } from '@/lib/api/societies.api';
import { showToast } from '@/stores/toast-store';

interface Society {
  id: string;
  name: string;
  city?: string;
}

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreatePropertyModal({ isOpen, onClose, onCreated }: CreatePropertyModalProps) {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societiesLoading, setSocietiesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      type: 'APARTMENT',
      transactionType: 'SALE',
    },
  });

  const txnType = watch('transactionType');
  const propType = watch('type');

  useEffect(() => {
    if (!isOpen) return;
    setSocietiesLoading(true);
    societiesApi
      .list({ limit: 200 })
      .then(({ data }) => {
        setSocieties(data?.data || data || []);
      })
      .catch(() => {
        showToast.error('Failed to load societies');
      })
      .finally(() => setSocietiesLoading(false));
  }, [isOpen]);

  const onSubmit: SubmitHandler<CreatePropertyInput> = async (data) => {
    setSubmitting(true);
    try {
      // Strip irrelevant price field based on transaction type
      const payload: CreatePropertyInput = { ...data };
      if (data.transactionType === 'RENT') delete (payload as { priceSale?: number }).priceSale;
      if (data.transactionType === 'SALE') {
        delete (payload as { priceRent?: number }).priceRent;
        delete (payload as { securityDeposit?: number }).securityDeposit;
      }
      await propertiesApi.create(payload as Record<string, unknown>);
      showToast.success('Property created');
      reset();
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message || 'Failed to create property';
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const showRent = txnType === 'RENT' || txnType === 'BOTH';
  const showSale = txnType === 'SALE' || txnType === 'BOTH';
  const showBhk = propType === 'APARTMENT' || propType === 'VILLA';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Property" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Society */}
        <Select
          label="Society"
          {...register('societyId')}
          error={errors.societyId?.message}
          placeholder={societiesLoading ? 'Loading…' : 'Select a society'}
          disabled={societiesLoading}
          options={societies.map((s) => ({
            value: s.id,
            label: s.city ? `${s.name} — ${s.city}` : s.name,
          }))}
        />

        {/* Flat / Tower */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Flat number"
            placeholder="A-504"
            {...register('flatNumber')}
            error={errors.flatNumber?.message}
          />
          <Input
            label="Tower / Block"
            placeholder="Tower B"
            {...register('towerBlock')}
            error={errors.towerBlock?.message}
          />
        </div>

        {/* Type / Transaction */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Property type"
            {...register('type')}
            error={errors.type?.message}
            options={[
              { value: 'APARTMENT', label: 'Apartment' },
              { value: 'VILLA', label: 'Villa' },
              { value: 'COMMERCIAL', label: 'Commercial' },
            ]}
          />
          <Select
            label="Transaction type"
            {...register('transactionType')}
            error={errors.transactionType?.message}
            options={[
              { value: 'SALE', label: 'Sale' },
              { value: 'RENT', label: 'Rent' },
              { value: 'BOTH', label: 'Both' },
            ]}
          />
        </div>

        {/* Specs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {showBhk && (
            <Input
              label="BHK"
              type="number"
              min={1}
              placeholder="3"
              {...register('bhk', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
              error={errors.bhk?.message}
            />
          )}
          <Input
            label="Carpet area (sq ft)"
            type="number"
            min={0}
            placeholder="1200"
            {...register('carpetArea', {
              setValueAs: (v) => (v === '' ? undefined : Number(v)),
            })}
            error={errors.carpetArea?.message}
          />
          <Select
            label="Furnishing"
            {...register('furnishing')}
            error={errors.furnishing?.message}
            placeholder="Optional"
            options={[
              { value: 'FURNISHED', label: 'Furnished' },
              { value: 'SEMI', label: 'Semi-Furnished' },
              { value: 'UNFURNISHED', label: 'Unfurnished' },
            ]}
          />
        </div>

        {/* Pricing */}
        {(showRent || showSale) && (
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <p className="mb-3 text-overline text-muted-foreground">Pricing (₹)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {showSale && (
                <Input
                  label="Sale price"
                  type="number"
                  min={0}
                  placeholder="15000000"
                  hint="Lump-sum amount"
                  {...register('priceSale', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                  error={errors.priceSale?.message}
                />
              )}
              {showRent && (
                <>
                  <Input
                    label="Monthly rent"
                    type="number"
                    min={0}
                    placeholder="45000"
                    {...register('priceRent', {
                      setValueAs: (v) => (v === '' ? undefined : Number(v)),
                    })}
                    error={errors.priceRent?.message}
                  />
                  <Input
                    label="Security deposit"
                    type="number"
                    min={0}
                    placeholder="90000"
                    {...register('securityDeposit', {
                      setValueAs: (v) => (v === '' ? undefined : Number(v)),
                    })}
                    error={errors.securityDeposit?.message}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Create property
          </Button>
        </div>
      </form>
    </Modal>
  );
}
