'use client';

import { Suspense } from 'react';
import { useSearch } from '@/hooks/use-search';
import { SearchFilters } from '@/components/search/search-filters';
import { PropertyCard } from '@/components/search/property-card';
import { QuickFilters } from '@/components/search/quick-filters';
import { AppliedFilters } from '@/components/search/applied-filters';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { DropdownSelect } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';

function SearchContent() {
  const { filters, results, total, loading, error, search, page, totalPages } = useSearch();

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-xl text-gray-900">
            {filters.transactionType === 'SALE'
              ? 'Properties for Sale'
              : filters.transactionType === 'RENT'
                ? 'Properties for Rent'
                : 'Search Properties'}
          </h1>
          {total > 0 && (
            <p className="mt-0.5 text-body-sm text-gray-500">
              {total.toLocaleString('en-IN')} properties found
              {filters.city ? ` in ${filters.city}` : ''}
            </p>
          )}
        </div>
        <DropdownSelect
          value={filters.sort || ''}
          onChange={(val) => search({ ...filters, sort: val || undefined, page: undefined })}
          placeholder="Sort by"
          options={[
            { label: 'Newest First', value: '' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' },
            { label: 'Area: Largest First', value: 'area_desc' },
          ]}
          className="w-48"
        />
      </div>

      {/* Quick filters */}
      <div className="mb-3">
        <QuickFilters
          filters={filters as Record<string, string | undefined>}
          onChange={(f) => search(f as Record<string, string | undefined>)}
        />
      </div>

      {/* Applied filters */}
      <div className="mb-4">
        <AppliedFilters
          filters={filters as Record<string, string | undefined>}
          onChange={(f) => search(f as Record<string, string | undefined>)}
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(theme(height.header)+1rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <SearchFilters
              filters={filters as Record<string, string | undefined>}
              onChange={(newFilters) => search(newFilters as Record<string, string | undefined>)}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <svg
                  className="h-7 w-7 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-heading-md text-gray-900">Failed to load properties</h3>
              <p className="mt-2 max-w-sm text-body-md text-gray-500">{error}</p>
              <Button
                onClick={() => search(filters as Record<string, string | undefined>)}
                className="mt-6"
              >
                Try Again
              </Button>
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
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
