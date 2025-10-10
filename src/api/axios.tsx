// import dotenv from "dotenv"
// dotenv.config()
import axios from 'axios';

// Prefer env-driven base URL. In dev, default to '/api' to work with Vite proxy.
const baseURL = (import.meta as any).env?.VITE_API_URL
  || (import.meta as any).env?.DEV ? '/api' : 'https://kpi-tracking-back.onrender.com/api';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
