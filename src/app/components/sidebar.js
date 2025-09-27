"use client";
 
import Link from "next/link";
import "./styles.css";
 
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`sb-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      />
 
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
 
        <div className="brand">
          <img src="/Logo.png" alt="logo" />
          <span>Budget Buddy</span>
        </div>
 
        <nav className="nav">
          <Link href="/Home" className="nav-item">
            <span className="nav-ic">💼</span> My Wallet
          </Link>
 
          <Link href="/Transaction" className="nav-item">
            <span className="nav-ic">🧾</span> Transaction
          </Link>
 
          <Link href="/dashboard" className="nav-item">
            <span className="nav-ic">📈</span> Graph
          </Link>
         
        </nav>
 
        <div className="logout">
          <Link href="/Login" className="LOGIN-link">
            <button className="logout-btn">
              Log Out <img className="icon" src="/logout.png" alt="logout" />
            </button>
          </Link>
         
        </div>
      </div>
    </>
  );
}