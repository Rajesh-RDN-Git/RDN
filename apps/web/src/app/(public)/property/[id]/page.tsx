import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PropertyDetailClient } from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

async function getProperty(id: string) {
  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const property = await getProperty(params.id);
  if (!property) return { title: 'Property Not Found' };

  const price =
    property.transactionType === 'SALE'
      ? `${(Number(property.priceSale) / 100000).toFixed(0)}L`
      : `${Number(property.priceRent).toLocaleString('en-IN')}/mo`;

  const title = `${property.bhk} BHK ${property.type} for ${property.transactionType} in ${property.society?.name} - ${price}`;
  const description = `${property.bhk} BHK ${property.furnishing?.toLowerCase() || ''} ${property.type?.toLowerCase()} in ${property.towerBlock}, ${property.society?.name}, ${property.society?.city}. ${property.carpetArea} sq.ft. carpet area.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: property.media?.[0]?.url ? [property.media[0].url] : [],
    },
  };
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${property.bhk} BHK ${property.type} in ${property.society?.name}`,
    description: `${property.bhk} BHK ${property.furnishing || ''} ${property.type} in ${property.towerBlock}`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/property/${property.id}`,
    datePosted: property.createdAt,
    image: property.media?.map((m: any) => m.url) || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.society?.address,
      addressLocality: property.society?.city,
      addressRegion: property.society?.state,
      postalCode: property.society?.pincode,
      addressCountry: 'IN',
    },
    ...(property.transactionType === 'SALE'
      ? { price: Number(property.priceSale), priceCurrency: 'INR' }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient property={property} />
    </>
  );
}
