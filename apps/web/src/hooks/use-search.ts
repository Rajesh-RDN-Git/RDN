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
  // Tracks the param string we last fetched for, so the router.replace() that
  // search() itself performs doesn't re-trigger the URL-driven effect below.
  const lastParamsRef = useRef<string | null>(null);

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
      lastParamsRef.current = params.toString();
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

  // Fetch whenever the URL params change — on first mount AND on client-side
  // navigation (e.g. clicking Buy/Rent on the home page pushes /search?
  // transactionType=… without remounting this hook). The lastParamsRef guard
  // skips the echo from search()'s own router.replace so we don't double-fetch.
  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastParamsRef.current) return;
    lastParamsRef.current = current;
    search(getFiltersFromParams());
  }, [searchParams, search, getFiltersFromParams]);

  const filters = getFiltersFromParams();
  const page = Number(filters.page) || 1;
  const totalPages = Math.ceil(total / 20);

  return { filters, results, total, loading, error, search, debouncedSearch, page, totalPages };
}
