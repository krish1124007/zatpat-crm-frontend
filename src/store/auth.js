import { create } from 'zustand';
import { api, tokenStorage } from '../services/api.js';

export const useAuth = create((set) => ({
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,

  async bootstrap() {
    const access = tokenStorage.getAccess();
    if (!access || access === 'undefined' || access === 'null') {
      console.log('[auth] No valid access token found in storage.');
      set({ user: null, status: 'unauthenticated' });
      return;
    }

    set({ status: 'loading' });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, status: 'authenticated', error: null });
      console.log('[auth] Bootstrap successful:', data.user.email);
    } catch (err) {
      console.error('[auth] Bootstrap failed:', err.response?.data || err.message);
      // Only clear if it's a definitive auth failure, not a network error
      if (err.response?.status === 401) {
        tokenStorage.clear();
        set({ user: null, status: 'unauthenticated' });
      } else {
        // For other errors (like 500 or network), don't log out immediately
        set({ status: 'unauthenticated', error: 'Server connection failed' });
      }
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
