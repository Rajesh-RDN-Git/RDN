import Link from 'next/link';
import { Badge } from '../ui/badge';

interface PropertyCardProps {
  property: {
    id: string;
    flatNumber: string;
    towerBlock: string;
    type: string;
    transactionType: string;
    bhk: number;
    carpetArea: string;
    priceRent: string | null;
    priceSale: string | null;
    furnishing: string;
    availabilityStatus: string;
    viewsCount: number;
    society: { name: string; slug: string };
    media: Array<{ url: string }>;
  };
}

const formatPrice = (price: string | null, type: string) => {
  if (!price) return 'Price on request';
  const num = Number(price);
  if (type === 'SALE' || type === 'BOTH') {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
  }
  return `${num.toLocaleString('en-IN')}${type === 'RENT' ? '/mo' : ''}`;
};

const typeVariant = (type: string) => {
  switch (type) {
    case 'RENT':
      return 'info' as const;
    case 'SALE':
      return 'success' as const;
    default:
      return 'warning' as const;
  }
};

export function PropertyCard({ property }: PropertyCardProps) {
  const imageUrl = property.media?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image';
  const price =
    property.transactionType === 'SALE'
      ? formatPrice(property.priceSale, 'SALE')
      : formatPrice(property.priceRent, 'RENT');

  return (
    <Link href={`/property/${property.id}`} className="block">
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={`${property.bhk} BHK in ${property.towerBlock}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant={typeVariant(property.transactionType)}>
              {property.transactionType}
            </Badge>
            {property.furnishing && (
              <Badge variant="default">{property.furnishing.replace('_', '-')}</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-gray-900">{price}</p>
          <p className="mt-1 font-medium text-gray-700">
            {property.bhk} BHK {property.type.toLowerCase()} in {property.towerBlock}
          </p>
          <p className="mt-1 text-sm text-gray-500">{property.society.name}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>{property.carpetArea} sq.ft.</span>
            <span>
              {property.flatNumber}, {property.towerBlock}
            </span>
            <span>{property.viewsCount} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
