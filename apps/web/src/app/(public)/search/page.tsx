'use client';

import { Suspense } from 'react';
import { useSearch } from '@/hooks/use-search';
import { SearchFilters } from '@/components/search/search-filters';
import { PropertyCard } from '@/components/search/property-card';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

function SearchContent() {
  const { filters, results, total, loading, search, page, totalPages } = useSearch();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Search Properties</h1>
        {total > 0 && <p className="text-sm text-gray-500">{total} properties found</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <SearchFilters
            filters={filters as Record<string, string | undefined>}
            onChange={(newFilters) => search(newFilters as Record<string, string | undefined>)}
          />
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              title="No properties found"
              description="Try adjusting your filters or search in a different city."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((property) => (
                  <PropertyCard key={property.id} property={property as any} />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => search({ ...filters, page: String(p) })}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
