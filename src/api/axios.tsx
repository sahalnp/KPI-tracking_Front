// import dotenv from "dotenv"
// dotenv.config()
import axios from 'axios';

// Prefer env-driven base URL; default to relative "/api" so Vite proxy works in dev
// Using a defensive access pattern to avoid TS errors when Vite types are not included
const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) || {};
const baseURL = viteEnv.VITE_API_BASE_URL || '/api';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
