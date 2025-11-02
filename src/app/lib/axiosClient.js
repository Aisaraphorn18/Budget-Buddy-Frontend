// lib/axiosClient.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000",
  withCredentials: true, // สำคัญ! ต้องส่ง cookie
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": "" // จะถูกตั้งค่าใน interceptor
  }
});

// console.log("API Base URL:", api.defaults.baseURL);

// ฟังก์ชันดึง CSRF Token
export const fetchCsrfToken = async () => {
  try {
    const response = await api.get("/api/v1/csrf-token");
    const { csrfToken } = response.data;

    // ลบ console.log เพื่อความปลอดภัย - ไม่แสดง token ใน console

    if (csrfToken && typeof window !== "undefined") {
      sessionStorage.setItem("csrfToken", csrfToken);
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
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // เพิ่ม CSRF Token สำหรับ POST, PUT, DELETE, PATCH
    const methodsRequiringCsrf = ["get", "post", "put", "delete", "patch"];
    if (methodsRequiringCsrf.includes(config.method?.toLowerCase())) {
      const csrfToken = sessionStorage.getItem("csrfToken");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
  }
  return config;
});

export default api;
