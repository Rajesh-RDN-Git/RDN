import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { PropertyCard } from '@/components/search/property-card';
import { HomeIcon, BuildingIcon, ShieldIcon, StarIcon, CheckIcon } from '@/components/ui/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

async function getSociety(slug: string) {
  try {
    const res = await fetch(`${API_URL}/societies/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

async function getSocietyProperties(societyId: string) {
  try {
    const res = await fetch(`${API_URL}/search/properties?societyId=${societyId}&limit=12`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const payload = json.data ?? json;
    return payload.data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const society = await getSociety(params.slug);
  if (!society) return { title: 'Society Not Found' };

  const title = `${society.name} - Properties for Rent & Sale in ${society.city}`;
  const description = `Browse ${society.totalUnits || ''} unit residential society ${society.name} in ${society.city}. Find apartments for rent and sale with verified listings.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function SocietyPage({ params }: { params: { slug: string } }) {
  const society = await getSociety(params.slug);
  if (!society) notFound();

  const properties = await getSocietyProperties(society.id);

  const saleProperties = properties.filter(
    (p: any) => p.transactionType === 'SALE' || p.transactionType === 'BOTH',
  );
  const rentProperties = properties.filter(
    (p: any) => p.transactionType === 'RENT' || p.transactionType === 'BOTH',
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ResidentialComplex',
    name: society.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: society.address,
      addressLocality: society.city,
      addressRegion: society.state,
      postalCode: society.pincode,
      addressCountry: 'IN',
    },
    numberOfRooms: society.totalUnits,
    amenityFeature: (society.amenities as string[])?.map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
    })),
  };

  const stats = [
    {
      label: 'Total Units',
      value: society.totalUnits || '—',
      icon: <HomeIcon size={20} className="text-brand" />,
    },
    {
      label: 'Active Listings',
      value: properties.length,
      icon: <BuildingIcon size={20} className="text-brand" />,
    },
    {
      label: 'Verified',
      value: society.verificationStatus === 'VERIFIED' ? 'Yes' : 'Pending',
      icon: <ShieldIcon size={20} className="text-brand" />,
    },
    {
      label: 'Amenities',
      value: (society.amenities as string[])?.length || 0,
      icon: <StarIcon size={20} className="text-brand" />,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero banner */}
      <div className="relative h-64 overflow-hidden bg-chrome md:h-80">
        {society.media?.[0]?.url ? (
          <img
            src={society.media[0].url}
            alt={society.name}
            className="h-full w-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-active to-chrome" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-chrome/90 via-chrome/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-content px-4 pb-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={society.status === 'ONBOARDED' ? 'success' : 'warning'}>
                  {society.status}
                </Badge>
                {society.verificationStatus === 'VERIFIED' && (
                  <Badge variant="success">Verified</Badge>
                )}
              </div>
              <h1 className="text-display-md text-chrome-foreground md:text-display-lg">
                {society.name}
              </h1>
              <p className="mt-1 text-body-lg text-chrome-muted">
                {society.address}, {society.city}, {society.state} - {society.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-content px-4 py-8">
        {/* Stats grid */}
        <div className="-mt-12 relative z-10 mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-5 shadow-elevation-1"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle">
                {stat.icon}
              </div>
              <p className="text-display-sm text-foreground">{stat.value}</p>
              <p className="mt-1 text-label-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs implementation (SSR-safe) */}
        <div className="mb-8">
          {/* Properties section */}
          <h2 className="mb-6 text-heading-xl text-foreground">Properties</h2>

          {properties.length === 0 ? (
            <p className="text-body-md text-muted-foreground">
              No properties currently listed in this society.
            </p>
          ) : (
            <>
              {/* For Sale */}
              {saleProperties.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-heading-md text-foreground">
                    For Sale ({saleProperties.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {saleProperties.map((prop: any) => (
                      <PropertyCard key={prop.id} property={prop} />
                    ))}
                  </div>
                </div>
              )}

              {/* For Rent */}
              {rentProperties.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-heading-md text-foreground">
                    For Rent ({rentProperties.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rentProperties.map((prop: any) => (
                      <PropertyCard key={prop.id} property={prop} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* About & Amenities */}
        {(society.amenities as string[])?.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-heading-lg text-foreground">Amenities</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {(society.amenities as string[]).map((a: string) => (
                <div
                  key={a}
                  className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-body-sm text-foreground"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-subtle text-brand">
                    <CheckIcon size={14} />
                  </span>
                  {a}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
