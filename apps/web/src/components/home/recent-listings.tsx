'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { searchApi } from '@/lib/api/search.api';
import { PropertyCard } from '@/components/search/property-card';
import { ArrowRightIcon } from '@/components/ui/icons';

export function RecentListings() {
  const [properties, setProperties] = useState<any[]>([]);
  const [error, setError] = useState(false);

  const fetchListings = async () => {
    setError(false);
    try {
      const { data } = await searchApi.searchProperties({ limit: 9 });
      setProperties(data.data || []);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  if (!error && properties.length === 0) return null;

  return (
    <section className="bg-muted py-16">
      <div className="mx-auto max-w-content px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-heading-xl text-foreground">Recent Listings</h2>
            <p className="mt-1 text-body-md text-muted-foreground">
              Newly listed properties across societies
            </p>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-1 text-label-md text-brand hover:text-brand-text md:flex"
          >
            View All <ArrowRightIcon size={16} />
          </Link>
        </div>

        {error ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-body-md text-muted-foreground">Failed to load recent listings.</p>
            <button
              onClick={fetchListings}
              className="mt-2 text-label-md text-brand hover:text-brand-text"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        <Link
          href="/search"
          className="mt-8 flex items-center justify-center gap-1 text-label-md text-brand hover:text-brand-text md:hidden"
        >
          View All Properties <ArrowRightIcon size={16} />
        </Link>
      </div>
    </section>
  );
}
