"use client";
 
import Sidebar from "@/app/components/sidebar";
import DashboardContent from "./DashboardContent";
//import "@/app/Home/home.css";   // ← layout + sidebar + ตัวแปรสี
import "./Report.css";     // ← สไตล์เฉพาะหน้ากราฟ
 
export default function Page() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <DashboardContent />
      </main>
    </div>
  );
}