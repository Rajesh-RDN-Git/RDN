'use client';

import { useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/property/wizard/property-wizard';
import { useAuth } from '@/hooks/use-auth';

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
    return <p className="p-6">You don&apos;t have permission to add properties.</p>;
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
