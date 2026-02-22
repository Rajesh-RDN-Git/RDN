'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Check auth state from token
    setLoading(false);
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
