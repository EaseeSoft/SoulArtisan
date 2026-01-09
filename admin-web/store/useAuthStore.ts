import { create } from 'zustand';
import { AdminUser } from '../types';
import { getCurrentUser as fetchCurrentUser, logout as apiLogout } from '../api/auth';

interface AuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AdminUser | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
  isSystemAdmin: () => boolean;
  isSiteAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await fetchCurrentUser();
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  isSystemAdmin: () => {
    const { user } = get();
    return user?.role === 'SYSTEM_ADMIN';
  },

  isSiteAdmin: () => {
    const { user } = get();
    return user?.role === 'SITE_ADMIN';
  },
}));
