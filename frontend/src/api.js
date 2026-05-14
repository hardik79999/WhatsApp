import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // <-- Ise update kar diya
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const url = config.url || '';
  const isRefresh = url.includes('/auth/refresh');
  const csrfToken = localStorage.getItem(isRefresh ? 'csrf_refresh_token' : 'csrf_access_token');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

let refreshPromise = null;

// Response interceptor — 401 → refresh + retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Don't retry refresh endpoint itself
    const isRefreshRequest = (originalRequest?.url || '').includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh');
        }
        const { data } = await refreshPromise;
        refreshPromise = null;

        if (data?.csrf_access_token)  localStorage.setItem('csrf_access_token',  data.csrf_access_token);
        if (data?.csrf_refresh_token) localStorage.setItem('csrf_refresh_token', data.csrf_refresh_token);

        return api(originalRequest);
      } catch (refreshErr) {
        console.warn('Token refresh failed:', refreshErr);
        refreshPromise = null;
        // Tokens no longer valid
        localStorage.removeItem('csrf_access_token');
        localStorage.removeItem('csrf_refresh_token');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
