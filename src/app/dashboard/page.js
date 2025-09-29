<<<<<<< HEAD

"use client";

import Sidebar from "@/app/components/sidebar";
import DashboardContent from "./DashboardContent";
//import "@/app/Home/home.css";   // ← layout + sidebar + ตัวแปรสี
import "./Report.css";     // ← สไตล์เฉพาะหน้ากราฟ
=======
"use client";

import DashboardContent from "./DashboardContent";

>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b

export default function Page() {
  return (
    <div className="app">
<<<<<<< HEAD
      <Sidebar />
      <main className="main">
        <DashboardContent />
      </main>
=======
      
        <DashboardContent />
      
>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
    </div>
  );
}
