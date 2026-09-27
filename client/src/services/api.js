import axios from 'axios';
const api = axios.create({ baseURL: '/api', timeout: 20000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('quickfix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const dataOf = response => response.data.data;
export const errorText = error => error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
export default api;
