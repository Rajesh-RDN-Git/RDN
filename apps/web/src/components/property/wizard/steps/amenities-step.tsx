'use client';

import { AMENITY_CATEGORIES, ALL_AMENITIES, FURNISHING_ITEMS } from '@rdn/shared';
import { useWizard } from '../wizard-context';

type Props = {
  societyAmenities: string[];
};

export function AmenitiesStep({ societyAmenities }: Props) {
  const { state, dispatch } = useWizard();
  const selected = new Set(state.data.amenities);
  const furnishing = state.data.furnishingDetails ?? {};

  const toggle = (a: string) => {
    const next = new Set(selected);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    dispatch({ type: 'SET_FIELD', field: 'amenities', value: Array.from(next) });
  };

  const setCount = (item: string, count: number) => {
    const next = { ...furnishing };
    if (count <= 0) delete next[item];
    else next[item] = count;
    dispatch({ type: 'SET_FIELD', field: 'furnishingDetails', value: next as never });
  };

  // Society-specific amenities that aren't already in the standard catalog.
  const societyExtras = societyAmenities.filter((a) => !ALL_AMENITIES.includes(a));

  const categories = [
    ...AMENITY_CATEGORIES,
    ...(societyExtras.length ? [{ category: 'Society-specific', items: societyExtras }] : []),
  ];

  const chip = (a: string) => (
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
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        All fields on this step are optional — add what applies.
      </p>

      {categories.map((cat) => (
        <div key={cat.category}>
          <h3 className="text-sm font-medium mb-3">{cat.category}</h3>
          <div className="flex flex-wrap gap-2">{cat.items.map(chip)}</div>
        </div>
      ))}

      <div>
        <h3 className="text-sm font-medium mb-1">Furnishing details</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Set how many of each item the property includes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FURNISHING_ITEMS.map((item) => {
            const count = furnishing[item] ?? 0;
            return (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
              >
                <span className="text-sm text-foreground">{item}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease ${item}`}
                    onClick={() => setCount(item, count - 1)}
                    disabled={count <= 0}
                    className="h-7 w-7 rounded border border-border text-foreground disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">{count}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item}`}
                    onClick={() => setCount(item, count + 1)}
                    className="h-7 w-7 rounded border border-border text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
