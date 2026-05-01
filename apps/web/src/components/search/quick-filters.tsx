'use client';

import { Chip } from '../ui/chip';

interface QuickFiltersProps {
  filters: Record<string, string | undefined>;
  onChange: (filters: Record<string, string | undefined>) => void;
}

const PRESETS = [
  { label: 'Affordable', sub: '50L–90L', priceMin: '5000000', priceMax: '9000000' },
  { label: 'Mid-Range', sub: '90L–1.5Cr', priceMin: '9000000', priceMax: '15000000' },
  { label: 'Premium', sub: '1.5Cr–3Cr', priceMin: '15000000', priceMax: '30000000' },
  { label: 'Luxury', sub: '3Cr+', priceMin: '30000000', priceMax: '' },
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

  const verifiedActive = filters.verified === 'true';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Budget
      </span>
      {PRESETS.map((preset) => (
        <Chip
          key={preset.label}
          label={`${preset.label} · ${preset.sub}`}
          selected={isPresetActive(preset)}
          onToggle={() => togglePreset(preset)}
        />
      ))}
      <div className="mx-2 h-5 w-px flex-shrink-0 bg-border" aria-hidden="true" />
      <Chip
        label="Verified only"
        selected={verifiedActive}
        onToggle={() =>
          onChange({
            ...filters,
            verified: verifiedActive ? undefined : 'true',
            page: undefined,
          })
        }
      />
    </div>
  );
}
