"use client";
<<<<<<< HEAD
 
import Link from "next/link";
import "./styles.css";
 
=======

import Link from "next/link";
import "./styles.css";

>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`sb-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      />
<<<<<<< HEAD
 
=======

>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* ปุ่ม back มุมขวาบน */}
        <button
          type="button"
          className="btn-back"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <img src="/back.png" alt="" className="iconback" />
        </button>
<<<<<<< HEAD
 
=======

>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
        <div className="brand">
          <img src="/Logo.png" alt="logo" />
          <span>Budget Buddy</span>
        </div>
<<<<<<< HEAD
 
=======

>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
        <nav className="nav">
          <Link href="/Home" className="nav-item">
            <span className="nav-ic">💼</span> My Wallet
          </Link>
<<<<<<< HEAD
 
          <Link href="/Transaction" className="nav-item">
            <span className="nav-ic">🧾</span> Transaction
          </Link>
 
          <Link href="/dashboard" className="nav-item">
            <span className="nav-ic">📈</span> Graph
          </Link>
         
        </nav>
 
=======

          <Link href="/Transaction" className="nav-item">
            <span className="nav-ic">🧾</span> Transaction
          </Link>

          <Link href="/dashboard" className="nav-item">
            <span className="nav-ic">📈</span> Graph
          </Link>
          
        </nav>

>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
        <div className="logout">
          <Link href="/Login" className="LOGIN-link">
            <button className="logout-btn">
              Log Out <img className="icon" src="/logout.png" alt="logout" />
            </button>
          </Link>
<<<<<<< HEAD
         
=======
          
>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
        </div>
      </div>
    </>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
