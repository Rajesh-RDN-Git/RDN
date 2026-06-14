'use client';

import { useWizard } from '../wizard-context';

const RESTRICTIONS = [
  { key: 'vegetarianOnly', label: 'Vegetarian only' },
  { key: 'familyOnly', label: 'Family only' },
  { key: 'noPets', label: 'No pets' },
  { key: 'bachelorsAllowed', label: 'Bachelors allowed' },
];

type Props = {
  societyAmenities: string[];
};

export function AmenitiesStep({ societyAmenities }: Props) {
  const { state, dispatch } = useWizard();
  const selected = new Set(state.data.amenities);
  const restrictions = state.data.restrictions ?? {};

  const toggle = (a: string) => {
    const next = new Set(selected);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    dispatch({ type: 'SET_FIELD', field: 'amenities', value: Array.from(next) });
  };

  const setRestriction = (key: string, value: boolean) => {
    dispatch({
      type: 'SET_FIELD',
      field: 'restrictions',
      value: { ...restrictions, [key]: value },
    });
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
      <div>
        <h3 className="text-sm font-medium mb-3">Restrictions</h3>
        <div className="space-y-2">
          {RESTRICTIONS.map((r) => (
            <label key={r.key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                id={r.key}
                checked={!!restrictions[r.key]}
                onChange={(e) => setRestriction(r.key, e.target.checked)}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
