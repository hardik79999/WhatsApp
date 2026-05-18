// Created by: Master Fix Pass

import axios from 'axios';
import { showToast } from '../components/Toast';

function extractDetail(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.message || item.msg || String(item)).join(', ');
  }
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') return detail.message || JSON.stringify(detail);
  return error?.message || 'Request failed';
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const url = config.url || '';
  const isRefresh = url.includes('/auth/refresh');
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem(isRefresh ? 'csrf_refresh_token' : 'csrf_access_token');

  if (accessToken && !isRefresh) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isRefreshRequest = (originalRequest?.url || '').includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = apiClient.post('/auth/refresh');
        }
        const { data } = await refreshPromise;
        refreshPromise = null;

        if (data?.access_token) localStorage.setItem('access_token', data.access_token);
        if (data?.csrf_access_token) localStorage.setItem('csrf_access_token', data.csrf_access_token);
        if (data?.csrf_refresh_token) localStorage.setItem('csrf_refresh_token', data.csrf_refresh_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        localStorage.clear();
        sessionStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (status === 429) {
      showToast('Too many requests', 'warning');
    } else if (!error.response) {
      showToast('Server se connect nahi ho pa raha', 'error');
    }

    error.message = extractDetail(error);
    return Promise.reject(error);
  }
);

export default apiClient;
