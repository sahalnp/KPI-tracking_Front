import axios from 'axios';
import dotenv from "dotenv"
dotenv.config()

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // required for cookies
});
