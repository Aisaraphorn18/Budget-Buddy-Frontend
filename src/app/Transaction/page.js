"use client";

<<<<<<< HEAD
import Sidebar from "@/app/components/sidebar";
import "./Tran.css";
import { useState } from "react";

export default function Transactions() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="transaction-content">
      {/* Sidebar บนสุด */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Topbar + ปุ่ม toggle */}
      <header className="fc-topbar">
        <div className="fc-title">
          <button onClick={toggleSidebar}>
            <img src="/hamburger.png" alt="icon-ham" className="transaction-iconham" />
          </button>
          <h1>Recent Transactions</h1>
          <p>ดูธุรกรรมล่าสุดของคุณ</p>
        </div>
      </header>

      {/* Main content */}
      <div className="transaction-section">
        <table>
          <thead>
            <tr>
              <th>Category/Note</th>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Suki Tei <br />
                <span className="text-gray-500">Foods and Groceries</span>
              </td>
              <td>03 Jan, 2022</td>
              <td className="expense">Expense</td>
              <td className="expense">-549.90</td>
            </tr>
            <tr>
              <td>
                KFC <br />
                <span className="text-gray-500">Foods and Groceries</span>
              </td>
              <td>01 Jan, 2022</td>
              <td className="expense">Expense</td>
              <td className="expense">-238.90</td>
            </tr>
            <tr>
              <td>
                Spotify <br />
                <span className="text-gray-500">Foods and Groceries</span>
              </td>
              <td>31 Dec, 2021</td>
              <td className="expense">Expense</td>
              <td className="expense">-283.90</td>
            </tr>
            <tr>
              <td>
                Mom give <br />
                <span className="text-gray-500">Gift</span>
              </td>
              <td>24 Dec, 2021</td>
              <td className="income">Income</td>
              <td className="income">237.90</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
=======
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "@/app/components/sidebar";
import "./styles.css";

/* ===== Theme utils (เหมือนหน้า Home) ===== */
const THEME_KEY = "theme";
const readTheme = () => {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "dark" || v === "light") return v;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
};
const applyTheme = (mode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark"); // ✅ toggle ที่ root
  localStorage.setItem(THEME_KEY, mode);
};

export default function Transactions() {
  // ----- UI -----
  const [dark, setDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((v) => !v);

  // ทำให้ธีมคงอยู่และอ่านเหมือนหน้า Home
  useLayoutEffect(() => {
    const mode = readTheme();
    applyTheme(mode);
    setDark(mode === "dark");
  }, []);
  const onToggleTheme = (checked) => {
    const mode = checked ? "dark" : "light";
    applyTheme(mode);
    setDark(checked);
  };

  // ----- Data -----
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const params = useMemo(() => ({}), []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const auth = {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };

        const txReq  = axios.get("http://localhost:4000/protected/api/v1/transactions", { ...auth, params });
        const catReq = axios.get("http://localhost:4000/protected/api/v1/categories", auth);

        const [txRes, catRes] = await Promise.all([txReq, catReq]);

        // build category map
        const catPayload = catRes?.data;
        const catList = Array.isArray(catPayload?.data)
          ? catPayload.data
          : Array.isArray(catPayload)
          ? catPayload
          : [];
        const catMap = {};
        for (const c of catList) {
          const id   = c.category_id ?? c.id ?? c._id ?? c.cid;
          const name = c.category_name ?? c.name ?? c.title ?? c.label ?? (id != null ? `Category ${id}` : "—");
          if (id != null) catMap[id] = name;
        }

        // normalize transactions
        const txPayload = txRes?.data;
        if (txPayload?.success === false) throw new Error(txPayload?.message || "Failed to fetch transactions");
        const list = Array.isArray(txPayload?.data) ? txPayload.data : [];

        const normalized = list.map((t) => {
          const isIncome = String(t.type).toLowerCase() === "income";
          const categoryName =
            t.category_name ??
            t.categoryName ??
            t.category?.name ??
            (t.category_id != null ? catMap[t.category_id] : undefined) ??
            "—";
          const note = t.note ? ` / ${t.note}` : "";
          const amountNum = Number(t.amount || 0);

          return {
            category: `${categoryName}${note}`,
            date: formatDate(t.created_at ?? t.date ?? t.txn_date),
            type: isIncome ? "Income" : "Expenses",
            amount: isIncome ? amountNum : -Math.abs(amountNum),
          };
        });

        setItems(normalized);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [params]);

  return (
    <div className="app transactions-page">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Main */}
      <main className="main">
        <header className="page-head">
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="icon-btn">
            <img src="/hamburger.png" alt="menu" className="iconham" />
          </button>

          <h1 className="page-title">Recent Transactions</h1>

          {/* dark mode switch — ใช้ตัวเดียวกับ Home */}
          <label className="toggle">
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => onToggleTheme(e.target.checked)}
            />
            <span className="toggle-slider">{dark ? "🌙" : "☀️"}</span>
          </label>
        </header>

        <div className="table-wrapper">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Category/Note</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="state">Loading...</td></tr>
              )}

              {!loading && error && (
                <tr><td colSpan={4} className="state error">{error}</td></tr>
              )}

              {!loading && !error && items.length === 0 && (
                <tr><td colSpan={4} className="state">No transactions</td></tr>
              )}

              {!loading && !error && items.map((t, i) => (
                <tr key={i}>
                  <td className="category" data-label="Category/Note">{t.category}</td>
                  <td data-label="Date">{t.date}</td>
                  <td data-label="Type">{t.type}</td>
                  <td data-label="Amount" className={t.amount > 0 ? "income" : "expense"}>
                    {t.amount > 0
                      ? `$${t.amount.toFixed(2)}`
                      : `- $${Math.abs(t.amount).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ---------- helpers ----------
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const parts = d.toLocaleDateString("en-GB", opts).replace(/\s/g, " ").split(" ");
  return `${parts[0]} ${parts[1].replace(".", "")}, ${parts[2]}`;
}
>>>>>>> efd6983574aa0e53b35bee29d8375298b83b911b
