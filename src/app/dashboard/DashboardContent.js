"use client";

import "./Report.css";
import Sidebar from "@/app/components/sidebar";
import { useMemo, useState, useEffect, useLayoutEffect } from "react";
import api from "@/app/lib/axiosClient";

/** สีสำหรับโดนัท */
const COLOR_POOL = [
  "#6E47E8","#10B981","#F59E0B","#EF4444","#06B6D4","#A78BFA",
  "#F97316","#22C55E","#3B82F6","#E11D48","#14B8A6","#8B5CF6",
  "#84CC16","#F43F5E","#38BDF8","#C084FC","#D946EF","#FACC15",
  "#34D399","#60A5FA","#FB7185","#2DD4BF","#4ADE80","#FBBF24"
];

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

/* ---------- helpers ---------- */
const asArray = (x) =>
  (Array.isArray(x?.data) && x.data) ||
  (Array.isArray(x?.items) && x.items) ||
  (Array.isArray(x) && x) ||
  [];

const pad2 = (n) => String(n).padStart(2, "0");
const ymShort = (ymStr) => new Date(ymStr + "-01").toLocaleString("en-US", { month: "short" });
const toYM = (y, m1to12) => `${y}-${pad2(m1to12)}`;

const monthRange = (monthISO) => {
  const [yy, mm] = monthISO.split("-").map(Number);
  const lastDay = new Date(yy, mm, 0).getDate();
  return { start_date: `${monthISO}-01`, end_date: `${monthISO}-${pad2(lastDay)}` };
};

const last6MonthsFrom = (monthISO) => {
  const [y, m] = monthISO.split("-").map(Number);
  const base = new Date(y, m - 1, 1);
  const arr = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    arr.push(toYM(d.getFullYear(), d.getMonth() + 1));
  }
  return arr;
};

const last6MonthsOptions = () => {
  const nowYM = new Date().toISOString().slice(0, 7);
  return last6MonthsFrom(nowYM);
};

const baht = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const parts = d.toLocaleDateString("en-GB", opts).replace(/\s/g, " ").split(" ");
  return `${parts[0]} ${parts[1].replace(".", "")}, ${parts[2]}`;
};

/* ===== ดึงเซ็ตหมวดที่มี Budget ===== */
async function fetchBudgetCatIds() {
  const budRes = await api.get("/protected/api/v1/budgets");
  const budgets =
    (Array.isArray(budRes?.data?.data) && budRes.data.data) ||
    (Array.isArray(budRes?.data?.items) && budRes.data.items) ||
    (Array.isArray(budRes?.data?.budgets) && budRes.data.budgets) ||
    (Array.isArray(budRes?.data) && budRes.data) ||
    [];
  return new Set(
    budgets
      .map((b) => b.category_id ?? b.id ?? b.category?.id)
      .filter((x) => x != null)
      .map((x) => String(x))
  );
}

/* ===== รวมยอดโดนัท “เฉพาะหมวดที่มี Budget” ===== */
async function buildDonutForDateRange(start_date, end_date) {
  const budgetCatIds = await fetchBudgetCatIds();

  const LIMIT = 100;
  let page = 1;
  let allTx = [];

  while (true) {
    const txRes = await api.get("/protected/api/v1/transactions", {
      params: { start_date, end_date, limit: String(LIMIT), page: String(page) },
    });

    const payload = txRes?.data || {};
    const list =
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.items) && payload.items) ||
      (Array.isArray(payload) && payload) ||
      [];

    allTx = allTx.concat(list);

    const pag = payload?.pagination || {};
    const total = pag.total ?? allTx.length;
    const limit = pag.limit ?? LIMIT;
    const curPage = pag.page ?? page;
    const totalPages = pag.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : curPage);

    if (totalPages && curPage >= totalPages) break;
    if (list.length < LIMIT) break;

    page += 1;
    if (page > 50) break;
  }

  // แผนที่ id -> name
  const catRes = await api.get("/protected/api/v1/categories");
  const cats =
    (Array.isArray(catRes?.data?.data) && catRes.data.data) ||
    (Array.isArray(catRes?.data?.items) && catRes.data.items) ||
    (Array.isArray(catRes?.data) && catRes.data) ||
    [];
  const catNameById = {};
  for (const c of cats) {
    const id = c.category_id ?? c.id ?? c._id;
    const name = c.category_name ?? c.name ?? `Category ${id ?? ""}`;
    if (id != null) catNameById[String(id)] = name;
  }

  // รวมเฉพาะ expense ที่อยู่ในงบ
  const sumByCat = new Map();
  for (const t of allTx) {
    if (String(t.type ?? "").toLowerCase() !== "expense") continue;

    const rawId = t.category_id ?? t.categoryId ?? t.category?.id;
    if (rawId == null) continue;
    const key = String(rawId);
    if (!budgetCatIds.has(key)) continue;

    const amtRaw = t.amount;
    const amt =
      typeof amtRaw === "number"
        ? amtRaw
        : parseFloat(String(amtRaw ?? "0").replace(/,/g, "").trim()) || 0;
    if (amt <= 0) continue;

    sumByCat.set(key, (sumByCat.get(key) || 0) + amt);
  }

  const entries = Array.from(sumByCat.entries()).sort((a, b) => b[1] - a[1]);
  return entries.map(([id, amount], i) => ({
    key: catNameById[id] || `Category ${id}`,
    category_id: Number(id),
    amount,
    color: COLOR_POOL[i % COLOR_POOL.length],
  }));
}

/* ===== รวมยอดรายรับ/รายจ่ายของ “เดือนเดียว” โดยให้รายจ่ายอิง Budget ===== */
async function computeMonthIEWithBudget(monthISO) {
  const { start_date, end_date } = monthRange(monthISO);
  const budgetCatIds = await fetchBudgetCatIds();

  const LIMIT = 100;
  let page = 1;
  let income = 0;
  let expense = 0;

  while (true) {
    const txRes = await api.get("/protected/api/v1/transactions", {
      params: { start_date, end_date, limit: String(LIMIT), page: String(page) },
    });

    const payload = txRes?.data || {};
    const list =
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.items) && payload.items) ||
      (Array.isArray(payload) && payload) ||
      [];

    for (const t of list) {
      const type = String(t.type ?? "").toLowerCase();
      const amt =
        typeof t.amount === "number"
          ? t.amount
          : parseFloat(String(t.amount ?? "0").replace(/,/g, "").trim()) || 0;

      if (type === "income") {
        income += amt;
      } else if (type === "expense") {
        const rawId = t.category_id ?? t.categoryId ?? t.category?.id;
        const key = rawId != null ? String(rawId) : null;
        if (key && budgetCatIds.has(key)) {
          expense += amt; // อิงงบเท่านั้น
        }
      }
    }

    const pag = payload?.pagination || {};
    const total = pag.total ?? 0;
    const limit = pag.limit ?? LIMIT;
    const curPage = pag.page ?? page;
    const totalPages = pag.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : curPage);

    if (totalPages && curPage >= totalPages) break;
    if (list.length < LIMIT) break;

    page += 1;
    if (page > 50) break;
  }

  return { income, expense };
}

export default function DashboardContent() {
  /* ==== Theme state & init ==== */
  const [dark, setDark] = useState(false);
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

  const [filterValue, setFilterValue] = useState("LAST_6M");
  const currentYM = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthISO = filterValue === "LAST_6M" ? currentYM : filterValue;

  const [view, setView] = useState("summary");
  const [monthly, setMonthly] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((v) => !v);

  const [openCatId, setOpenCatId] = useState(null);
  const [detailsByCat, setDetailsByCat] = useState({});

  const monthsForBars = useMemo(
    () => (filterValue === "LAST_6M" ? last6MonthsFrom(currentYM) : [monthISO]),
    [filterValue, currentYM, monthISO]
  );

  const monthOptions = useMemo(() => last6MonthsOptions(), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        // ===== SUMMARY (bar) — คำนวณจาก transactions ให้ตรงกับ Home =====
        const bars = [];
        for (const m of monthsForBars) {
          const { income, expense } = await computeMonthIEWithBudget(m);
          bars.push({ month: m, m: ymShort(m), income, expense });
        }
        if (!cancelled) setMonthly(bars);

        // ===== DONUT (อิงเฉพาะหมวดที่มี Budget) =====
        let donut = [];
        if (filterValue === "LAST_6M") {
          const start = monthsForBars[0];
          const end = monthsForBars[monthsForBars.length - 1];
          const { start_date } = monthRange(start);
          const { end_date } = monthRange(end);
          donut = await buildDonutForDateRange(start_date, end_date);
        } else {
          const { start_date, end_date } = monthRange(monthISO);
          donut = await buildDonutForDateRange(start_date, end_date);
        }

        if (!cancelled) {
          setCategoryData(donut);
          setOpenCatId(null);
          setDetailsByCat({});
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [filterValue, monthISO, monthsForBars]);

  const loadCategoryDetails = async (catId) => {
    setDetailsByCat((s) => ({ ...s, [catId]: { loading: true, items: s[catId]?.items || [] } }));
    try {
      let start_date, end_date;
      if (filterValue === "LAST_6M") {
        const start = monthsForBars[0];
        const end = monthsForBars[monthsForBars.length - 1];
        start_date = monthRange(start).start_date;
        end_date = monthRange(end).end_date;
      } else {
        ({ start_date, end_date } = monthRange(monthISO));
      }

      const LIMIT = 100;
      let page = 1;
      let rows = [];

      while (true) {
        const txRes = await api.get("/protected/api/v1/transactions", {
          params: {
            type: "expense",
            category_id: String(catId),
            start_date,
            end_date,
            limit: String(LIMIT),
            page: String(page),
          },
        });

        const payload = txRes?.data || {};
        const list =
          (Array.isArray(payload?.data) && payload.data) ||
          (Array.isArray(payload?.items) && payload.items) ||
          (Array.isArray(payload) && payload) ||
          [];

        const mapped = list.map((t) => ({
          id: t.transaction_id ?? t.id,
          date: formatDate(t.created_at ?? t.transaction_date ?? t.date),
          note: t.note || t.description || "",
          amount:
            typeof t.amount === "number"
              ? t.amount
              : parseFloat(String(t.amount ?? "0").replace(/,/g, "").trim()) || 0,
        }));

        rows = rows.concat(mapped);

        const pag = payload?.pagination || {};
        const total = pag.total ?? rows.length;
        const limit = pag.limit ?? LIMIT;
        const curPage = pag.page ?? page;
        const totalPages = pag.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : curPage);

        if (totalPages && curPage >= totalPages) break;
        if (list.length < LIMIT) break;

        page += 1;
        if (page > 50) break;
      }

      rows.sort((a, b) => (a.date < b.date ? 1 : -1));
      setDetailsByCat((s) => ({ ...s, [catId]: { loading: false, items: rows } }));
    } catch (e) {
      setDetailsByCat((s) => ({
        ...s,
        [catId]: { loading: false, items: s[catId]?.items || [], error: e?.message || "Failed" },
      }));
    }
  };

  const totalCat = useMemo(() => categoryData.reduce((sum, d) => sum + d.amount, 0), [categoryData]);
  const parts = useMemo(() => {
    if (totalCat <= 0) return [];
    let acc = 0;
    return categoryData.map((d) => {
      const pct = (d.amount / totalCat) * 100;
      const from = acc; const to = acc + pct; acc = to;
      return { ...d, pct, from, to };
    });
  }, [categoryData, totalCat]);

  const donutGradient = parts.length
    ? `conic-gradient(${parts.map((p) => `${p.color} ${p.from}% ${p.to}%`).join(", ")})`
    : `conic-gradient(#e5e7eb 0 100%)`;

  const maxY = useMemo(() => Math.max(...monthly.flatMap((x) => [x.income, x.expense]), 0), [monthly]);
  const totalIncome = useMemo(() => monthly.reduce((s, x) => s + x.income, 0), [monthly]);
  const totalExpense = useMemo(() => monthly.reduce((s, x) => s + x.expense, 0), [monthly]);

  const totalExpenseForCard = useMemo(
    () => (filterValue === "LAST_6M" ? totalExpense : totalCat),
    [filterValue, totalExpense, totalCat]
  );

  const asOf = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
  const yearOfMonth = Number(monthISO.slice(0, 4));
  const monthShort = ymShort(monthISO);
  const barTitle =
    filterValue === "LAST_6M"
      ? `Income & Expenses — Last 6 months (to ${ymShort(currentYM)} ${currentYM.slice(0, 4)})`
      : `Income & Expenses — ${monthShort} ${yearOfMonth}`;

  return (
    <div className="app report-page">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="main">
        <div className="dashboard-content">
          <header className="fc-topbar">
            <div className="fc-title">
              <button onClick={toggleSidebar}>
                <img src="/hamburger.png" alt="icon-ham" className="iconham" />
              </button>
              <h1>Finance Chart</h1>
              <p>Keep track your financial plan</p>
            </div>

            <label className="toggle" aria-label="Toggle theme">
              <input
                type="checkbox"
                checked={dark}
                onChange={(e) => onToggleTheme(e.target.checked)}
              />
              <span className="toggle-slider">{dark ? "🌙" : "☀️"}</span>
            </label>
          </header>

          <div className="row-head">
            <div className="fc-segment">
              <button
                className={`seg ${view === "summary" ? "active" : ""}`}
                onClick={() => setView("summary")}
              >
                ภาพรวม
              </button>
              <button
                className={`seg ${view === "category" ? "active" : ""}`}
                onClick={() => setView("category")}
              >
                ตามหมวดหมู่
              </button>
            </div>

            <div className="fc-filters">
              <div className="fc-filter">
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  aria-label="Select month or last 6 months"
                >
                  <option value="LAST_6M">Last 6 months</option>
                  {last6MonthsOptions().map((m) => (
                    <option key={m} value={m}>
                      {ymShort(m)} {m.slice(0, 4)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading && <p>Loading data...</p>}
          {error && <p className="error">{error}</p>}

          {/* SUMMARY */}
          {view === "summary" && !loading && !error && (
            <>
              <section className="fc-board">
                <div className="bar-head">
                  <h3>{barTitle}</h3>
                </div>

                <div
                  className="bars-wrap"
                  style={{ gridTemplateColumns: `repeat(${monthly.length || 1}, minmax(0, 1fr))` }}
                >
                  {monthly.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", alignSelf: "center" }}>
                      No data to display
                    </div>
                  ) : (
                    monthly.map((x) => {
                      const ih = maxY > 0 ? Math.round((x.income / maxY) * 100) : 0;
                      const eh = maxY > 0 ? Math.round((x.expense / maxY) * 100) : 0;
                      return (
                        <div className="bar-col" key={x.month} title={x.month}>
                          <div className="bar-stack">
                            <span className="bar income" style={{ height: `${Math.max(ih, 4)}%` }} />
                            <span className="bar expense" style={{ height: `${Math.max(eh, 4)}%` }} />
                          </div>
                          <div className="bar-label">{x.m}</div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="totals-row">
                  <div className="mini-total">
                    <span className="mini-ic">🐷</span>
                    <div className="mini-meta">
                      <div className="mini-title">Total Income (Baht)</div>
                      <div className="mini-value">฿{totalIncome.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mini-total">
                    <span className="mini-ic">🐷</span>
                    <div className="mini-meta">
                      <div className="mini-title">Total Expenses (Baht)</div>
                      <div className="mini-value">฿{totalExpense.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="fc-sub">
                  {filterValue === "LAST_6M" ? "Income & Expense (last 6 months)" : "Income & Expense (selected month)"}
                </div>
                <div className="fc-date">Data as of {asOf}</div>
              </section>

              {monthly.length > 0 && (
                <section className="month-list">
                  <h4 className="year-title">
                    {monthsForBars[0].slice(0, 4)} – {monthsForBars[monthsForBars.length - 1].slice(0, 4)}
                  </h4>
                  {monthly.map((row) => {
                    const net = row.income - row.expense;
                    return (
                      <div className="month-card" key={row.month}>
                        <div className="month-head">
                          {row.m} {row.month.slice(2, 4)}
                        </div>
                        <div className="month-line">
                          <span>Total Income :</span>
                          <b className="green">{row.income.toFixed(2)} Baht</b>
                        </div>
                        <div className="month-line">
                          <span>Total Expenses :</span>
                          <b className="red">{row.expense.toFixed(2)} Baht</b>
                        </div>
                        <div className="month-line">
                          <span>Net Balance :</span>
                          <b className={net >= 0 ? "green" : "red"}>{net.toFixed(2)} Baht</b>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </>
          )}

          {/* CATEGORY */}
          {view === "category" && !loading && !error && (
            <>
              <section className="fc-board">
                <div className="fc-chart">
                  <h3>
                    All Expenses — {filterValue === "LAST_6M" ? "Last 6 months" : `${ymShort(monthISO)} ${monthISO.slice(0,4)}`}
                  </h3>
                  <div className="donut-wrap">
                    <div className="donut" style={{ background: donutGradient }}>
                      <div className="donut-hole">
                        <div className="donut-label">{parts.length ? "100%" : "0%"}</div>
                      </div>
                    </div>
                    <ul className="legend">
                      {parts.length === 0 ? (
                        <li>No expenses in range</li>
                      ) : (
                        parts.map((p) => (
                          <li key={p.key}>
                            <span className="dot" style={{ background: p.color }} />
                            {p.key} — {p.pct.toFixed(1)}%
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                <div className="fc-total">
                  <div className="pig">🐷</div>
                  <div className="meta">
                    <div className="label">Total Expenses (Baht)</div>
                    <div className="value">฿{totalExpenseForCard.toLocaleString("en-US")}</div>
                  </div>
                </div>

                <div className="fc-date">Data as of {asOf}</div>
              </section>

              {parts.map((p) => {
                const isOpenRow = openCatId === p.category_id;
                const detail = detailsByCat[p.category_id];

                return (
                  <section className="fc-list" key={p.key}>
                    <button
                      className="row"
                      onClick={async () => {
                        const next = isOpenRow ? null : p.category_id;
                        setOpenCatId(next);
                        if (next && !detailsByCat[next]?.items && !detailsByCat[next]?.loading) {
                          await loadCategoryDetails(next);
                        }
                      }}
                    >
                      <div className="left">
                        <div className="name">{p.key}</div>
                      </div>
                      <div className="right">
                        <div className="meta">
                          <span className="amount">฿{baht(p.amount)}</span>
                          <span className="percent">{p.pct.toFixed(1)}%</span>
                        </div>
                        <span className="chev">{isOpenRow ? "˄" : "›"}</span>
                      </div>
                    </button>

                    {isOpenRow && (
                      <div className="detail-panel">
                        {!detail || detail.loading ? (
                          <div className="state" style={{ padding: 12 }}>Loading...</div>
                        ) : detail.error ? (
                          <div className="state error" style={{ padding: 12 }}>{detail.error}</div>
                        ) : detail.items?.length === 0 ? (
                          <div className="state" style={{ padding: 12 }}>No transactions</div>
                        ) : (
                          <div className="detail-table-wrap">
                            <table className="detail-table">
                              <thead>
                                <tr>
                                  <th className="col-date">Date</th>
                                  <th className="col-note">Note</th>
                                  <th className="col-amt">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.items.map((t) => (
                                  <tr key={t.id}>
                                    <td className="col-date">{t.date}</td>
                                    <td className="col-note">{t.note || "—"}</td>
                                    <td className="col-amt">-฿{baht(t.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
