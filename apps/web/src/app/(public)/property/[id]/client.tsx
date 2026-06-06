'use client';

import { useState, useEffect } from 'react';
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
  SettingsIcon,
} from '@/components/ui/icons';
import { leadsApi } from '@/lib/api/leads.api';
import { propertiesApi } from '@/lib/api/properties.api';
import { useAuthStore } from '@/stores/auth-store';
import { showToast } from '@/stores/toast-store';

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
  status?: string;
  owner?: { id: string; name?: string };
  assignedDealer?: { id: string; user?: { id: string; name?: string } };
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
  {
    icon: AreaIcon,
    label: 'Super Area',
    value: property.superArea ? `${property.superArea} sq.ft.` : 'N/A',
  },
  {
    icon: FloorIcon,
    label: 'Floor',
    value:
      property.floor && property.totalFloors
        ? `${property.floor} of ${property.totalFloors}`
        : 'N/A',
  },
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
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [requestingCallback, setRequestingCallback] = useState(false);
  const [delisting, setDelisting] = useState(false);

  // Role-aware action panel. Anonymous + buyers get the enquiry/shortlist flow;
  // the owner of this listing and admins get manage actions; everyone else just
  // gets shortlist (avoids offering enquiry that would 403). During auth-store
  // hydration, fall back to the buyer/anon view to avoid flashing manage UI.
  const role = user?.role;
  const isBuyerFlow = isLoading || !user || role === 'BUYER_TENANT';
  const isOwnerOfThis = role === 'OWNER' && !!property.owner?.id && property.owner.id === user?.id;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'RWA_ADMIN';
  const canManage = !isBuyerFlow && (isOwnerOfThis || isAdmin);

  const handleDelist = async () => {
    if (!confirm('Delist this property? It will no longer appear in search.')) return;
    setDelisting(true);
    try {
      await propertiesApi.delist(property.id);
      showToast.success('Property delisted');
      window.location.href = '/dashboard/properties';
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delist property';
      showToast.error(msg);
    } finally {
      setDelisting(false);
    }
  };
  // Start false so SSR and first client render agree, then hydrate from
  // localStorage after mount — reading storage in the initializer causes a
  // hydration mismatch (React #418/#425) when the property is shortlisted.
  const [shortlisted, setShortlisted] = useState(false);

  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('rdn_shortlist') || '[]');
      setShortlisted(saved.includes(property.id));
    } catch {
      /* localStorage unavailable */
    }
  }, [property.id]);

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

  const handleRequestCallback = async () => {
    if (!isAuthenticated) {
      showToast.info('Sign in to request a callback');
      window.location.href = `/login?from=/property/${property.id}`;
      return;
    }

    setRequestingCallback(true);
    try {
      // Create a lead — backend auto-assigns the dealer and notifies them.
      // The masked call itself is dealer-initiated (POST /communication/call is
      // dealer-only), so the buyer flow stops here: the dealer calls back.
      const leadRes = await leadsApi.create({
        propertyId: property.id,
        source: 'APP_SEARCH',
      });
      const lead = leadRes.data as { id: string; dealer?: { user?: { id: string } } };

      if (!lead?.id) {
        throw new Error('No dealer available to call you back right now.');
      }

      showToast.success(
        'Callback requested. A community dealer will call you shortly via a masked number.',
      );
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to request callback. Please try again.';
      showToast.error(msg);
    } finally {
      setRequestingCallback(false);
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-body-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronIcon size={14} direction="right" />
        <Link href={`/search?city=${property.society.city}`} className="hover:text-brand">
          {property.society.city}
        </Link>
        <ChevronIcon size={14} direction="right" />
        <Link href={`/society/${property.society.slug}`} className="hover:text-brand">
          {property.society.name}
        </Link>
        <ChevronIcon size={14} direction="right" />
        <span className="text-foreground">
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
              <h1 className="text-display-sm text-foreground">
                {property.bhk} BHK {property.type}
              </h1>
              <Badge variant={property.transactionType === 'SALE' ? 'success' : 'info'}>
                For {property.transactionType}
              </Badge>
            </div>
            <p className="mt-1 text-body-lg text-muted-foreground">
              {property.flatNumber}, {property.towerBlock} &middot;{' '}
              <Link
                href={`/society/${property.society.slug}`}
                className="text-brand hover:underline"
              >
                {property.society.name}
              </Link>
            </p>
            <p className="text-body-sm text-muted-foreground">
              {[property.society.address, property.society.city].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Property specs grid with icons */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-5 sm:grid-cols-4">
            {specItems(property).map((spec) => (
              <div key={spec.label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                  <spec.icon size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-caption-md text-muted-foreground">{spec.label}</p>
                  <p className="text-label-md text-foreground">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {property.amenities && (property.amenities as string[]).length > 0 && (
            <div>
              <h2 className="mb-4 text-heading-md text-foreground">Property Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.amenities as string[]).map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-body-sm text-foreground"
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
              <h2 className="mb-4 text-heading-md text-foreground">Society Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.society.amenities as string[]).map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-info-bg px-3 py-2 text-body-sm text-info-text"
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
          <div className="sticky top-[calc(theme(height.header)+1rem)] space-y-6 rounded-xl border border-border bg-card p-6 shadow-elevation-1">
            {/* Price */}
            <div className="space-y-2">
              {property.priceRent && (
                <div>
                  <p className="text-caption-md text-muted-foreground">Rent</p>
                  <p className="text-display-sm text-foreground">
                    {formatPrice(property.priceRent)}
                    <span className="text-body-lg text-muted-foreground">/mo</span>
                  </p>
                </div>
              )}
              {property.priceSale && (
                <div>
                  <p className="text-caption-md text-muted-foreground">Sale Price</p>
                  <p className="text-display-sm text-foreground">
                    {formatPrice(property.priceSale)}
                  </p>
                </div>
              )}
              {property.securityDeposit && (
                <div>
                  <p className="text-caption-md text-muted-foreground">Security Deposit</p>
                  <p className="text-heading-md text-foreground">
                    {formatPrice(property.securityDeposit)}
                  </p>
                </div>
              )}
            </div>

            {/* CTA buttons — role aware */}
            <div className="space-y-3">
              {canManage ? (
                <>
                  <Link href={`/dashboard/properties/${property.id}/edit`} className="block">
                    <Button className="w-full" size="lg" leftIcon={<SettingsIcon size={18} />}>
                      Edit listing
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={handleDelist}
                    isLoading={delisting}
                    disabled={delisting || property.status === 'DELISTED'}
                  >
                    {property.status === 'DELISTED' ? 'Delisted' : 'Delist'}
                  </Button>
                </>
              ) : (
                <>
                  {isBuyerFlow && (
                    <>
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
                        onClick={handleRequestCallback}
                        isLoading={requestingCallback}
                        disabled={requestingCallback}
                      >
                        Request Callback
                      </Button>
                    </>
                  )}
                  <Button
                    variant={shortlisted ? 'secondary' : 'ghost'}
                    className="w-full"
                    size="lg"
                    leftIcon={
                      <HeartIcon
                        size={18}
                        filled={shortlisted}
                        className={shortlisted ? 'text-error-icon' : ''}
                      />
                    }
                    onClick={toggleShortlist}
                  >
                    {shortlisted ? 'Shortlisted' : 'Shortlist'}
                  </Button>
                </>
              )}
            </div>

            {/* Dealer card */}
            {property.dealer?.user && (
              <div className="rounded-lg border border-border bg-muted p-4">
                <p className="mb-2 text-caption-md text-muted-foreground">Your Community Dealer</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-label-md font-semibold text-brand">
                    {property.dealer.user.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="text-label-md text-foreground">{property.dealer.user.name}</p>
                    <p className="text-caption-md text-muted-foreground">Verified Dealer</p>
                  </div>
                </div>
              </div>
            )}

            {/* Views */}
            <p className="text-center text-caption-md text-muted-foreground">
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
