// src/app/Home/home.js
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import Sidebar from "@/app/components/sidebar";
import api from "@/app/lib/axiosClient";
import "./home.css";

/* ========= THEME ========= */
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

/* ========= Helpers ========= */
const baht = (n) => (Number(n) || 0).toLocaleString("th-TH");
const pickItems = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.data?.items)) return d.data.items;
  if (Array.isArray(d?.budgets)) return d.budgets;
  if (Array.isArray(d?.data?.budgets)) return d.data.budgets;
  return [];
};

export default function Home() {
  /* ===== UI ===== */
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((v) => !v);

  const [dark, setDark] = useState(false);
  useLayoutEffect(() => {
    const mode = readTheme();
    applyTheme(mode);
    setDark(mode === "dark");
  }, []);
  const toggleTheme = (checked) => {
    const mode = checked ? "dark" : "light";
    applyTheme(mode);
    setDark(checked);
  };

  /* ===== Month (สำหรับสรุป/กรอง) ===== */
  const [monthISO] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const isInSelectedMonth = useCallback(
    (t) => String(t.date ?? t.transaction_date ?? t.created_at ?? "").slice(0, 7) === monthISO,
    [monthISO]
  );

  /* ===== Data ===== */
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const balance = useMemo(() => income - expenses, [income, expenses]);

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [txns, setTxns] = useState([]);

  const [loading, setLoading] = useState(false);
  const [budError, setBudError] = useState("");
  const [catsError, setCatsError] = useState("");
  const [txnError, setTxnError] = useState("");

  /* ===== Modals ===== */
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);

  // Edit modal
  const [edit, setEdit] = useState(null); // {id, category_id, budget_amount, cycle_month}
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm
  const [confirm, setConfirm] = useState(null); // {id, name}
  const [deletingId, setDeletingId] = useState("");

  /* ===== Forms ===== */
  const [selectedCategory, setSelectedCategory] = useState(0); // number
  const [amount, setAmount] = useState("");
  const firstInputRef = useRef(null);

  // ⬇️ “วันนี้” และล็อกไว้
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [txnDate, setTxnDate] = useState(todayISO);
  const [txnType, setTxnType] = useState("");
  const [txnCategory, setTxnCategory] = useState(0); // number
  const [txnAmount, setTxnAmount] = useState("");
  const [txnNote, setTxnNote] = useState("");
  const [txnSaving, setTxnSaving] = useState(false);

  /* ===== Active budgets / filters ===== */
  const activeBudgetCatIds = useMemo(() => {
    const s = new Set();
    for (const b of budgets) s.add(String(b.category_id ?? b.id ?? ""));
    return s;
  }, [budgets]);

  const monthTxns = useMemo(() => txns.filter(isInSelectedMonth), [txns, isInSelectedMonth]);

  const filteredExpenseTxns = useMemo(
    () =>
      monthTxns.filter((t) => {
        const type = String(t.type ?? "").toLowerCase();
        const catId = String(t.category_id ?? t.categoryId ?? "");
        return type === "expense" && activeBudgetCatIds.has(catId);
      }),
    [monthTxns, activeBudgetCatIds]
  );

  const filteredIncomeTxns = useMemo(
    () => monthTxns.filter((t) => String(t.type ?? "").toLowerCase() === "income"),
    [monthTxns]
  );

  /* ===== Derived ===== */
  const spentByCat = useMemo(() => {
    const map = {};
    for (const t of filteredExpenseTxns) {
      const catId = (t.category_id ?? t.categoryId ?? "").toString();
      const amt = Number(t.amount) || 0;
      const d = t.created_at ?? t.date ?? null;
      if (!map[catId]) map[catId] = { spent: 0, lastPaid: undefined };
      map[catId].spent += amt;
      if (d && (!map[catId].lastPaid || String(d) > String(map[catId].lastPaid))) {
        map[catId].lastPaid = String(d).slice(0, 10);
      }
    }
    return map;
  }, [filteredExpenseTxns]);

  const catName = useCallback(
    (id) => {
      const c = categories.find((x) => String(x.category_id ?? x.id) === String(id));
      return c?.category_name ?? c?.name ?? `Category ${id}`;
    },
    [categories]
  );

  const budgetsView = useMemo(
    () =>
      budgets.map((b) => ({
        ...b,
        _displayName: b.category_name ?? catName(b.category_id),
      })),
    [budgets, catName]
  );

  /* ===== Load all ===== */
  const loadAll = useCallback(async () => {
    setLoading(true);
    setBudError("");
    setCatsError("");
    setTxnError("");
    try {
      const [catsRes, budRes, txnRes] = await Promise.all([
        api.get("/protected/api/v1/categories"),
        api.get("/protected/api/v1/budgets"),
        api.get("/protected/api/v1/transactions", { params: { month: monthISO } }),
      ]);

      const cats = pickItems(catsRes);
      const buds = pickItems(budRes);
      const txs = pickItems(txnRes);

      setCategories(cats);
      setBudgets(buds);
      setTxns(txs);

      // ตั้ง default ครั้งแรก
      if (!selectedCategory && cats[0]) {
        const firstId = Number(cats[0].category_id ?? cats[0].id ?? 0);
        setSelectedCategory(firstId);
      }
      if (!txnCategory && cats[0]) {
        const firstId = Number(cats[0].category_id ?? cats[0].id ?? 0);
        setTxnCategory(firstId);
      }

      // คำนวณสรุป
      const inc = filteredIncomeTxns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const exp = filteredExpenseTxns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      setIncome(inc);
      setExpenses(exp);
    } catch (err) {
      console.error("loadAll error:", err);
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setCatsError(msg || "โหลดหมวดหมู่ไม่สำเร็จ");
      setBudError(msg || "โหลด Budget ไม่สำเร็จ");
      setTxnError(msg || "โหลด Transaction ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [monthISO, filteredIncomeTxns, filteredExpenseTxns, selectedCategory, txnCategory]);

  useEffect(() => {
    loadAll();
    const onFocus = () => loadAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadAll]);

  /* ===== Actions ===== */
  const createBudget = async () => {
    try {
      await api.post("/protected/api/v1/budgets", {
        category_id: Number(selectedCategory),
        budget_amount: Number(amount),
        cycle_month: monthISO,
      });
      setShowBudgetModal(false);
      setAmount("");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "สร้าง Budget ไม่สำเร็จ"
          : "เกิดข้อผิดพลาด"
      );
    }
  };

  const addTransaction = async () => {
    try {
      setTxnSaving(true);
      setTxnError("");

      // ⛔️ บังคับว่าต้องมี Budget สำหรับ category ที่เลือก (ไม่ว่าจะ income/expense)
      const hasBudget = activeBudgetCatIds.has(String(txnCategory));
      if (!hasBudget) {
        setTxnSaving(false);
        return setTxnError("ไม่สามารถบันทึกธุรกรรมได้ เพราะหมวดนี้ยังไม่มี Budget");
      }

      const today = todayISO; // วันนี้เสมอ

      await api.post("/protected/api/v1/transactions", {
        category_id: Number(txnCategory),
        type: txnType,
        amount: Number(txnAmount),
        note: txnNote || "",
        date: today, // fixed วันนี้
      });

      setShowTxnModal(false);
      setTxnAmount("");
      setTxnNote("");
      await loadAll();
    } catch (err) {
      console.error(err);
      setTxnError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "บันทึกธุรกรรมไม่สำเร็จ"
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setTxnSaving(false);
    }
  };

  const openConfirm = (b) => {
    const id = b.budget_id ?? b.id;
    const name = b.category_name ?? catName(b.category_id) ?? `Budget ${id}`;
    setConfirm({ id, name });
  };

  const doDelete = async () => {
    try {
      setDeletingId(String(confirm.id));
      await api.delete(`/protected/api/v1/budgets/${confirm.id}`);
      setConfirm(null);
      await loadAll();
    } catch (err) {
      console.error("Delete budget error:", err);
      alert(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "ลบ Budget ไม่สำเร็จ"
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setDeletingId("");
    }
  };

  const openEdit = (b) => {
    const id = b.budget_id ?? b.id;
    setEdit({
      id,
      category_id: String(b.category_id ?? ""),
      budget_amount: String(b.budget_amount ?? ""),
      cycle_month: b.cycle_month ?? monthISO,
    });
  };

  const updateBudget = async () => {
    if (!edit) return;
    try {
      setSavingEdit(true);
      await api.put(`/protected/api/v1/budgets/${edit.id}`, {
        category_id: Number(edit.category_id),
        budget_amount: Number(edit.budget_amount),
        cycle_month: edit.cycle_month,
      });
      setEdit(null);
      await loadAll();
    } catch (err) {
      console.error("Update budget error:", err);
      alert(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "อัปเดต Budget ไม่สำเร็จ"
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  /* ===== UI ===== */
  return (
    <div className="app">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="main">
        <header className="page-head">
          <button onClick={toggleSidebar}>
            <img src="/hamburger.png" alt="menu" className="iconham" />
          </button>

          <h1>My Wallet</h1>

          <label className="toggle" style={{ marginLeft: "auto" }}>
            <input type="checkbox" checked={dark} onChange={(e) => toggleTheme(e.target.checked)} />
            <span className="toggle-slider">{dark ? "🌙" : "☀️"}</span>
          </label>
        </header>

        <p className="subtitle">สรุปภาพรวมรายรับ รายจ่าย และเป้าหมายการออมของคุณ</p>

        {/* ===== Summary ===== */}
        <section className="summary">
          <div className="card">
            <div className="sum-head">
              <img className="icon" src="/income.png" alt="income" />
              <span className="sum-title">Income</span>
            </div>
            <div className="sum-value">{baht(income)} ฿</div>
          </div>

          <div className="card">
            <div className="sum-head">
              <img className="icon" src="/expeness.png" alt="expenses" />
              <span className="sum-title">Expenses</span>
            </div>
            <div className="sum-value">{baht(expenses)} ฿</div>
          </div>

          <div className="card">
            <div className="sum-head">
              <img className="icon" src="/balance.png" alt="balance" />
              <span className="sum-title">Balance</span>
            </div>
            <div className="sum-value">{baht(balance)} ฿</div>
          </div>
        </section>

        {/* ===== Actions ===== */}
        <div className="budget-header">
          <h2 className="section-title">Budget</h2>
          <div className="actions">
            <button
              className="btn btn-green"
              onClick={() => {
                // เปิดโมดัลเพิ่มธุรกรรม: ล็อกวันที่เป็นวันนี้
                setTxnDate(todayISO);
                setTxnType("");
                if (!txnCategory && categories[0]) {
                  const firstId = Number(categories[0].category_id ?? categories[0].id ?? 0);
                  setTxnCategory(firstId);
                }
                setTxnAmount("");
                setTxnNote("");
                setTxnError("");
                setShowTxnModal(true);
              }}
            >
              + add transaction
            </button>

            <button
              className="btn btn-red"
              onClick={() => {
                setAmount("");
                if (!selectedCategory && categories[0]) {
                  const firstId = Number(categories[0].category_id ?? categories[0].id ?? 0);
                  setSelectedCategory(firstId);
                }
                setShowBudgetModal(true);
              }}
            >
              + create budget
            </button>
          </div>
        </div>

        {/* ===== Budget grid ===== */}
        <section className="budget-grid">
          {loading && budgetsView.length === 0 && <div className="muted">กำลังโหลดข้อมูล…</div>}
          {budError && <div className="error">{budError}</div>}
          {!loading && !budError && budgetsView.length === 0 && (
            <div className="muted">ยังไม่มี Budget</div>
          )}

          {budgetsView.map((b) => {
            const id = b.budget_id ?? b.id;
            const max = Number(b.budget_amount) || 0;
            const catId = b.category_id;
            const name = b._displayName;

            const spent = spentByCat[String(catId)]?.spent ?? 0;
            const pct = max > 0 ? Math.min(100, Math.round((spent / max) * 100)) : 0;

            const lastPaidISO = spentByCat[String(catId)]?.lastPaid;
            const paid = lastPaidISO
              ? new Date(lastPaidISO + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "2-digit",
                  year: "numeric",
                })
              : "—";

            const barStyle = {
              width: `${pct}%`,
              background:
                pct >= 100
                  ? "linear-gradient(90deg, #ef4444, #f87171)"
                  : pct >= 80
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, var(--purple), #9b8cff)",
            };

            return (
              <div className="budget-card" key={id}>
                <div className="budget-top">
                  <div className="left">
                    <div className="bname">{name}</div>
                    <div className="meta">Last Paid on {paid}</div>
                  </div>
                  <div className="right">
                    <button className="icon-btn" title="Edit" onClick={() => openEdit(b)}>
                      <img className="icon" src="/edit.png" alt="edit" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete"
                      onClick={() => openConfirm({ ...b, id })}
                    >
                      <img className="icon" src="/bin.png" alt="delete" />
                    </button>
                  </div>
                </div>

                <div className="bamount-row">
                  <div className="bamount">
                    ฿{baht(spent)} <span className="muted">/ {baht(max)}</span>
                  </div>
                  <span className={"pct-badge " + (pct >= 100 ? "danger" : pct >= 80 ? "warn" : "")}>
                    {pct}%
                  </span>
                </div>

                <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                  <div className="bar" style={barStyle} />
                </div>
              </div>
            );
          })}
        </section>

        {/* ===== Create Budget Modal ===== */}
        {showBudgetModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowBudgetModal(false)}>
            <div className="modal">
              <div className="modal-header center">
                <h3 className="modal-title">Create Budget</h3>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <label>Category</label>
                  <select
                    className="input"
                    value={String(selectedCategory || 0)}
                    onChange={(e) => setSelectedCategory(Number(e.target.value))}
                  >
                    {categories.length === 0 && <option disabled>No categories</option>}
                    {categories.map((c) => {
                      const id = Number(c.category_id ?? c.id ?? 0);
                      const name = c.category_name ?? c.name ?? `Category ${id || ""}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-row">
                  <label>Amount</label>
                  <input
                    ref={firstInputRef}
                    type="number"
                    className="input"
                    placeholder="฿120"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="modal-actions center">
                  <button
                    type="button"
                    className="btn btn-purple"
                    disabled={!selectedCategory || !amount || Number(amount) <= 0}
                    onClick={createBudget}
                  >
                    Create
                  </button>
                  <button type="button" className="btn" onClick={() => setShowBudgetModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Edit Budget Modal ===== */}
        {edit && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEdit(null)}>
            <div className="modal">
              <div className="modal-header center">
                <h3 className="modal-title">Edit Budget</h3>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <label>Category</label>
                  <select
                    className="input"
                    value={String(edit.category_id)}
                    onChange={(e) => setEdit((x) => ({ ...x, category_id: e.target.value }))}
                  >
                    {categories.length === 0 && <option disabled>No categories</option>}
                    {categories.map((c) => {
                      const id = (c.category_id ?? c.id)?.toString();
                      const name = c.category_name ?? c.name ?? `Category ${id ?? ""}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-row">
                  <label>Amount</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={edit.budget_amount}
                    onChange={(e) => setEdit((x) => ({ ...x, budget_amount: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <label>Cycle month</label>
                  <input
                    type="month"
                    className="input"
                    value={edit.cycle_month}
                    onChange={(e) => setEdit((x) => ({ ...x, cycle_month: e.target.value }))}
                  />
                </div>

                <div className="modal-actions center">
                  <button
                    type="button"
                    className="btn btn-purple"
                    disabled={savingEdit || !edit.category_id || !edit.budget_amount || Number(edit.budget_amount) <= 0}
                    onClick={updateBudget}
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="btn" onClick={() => setEdit(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Confirm Delete ===== */}
        {confirm && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirm(null)}>
            <div className="modal" role="dialog" aria-modal="true">
              <div className="modal-header center">
                <h3 className="modal-title">Delete budget?</h3>
              </div>
              <div className="modal-body">
                <p className="muted" style={{ textAlign: "center" }}>
                  ต้องการลบงบประมาณ <b>{confirm.name}</b> ใช่ไหม การลบจะไม่สามารถเรียกคืนได้
                </p>
                <div className="modal-actions center" style={{ gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-red"
                    onClick={doDelete}
                    disabled={deletingId === String(confirm.id)}
                  >
                    {deletingId === String(confirm.id) ? "Deleting..." : "Delete"}
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirm(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Add Transaction Modal ===== */}
        {showTxnModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTxnModal(false)}>
            <div className="modal">
              <div className="modal-header center">
                <h3 className="modal-title">Add Transaction</h3>
              </div>
              <div className="modal-body">
                {txnError && <div className="error" style={{ marginBottom: 12 }}>{txnError}</div>}

                <div className="form-grid-2">
                  <div className="form-row">
                    {/* 🔒 ล็อกเป็น "วันนี้" แก้ไม่ได้/คลิกไม่ได้ */}
                    <input
                      ref={firstInputRef}
                      type="date"
                      className="input"
                      value={todayISO}
                      readOnly
                      onKeyDown={(e) => e.preventDefault()}
                      onMouseDown={(e) => e.preventDefault()}
                      style={{ cursor: "not-allowed", background: "var(--panel)" }}
                      title="Fixed to today"
                    />
                  </div>

                  <div className="form-row">
                    <select className="input" value={txnType} onChange={(e) => setTxnType(e.target.value)}>
                      <option value="" disabled>Type</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      className="input"
                      value={String(txnCategory || 0)}
                      onChange={(e) => setTxnCategory(Number(e.target.value))}
                    >
                      {categories.length === 0 && <option disabled>No categories</option>}
                      {categories.map((c) => {
                        const id = Number(c.category_id ?? c.id ?? 0);
                        const name = c.category_name ?? c.name ?? `Category ${id || ""}`;
                        return (
                          <option key={id} value={id}>{name}</option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-row">
                    <input
                      type="number"
                      className="input"
                      placeholder="Amount"
                      min="0.01"
                      step="0.01"
                      value={txnAmount}
                      onChange={(e) => setTxnAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Note"
                    value={txnNote}
                    onChange={(e) => setTxnNote(e.target.value)}
                  />
                </div>

                <div className="modal-actions center">
                  <button
                    type="button"
                    className="btn btn-green"
                    disabled={
                      txnSaving ||
                      !txnType ||
                      !txnCategory ||
                      !txnAmount ||
                      Number(txnAmount) <= 0 ||
                      !activeBudgetCatIds.has(String(txnCategory)) // ⛔️ ไม่มี budget ก็ห้ามกด
                    }
                    onClick={addTransaction}
                  >
                    {txnSaving ? "Saving..." : "Add"}
                  </button>
                  <button type="button" className="btn" onClick={() => setShowTxnModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
