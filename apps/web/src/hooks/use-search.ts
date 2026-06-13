'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { searchApi } from '../lib/api/search.api';
import { useSearchParams, useRouter } from 'next/navigation';

interface SearchFilters {
  q?: string;
  city?: string;
  transactionType?: string;
  propertyType?: string;
  bhk?: string;
  priceMin?: string;
  priceMax?: string;
  furnishing?: string;
  availability?: string;
  sort?: string;
  page?: string;
}

interface PropertyResult {
  id: string;
  flatNumber: string;
  towerBlock: string;
  type: string;
  transactionType: string;
  bhk: number;
  carpetArea: string;
  priceRent: string | null;
  priceSale: string | null;
  furnishing: string;
  availabilityStatus: string;
  viewsCount: number;
  society: { id: string; name: string; slug: string };
  media: Array<{ url: string; type: string }>;
}

export function useSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const getFiltersFromParams = useCallback((): SearchFilters => {
    const filters: SearchFilters = {};
    for (const [key, value] of searchParams.entries()) {
      (filters as Record<string, string>)[key] = value;
    }
    return filters;
  }, [searchParams]);

  const search = useCallback(
    async (newFilters: SearchFilters) => {
      // Update URL params
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(newFilters)) {
        if (value) params.set(key, value);
      }
      router.replace(`/search?${params.toString()}`, { scroll: false });

      setLoading(true);
      setError(null);
      try {
        const { data } = await searchApi.searchProperties(newFilters as Record<string, unknown>);
        setResults(data.data || []);
        setTotal(data.pagination?.total ?? data.total ?? 0);
      } catch (err: any) {
        setResults([]);
        setTotal(0);
        const message =
          err?.response?.data?.message ||
          (err?.code === 'ERR_NETWORK'
            ? 'Network error. Please check your connection and try again.'
            : 'Failed to load properties. Please try again.');
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const debouncedSearch = useCallback(
    (filters: SearchFilters) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(filters), 300);
    },
    [search],
  );

  // Load initial search on mount. Run even with no filters so a bare /search
  // shows all listings instead of an empty "no properties" state.
  useEffect(() => {
    search(getFiltersFromParams());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = getFiltersFromParams();
  const page = Number(filters.page) || 1;
  const totalPages = Math.ceil(total / 20);

  return { filters, results, total, loading, error, search, debouncedSearch, page, totalPages };
}
