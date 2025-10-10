import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL:"https://kpi-tracking-back.vercel.app/api",
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // required for cookies
});
