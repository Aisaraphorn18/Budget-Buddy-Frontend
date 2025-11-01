"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/app/components/sidebar";
import "./styles.css";
import api from "@/app/lib/axiosClient";
/* ===== Theme utils ===== */
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

// รองรับ payload หลายแบบ
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

// สำหรับเรียงใหม่→เก่า
const toTime = (v) => {
  if (!v) return 0;
  const d = new Date(v);
  return isNaN(d) ? 0 : d.getTime();
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

  // ----- Data (ALL months) -----
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const makeAuth = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  // ดึงประวัติทั้งหมดครั้งเดียว (ไม่มีการกรองเดือน)
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const txReq  = api.get("/protected/api/v1/transactions", makeAuth());
        const catReq = api.get("/protected/api/v1/categories", makeAuth());
        const [txRes, catRes] = await Promise.all([txReq, catReq]);

        // category map
        const catList = pickItems(catRes);
        const catMap = {};
        for (const c of catList) {
          const id   = c.category_id ?? c.id ?? c._id ?? c.cid;
          const name =
            c.category_name ??
            c.name ??
            c.title ??
            c.label ??
            (id != null ? `Category ${id}` : "—");
          if (id != null) catMap[String(id)] = name;
        }

        // normalize + sort ใหม่→เก่า
        const list = pickItems(txRes);
        const normalized = list
          .map((t) => {
            const rawDate =
              t.transaction_date ?? t.created_at ?? t.date ?? t.txn_date ?? null;
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
              date: formatDate(rawDate),
              dateRaw: rawDate,              // เก็บไว้เรียง
              type: isIncome ? "Income" : "Expenses",
              amount: isIncome ? amountNum : -Math.abs(amountNum),
            };
          })
          .sort((a, b) => toTime(b.dateRaw) - toTime(a.dateRaw)); // ใหม่→เก่า

        setItems(normalized);
      } catch (e) {
        setError(e?.message || "Unknown error");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="app transactions-page">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="main">
        <header className="page-head">
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="icon-btn">
            <img src="/hamburger.png" alt="menu" className="iconham" />
          </button>

          <h1 className="page-title">Recent Transactions</h1>

          {/* เอา select เดือนออกแล้ว เหลือเพียงปุ่มธีม */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <label className="toggle">
              <input
                type="checkbox"
                checked={dark}
                onChange={(e) => onToggleTheme(e.target.checked)}
              />
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
