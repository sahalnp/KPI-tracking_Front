import axios from 'axios';

// Use env when provided; default to HTTPS API in production, Vite proxy in dev
const isProd = typeof import.meta !== 'undefined' && (import.meta as any)?.env?.PROD;
const envBase = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BASE_URL) as string | undefined;
const baseURL = envBase || (isProd ? 'https://kpi-tracking-back.onrender.com/api' : '/api');

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // required for cookies
});
