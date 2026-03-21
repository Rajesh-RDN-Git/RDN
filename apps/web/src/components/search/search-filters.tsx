'use client';

import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface SearchFiltersProps {
  filters: Record<string, string | undefined>;
  onChange: (filters: Record<string, string | undefined>) => void;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const update = (key: string, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: undefined });
  };

  const reset = () => {
    onChange({});
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Filters</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
        <Select value={filters.city || ''} onChange={(e) => update('city', e.target.value)}>
          <option value="">All Cities</option>
          <option value="Gurugram">Gurugram</option>
          <option value="Noida">Noida</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Bangalore">Bangalore</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Transaction Type</label>
        <Select
          value={filters.transactionType || ''}
          onChange={(e) => update('transactionType', e.target.value)}
        >
          <option value="">All</option>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Property Type</label>
        <Select
          value={filters.propertyType || ''}
          onChange={(e) => update('propertyType', e.target.value)}
        >
          <option value="">All</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="COMMERCIAL">Commercial</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">BHK</label>
        <Select value={filters.bhk || ''} onChange={(e) => update('bhk', e.target.value)}>
          <option value="">Any</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4 BHK</option>
          <option value="5">5+ BHK</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Price Range</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => update('priceMin', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => update('priceMax', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Furnishing</label>
        <Select
          value={filters.furnishing || ''}
          onChange={(e) => update('furnishing', e.target.value)}
        >
          <option value="">Any</option>
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI">Semi-Furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Availability</label>
        <Select
          value={filters.availability || ''}
          onChange={(e) => update('availability', e.target.value)}
        >
          <option value="">Any</option>
          <option value="AVAILABLE_NOW">Available Now</option>
          <option value="AVAILABLE_FROM">Available Soon</option>
          <option value="UNDER_NOTICE">Under Notice</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Sort By</label>
        <Select value={filters.sort || ''} onChange={(e) => update('sort', e.target.value)}>
          <option value="">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="area_desc">Area: Largest First</option>
        </Select>
      </div>

      <Button variant="secondary" className="w-full" onClick={reset}>
        Clear Filters
      </Button>
    </div>
  );
}
