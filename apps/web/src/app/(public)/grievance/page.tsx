'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';

type Category = 'DATA_ACCESS' | 'DATA_ERASURE' | 'DATA_CORRECTION' | 'CONSENT_WITHDRAWAL' | 'OTHER';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function GrievancePage() {
  const [category, setCategory] = useState<Category>('OTHER');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim()) {
        setErrorMessage('Please describe your grievance.');
        return;
      }
      setState('submitting');
      setErrorMessage(null);
      try {
        await apiClient.post('/grievance/dpdp', {
          category,
          description,
          contact: contact || undefined,
        });
        setState('success');
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to submit. Try again or email grievance@rdn.example.com.';
        setErrorMessage(msg);
        setState('error');
      }
    },
    [category, description, contact],
  );

  if (state === 'success') {
    return (
      <article className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Grievance submitted</h1>
        <p className="mt-4 text-slate-700">
          We&apos;ve acknowledged your submission. Our Grievance Officer will respond within 7 days
          and resolve within 30 days.
        </p>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Data grievance</h1>
      <p className="mt-2 text-slate-600">
        For DPDP Act 2023 grievances (data access, erasure, correction, consent withdrawal). For
        property or service complaints, use the in-app grievance flow.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            <option value="DATA_ACCESS">Data access / portability</option>
            <option value="DATA_ERASURE">Data erasure</option>
            <option value="DATA_CORRECTION">Correction</option>
            <option value="CONSENT_WITHDRAWAL">Consent withdrawal</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Please describe your grievance with as much detail as possible."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contact (phone or email, optional)
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="If unauthenticated or want a non-account contact"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <Button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Submitting…' : 'Submit grievance'}
        </Button>
      </form>

      <div className="mt-12 border-t pt-6 text-sm text-slate-600">
        <h2 className="text-base font-semibold text-slate-900">Grievance Officer</h2>
        <p className="mt-2">
          Email: <a href="mailto:grievance@rdn.example.com">grievance@rdn.example.com</a>
        </p>
        <p>Acknowledgement within 7 days · Resolution within 30 days</p>
      </div>
    </article>
  );
}
