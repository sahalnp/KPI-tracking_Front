import axios from "axios";

const baseURL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api" 
    : "https://kpi-tracking-back.vercel.app/api";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});
