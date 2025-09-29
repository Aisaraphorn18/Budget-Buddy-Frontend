"use client";
import "./Report.css";
import Sidebar from "@/app/components/sidebar";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";

const COLORS = ["#6E47E8", "#10B981", "#f59e0b", "#ef4444"];

export default function DashboardContent() {
  const [view, setView] = useState("summary");
  const [chartType, setChartType] = useState("income-expense");
  const [range, setRange] = useState("year");

  const [categoryData, setCategoryData] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        };

        // Fetch expenses by category
        const catRes = await axios.get(
          "http://localhost:4000/protected/api/v1/reports/expenses-by-category",
          headers
        );
        const catDataRaw = catRes.data.data || catRes.data || [];

        const catData = catDataRaw.map((c, i) => ({
          key: c.category || c.key || `Category${i + 1}`,
          amount: Number(c.amount || 0),
          color: COLORS[i % COLORS.length],
          icon: c.icon || ["📈", "🍽️", "🧾", "⋯"][i % 4],
        }));
        setCategoryData(catData);

        // Fetch income vs expense monthly data
        const ieRes = await axios.get(
          "http://localhost:4000/protected/api/v1/reports/income-vs-expense",
          headers
        );
        const ieRaw = ieRes.data.data || ieRes.data || [];

        const monthlyData = ieRaw.map((d) => ({
          m: d.month || d.m || "N/A",
          income: Number(d.income || 0),
          expense: Number(d.expense || 0),
        }));
        setMonthly(monthlyData);
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalCat = useMemo(() => categoryData.reduce((sum, d) => sum + d.amount, 0), [categoryData]);

  const parts = useMemo(() => {
    let acc = 0;
    return categoryData.map((d) => {
      const pct = totalCat > 0 ? (d.amount / totalCat) * 100 : 0;
      const from = acc;
      const to = acc + pct;
      acc = to;
      return { ...d, pct, from, to };
    });
  }, [categoryData, totalCat]);

  const donutGradient = useMemo(() => {
    const stops = parts.map((p) => `${p.color} ${p.from}% ${p.to}%`).join(", ");
    return `conic-gradient(${stops})`;
  }, [parts]);

  const maxY = useMemo(() => Math.max(...monthly.flatMap((x) => [x.income, x.expense]), 0), [monthly]);
  const totalIncome = useMemo(() => monthly.reduce((s, x) => s + x.income, 0), [monthly]);
  const totalExpense = useMemo(() => monthly.reduce((s, x) => s + x.expense, 0), [monthly]);

  const asOf = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

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
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="income-expense">Income & Expense Chart</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>
          <div className="fc-filter">
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="error">{error}</p>}

      {view === "summary" && !loading && !error && (
        <>
          <section className="fc-board">
            <div className="bar-head">
              <h3>Income & Expenses</h3>
            </div>
            <div className="bars-wrap">
              {monthly.map((x) => {
                const ih = maxY > 0 ? Math.round((x.income / maxY) * 100) : 0;
                const eh = maxY > 0 ? Math.round((x.expense / maxY) * 100) : 0;
                return (
                  <div className="bar-col" key={x.m} title={x.m}>
                    <div className="bar-stack">
                      <div className="bar income" style={{ height: `${Math.max(ih, 5)}%` }}></div>
                      <div className="bar expense" style={{ height: `${Math.max(eh, 5)}%` }}></div>
                    </div>
                    <div className="bar-label">{x.m}</div>
                  </div>
                );
              })}
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

            <div className="fc-sub">Income & Expense Summary (January 2024 - December 2024)</div>
            <div className="fc-date">Data as of {asOf}</div>
          </section>

          <section className="month-list">
            <h4 className="year-title">2024</h4>
            {monthly.map((row) => {
              const net = row.income - row.expense;
              return (
                <div className="month-card" key={row.m}>
                  <div className="month-head">{row.m} 24</div>
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
        </>
      )}

      {view === "category" && !loading && !error && (
        <>
          <section className="fc-board">
            <div className="fc-chart">
              <h3>All Expenses</h3>
              <div className="donut-wrap">
                <div className="donut" style={{ background: donutGradient }}>
                  <div className="donut-hole">
                    <div className="donut-label">100%</div>
                  </div>
                </div>
                <ul className="legend">
                  {parts.map((p) => (
                    <li key={p.key}>
                      <span className="dot" style={{ background: p.color }} />
                      {p.key}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="fc-total">
              <div className="pig">🐷</div>
              <div className="meta">
                <div className="label">Total Expenses (Baht)</div>
                <div className="value">฿{totalCat.toLocaleString("en-US")}</div>
              </div>
            </div>

            <div className="fc-date">Data as of {asOf}</div>
          </section>

          {parts.map((p) => (
            <section className="fc-list" key={p.key}>
              <button className="row">
                <div className="left">
                  <div className="badge" style={{ background: "#F3F4F6" }}>
                    <span className="emoji">{categoryData.find((c) => c.key === p.key)?.icon}</span>
                  </div>
                  <div className="name">{p.key}</div>
                </div>
                <div className="right">
                  <div className="meta">
                    <span className="amount">{p.amount.toFixed(2)} Baht</span>
                    <span className="percent">{p.pct.toFixed(1)}%</span>
                  </div>
                  <span className="chev">›</span>
                </div>
              </button>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
