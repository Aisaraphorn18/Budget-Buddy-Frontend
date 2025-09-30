// src/app/dashboard/DashboardContent.js
"use client";

import "./Report.css";
import Sidebar from "@/app/components/sidebar";
import { useMemo, useState, useEffect } from "react";
import api from "@/app/lib/axiosClient";

/** สีเยอะ ๆ ลดโอกาสซ้ำในโดนัท */
const COLOR_POOL = [
  "#6E47E8","#10B981","#F59E0B","#EF4444","#06B6D4","#A78BFA",
  "#F97316","#22C55E","#3B82F6","#E11D48","#14B8A6","#8B5CF6",
  "#84CC16","#F43F5E","#38BDF8","#C084FC","#D946EF","#FACC15",
  "#34D399","#60A5FA","#FB7185","#2DD4BF","#4ADE80","#FBBF24"
];

/* ---------- helpers ---------- */
const asArray = (x) =>
  (Array.isArray(x?.data) && x.data) ||
  (Array.isArray(x?.items) && x.items) ||
  (Array.isArray(x) && x) ||
  [];

const pad2 = (n) => String(n).padStart(2, "0");
const ymShort = (ymStr) => new Date(ymStr + "-01").toLocaleString("en-US", { month: "short" });
const toYM = (y, m1to12) => `${y}-${pad2(m1to12)}`;

/** คืน start_date / end_date จาก "YYYY-MM" */
const monthRange = (monthISO) => {
  const [yy, mm] = monthISO.split("-").map(Number);
  const lastDay = new Date(yy, mm, 0).getDate();
  return { start_date: `${monthISO}-01`, end_date: `${monthISO}-${pad2(lastDay)}` };
};

/** 6 เดือนย้อนหลัง (จบที่ monthISO) เรียงเก่า -> ใหม่ */
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

/** 6 เดือนย้อนหลังจากเดือนปัจจุบัน (สำหรับ dropdown เริ่มต้น) */
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

/* ========= ดึงธุรกรรมช่วงวันที่ แล้วสรุปโดนัทจาก /transactions ========= */
/** รวมยอดตามช่วงวัน (รองรับทั้ง “เดือนเดียว” และ “6 เดือน”) */
async function buildDonutForDateRange(start_date, end_date) {
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
    if (page > 50) break; // safety
  }

  // 2) ดึงรายชื่อหมวดหมู่เพื่อ map id -> name
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

  // 3) รวมเฉพาะ "expense" ต่อหมวด
  const sumByCat = new Map();
  for (const t of allTx) {
    if (String(t.type ?? "").toLowerCase() !== "expense") continue;
    const id = t.category_id ?? t.categoryId ?? t.category?.id;
    if (id == null) continue;

    const amtRaw = t.amount;
    const amt =
      typeof amtRaw === "number"
        ? amtRaw
        : parseFloat(String(amtRaw ?? "0").replace(/,/g, "").trim()) || 0;
    if (amt <= 0) continue;

    const key = String(id);
    sumByCat.set(key, (sumByCat.get(key) || 0) + amt);
  }

  // 4) แปลงเป็นรูปแบบสำหรับโดนัท (เรียงมาก -> น้อย) + แจกสี
  const entries = Array.from(sumByCat.entries()).sort((a, b) => b[1] - a[1]);
  return entries.map(([id, amount], i) => ({
    key: catNameById[id] || `Category ${id}`,
    category_id: Number(id),
    amount,
    color: COLOR_POOL[i % COLOR_POOL.length],
  }));
}

export default function DashboardContent() {
  // โหมดตัวกรอง: LAST_6M = 6 เดือนย้อนหลังอัตโนมัติ, หรือเลือกเดือนเดียว (ค่าเป็น "YYYY-MM")
  const [filterValue, setFilterValue] = useState("LAST_6M");
  const currentYM = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthISO = filterValue === "LAST_6M" ? currentYM : filterValue;

  const [view, setView] = useState("summary"); // summary | category

  const [monthly, setMonthly] = useState([]); // ข้อมูลกราฟแท่ง
  const [categoryData, setCategoryData] = useState([]); // ข้อมูลโดนัท (รวมตามโหมด)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((v) => !v);

  // รายละเอียดธุรกรรมของแต่ละหมวด
  const [openCatId, setOpenCatId] = useState(null);
  const [detailsByCat, setDetailsByCat] = useState({});

  // ช่วงเดือนที่จะใช้ใน “กราฟแท่ง”
  const monthsForBars = useMemo(
    () => (filterValue === "LAST_6M" ? last6MonthsFrom(currentYM) : [monthISO]),
    [filterValue, currentYM, monthISO]
  );

  const monthOptions = useMemo(() => last6MonthsOptions(), []);

  // โหลดข้อมูลตาม filterValue / monthISO
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        /* ====== SUMMARY (BAR): monthsForBars ====== */
        const yearsNeeded = Array.from(new Set(monthsForBars.map((s) => s.slice(0, 4))));
        let mergedMonthly = [];

        for (const y of yearsNeeded) {
          const sumRes = await api.get("/protected/api/v1/reports/summary", {
            params: { range: "year", year: y },
          });
          const root = sumRes?.data?.data ?? sumRes?.data;
          const items = asArray(root?.monthly_breakdown);

          const mapped = items.map((d) => ({
            month: d.month || null,
            income: Number(d.total_income ?? 0),
            expense: Number(d.total_expense ?? 0),
          }));

          mergedMonthly = mergedMonthly.concat(mapped);
        }

        // เก็บเฉพาะเดือนที่อยู่ใน monthsForBars เท่านั้น
        const finalBars = monthsForBars.map((m) => {
          const found = mergedMonthly.find((x) => x.month === m) || {
            month: m,
            income: 0,
            expense: 0,
          };
          return {
            month: m,
            m: ymShort(m),
            income: Number(found.income || 0),
            expense: Number(found.expense || 0),
          };
        });

        if (!cancelled) setMonthly(finalBars);

        /* ====== DONUT ====== */
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
        if (!cancelled) {
          const msg = e?.response?.data?.message || e?.message || "Failed to load data";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [filterValue, monthISO, monthsForBars]);

  /* ===== โหลดรายละเอียดธุรกรรมของหมวด ===== */
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

      rows.sort((a, b) => (a.date < b.date ? 1 : -1)); // ล่าสุด -> เก่าสุด
      setDetailsByCat((s) => ({ ...s, [catId]: { loading: false, items: rows } }));
    } catch (e) {
      setDetailsByCat((s) => ({
        ...s,
        [catId]: { loading: false, items: s[catId]?.items || [], error: e?.message || "Failed" },
      }));
    }
  };

  /* ===== DONUT derived ===== */
  const totalCat = useMemo(
    () => categoryData.reduce((sum, d) => sum + d.amount, 0),
    [categoryData]
  );

  const parts = useMemo(() => {
    if (totalCat <= 0) return [];
    let acc = 0;
    return categoryData.map((d) => {
      const pct = (d.amount / totalCat) * 100;
      const from = acc;
      const to = acc + pct;
      acc = to;
      return { ...d, pct, from, to };
    });
  }, [categoryData, totalCat]);

  const donutGradient = parts.length
    ? `conic-gradient(${parts.map((p) => `${p.color} ${p.from}% ${p.to}%`).join(", ")})`
    : `conic-gradient(#e5e7eb 0 100%)`;

  /* ===== BAR derived (ใช้สำหรับ sum 6 เดือน) ===== */
  const maxY = useMemo(
    () => Math.max(...monthly.flatMap((x) => [x.income, x.expense]), 0),
    [monthly]
  );
  const totalIncome = useMemo(() => monthly.reduce((s, x) => s + x.income, 0), [monthly]);
  const totalExpense = useMemo(() => monthly.reduce((s, x) => s + x.expense, 0), [monthly]);

  /* ===== ค่า Total Expenses ในบัตรใต้โดนัท ===== */
  const totalExpenseForCard = useMemo(
    () => (filterValue === "LAST_6M" ? totalExpense : totalCat),
    [filterValue, totalExpense, totalCat]
  );

  /* ===== Misc ===== */
  const asOf = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "2-digit",
  });
  const yearOfMonth = Number(monthISO.slice(0, 4));
  const monthShort = ymShort(monthISO);

  const barTitle =
    filterValue === "LAST_6M"
      ? `Income & Expenses — Last 6 months (to ${ymShort(currentYM)} ${currentYM.slice(0, 4)})`
      : `Income & Expenses — ${monthShort} ${yearOfMonth}`;

  return (
    <div className="dashboard-content">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <header className="fc-topbar">
        <div className="fc-title">
          <button onClick={toggleSidebar}>
            <img src="/hamburger.png" alt="icon-ham" className="iconham" />
          </button>
          <h1>Finance Chart</h1>
          <p>Keep track your financial plan</p>
        </div>
      </header>

      <div className="row-head">
        <div className="fc-segment">
          <button className={`seg ${view === "summary" ? "active" : ""}`} onClick={() => setView("summary")}>
            ภาพรวม
          </button>
          <button className={`seg ${view === "category" ? "active" : ""}`} onClick={() => setView("category")}>
            ตามหมวดหมู่
          </button>
        </div>

        {/* เลือก 6 เดือน หรือ เดือนเดี่ยว */}
        <div className="fc-filters">
          <div className="fc-filter">
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              aria-label="Select month or last 6 months"
            >
              <option value="LAST_6M">Last 6 months</option>
              {monthOptions.map((m) => (
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

      {/* ===== SUMMARY (BAR) ===== */}
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

      {/* ===== CATEGORY (DONUT + รายละเอียดต่อหมวด) ===== */}
      {view === "category" && !loading && !error && (
        <>
          <section className="fc-board">
            <div className="fc-chart">
              <h3>
                All Expenses — {filterValue === "LAST_6M" ? "Last 6 months" : `${ymShort(monthISO)} ${monthISO.slice(0,4)}`}
              </h3>
              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{ background: donutGradient }}
                >
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

            {/* ใช้ยอดรวมแบบปรับตาม filterValue */}
            <div className="fc-total">
              <div className="pig">🐷</div>
              <div className="meta">
                <div className="label">Total Expenses (Baht)</div>
                <div className="value">฿{totalExpenseForCard.toLocaleString("en-US")}</div>
              </div>
            </div>

            <div className="fc-date">Data as of {asOf}</div>
          </section>

          {/* รายการแยกตามหมวด + กางรายละเอียดธุรกรรม */}
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
                  {/* เอาไอคอนออก เหลือชื่อหมวด */}
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

                {/* Panel รายละเอียด */}
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
  );
}
