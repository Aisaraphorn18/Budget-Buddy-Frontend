"use client";
import "./styles.css";
import Sidebar from "@/app/components/sidebar";

import { useMemo, useState } from "react";



const COLORS = ["#6E47E8", "#10B981", "#f59e0b", "#ef4444"];

const categoryData = [
  { key: "Investment", amount: 1912.5, color: COLORS[0], icon: "📈" },
  { key: "Food",       amount: 1912.5, color: COLORS[1], icon: "🍽️" },
  { key: "Shopping",   amount: 1912.5, color: COLORS[2], icon: "🧾" },
  { key: "Others",     amount: 1912.5, color: COLORS[3], icon: "⋯" },
];

const monthly = [
  { m: "Jan", income: 2200, expense: 1800 },
  { m: "Feb", income: 1800, expense: 1600 },
  { m: "Mar", income: 2100, expense: 1400 },
  { m: "Apr", income: 2000, expense: 1500 },
  { m: "May", income: 1950, expense: 1550 },
  { m: "Jun", income: 2050, expense: 1600 },
  { m: "Jul", income: 2600, expense: 2000 },
  { m: "Aug", income: 2500, expense: 2300 },
  { m: "Sep", income: 2400, expense: 1500 },
  { m: "Oct", income: 2300, expense: 2100 },
  { m: "Nov", income: 2350, expense: 2200 },
  { m: "Dec", income: 2450, expense: 2300 },
];

export default function DashboardContent() {
  const [view, setView] = useState("summary");
  const [chartType, setChartType] = useState("income-expense");
  const [range, setRange] = useState("year");

  const totalCat = useMemo(
    () => categoryData.reduce((s, d) => s + d.amount, 0),
    []
  );

  const parts = useMemo(() => {
    let acc = 0;
    return categoryData.map((d) => {
      const pct = (d.amount / totalCat) * 100;
      const from = acc;
      const to = acc + pct;
      acc = to;
      return { ...d, pct, from, to };
    });
  }, [totalCat]);

  const donutGradient = useMemo(() => {
    const stops = parts.map((p) => `${p.color} ${p.from}% ${p.to}%`).join(", ");
    return `conic-gradient(${stops})`;
  }, [parts]);

  const maxY = useMemo(
    () => Math.max(...monthly.flatMap((x) => [x.income, x.expense])),
    []
  );
  const totalIncome = useMemo(
    () => monthly.reduce((s, x) => s + x.income, 0),
    []
  );
  const totalExpense = useMemo(
    () => monthly.reduce((s, x) => s + x.expense, 0),
    []
  );

  const asOf = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="content">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <header className="fc-topbar">
        <div className="fc-title">
          <button onClick={toggleSidebar}>
            <img src="/hamburger.png" alt="icon-ham" className="iconham"/>
          </button>
          <h1>Finance Chart</h1>
          <p>Keep track your financial plan</p>
        </div>
        
      </header>

      <div className="row-head">
        <div className="fc-segment">
          <button className={`seg ${view === "summary" ? "active" : ""}`} onClick={() => setView("summary")}>ภาพรวม</button>
          <button className={`seg ${view === "category" ? "active" : ""}`} onClick={() => setView("category")}>ตามหมวดหมู่</button>
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

      {view === "summary" && (
        <>
          <section className="fc-board">
            <div className="bar-head">
              <h3>Income & Expenses</h3>
            </div>
            <div className="bars-wrap">
              {monthly.map((x) => {
                const ih = Math.round((x.income / maxY) * 100);
                const eh = Math.round((x.expense / maxY) * 100);
                return (
                  <div className="bar-col" key={x.m} title={x.m}>
                    <div className="bar-stack">
                      <div className="bar income" style={{ height: `${ih}%` }} />
                      <div className="bar expense" style={{ height: `${eh}%` }} />
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
            {["Dec", "Nov", "Oct"].map((mm) => {
              const row = monthly.find((x) => x.m.startsWith(mm)) ?? monthly[0];
              const net = row.income - row.expense;
              return (
                <div className="month-card" key={mm}>
                  <div className="month-head">{mm} 24</div>
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

      {view === "category" && (
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
                <div className="value">฿{(totalCat * 443).toLocaleString("en-US")}</div>
              </div>
            </div>

            <div className="fc-date">Data as of {asOf}</div>
          </section>

          <section className="fc-list">
            {parts.map((p) => (
              <button key={p.key} className="row">
                <div className="left">
                  <div className="badge" style={{ background: "#F3F4F6" }}>
                    <span className="emoji">
                      {categoryData.find((c) => c.key === p.key)?.icon}
                    </span>
                  </div>
                  <div className="name">{p.key}</div>
                </div>
                <div className="right">
                  <div className="amount">฿{(p.amount * 443).toLocaleString()}</div>
                  <div className="percent">{p.pct.toFixed(1)}%</div>
                  <div className="chev">›</div>
                </div>
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  );
}