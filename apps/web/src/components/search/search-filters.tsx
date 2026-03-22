'use client';

import { useState } from 'react';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { RangeSlider } from '../ui/range-slider';
import { ChevronIcon } from '../ui/icons';

interface SearchFiltersProps {
  filters: Record<string, string | undefined>;
  onChange: (filters: Record<string, string | undefined>) => void;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-label-md text-gray-900"
      >
        {title}
        <ChevronIcon size={16} direction={open ? 'up' : 'down'} className="text-gray-400" />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

const AMENITY_OPTIONS = [
  'Swimming Pool',
  'Gym',
  'Clubhouse',
  'Park',
  'Playground',
  'Security',
  'Power Backup',
  'Parking',
  'Lift',
  'Tennis Court',
];

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const update = (key: string, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: undefined });
  };

  const reset = () => {
    onChange({});
  };

  const priceMin = Number(filters.priceMin || 0);
  const priceMax = Number(filters.priceMax || 50000000);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-sm text-gray-900">Filters</h2>
        <Button variant="ghost" size="sm" onClick={reset} className="text-body-sm text-gray-500">
          Reset
        </Button>
      </div>

      <FilterSection title="Location">
        <Select value={filters.city || ''} onChange={(e) => update('city', e.target.value)}>
          <option value="">All Cities</option>
          <option value="Gurugram">Gurugram</option>
          <option value="Noida">Noida</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Bangalore">Bangalore</option>
        </Select>
      </FilterSection>

      <FilterSection title="Transaction Type">
        <Select
          value={filters.transactionType || ''}
          onChange={(e) => update('transactionType', e.target.value)}
        >
          <option value="">All</option>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
          <option value="BOTH">Both</option>
        </Select>
      </FilterSection>

      <FilterSection title="Property Type">
        <Select
          value={filters.propertyType || ''}
          onChange={(e) => update('propertyType', e.target.value)}
        >
          <option value="">All</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="COMMERCIAL">Commercial</option>
        </Select>
      </FilterSection>

      <FilterSection title="BHK">
        <div className="flex flex-wrap gap-2">
          {['', '1', '2', '3', '4', '5'].map((val) => (
            <button
              key={val}
              onClick={() => update('bhk', val)}
              className={`rounded-lg border px-3 py-1.5 text-body-sm transition-colors ${
                (filters.bhk || '') === val
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {val ? `${val} BHK` : 'Any'}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget">
        <RangeSlider
          min={0}
          max={50000000}
          step={500000}
          value={[priceMin, priceMax]}
          onChange={([min, max]) => {
            onChange({
              ...filters,
              priceMin: min > 0 ? String(min) : undefined,
              priceMax: max < 50000000 ? String(max) : undefined,
              page: undefined,
            });
          }}
        />
      </FilterSection>

      <FilterSection title="Furnishing">
        <div className="space-y-2">
          {[
            { value: '', label: 'Any' },
            { value: 'FURNISHED', label: 'Furnished' },
            { value: 'SEMI', label: 'Semi-Furnished' },
            { value: 'UNFURNISHED', label: 'Unfurnished' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="radio"
                name="furnishing"
                checked={(filters.furnishing || '') === opt.value}
                onChange={() => update('furnishing', opt.value)}
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability" defaultOpen={false}>
        <Select
          value={filters.availability || ''}
          onChange={(e) => update('availability', e.target.value)}
        >
          <option value="">Any</option>
          <option value="AVAILABLE_NOW">Available Now</option>
          <option value="AVAILABLE_FROM">Available Soon</option>
          <option value="UNDER_NOTICE">Under Notice</option>
        </Select>
      </FilterSection>

      <FilterSection title="Amenities" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-1">
          {AMENITY_OPTIONS.map((amenity) => (
            <label
              key={amenity}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              {amenity}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}
