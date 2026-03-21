import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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

  const formatPrice = (price: string | null) => {
    if (!price) return null;
    const num = Number(price);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
    return num.toLocaleString('en-IN');
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Society Header */}
        <div className="mb-8 rounded-xl border bg-white p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{society.name}</h1>
              <p className="mt-1 text-gray-600">{society.address}</p>
              <p className="text-sm text-gray-500">
                {society.city}, {society.state} - {society.pincode}
              </p>
            </div>
            <Badge variant={society.status === 'ONBOARDED' ? 'success' : 'warning'}>
              {society.status}
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{society.totalUnits || '-'}</p>
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              <p className="text-sm text-gray-500">Active Listings</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {society.verificationStatus === 'VERIFIED' ? 'Yes' : 'Pending'}
              </p>
              <p className="text-sm text-gray-500">Verified</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {(society.amenities as string[])?.length || 0}
              </p>
              <p className="text-sm text-gray-500">Amenities</p>
            </div>
          </div>

          {(society.amenities as string[])?.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 font-semibold text-gray-900">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(society.amenities as string[]).map((a: string) => (
                  <Badge key={a} variant="info">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Available Properties */}
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Available Properties</h2>
        {properties.length === 0 ? (
          <p className="text-gray-500">No properties currently listed in this society.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop: any) => (
              <Link
                key={prop.id}
                href={`/property/${prop.id}`}
                className="block rounded-xl border bg-white p-4 transition-shadow hover:shadow-lg"
              >
                {prop.media?.[0]?.url && (
                  <img
                    src={prop.media[0].url}
                    alt={`${prop.bhk} BHK`}
                    className="mb-3 aspect-[4/3] w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={prop.transactionType === 'SALE' ? 'success' : 'info'}>
                    {prop.transactionType}
                  </Badge>
                  <Badge variant="default">{prop.furnishing?.replace('_', '-') || 'N/A'}</Badge>
                </div>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {prop.transactionType === 'SALE'
                    ? formatPrice(prop.priceSale)
                    : `${formatPrice(prop.priceRent)}/mo`}
                </p>
                <p className="font-medium text-gray-700">
                  {prop.bhk} BHK &middot; {prop.carpetArea} sq.ft.
                </p>
                <p className="text-sm text-gray-500">
                  {prop.flatNumber}, {prop.towerBlock}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
