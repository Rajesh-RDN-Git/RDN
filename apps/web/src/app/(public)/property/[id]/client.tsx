'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageGallery } from '@/components/property/image-gallery';
import { EnquiryModal } from '@/components/property/enquiry-modal';
import { SimilarProperties } from '@/components/property/similar-properties';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BedIcon,
  AreaIcon,
  FloorIcon,
  CompassIcon,
  CalendarIcon,
  HomeIcon,
  HeartIcon,
  PhoneIcon,
  ChatIcon,
  ChevronIcon,
} from '@/components/ui/icons';

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
  dealer?: { user?: { name: string; avatarUrl?: string } };
}

const formatPrice = (price: string | null) => {
  if (!price) return null;
  const num = Number(price);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const specItems = (property: Property) => [
  { icon: BedIcon, label: 'Bedrooms', value: `${property.bhk} BHK` },
  { icon: AreaIcon, label: 'Carpet Area', value: `${property.carpetArea} sq.ft.` },
  { icon: AreaIcon, label: 'Super Area', value: `${property.superArea} sq.ft.` },
  { icon: FloorIcon, label: 'Floor', value: `${property.floor} of ${property.totalFloors}` },
  { icon: CompassIcon, label: 'Facing', value: property.facing || 'N/A' },
  { icon: HomeIcon, label: 'Furnishing', value: property.furnishing?.replace('_', '-') || 'N/A' },
  {
    icon: CalendarIcon,
    label: 'Availability',
    value: property.availabilityStatus.replace(/_/g, ' '),
  },
  ...(property.availableFrom
    ? [
        {
          icon: CalendarIcon,
          label: 'Available From',
          value: new Date(property.availableFrom).toLocaleDateString('en-IN'),
        },
      ]
    : []),
];

export function PropertyDetailClient({ property }: { property: Property }) {
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [shortlisted, setShortlisted] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return JSON.parse(localStorage.getItem('rdn_shortlist') || '[]').includes(property.id);
    } catch {
      return false;
    }
  });

  const toggleShortlist = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('rdn_shortlist') || '[]');
      const next = shortlisted ? saved.filter((id) => id !== property.id) : [...saved, property.id];
      localStorage.setItem('rdn_shortlist', JSON.stringify(next));
      setShortlisted(!shortlisted);
    } catch {
      /* localStorage unavailable */
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-body-sm text-gray-500">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <ChevronIcon size={14} direction="right" />
        <Link href={`/search?city=${property.society.city}`} className="hover:text-primary-600">
          {property.society.city}
        </Link>
        <ChevronIcon size={14} direction="right" />
        <Link href={`/society/${property.society.slug}`} className="hover:text-primary-600">
          {property.society.name}
        </Link>
        <ChevronIcon size={14} direction="right" />
        <span className="text-gray-900">
          {property.bhk} BHK {property.type}
        </span>
      </nav>

      {/* Image Gallery */}
      <ImageGallery images={property.media || []} />

      {/* Main content */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="space-y-8 lg:col-span-2">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-display-sm text-gray-900">
                {property.bhk} BHK {property.type}
              </h1>
              <Badge variant={property.transactionType === 'SALE' ? 'success' : 'info'}>
                For {property.transactionType}
              </Badge>
            </div>
            <p className="mt-1 text-body-lg text-gray-600">
              {property.flatNumber}, {property.towerBlock} &middot;{' '}
              <Link
                href={`/society/${property.society.slug}`}
                className="text-primary-600 hover:underline"
              >
                {property.society.name}
              </Link>
            </p>
            <p className="text-body-sm text-gray-500">
              {property.society.address}, {property.society.city}
            </p>
          </div>

          {/* Property specs grid with icons */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 p-5 sm:grid-cols-4">
            {specItems(property).map((spec) => (
              <div key={spec.label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  <spec.icon size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-caption-md text-gray-500">{spec.label}</p>
                  <p className="text-label-md text-gray-900">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {property.amenities && (property.amenities as string[]).length > 0 && (
            <div>
              <h2 className="mb-4 text-heading-md text-gray-900">Property Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.amenities as string[]).map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-body-sm text-gray-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Society Amenities */}
          {property.society.amenities && (property.society.amenities as string[]).length > 0 && (
            <div>
              <h2 className="mb-4 text-heading-md text-gray-900">Society Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.society.amenities as string[]).map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-body-sm text-blue-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-[calc(theme(height.header)+1rem)] space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-elevation-1">
            {/* Price */}
            <div className="space-y-2">
              {property.priceRent && (
                <div>
                  <p className="text-caption-md text-gray-500">Rent</p>
                  <p className="text-display-sm text-gray-900">
                    {formatPrice(property.priceRent)}
                    <span className="text-body-lg text-gray-500">/mo</span>
                  </p>
                </div>
              )}
              {property.priceSale && (
                <div>
                  <p className="text-caption-md text-gray-500">Sale Price</p>
                  <p className="text-display-sm text-gray-900">{formatPrice(property.priceSale)}</p>
                </div>
              )}
              {property.securityDeposit && (
                <div>
                  <p className="text-caption-md text-gray-500">Security Deposit</p>
                  <p className="text-heading-md text-gray-900">
                    {formatPrice(property.securityDeposit)}
                  </p>
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowEnquiry(true)}
                className="w-full"
                size="lg"
                leftIcon={<ChatIcon size={18} />}
              >
                Enquire Now
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                leftIcon={<PhoneIcon size={18} />}
              >
                Request Callback
              </Button>
              <Button
                variant={shortlisted ? 'secondary' : 'ghost'}
                className="w-full"
                size="lg"
                leftIcon={
                  <HeartIcon
                    size={18}
                    filled={shortlisted}
                    className={shortlisted ? 'text-red-500' : ''}
                  />
                }
                onClick={toggleShortlist}
              >
                {shortlisted ? 'Shortlisted' : 'Shortlist'}
              </Button>
            </div>

            {/* Dealer card */}
            {property.dealer?.user && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-caption-md text-gray-500">Your Community Dealer</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-label-md font-semibold text-primary-600">
                    {property.dealer.user.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="text-label-md text-gray-900">{property.dealer.user.name}</p>
                    <p className="text-caption-md text-gray-500">Verified Dealer</p>
                  </div>
                </div>
              </div>
            )}

            {/* Views */}
            <p className="text-center text-caption-md text-gray-400">
              {property.viewsCount} people viewed this property
            </p>
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      <SimilarProperties societyId={property.society.id} currentPropertyId={property.id} />

      <EnquiryModal
        isOpen={showEnquiry}
        onClose={() => setShowEnquiry(false)}
        propertyId={property.id}
        propertyName={`${property.bhk} BHK, ${property.towerBlock}, ${property.society.name}`}
      />
    </div>
  );
}
