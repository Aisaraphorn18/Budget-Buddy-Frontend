"use client";

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
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem(THEME_KEY, mode);
};

/* ===== Helpers ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const toYM = (y, m1to12) => `${y}-${pad2(m1to12)}`;
const ymShort = (ym) => new Date(ym + "-01").toLocaleString("en-US", { month: "short" });
const last6Months = (endYM /* YYYY-MM */) => {
  const [y, m] = endYM.split("-").map(Number);
  const base = new Date(y, m - 1, 1);
  const arr = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    arr.push(toYM(d.getFullYear(), d.getMonth() + 1));
  }
  return arr;
};
const last6MonthsOptions = () => last6Months(new Date().toISOString().slice(0, 7));

const pickItems = (payload) => {
  const d = payload?.data ?? payload;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.transactions)) return d.transactions;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.items)) return d.data.items;
  if (Array.isArray(d?.data?.transactions)) return d.data.transactions;
  return [];
};

export default function Transactions() {
  // ----- UI -----
  const [dark, setDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((v) => !v);
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

  // ----- Filters -----
  const [monthISO, setMonthISO] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const monthOptions = useMemo(() => last6MonthsOptions(), []);

  // ----- Data -----
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

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

        // ส่งพารามิเตอร์ month เสมอ เพื่อขอข้อมูลของเดือนที่เลือก
        const txReq  = axios.get("http://localhost:4000/protected/api/v1/transactions", { ...auth, params: { month: monthISO } });
        const catReq = axios.get("http://localhost:4000/protected/api/v1/categories", auth);

        const [txRes, catRes] = await Promise.all([txReq, catReq]);

        // build category map
        const catList = pickItems(catRes);
        const catMap = {};
        for (const c of catList) {
          const id   = c.category_id ?? c.id ?? c._id ?? c.cid;
          const name = c.category_name ?? c.name ?? c.title ?? c.label ?? (id != null ? `Category ${id}` : "—");
          if (id != null) catMap[String(id)] = name;
        }

        // normalize transactions (รองรับหลาย payload shapes)
        const list = pickItems(txRes);
        const normalized = list.map((t) => {
          const isIncome = String(t.type).toLowerCase() === "income";
          const categoryName =
            t.category_name ??
            t.categoryName ??
            t.category?.name ??
            (t.category_id != null ? catMap[String(t.category_id)] : undefined) ??
            "—";
          const note = t.note ? ` / ${t.note}` : "";
          const amountNum = Number(t.amount || 0);

          return {
            category: `${categoryName}${note}`,
            date: formatDate(t.transaction_date ?? t.created_at ?? t.date ?? t.txn_date),
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
  }, [monthISO]);

  return (
    <div className="app transactions-page">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="main">
        <header className="page-head">
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="icon-btn">
            <img src="/hamburger.png" alt="menu" className="iconham" />
          </button>

          <h1 className="page-title">Recent Transactions</h1>

          {/* month filter (ย้อนหลัง 6 เดือน) */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <select
              className="input"
              value={monthISO}
              onChange={(e) => setMonthISO(e.target.value)}
              aria-label="Select month (last 6 months)"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {ymShort(m)} {m.slice(0,4)}
                </option>
              ))}
            </select>

            <label className="toggle">
              <input type="checkbox" checked={dark} onChange={(e) => onToggleTheme(e.target.checked)} />
              <span className="toggle-slider">{dark ? "🌙" : "☀️"}</span>
            </label>
          </div>
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
                      ? `฿${t.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `- ฿${Math.abs(t.amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const parts = d.toLocaleDateString("en-GB", opts).replace(/\s/g, " ").split(" ");
  return `${parts[0]} ${parts[1].replace(".", "")}, ${parts[2]}`;
}
