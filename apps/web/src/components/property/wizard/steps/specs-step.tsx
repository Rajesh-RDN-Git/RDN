'use client';

import { BHK_OPTIONS, ADDITIONAL_ROOMS, PROPERTY_VIEWS } from '@rdn/shared';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useWizard } from '../wizard-context';
import { RequiredMark, OptionalTag } from '../field-label';

/** Inline multi-select chip group used for rooms / views. */
function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-background text-foreground hover:border-primary'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function SpecsStep() {
  const { state, dispatch } = useWizard();
  const { data } = state;
  const showBhk = data.type === 'APARTMENT' || data.type === 'VILLA';

  const setNum =
    (field: 'carpetArea' | 'superArea' | 'floor' | 'totalFloors') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({
        type: 'SET_FIELD',
        field,
        value: e.target.value ? Number(e.target.value) : undefined,
      });

  const toggleInList = (field: 'additionalRooms' | 'propertyView', value: string) => {
    const current = (data[field] as string[]) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    dispatch({ type: 'SET_FIELD', field, value: next as never });
  };

  return (
    <div className="space-y-4">
      {showBhk && (
        <div>
          <label htmlFor="bhk" className="mb-1.5 block text-sm font-medium text-foreground">
            BHK
            <RequiredMark />
          </label>
          <Select
            id="bhk"
            value={data.bhk ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_FIELD',
                field: 'bhk',
                value: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">Select BHK</option>
            {BHK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="carpetArea" className="mb-1.5 block text-sm font-medium text-foreground">
            Carpet area (sqft)
            <RequiredMark />
          </label>
          <Input
            id="carpetArea"
            type="number"
            value={data.carpetArea ?? ''}
            onChange={setNum('carpetArea')}
          />
        </div>
        <div>
          <label htmlFor="superArea" className="mb-1.5 block text-sm font-medium text-foreground">
            Super area (sqft)
            <OptionalTag />
          </label>
          <Input
            id="superArea"
            type="number"
            value={data.superArea ?? ''}
            onChange={setNum('superArea')}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="floorLabel" className="mb-1.5 block text-sm font-medium text-foreground">
            Floor type
            <OptionalTag />
          </label>
          <Select
            id="floorLabel"
            value={data.floorLabel ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_FIELD',
                field: 'floorLabel',
                value: (e.target.value || undefined) as never,
              })
            }
          >
            <option value="">By number</option>
            <option value="GROUND">Ground Floor</option>
            <option value="TOP">Top Floor</option>
          </Select>
        </div>
        <div>
          <label htmlFor="floor" className="mb-1.5 block text-sm font-medium text-foreground">
            Floor no.
            <OptionalTag />
          </label>
          <Input
            id="floor"
            type="number"
            value={data.floor ?? ''}
            onChange={setNum('floor')}
            disabled={!!data.floorLabel}
          />
        </div>
        <div>
          <label htmlFor="totalFloors" className="mb-1.5 block text-sm font-medium text-foreground">
            Total floors
            <OptionalTag />
          </label>
          <Input
            id="totalFloors"
            type="number"
            value={data.totalFloors ?? ''}
            onChange={setNum('totalFloors')}
          />
        </div>
      </div>
      <div>
        <label htmlFor="facing" className="mb-1.5 block text-sm font-medium text-foreground">
          Facing
          <OptionalTag />
        </label>
        <Select
          id="facing"
          value={data.facing ?? ''}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'facing', value: e.target.value })}
        >
          <option value="">Select facing</option>
          <option value="N">North</option>
          <option value="S">South</option>
          <option value="E">East</option>
          <option value="W">West</option>
          <option value="NE">North-East</option>
          <option value="NW">North-West</option>
          <option value="SE">South-East</option>
          <option value="SW">South-West</option>
        </Select>
      </div>
      <div>
        <label htmlFor="furnishing" className="mb-1.5 block text-sm font-medium text-foreground">
          Furnishing
          <OptionalTag />
        </label>
        <Select
          id="furnishing"
          value={data.furnishing ?? ''}
          onChange={(e) =>
            dispatch({
              type: 'SET_FIELD',
              field: 'furnishing',
              value: e.target.value as never,
            })
          }
        >
          <option value="">Select furnishing</option>
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI">Semi-furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Additional rooms
          <OptionalTag />
        </label>
        <ChipMultiSelect
          options={ADDITIONAL_ROOMS}
          selected={data.additionalRooms ?? []}
          onToggle={(v) => toggleInList('additionalRooms', v)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          View
          <OptionalTag />
        </label>
        <ChipMultiSelect
          options={PROPERTY_VIEWS}
          selected={data.propertyView ?? []}
          onToggle={(v) => toggleInList('propertyView', v)}
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-foreground">
          Description
          <OptionalTag />
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          value={data.description ?? ''}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })
          }
          placeholder="Describe the property — highlights, neighbourhood, recent renovations…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}
