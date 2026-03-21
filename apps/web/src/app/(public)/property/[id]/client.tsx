'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageGallery } from '@/components/property/image-gallery';
import { EnquiryModal } from '@/components/property/enquiry-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  flatNumber: string;
  towerBlock: string;
  type: string;
  transactionType: string;
  bhk: number;
  carpetArea: string;
  superArea: string;
  floor: number;
  totalFloors: number;
  facing: string;
  furnishing: string;
  priceRent: string | null;
  priceSale: string | null;
  securityDeposit: string | null;
  availabilityStatus: string;
  availableFrom: string | null;
  amenities: string[];
  viewsCount: number;
  society: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    amenities: string[];
  };
  media: Array<{ url: string; type: string; order: number }>;
}

const formatPrice = (price: string | null) => {
  if (!price) return null;
  const num = Number(price);
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
  return num.toLocaleString('en-IN');
};

export function PropertyDetailClient({ property }: { property: Property }) {
  const [showEnquiry, setShowEnquiry] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ImageGallery images={property.media || []} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {property.bhk} BHK {property.type}
              </h1>
              <Badge variant={property.transactionType === 'SALE' ? 'success' : 'info'}>
                For {property.transactionType}
              </Badge>
            </div>
            <p className="mt-1 text-lg text-gray-600">
              {property.flatNumber}, {property.towerBlock} &middot;{' '}
              <Link
                href={`/society/${property.society.slug}`}
                className="text-primary-600 hover:underline"
              >
                {property.society.name}
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              {property.society.address}, {property.society.city}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Carpet Area</p>
              <p className="font-semibold">{property.carpetArea} sq.ft.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Super Area</p>
              <p className="font-semibold">{property.superArea} sq.ft.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Floor</p>
              <p className="font-semibold">
                {property.floor} of {property.totalFloors}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Facing</p>
              <p className="font-semibold">{property.facing || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Furnishing</p>
              <p className="font-semibold">{property.furnishing?.replace('_', '-') || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Availability</p>
              <p className="font-semibold">{property.availabilityStatus.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Views</p>
              <p className="font-semibold">{property.viewsCount}</p>
            </div>
            {property.availableFrom && (
              <div>
                <p className="text-xs text-gray-500">Available From</p>
                <p className="font-semibold">
                  {new Date(property.availableFrom).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
          </div>

          {property.amenities && (property.amenities as string[]).length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.amenities as string[]).map((a) => (
                  <Badge key={a} variant="default">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {property.society.amenities && (property.society.amenities as string[]).length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Society Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.society.amenities as string[]).map((a) => (
                  <Badge key={a} variant="info">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              {property.priceRent && (
                <div>
                  <p className="text-sm text-gray-500">Rent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(property.priceRent)}/mo
                  </p>
                </div>
              )}
              {property.priceSale && (
                <div>
                  <p className="text-sm text-gray-500">Sale Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(property.priceSale)}
                  </p>
                </div>
              )}
              {property.securityDeposit && (
                <div>
                  <p className="text-sm text-gray-500">Security Deposit</p>
                  <p className="font-semibold">{formatPrice(property.securityDeposit)}</p>
                </div>
              )}
            </div>
            <Button onClick={() => setShowEnquiry(true)} className="mt-6 w-full" size="lg">
              Enquire Now
            </Button>
          </div>
        </div>
      </div>

      <EnquiryModal
        isOpen={showEnquiry}
        onClose={() => setShowEnquiry(false)}
        propertyId={property.id}
        propertyName={`${property.bhk} BHK, ${property.towerBlock}, ${property.society.name}`}
      />
    </div>
  );
}
