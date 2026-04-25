import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
});

// Helper to manage tokens
export const tokenStorage = {
  getAccess: () => localStorage.getItem('zpl_access'),
  getRefresh: () => localStorage.getItem('zpl_refresh'),
  set: (access, refresh) => {
    if (access) localStorage.setItem('zpl_access', access);
    if (refresh) localStorage.setItem('zpl_refresh', refresh);
  },
  clear: () => {
    localStorage.removeItem('zpl_access');
    localStorage.removeItem('zpl_refresh');
  }
};

// Add token to headers
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let refreshing = null;

api.interceptors.response.use(
  (res) => {
    // If response contains tokens, save them
    if (res.data?.accessToken) {
      tokenStorage.set(res.data.accessToken, res.data.refreshToken);
    }
    return res;
  },
  async (error) => {
    const original = error.config;
    
    // Don't refresh on login/refresh calls or if already retried
    if (error.response?.status === 401 && !original._retry) {
      // Don't intercept login or refresh calls themselves
      const isAuthPath = original.url.includes('/auth/login') || original.url.includes('/auth/refresh');
      if (isAuthPath) return Promise.reject(error);

      original._retry = true;
      const refreshToken = tokenStorage.getRefresh();

      if (!refreshToken) {
        console.warn('[api] No refresh token found, logging out.');
        tokenStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        if (!refreshing) {
          console.log('[api] Token expired, attempting refresh...');
          refreshing = api.post('/auth/refresh', { refreshToken });
        }
        
        const { data } = await refreshing;
        refreshing = null;
        
        console.log('[api] Refresh successful.');
        // Use new token for the retry
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        console.error('[api] Refresh failed, logging out.', e);
        refreshing = null;
        tokenStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
