// lib/axiosClient.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://budget-buddy-backend-production.up.railway.app",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
