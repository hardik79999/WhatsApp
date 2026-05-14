import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // <-- Ise update kar diya
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const csrfToken = localStorage.getItem('csrf_access_token');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Response interceptor — 401 milne par tokens clear karo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('API interceptor: 401 error detected');
      // Don't automatically reload - let the component handle it
      // localStorage.clear();
      // window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
