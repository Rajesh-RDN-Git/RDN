'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { grievancesApi, type GrievanceCategory } from '@/lib/api/grievances.api';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { showToast } from '@/stores/toast-store';

// Categories surfaced to residents (owners/buyers) filing a grievance.
const CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: 'KEY_ARRANGEMENT', label: 'Key arrangement' },
  { value: 'VISIT_TIME', label: 'Time for visit' },
  { value: 'MEETING_AVAILABILITY', label: 'Availability for meeting' },
  { value: 'DEALER_CONDUCT', label: 'Dealer conduct' },
  { value: 'PROPERTY_MISMATCH', label: 'Property mismatch' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

export default function RaiseGrievancePage() {
  const router = useRouter();
  const [category, setCategory] = useState<GrievanceCategory>('KEY_ARRANGEMENT');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (description.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await grievancesApi.create({ category, severity, description: description.trim() });
      showToast.success('Grievance submitted. Our team will review it.');
      router.push('/dashboard');
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to submit grievance.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-heading-xl text-foreground">Raise a Grievance</h1>
      <p className="mb-6 text-body-sm text-muted-foreground">
        Report an issue — like key arrangement, visit timing, or meeting availability. Our team
        triages every grievance.
      </p>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-label-sm text-foreground">Category</label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm text-foreground">Priority</label>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the issue…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-body-md text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-ring"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
            {error}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()} className="flex-1">
            Cancel
          </Button>
          <Button onClick={submit} isLoading={submitting} className="flex-1">
            Submit Grievance
          </Button>
        </div>
      </div>
    </div>
  );
}
