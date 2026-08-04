import { create } from 'zustand';
import { authApi } from '@/features/auth/api/authApi';

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,

  login: async (credentials) => {
    set({ status: 'loading', error: null });
    try {
      const data = await authApi.login(credentials);
      set({ user: data.user, role: data.user_type, status: 'authenticated' });
      return data; // return the whole thing so LoginPage can use data.redirect
    } catch (err) {
      set({
        status: 'unauthenticated',
        error: err.response?.data?.message ?? 'Invalid email or password',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, role: null, status: 'unauthenticated' });
    }
  },

  fetchUser: async () => {
    set({ status: 'loading' });
    try {
      const data = await authApi.getCurrentUser();
      set({ user: data.user, role: data.user_type, status: 'authenticated' });
    } catch {
      set({ user: null, role: null, status: 'unauthenticated' });
    }
  },
}));