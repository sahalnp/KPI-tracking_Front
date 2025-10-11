import axios from "axios";

const baseURL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api" 
    : "https://kpi-tracking-back-6domk2bqt-muhammed-sahals-projects-e6fd404c.vercel.app/api";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});
