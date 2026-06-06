'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { propertiesApi } from '@/lib/api/properties.api';
import { PropertyCard } from '@/components/search/property-card';
import { HeartIcon } from '@/components/ui/icons';

// Buyer-facing "Saved" view. Shortlist is stored client-side in localStorage
// (rdn_shortlist) so it works before sign-up; here we resolve those ids to
// full property records and render them as cards.
export function SavedProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem('rdn_shortlist') || '[]');
    } catch {
      /* localStorage unavailable */
    }

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    Promise.allSettled(ids.map((id) => propertiesApi.getById(id)))
      .then((results) => {
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map((r) => r.value.data)
          .filter(Boolean);
        setProperties(loaded);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-heading-xl text-foreground">Saved Properties</h1>
        {!loading && properties.length > 0 && (
          <p className="mt-0.5 text-body-sm text-muted-foreground">
            {properties.length} saved {properties.length === 1 ? 'property' : 'properties'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-subtle">
            <HeartIcon size={28} className="text-brand" />
          </div>
          <h3 className="text-heading-md text-foreground">No saved properties yet</h3>
          <p className="mt-2 max-w-sm text-body-md text-muted-foreground">
            Tap the heart on any listing to save it here for later.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex items-center rounded-lg bg-brand px-4 py-2 text-label-md text-white transition-colors hover:bg-brand-hover"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
