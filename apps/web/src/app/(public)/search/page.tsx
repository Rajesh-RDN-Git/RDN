'use client';

import { Suspense, useState } from 'react';
import { useSearch } from '@/hooks/use-search';
import { SearchFilters } from '@/components/search/search-filters';
import { PropertyCard } from '@/components/search/property-card';
import { QuickFilters } from '@/components/search/quick-filters';
import { AppliedFilters } from '@/components/search/applied-filters';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { DropdownSelect } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { SearchIcon, FrownIcon, SlidersIcon } from '@/components/ui/icons';

function PageHeader({
  title,
  count,
  city,
  loading,
  sortValue,
  onSortChange,
}: {
  title: string;
  count: number;
  city?: string;
  loading: boolean;
  sortValue: string;
  onSortChange: (val: string) => void;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6 lg:px-8">
        <div>
          <h1 className="text-heading-xl text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? 'Searching…'
              : count > 0
                ? `${count.toLocaleString('en-IN')} ${count === 1 ? 'property' : 'properties'}${city ? ` in ${city}` : ''}`
                : `No matching properties${city ? ` in ${city}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
            Sort
          </span>
          <DropdownSelect
            value={sortValue}
            onChange={onSortChange}
            placeholder="Newest first"
            options={[
              { label: 'Newest first', value: '' },
              { label: 'Price: Low to High', value: 'price_asc' },
              { label: 'Price: High to Low', value: 'price_desc' },
              { label: 'Area: Largest first', value: 'area_desc' },
            ]}
            className="w-52"
          />
        </div>
      </div>
    </div>
  );
}

function SearchBar({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="relative"
      role="search"
    >
      <SearchIcon
        size={20}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // Debounced live search; the hook already debounces by 300ms.
          onSearch(e.target.value.trim());
        }}
        placeholder="Search by society, locality, flat, or tower…"
        aria-label="Search properties"
        className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 text-body-md text-foreground shadow-elevation-1 outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
      />
    </form>
  );
}

function ResultsEmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <FrownIcon size={28} />
      </div>
      <h3 className="text-heading-md text-foreground">No properties match your filters</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? 'Try widening your budget, removing a filter, or searching in a different city.'
          : 'No properties have been listed yet. Check back soon, or browse societies to see what is coming.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasFilters && (
          <Button variant="primary" onClick={onClear}>
            Clear all filters
          </Button>
        )}
        <Button variant="outline" leftIcon={<SearchIcon size={16} />} onClick={() => onClear()}>
          {hasFilters ? 'Browse all properties' : 'Try a search'}
        </Button>
      </div>
    </div>
  );
}

function ResultsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-error-border bg-error-bg/30 px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-error-bg text-error-icon">
        <svg
          className="h-7 w-7"
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
      <h3 className="text-heading-md text-foreground">Couldn&apos;t load properties</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} className="mt-6">
        Try again
      </Button>
    </div>
  );
}

function SearchContent() {
  const { filters, results, total, loading, error, search, debouncedSearch, page, totalPages } =
    useSearch();

  const title =
    filters.transactionType === 'SALE'
      ? 'Properties for Sale'
      : filters.transactionType === 'RENT'
        ? 'Properties for Rent'
        : 'Search Properties';

  const hasFilters = Object.entries(filters).some(([k, v]) => v && k !== 'page' && k !== 'sort');

  return (
    <div className="bg-background">
      <PageHeader
        title={title}
        count={total}
        city={filters.city}
        loading={loading}
        sortValue={filters.sort || ''}
        onSortChange={(val) => search({ ...filters, sort: val || undefined, page: undefined })}
      />

      <div className="mx-auto max-w-content px-4 py-6 lg:px-8">
        {/* Free-text search */}
        <div className="mb-6">
          <SearchBar
            initialValue={filters.q || ''}
            onSearch={(q) => debouncedSearch({ ...filters, q: q || undefined, page: undefined })}
          />
        </div>

        {/* Filter band: quick presets + applied chips */}
        <div className="mb-6 space-y-3">
          <QuickFilters
            filters={filters as Record<string, string | undefined>}
            onChange={(f) => search(f as Record<string, string | undefined>)}
          />
          <AppliedFilters
            filters={filters as Record<string, string | undefined>}
            onChange={(f) => search(f as Record<string, string | undefined>)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(theme(height.header)+1.5rem)] rounded-lg border border-border bg-card p-5 shadow-elevation-1">
              <SearchFilters
                filters={filters as Record<string, string | undefined>}
                onChange={(newFilters) => search(newFilters as Record<string, string | undefined>)}
              />
            </div>
          </aside>

          {/* Mobile filter trigger */}
          <div className="flex items-center justify-between lg:hidden">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SlidersIcon size={16} />}
              onClick={() => {
                const el = document.getElementById('mobile-filters');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Filters
            </Button>
            <span className="text-sm text-muted-foreground">
              {loading ? '…' : `${total.toLocaleString('en-IN')} results`}
            </span>
          </div>

          {/* Results */}
          <div className="min-w-0">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <ResultsErrorState
                message={error}
                onRetry={() => search(filters as Record<string, string | undefined>)}
              />
            ) : results.length === 0 ? (
              <ResultsEmptyState hasFilters={hasFilters} onClear={() => search({})} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((property) => (
                    <PropertyCard key={property.id} property={property as any} />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => search({ ...filters, page: String(p) })}
                  className="mt-10"
                />
              </>
            )}
          </div>

          {/* Mobile filters at the bottom */}
          <div id="mobile-filters" className="lg:hidden">
            <div className="rounded-lg border border-border bg-card p-5 shadow-elevation-1">
              <SearchFilters
                filters={filters as Record<string, string | undefined>}
                onChange={(newFilters) => search(newFilters as Record<string, string | undefined>)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
