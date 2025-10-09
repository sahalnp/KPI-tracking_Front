import dotenv from "dotenv"
dotenv.config()
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
