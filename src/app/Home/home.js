"use client";
import { useEffect, useState } from "react";
import "./home.css";

export default function Home() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [dark]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <img src="/Logo.png" alt="logo" />
          <span>Budget Buddy</span>
        </div>

        <nav className="nav">
          <a className="nav-item active">
            <span className="nav-ic">💼</span> My Wallet
          </a>
          <a className="nav-item">
            <span className="nav-ic">🧾</span> Transaction
          </a>
          <a className="nav-item">
            <span className="nav-ic">📈</span> Graph
          </a>
        </nav>

        <div className="logout">
          <button className="logout-btn">
            Log Out
            <img className="icon" src="/logout.png" alt="logout" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="page-head">
          <h1>Home</h1>
          <label className="toggle">
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => setDark(e.target.checked)}
            />
            <span className="toggle-slider">{dark ? "🌙" : "☀️"}</span>
          </label>
        </header>

        <p className="subtitle">
          สรุปภาพรวมรายรับ รายจ่าย และเป้าหมายการออมของคุณ
        </p>

        {/* Summary cards */}
        <section className="summary">
          <div className="card">
            <div className="sum-head">
              <img className="icon" src="/income.png" alt="income" />
              <span className="sum-title">Income</span>
            </div>
            <div className="sum-value">8,900 ฿</div>
          </div>

          <div className="card">
            <div className="sum-head">
              <img className="icon" src="/expeness.png" alt="expenses" />
              <span className="sum-title">Expenses</span>
            </div>
            <div className="sum-value">2,000 ฿</div>
          </div>

          <div className="card">
            <div className="sum-head">
              <img className="icon" src="/balance.png" alt="balance" />
              <span className="sum-title">Balance</span>
            </div>
            <div className="sum-value">6,900 ฿</div>
          </div>
        </section>

        {/* Budget header + actions (ปุ่มอยู่ขวา) */}
        <div className="budget-header">
          <h2 className="section-title">Budget</h2>
          <div className="actions">
            <button className="btn btn-green">+ add transaction</button>
            <button className="btn btn-red">+ create wallet</button>
          </div>
        </div>

        {/* Budget grid */}
        <section className="budget-grid">
          {[
            { name: "Travel with us", paid: "August 31, 2025", value: 300, max: 10000, pct: 30, ic: "💖" },
            { name: "Travel Plan", paid: "August 01, 2025", value: 1000, max: 20000, pct: 50, ic: "🧳" },
            { name: "Gift", paid: "August 01, 2025", value: 7000, max: 10000, pct: 30, ic: "🎁" },
            { name: "Netflix", paid: "August 25, 2025", value: 300, max: 1000, pct: 30, ic: "🅽" },
            { name: "Food", paid: "August 25, 2025", value: 300, max: 1000, pct: 30, ic: "🍽️" },
          ].map((b, i) => (
            <div className="budget-card" key={i}>
              <div className="budget-top">
                <div className="left">
                  <span className="badge">{b.ic}</span>
                  <div className="bname">{b.name}</div>
                  <div className="meta">Last Paid on {b.paid}</div>
                </div>
                <div className="right">
                  <img className="icon" src="/edit.png" alt="edit" />
                  <img className="icon" src="/bin.png" alt="delete" />
                </div>
              </div>

              <div className="bamount">
                ฿{b.value} <span className="muted">/ {b.max.toLocaleString()}</span>
                <span className="pct">{b.pct}%</span>
              </div>

              <div className="progress">
                <div className="bar" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
