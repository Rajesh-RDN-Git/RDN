'use client';

import { useWizard } from '../wizard-context';

type Props = {
  societyAmenities: string[];
};

export function AmenitiesStep({ societyAmenities }: Props) {
  const { state, dispatch } = useWizard();
  const selected = new Set(state.data.amenities);

  const toggle = (a: string) => {
    const next = new Set(selected);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    dispatch({ type: 'SET_FIELD', field: 'amenities', value: Array.from(next) });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        All fields on this step are optional — add what applies.
      </p>
      <div>
        <h3 className="text-sm font-medium mb-3">Amenities (society-defined)</h3>
        <div className="flex flex-wrap gap-2">
          {societyAmenities.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggle(a)}
              aria-pressed={selected.has(a)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                selected.has(a)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
