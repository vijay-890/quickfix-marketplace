import axios from 'axios';
// Serve the React app from Render's static CDN so a sleeping API cannot block its first paint.
// Keep same-origin API calls as the default for local development and the all-in-one host.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const assetUrl = path => path?.startsWith('http') || !API_ORIGIN ? (path || '') : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
const api = axios.create({ baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api', timeout: 20000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('quickfix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const dataOf = response => response.data.data;
export const errorText = error => error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
export default api;
