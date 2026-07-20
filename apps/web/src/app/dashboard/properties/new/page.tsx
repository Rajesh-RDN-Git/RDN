'use client';

import { useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/property/wizard/property-wizard';
import { useAuth } from '@/hooks/use-auth';

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-elevation-1">
          <h1 className="text-xl font-semibold text-foreground">Listing is for property owners</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Only society property owners can list a property on RDN. If you own a flat in a listed
            society, switch to an owner account to add your property. Otherwise, browse verified
            listings or reach out to us for help.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/search')}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
            >
              Browse properties
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
            >
              Contact us
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">Add Property</h1>
      <PropertyWizard
        userRole={user.role}
        userId={user.id}
        primarySocietyId={user.primarySocietyId ?? null}
        onPublished={(id) => router.push(`/dashboard/properties?published=${id}`)}
      />
    </div>
  );
}
