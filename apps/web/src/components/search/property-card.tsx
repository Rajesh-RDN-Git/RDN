'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeartIcon, BedIcon, AreaIcon, FloorIcon, BuildingIcon } from '../ui/icons';
import { Button } from '../ui/button';

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
    <Link href={`/property/${property.id}`} className="block">
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-elevation-2">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`${property.bhk} BHK in ${property.towerBlock}`}
              className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
              <BuildingIcon size={48} className="text-primary-300" />
            </div>
          )}
          {/* Gradient badge overlay */}
          <div className="absolute left-0 top-0 p-3">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold text-white ${
                property.transactionType === 'SALE'
                  ? 'bg-gradient-to-r from-green-600 to-green-500'
                  : property.transactionType === 'RENT'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500'
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
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
            aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <HeartIcon
              size={18}
              filled={shortlisted}
              className={shortlisted ? 'text-red-500' : 'text-gray-600'}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <p className="text-heading-lg text-gray-900">{price}</p>
          {rentSubtitle && <p className="text-body-sm text-gray-500">{rentSubtitle}</p>}

          {/* Property specs line */}
          <div className="mt-1.5 flex items-center gap-3 overflow-hidden text-body-md text-gray-600">
            <span className="flex shrink-0 items-center gap-1">
              <BedIcon size={15} className="text-gray-400" />
              {property.bhk} BHK
            </span>
            <span className="shrink-0 text-gray-300">|</span>
            <span className="flex shrink-0 items-center gap-1">
              <AreaIcon size={15} className="text-gray-400" />
              {property.carpetArea} sq.ft.
            </span>
            {property.floor != null && (
              <>
                <span className="shrink-0 text-gray-300">|</span>
                <span className="flex shrink-0 items-center gap-1">
                  <FloorIcon size={15} className="text-gray-400" />
                  Floor {property.floor}
                  {property.totalFloors ? `/${property.totalFloors}` : ''}
                </span>
              </>
            )}
          </div>

          {/* Society link */}
          <p className="mt-2 text-body-sm text-gray-500">{property.society.name}</p>

          {/* Dealer footer */}
          {property.dealer?.user && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">
                  {property.dealer.user.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <span className="text-body-sm text-gray-600">{property.dealer.user.name}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                Contact
              </Button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
