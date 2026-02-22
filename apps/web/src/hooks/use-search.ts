'use client';

import { useState } from 'react';

interface SearchFilters {
  city?: string;
  type?: string;
  bhk?: number;
  priceMin?: number;
  priceMax?: number;
}

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setLoading(true);
    // TODO: Call search API
    setLoading(false);
  };

  return { filters, results, loading, search };
}
