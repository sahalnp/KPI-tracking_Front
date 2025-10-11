// import axios from 'axios';

// export const axiosInstance = axios.create({
//   baseURL:"https://kpi-tracking-back.onrender.com/api",
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true, 
// });



import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL:"https://kpi-tracking-back.onrender.com/api",
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Add request interceptor to log what's being sent
axiosInstance.interceptors.request.use((config) => {
  console.log('Request URL:', config.url);
  console.log('Full URL:', config.baseURL + config.url);
  return config;
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Error URL:', error.config?.url);
    console.log('Error Full URL:', error.config?.baseURL + error.config?.url);
    return Promise.reject(error);
  }
);