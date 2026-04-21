import { create } from 'zustand';
import { api, tokenStorage } from '../services/api.js';

export const useAuth = create((set) => ({
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,

  async bootstrap() {
    if (!tokenStorage.getAccess()) {
      set({ user: null, status: 'unauthenticated' });
      return;
    }

    set({ status: 'loading' });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, status: 'authenticated', error: null });
    } catch {
      tokenStorage.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  async login(identifier, password) {
    set({ status: 'loading', error: null });
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      // tokens are saved automatically by api.js interceptor
      set({ user: data.user, status: 'authenticated', error: null });
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ status: 'unauthenticated', error: msg });
      return false;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStorage.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
