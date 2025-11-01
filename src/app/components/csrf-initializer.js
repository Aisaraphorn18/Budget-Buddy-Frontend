"use client";

import { useEffect } from "react";
import { fetchCsrfToken } from "../lib/axiosClient";

export default function CsrfInitializer() {
  useEffect(() => {
    // ดึง CSRF Token ตอนเริ่ม app
    const initCsrf = async () => {
      await fetchCsrfToken();
    };

    initCsrf();
  }, []);

  return null; // Component นี้ไม่แสดงอะไร
}
