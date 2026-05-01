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
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-label-md text-foreground"
      >
        {title}
        <ChevronIcon size={16} direction={open ? 'up' : 'down'} className="text-muted-foreground" />
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

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== 'page' && k !== 'sort',
  ).length;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-heading-sm text-foreground">Filters</h2>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-foreground">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="-mr-2 h-8 px-2">
            Reset
          </Button>
        )}
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
                  ? 'border-brand bg-brand-subtle text-brand-text'
                  : 'border-border text-muted-foreground hover:border-border-strong'
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
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-foreground hover:bg-muted"
            >
              <input
                type="radio"
                name="furnishing"
                checked={(filters.furnishing || '') === opt.value}
                onChange={() => update('furnishing', opt.value)}
                className="h-4 w-4 border-border-strong text-brand focus:ring-ring"
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
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-foreground hover:bg-muted"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border-strong text-brand focus:ring-ring"
              />
              {amenity}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}
