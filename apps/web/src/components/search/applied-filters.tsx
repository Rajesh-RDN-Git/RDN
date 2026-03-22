'use client';

import { Chip } from '../ui/chip';
import { Button } from '../ui/button';

interface AppliedFiltersProps {
  filters: Record<string, string | undefined>;
  onChange: (filters: Record<string, string | undefined>) => void;
}

const LABEL_MAP: Record<string, string> = {
  city: 'City',
  transactionType: 'Type',
  propertyType: 'Property',
  bhk: 'BHK',
  priceMin: 'Min Price',
  priceMax: 'Max Price',
  furnishing: 'Furnishing',
  availability: 'Availability',
  verified: 'Verified',
};

const FORMAT_VALUE: Record<string, (v: string) => string> = {
  transactionType: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
  propertyType: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
  bhk: (v) => `${v} BHK`,
  priceMin: (v) => {
    const n = Number(v);
    if (n >= 10000000) return `From ${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `From ${(n / 100000).toFixed(0)} L`;
    return `From ${n.toLocaleString('en-IN')}`;
  },
  priceMax: (v) => {
    const n = Number(v);
    if (n >= 10000000) return `To ${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `To ${(n / 100000).toFixed(0)} L`;
    return `To ${n.toLocaleString('en-IN')}`;
  },
  furnishing: (v) => v.replace('_', '-'),
  availability: (v) => v.replace(/_/g, ' '),
};

const IGNORED_KEYS = new Set(['page', 'sort']);

export function AppliedFilters({ filters, onChange }: AppliedFiltersProps) {
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value && !IGNORED_KEYS.has(key),
  );

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string) => {
    onChange({ ...filters, [key]: undefined, page: undefined });
  };

  const clearAll = () => {
    onChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map(([key, value]) => {
        const label = LABEL_MAP[key] || key;
        const formatted = FORMAT_VALUE[key]?.(value!) || value;
        return (
          <Chip key={key} label={`${label}: ${formatted}`} onRemove={() => removeFilter(key)} />
        );
      })}
      <Button variant="ghost" size="sm" onClick={clearAll} className="text-gray-500">
        Clear All
      </Button>
    </div>
  );
}
