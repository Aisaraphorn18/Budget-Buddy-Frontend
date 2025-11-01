// lib/axiosClient.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000",
  withCredentials: true, // สำคัญ! ต้องส่ง cookie
});

console.log("API Base URL:", api.defaults.baseURL);

// ฟังก์ชันดึง CSRF Token
export const fetchCsrfToken = async () => {
  try {
    const response = await api.get("/api/v1/csrf-token");
    const { csrfToken } = response.data;
    
    if (csrfToken && typeof window !== "undefined") {
      localStorage.setItem("csrfToken", csrfToken);
    }
    
    return csrfToken;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
};

// Request interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // เพิ่ม JWT Token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // เพิ่ม CSRF Token สำหรับ POST, PUT, DELETE, PATCH
    const methodsRequiringCsrf = ["post", "put", "delete", "patch"];
    if (methodsRequiringCsrf.includes(config.method?.toLowerCase())) {
      const csrfToken = localStorage.getItem("csrfToken");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
  }
  return config;
});

export default api;
