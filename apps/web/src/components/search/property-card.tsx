'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeartIcon, BedIcon, AreaIcon, FloorIcon, BuildingIcon } from '../ui/icons';
import { Button } from '../ui/button';
import { formatBhk } from '@rdn/shared';

interface PropertyCardProps {
  property: {
    id: string;
    flatNumber: string;
    towerBlock: string;
    type: string;
    transactionType: string;
    bhk: number;
    carpetArea: string;
    floor?: number;
    floorLabel?: 'GROUND' | 'TOP' | null;
    totalFloors?: number;
    priceRent: string | null;
    priceSale: string | null;
    furnishing: string;
    availabilityStatus: string;
    viewsCount: number;
    society: { name: string; slug: string };
    media: Array<{ url: string }>;
    dealer?: { user?: { name: string; avatarUrl?: string } };
  };
}

const formatPrice = (price: string | null, type: string) => {
  if (!price) return 'Price on request';
  const num = Number(price);
  if (type === 'SALE' || type === 'BOTH') {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  }
  return `₹${num.toLocaleString('en-IN')}${type === 'RENT' ? '/mo' : ''}`;
};

export function PropertyCard({ property }: PropertyCardProps) {
  const [shortlisted, setShortlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageUrl = property.media?.[0]?.url || '';

  const price =
    property.transactionType === 'BOTH'
      ? formatPrice(property.priceSale, 'SALE')
      : property.transactionType === 'SALE'
        ? formatPrice(property.priceSale, 'SALE')
        : formatPrice(property.priceRent, 'RENT');

  const rentSubtitle =
    property.transactionType === 'BOTH' && property.priceRent
      ? `Rent: ${formatPrice(property.priceRent, 'RENT')}`
      : null;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rdn_shortlist') || '[]');
      setShortlisted(saved.includes(property.id));
    } catch {
      /* localStorage unavailable */
    }
  }, [property.id]);

  const toggleShortlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <Link href={`/property/${property.id}`} className="block h-full">
      <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-elevation-2">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-subtle">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`${property.bhk} BHK in ${property.towerBlock}`}
              className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-subtle to-brand-subtle">
              <BuildingIcon size={48} className="text-brand" />
            </div>
          )}
          {/* Gradient badge overlay */}
          <div className="absolute left-0 top-0 p-3">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold text-white ${
                property.transactionType === 'SALE'
                  ? 'bg-gradient-to-r from-success-icon to-success-icon'
                  : property.transactionType === 'RENT'
                    ? 'bg-gradient-to-r from-info-icon to-info-icon'
                    : 'bg-gradient-to-r from-warning-icon to-warning-icon'
              }`}
            >
              {property.transactionType === 'BOTH'
                ? 'Sale & Rent'
                : `For ${property.transactionType}`}
            </span>
          </div>
          {/* Heart icon */}
          <button
            onClick={toggleShortlist}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-elevation-1 transition-all hover:bg-muted hover:scale-110"
            aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <HeartIcon
              size={18}
              filled={shortlisted}
              className={shortlisted ? 'text-error-icon' : 'text-muted-foreground'}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          {/* Price */}
          <p className="text-heading-lg text-foreground">{price}</p>
          {rentSubtitle && <p className="text-body-sm text-muted-foreground">{rentSubtitle}</p>}

          {/* Property specs line */}
          <div className="mt-1.5 flex items-center gap-3 overflow-hidden text-body-md text-muted-foreground">
            <span className="flex shrink-0 items-center gap-1">
              <BedIcon size={15} className="text-muted-foreground" />
              {formatBhk(property.bhk) || `${property.bhk} BHK`}
            </span>
            <span className="shrink-0 text-muted-foreground">|</span>
            <span className="flex shrink-0 items-center gap-1">
              <AreaIcon size={15} className="text-muted-foreground" />
              {property.carpetArea} sq.ft.
            </span>
            {(property.floorLabel || property.floor != null) && (
              <>
                <span className="shrink-0 text-muted-foreground">|</span>
                <span className="flex shrink-0 items-center gap-1">
                  <FloorIcon size={15} className="text-muted-foreground" />
                  {property.floorLabel === 'GROUND'
                    ? 'Ground Floor'
                    : property.floorLabel === 'TOP'
                      ? 'Top Floor'
                      : `Floor ${property.floor}${property.totalFloors ? `/${property.totalFloors}` : ''}`}
                </span>
              </>
            )}
          </div>

          {/* Society link */}
          <p className="mt-2 text-body-sm text-muted-foreground">{property.society.name}</p>

          {/* Dealer footer — pinned to the bottom so cards in a row stay equal height */}
          {property.dealer?.user && (
            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand">
                  {property.dealer.user.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <span className="text-body-sm text-muted-foreground">
                  {property.dealer.user.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-brand hover:text-brand-text">
                Contact
              </Button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
