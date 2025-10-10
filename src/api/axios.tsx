import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL:"https://kpi-tracking-back.onrender.com/api",
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});
