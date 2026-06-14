'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useWizard } from '../wizard-context';
import { RequiredMark } from '../field-label';
import { societiesApi } from '@/lib/api/societies.api';

type Society = { id: string; name: string; city: string };

type Props = {
  userRole: 'OWNER' | 'SUPER_ADMIN' | 'RWA_ADMIN';
  primarySocietyId: string | null;
};

export function BasicsStep({ userRole, primarySocietyId }: Props) {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;
  const [societies, setSocieties] = useState<Society[]>([]);
  // Lock the society to the owner's primary society only when we actually know
  // it. If an owner has no primary society linked, let them pick one instead of
  // trapping them behind a disabled, empty dropdown.
  const ownerLocked = userRole === 'OWNER' && !!primarySocietyId;

  useEffect(() => {
    // limit: 50 so the owner's society is in the list even after many societies
    // are onboarded (default page size of 20 was pushing it off the first page).
    societiesApi
      .list({ limit: 50 })
      .then((r: { data: Society[] | { data: Society[] } }) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setSocieties(list);
      })
      .catch(() => {
        /* swallow — wizard can still render with empty list */
      });
  }, []);

  useEffect(() => {
    if (ownerLocked && primarySocietyId && !data.societyId) {
      dispatch({ type: 'SET_FIELD', field: 'societyId', value: primarySocietyId });
    }
  }, [ownerLocked, primarySocietyId, data.societyId, dispatch]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="society" className="mb-1.5 block text-sm font-medium text-foreground">
          Society
          <RequiredMark />
        </label>
        <Select
          id="society"
          value={data.societyId}
          disabled={ownerLocked}
          error={errors.societyId}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', field: 'societyId', value: e.target.value })
          }
        >
          <option value="">Select a society</option>
          {societies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.city}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="flatNumber" className="mb-1.5 block text-sm font-medium text-foreground">
            Flat number
            <RequiredMark />
          </label>
          <Input
            id="flatNumber"
            value={data.flatNumber}
            error={errors.flatNumber}
            placeholder="e.g. A-101"
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', field: 'flatNumber', value: e.target.value })
            }
          />
        </div>
        <div>
          <label htmlFor="towerBlock" className="mb-1.5 block text-sm font-medium text-foreground">
            Tower / Block
            <RequiredMark />
          </label>
          <Input
            id="towerBlock"
            value={data.towerBlock}
            error={errors.towerBlock}
            placeholder="e.g. Tower A"
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', field: 'towerBlock', value: e.target.value })
            }
          />
        </div>
      </div>
      <div>
        <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-foreground">
          Property type
          <RequiredMark />
        </label>
        <Select
          id="type"
          value={data.type}
          error={errors.type}
          onChange={(e) =>
            dispatch({
              type: 'SET_FIELD',
              field: 'type',
              value: e.target.value as never,
            })
          }
        >
          <option value="">Select type</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="COMMERCIAL">Commercial</option>
        </Select>
      </div>
      <div>
        <label
          htmlFor="transactionType"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Transaction type
          <RequiredMark />
        </label>
        <Select
          id="transactionType"
          value={data.transactionType}
          error={errors.transactionType}
          onChange={(e) =>
            dispatch({
              type: 'SET_FIELD',
              field: 'transactionType',
              value: e.target.value as never,
            })
          }
        >
          <option value="">Select transaction</option>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>
    </div>
  );
}
