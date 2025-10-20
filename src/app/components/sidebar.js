"use client";

import Link from "next/link";
import "./styles.css";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      <div className={`sb-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`} aria-label="App sidebar">
        {/* ปุ่ม back */}
        <button
          type="button"
          className="btn-back"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <img src="/back.png" alt="" className="iconback" />
        </button>

        {/* Brand */}
        <div className="brand">
          <img src="/Logo.png" alt="Budget Buddy logo" />
          <span>Budget Buddy</span>
        </div>

        {/* Nav */}
        <nav className="nav">
          <Link href="/Home" className="nav-item">
            <span className="nav-ic">💼</span>
            My Wallet
          </Link>

          <Link href="/Transaction" className="nav-item">
            <span className="nav-ic">🧾</span>
            Transaction
          </Link>

          <Link href="/dashboard" className="nav-item">
            <span className="nav-ic">📈</span>
            Graph
          </Link>
        </nav>

        {/* Logout rail (avatar + button) */}
        <div className="logout">
          <div className="logout-rail">
            <div className="user-pill" aria-hidden="true" title="Profile">
              {/* ถ้ามีรูปโปรไฟล์ให้ใช้ <img src="/me.jpg" /> แทนตัวอักษร */}
              <span>N</span>
            </div>

            <Link href="/Login" className="LOGIN-link" style={{ flex: 1 }}>
              <button className="logout-btn" type="button">
                Log Out <img className="icon" src="/logout.png" alt="logout" />
              </button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
