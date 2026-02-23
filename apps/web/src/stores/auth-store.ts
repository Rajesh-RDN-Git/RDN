import { create } from 'zustand';
import type { IUser } from '@rdn/shared';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: IUser) => void;
  logout: () => void;
  setUser: (user: IUser) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
