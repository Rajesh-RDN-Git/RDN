'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { BuildingIcon, CheckIcon, ShieldIcon } from '@/components/ui/icons';
import { useAuth } from '@/hooks/use-auth';
import { dealersApi, societiesApi } from '@/lib/api';
import { showToast } from '@/stores/toast-store';

interface SocietyOption {
  id: string;
  name: string;
  city: string;
  status: string;
}

type SubmitState = 'idle' | 'submitting' | 'success';

export default function BecomeDealerPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [societiesLoading, setSocietiesLoading] = useState(true);
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [residentConfirmed, setResidentConfirmed] = useState(false);
  const [aboutYou, setAboutYou] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch societies (public list, then filter to ONBOARDED).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSocietiesLoading(true);
      try {
        const { data } = await societiesApi.list({ limit: 50 });
        // Response shape: { data: Society[], total, page, limit }
        const list = Array.isArray((data as { data?: SocietyOption[] }).data)
          ? (data as { data: SocietyOption[] }).data
          : [];
        const onboarded = list.filter((s) => s.status === 'ONBOARDED');
        if (!cancelled) setSocieties(onboarded);
      } catch {
        if (!cancelled) setSocieties([]);
      } finally {
        if (!cancelled) setSocietiesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(
    () => isAuthenticated && !!selectedSocietyId && residentConfirmed && submitState === 'idle',
    [isAuthenticated, selectedSocietyId, residentConfirmed, submitState],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setSubmitState('submitting');
      setErrorMessage(null);
      try {
        await dealersApi.apply({ societyId: selectedSocietyId });
        setSubmitState('success');
        showToast.success('Application submitted for RWA review.');
      } catch (err) {
        const ax = err as AxiosError<{ message?: string }>;
        const status = ax.response?.status;
        const apiMsg = ax.response?.data?.message;
        if (status === 409) {
          setErrorMessage(
            'You already have a dealer application for this society. Please check your dashboard for its status.',
          );
        } else if (status === 401) {
          setErrorMessage('Your session has expired. Please log in and try again.');
        } else {
          setErrorMessage(apiMsg || 'Failed to submit application. Please try again.');
        }
        setSubmitState('idle');
      }
    },
    [canSubmit, selectedSocietyId],
  );

  // Loading auth state
  if (authLoading) {
    return (
      <div className="mx-auto flex max-w-content items-center justify-center px-4 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Success state
  if (submitState === 'success') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-elevation-1">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
            <CheckIcon size={28} className="text-success-icon" />
          </div>
          <h1 className="text-heading-lg text-foreground">Application submitted</h1>
          <p className="mt-3 text-body-md text-muted-foreground">
            Your dealer application is under review by the RWA admin of the selected society. You
            will be notified once a decision has been made. KYC document upload will be available in
            your dashboard shortly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-heading-xl text-foreground">Become a Resident Dealer</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          RDN dealers are residents of their society who help neighbours with property transactions
          and earn commissions. Submit your application — your RWA admin reviews and approves
          dealers from your community.
        </p>
      </div>

      {/* Benefits row */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BenefitCard
          icon={<BuildingIcon size={20} className="text-brand" />}
          title="Society-scoped"
          body="Help your own community with verified listings."
        />
        <BenefitCard
          icon={<ShieldIcon size={20} className="text-brand" />}
          title="RWA-approved"
          body="Build trust through community-led approval."
        />
        <BenefitCard
          icon={<CheckIcon size={20} className="text-brand" />}
          title="Earn commission"
          body="Transparent commission on closed transactions."
        />
      </div>

      {/* Not logged in */}
      {!isAuthenticated ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevation-1">
          <h2 className="text-heading-md text-foreground">Log in to apply</h2>
          <p className="mt-2 text-body-md text-muted-foreground">
            You need an RDN account to submit a dealer application. Sign in with your phone number —
            we will bring you back here after login.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/login?from=/become-dealer">
              <Button>Log in</Button>
            </Link>
            <Link href="/register?from=/become-dealer">
              <Button variant="outline">Create account</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-elevation-1"
        >
          <div className="rounded-lg bg-subtle p-3 text-body-sm text-muted-foreground">
            Applying as{' '}
            <span className="font-medium text-foreground">{user?.name || user?.phone}</span>
          </div>

          <Select
            label="Select your society"
            value={selectedSocietyId}
            onChange={(e) => setSelectedSocietyId(e.target.value)}
            placeholder={
              societiesLoading
                ? 'Loading societies…'
                : societies.length === 0
                  ? 'No onboarded societies available'
                  : 'Choose a society'
            }
            disabled={societiesLoading || societies.length === 0}
            hint="Only societies that have been onboarded onto RDN are listed."
            required
          >
            <option value="" disabled>
              {societiesLoading
                ? 'Loading societies…'
                : societies.length === 0
                  ? 'No onboarded societies available'
                  : 'Choose a society'}
            </option>
            {societies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.city}
              </option>
            ))}
          </Select>

          <Textarea
            label="About you (optional)"
            value={aboutYou}
            onChange={(e) => setAboutYou(e.target.value)}
            placeholder="Tell the RWA admin a bit about yourself, your tower/flat, and why you want to be a dealer."
            hint="Optional context for the RWA admin reviewing your application."
            maxLength={500}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-subtle">
            <input
              type="checkbox"
              checked={residentConfirmed}
              onChange={(e) => setResidentConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
              required
            />
            <span className="text-body-sm text-foreground">
              I confirm I am a current resident of the selected society and agree to the dealer
              terms. The RWA admin may contact me for verification.
            </span>
          </label>

          <div className="rounded-lg border border-dashed border-border bg-subtle p-4">
            <h3 className="text-label-md text-foreground">KYC document</h3>
            <p className="mt-1 text-body-sm text-muted-foreground">
              You will be prompted to upload your KYC document (e.g. Aadhaar / PAN) from your
              dashboard once your application is approved by the RWA. KYC upload from this page is
              coming soon.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link href="/" className="text-body-sm text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
            <Button type="submit" disabled={!canSubmit} isLoading={submitState === 'submitting'}>
              Submit application
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-brand-subtle">
        {icon}
      </div>
      <h3 className="text-label-md text-foreground">{title}</h3>
      <p className="mt-1 text-body-sm text-muted-foreground">{body}</p>
    </div>
  );
}
