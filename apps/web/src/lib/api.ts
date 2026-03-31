import axios from 'axios';
import { resolveRuntimeBaseUrl } from './runtime-base-url';

function getApiBaseUrl() {
  return resolveRuntimeBaseUrl(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3001');
}

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
