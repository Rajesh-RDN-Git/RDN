'use client';

import { Chip } from '../ui/chip';

interface QuickFiltersProps {
  filters: Record<string, string | undefined>;
  onChange: (filters: Record<string, string | undefined>) => void;
}

const PRESETS = [
  { label: 'Affordable (50L-90L)', priceMin: '5000000', priceMax: '9000000' },
  { label: 'Mid-Range (90L-1.5Cr)', priceMin: '9000000', priceMax: '15000000' },
  { label: 'Premium (1.5Cr-3Cr)', priceMin: '15000000', priceMax: '30000000' },
  { label: 'Luxury (3Cr+)', priceMin: '30000000', priceMax: '' },
];

const TOGGLES = [
  { label: 'New Listings', key: 'sort', value: '' },
  { label: 'Verified Only', key: 'verified', value: 'true' },
];

export function QuickFilters({ filters, onChange }: QuickFiltersProps) {
  const isPresetActive = (preset: (typeof PRESETS)[0]) =>
    filters.priceMin === preset.priceMin &&
    (preset.priceMax ? filters.priceMax === preset.priceMax : !filters.priceMax);

  const togglePreset = (preset: (typeof PRESETS)[0]) => {
    if (isPresetActive(preset)) {
      onChange({ ...filters, priceMin: undefined, priceMax: undefined, page: undefined });
    } else {
      onChange({
        ...filters,
        priceMin: preset.priceMin,
        priceMax: preset.priceMax || undefined,
        page: undefined,
      });
    }
  };

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {PRESETS.map((preset) => (
        <Chip
          key={preset.label}
          label={preset.label}
          selected={isPresetActive(preset)}
          onToggle={() => togglePreset(preset)}
        />
      ))}
      <div className="mx-1 h-6 w-px flex-shrink-0 bg-gray-200" />
      {TOGGLES.map((toggle) => (
        <Chip
          key={toggle.label}
          label={toggle.label}
          selected={
            filters[toggle.key] === toggle.value || (toggle.key === 'sort' && !filters.sort)
          }
          onToggle={() => {
            if (toggle.key === 'verified') {
              onChange({
                ...filters,
                verified: filters.verified ? undefined : 'true',
                page: undefined,
              });
            }
          }}
        />
      ))}
    </div>
  );
}
