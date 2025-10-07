import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://10.63.194.166:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});