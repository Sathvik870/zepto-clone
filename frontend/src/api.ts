import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    let token: string | null = null;

    if (config.url?.includes("/api/admin")) {
      token = localStorage.getItem("adminAuthToken");
    }
    
    else if (config.url?.includes("/api/customer")) {
      token = localStorage.getItem("customerAuthToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
