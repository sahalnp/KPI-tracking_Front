import axios from "axios";
import store from "../redux/store";
import { clearUser } from "../features/UserSlice";

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        store.dispatch(clearUser());
      } catch (_) {}
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);
