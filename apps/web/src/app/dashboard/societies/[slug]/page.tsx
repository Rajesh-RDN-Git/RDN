'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@rdn/shared';
import { useAuthStore } from '@/stores/auth-store';
import { societiesApi } from '@/lib/api/societies.api';
import { propertiesApi } from '@/lib/api/properties.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckIcon } from '@/components/ui/icons';

interface SocietyDetail {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  totalUnits?: number | null;
  amenities?: unknown;
  status: string;
  verificationStatus: string;
  rwaAdmin?: { id: string; name: string } | null;
  media?: { url: string }[];
  _count?: { properties: number; dealers: number };
}

interface PropertyRow {
  id: string;
  flatNumber: string;
  towerBlock: string;
  type: string;
  bhk?: number | null;
  transactionType: string;
  priceSale?: string | number | null;
  priceRent?: string | number | null;
  verificationStatus: string;
}

const statusVariant = (s: string) =>
  s === 'ONBOARDED'
    ? ('success' as const)
    : s === 'INACTIVE'
      ? ('error' as const)
      : ('warning' as const);

const verificationVariant = (s: string) =>
  s === 'VERIFIED'
    ? ('success' as const)
    : s === 'REJECTED'
      ? ('error' as const)
      : s === 'FLAGGED'
        ? ('warning' as const)
        : ('info' as const);

const formatPrice = (p?: string | number | null) => {
  const val = Number(p || 0);
  if (!val) return '—';
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
  return val.toLocaleString('en-IN');
};

export default function SocietyDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [society, setSociety] = useState<SocietyDetail | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSuperAdmin) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await societiesApi.getBySlug(params.slug);
        const soc = data as SocietyDetail;
        if (!active) return;
        setSociety(soc);
        try {
          // /properties (not /search) returns ACTIVE listings incl. PENDING ones,
          // which an admin needs to see; /search hides anything not RWA-approved.
          const res = await propertiesApi.list({ societyId: soc.id, limit: 50 });
          const payload = res.data?.data ?? res.data;
          if (active) setProperties((payload as PropertyRow[]) || []);
        } catch {
          /* listings are non-fatal — show society without them */
        }
      } catch (err: any) {
        if (active)
          setError(
            err?.response?.status === 404
              ? 'Society not found.'
              : err?.response?.data?.message || 'Failed to load society.',
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.slug, user, isSuperAdmin]);

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Society</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !society) {
    return (
      <div>
        <Link href="/dashboard/societies" className="text-sm text-brand hover:underline">
          ← Back to Societies
        </Link>
        <div className="mt-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
          {error || 'Society not found.'}
        </div>
      </div>
    );
  }

  const amenities = Array.isArray(society.amenities) ? (society.amenities as string[]) : [];

  const details: { label: string; value: React.ReactNode }[] = [
    { label: 'Address', value: society.address },
    { label: 'City', value: society.city },
    { label: 'State', value: society.state },
    { label: 'Pincode', value: society.pincode },
    { label: 'Total Units', value: society.totalUnits ?? '—' },
    {
      label: 'Coordinates',
      value: society.lat != null && society.lng != null ? `${society.lat}, ${society.lng}` : '—',
    },
    { label: 'RWA Admin', value: society.rwaAdmin?.name || '—' },
    { label: 'Listings', value: society._count?.properties ?? properties.length },
    { label: 'Dealers', value: society._count?.dealers ?? '—' },
  ];

  return (
    <div>
      <Link href="/dashboard/societies" className="text-sm text-brand hover:underline">
        ← Back to Societies
      </Link>

      {/* Header */}
      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{society.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{society.slug}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(society.status)}>{society.status}</Badge>
            <Badge variant={verificationVariant(society.verificationStatus)}>
              {society.verificationStatus}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/society/${society.slug}`)}>
            Public page
          </Button>
          <Button onClick={() => router.push('/dashboard/societies')}>Edit in list</Button>
        </div>
      </div>

      {/* Cover image (placeholder until society media is wired) */}
      <div className="mb-6 h-44 overflow-hidden rounded-xl border border-border bg-chrome">
        {society.media?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={society.media[0].url}
            alt={society.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-subtle to-muted text-sm text-muted-foreground">
            No photos yet
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-heading-md text-foreground">Details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Amenities */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-heading-md text-foreground">Amenities</h2>
        {amenities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No amenities listed.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {amenities.map((a) => (
              <div
                key={a}
                className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-subtle text-brand">
                  <CheckIcon size={12} />
                </span>
                {a}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-heading-md text-foreground">Listings ({properties.length})</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings in this society yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">BHK</th>
                  <th className="py-2 pr-4">For</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Verification</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-foreground">
                      {p.flatNumber}, {p.towerBlock}
                    </td>
                    <td className="py-2 pr-4">{p.type}</td>
                    <td className="py-2 pr-4">{p.bhk ?? '—'}</td>
                    <td className="py-2 pr-4">{p.transactionType}</td>
                    <td className="py-2 pr-4">
                      {p.transactionType === 'SALE'
                        ? formatPrice(p.priceSale)
                        : `${formatPrice(p.priceRent)}/mo`}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={verificationVariant(p.verificationStatus)}>
                        {p.verificationStatus}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/property/${p.id}`}
                        target="_blank"
                        className="text-brand hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
