// src/app/Home/home.js
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
// YYYY-MM ของเดือนปัจจุบัน
const currentMonthISO = () => {
  const dd = new Date();
  const m = String(dd.getMonth() + 1).padStart(2, "0");
  return `${dd.getFullYear()}-${m}`;
};

export default function Home() {
  const router = useRouter();

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

  /* ===== Month (สำหรับสรุป/กรองธุรกรรมหน้าบ้านเท่านั้น) ===== */
  const [monthISO] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const isInSelectedMonth = useCallback(
    (t) => String(t.date ?? t.transaction_date ?? t.created_at ?? "").slice(0, 7) === monthISO,
    [monthISO]
  );

  /* ===== Data ===== */
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const balance = useMemo(() => income - expenses, [income, expenses]);

  const [budgets, setBudgets] = useState([]); // budgets ของ “เดือนปัจจุบัน” เท่านั้น
  const [categories, setCategories] = useState([]);
  const [txns, setTxns] = useState([]);

  const [loading, setLoading] = useState(false);
  const [budError, setBudError] = useState("");
  const [catsError, setCatsError] = useState("");
  const [txnError, setTxnError] = useState("");

  const didLoadOnce = useRef(false);

  /* ===== Modals ===== */
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);

  // Edit modal
  const [edit, setEdit] = useState(null); // {id, category_id, budget_amount}
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm
  const [confirm, setConfirm] = useState(null); // {id, name}
  const [deletingId, setDeletingId] = useState("");

  /* ===== Forms ===== */
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [amount, setAmount] = useState("");
  const firstInputRef = useRef(null);

  const [createBudError, setCreateBudError] = useState(""); // ข้อความเตือนใน Create Budget
  const [createBudSaving, setCreateBudSaving] = useState(false);

  // วันนี้ (ล็อกใน add transaction)
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [txnType, setTxnType] = useState("");
  const [txnCategory, setTxnCategory] = useState(""); // string เพื่อรองรับ placeholder
  const [txnAmount, setTxnAmount] = useState("");
  const [txnNote, setTxnNote] = useState("");
  const [txnSaving, setTxnSaving] = useState(false);
  const catSelectRef = useRef(null);

  /* ===== Filters ===== */
  // ✅ ใช้ category_id เท่านั้น (เลิกใช้ b.id เป็น fallback)
  const activeBudgetCatIds = useMemo(() => {
    const s = new Set();
    for (const b of budgets) s.add(String(b.category_id ?? ""));
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
        // ⭐ โหลด budgets เฉพาะเดือนปัจจุบัน
        api.get("/protected/api/v1/budgets", { params: { cycle_month: monthISO } }),
        api.get("/protected/api/v1/transactions", { params: { month: monthISO } }),
      ]);

      const cats = pickItems(catsRes);
      const buds = pickItems(budRes);
      const txs = pickItems(txnRes);

      setCategories(cats);
      setBudgets(buds);
      setTxns(txs);

      if (!selectedCategory && cats[0]) {
        const firstId = Number(cats[0].category_id ?? cats[0].id ?? 0);
        setSelectedCategory(firstId);
      }

      // ✅ ใช้ category_id เท่านั้น (เลิกใช้ b.id เป็น fallback)
      const budSet = new Set(buds.map((b) => String(b.category_id ?? "")));

      const inc = txs
        .filter((t) => String(t.type ?? "").toLowerCase() === "income" && isInSelectedMonth(t))
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const exp = txs
        .filter(
          (t) =>
            String(t.type ?? "").toLowerCase() === "expense" &&
            isInSelectedMonth(t) &&
            budSet.has(String(t.category_id ?? t.categoryId ?? ""))
        )
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

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
      didLoadOnce.current = true;
    }
  }, [monthISO, isInSelectedMonth, selectedCategory]);

  /* ===== Auto refresh on return ===== */
  useEffect(() => {
    loadAll();
    const onFocus = () => loadAll();
    window.addEventListener("focus", onFocus);
    const onPageShow = (e) => {
      if (e.persisted) router.refresh();
      loadAll();
    };
    window.addEventListener("pageshow", onPageShow);
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadAll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadAll, router]);

  /* ===== Actions ===== */

  // ✅ กันซ้ำเฉพาะเดือนนี้ด้วย category_id เท่านั้น
  const isDupCategoryThisMonth = useMemo(
    () => budgets.some((b) => String(b.category_id ?? "") === String(selectedCategory)),
    [budgets, selectedCategory]
  );

  const createBudget = async () => {
    try {
      setCreateBudError("");
      setCreateBudSaving(true);

      if (isDupCategoryThisMonth) {
        setCreateBudError("ไม่สามารถสร้าง Budget ได้หมวดหมู่นี้ถูกสร้างไว้แล้วในเดือนนี้");
        return;
      }

      await api.post("/protected/api/v1/budgets", {
        category_id: Number(selectedCategory),
        budget_amount: Number(amount),
        cycle_month: monthISO,
      });

      setShowBudgetModal(false);
      setAmount("");
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setCreateBudError("ไม่สามารถสร้าง Budget ได้: หมวดหมู่นี้ถูกสร้างไว้แล้วในเดือนนี้");
        } else {
          const data = err.response?.data;
          const apiMsg = typeof data === "string" ? data : data?.message;
          setCreateBudError(apiMsg || "สร้าง Budget ไม่สำเร็จ");
        }
      } else {
        setCreateBudError("เกิดข้อผิดพลาด");
      }
    } finally {
      setCreateBudSaving(false);
    }
  };

  // Add Transaction: อนุญาตเสมอแม้ไม่มี Budget
  const addTransaction = async () => {
    try {
      setTxnSaving(true);
      setTxnError("");

      await api.post("/protected/api/v1/transactions", {
        category_id: Number(txnCategory || 0),
        type: txnType,
        amount: Number(txnAmount),
        note: txnNote || "",
        date: todayISO,
      });

      setShowTxnModal(false);
      setTxnAmount("");
      setTxnNote("");
      setTxnCategory("");
      setTxnType("");
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

  // บังคับเลข id ให้ชัด
  const openConfirm = (b) => {
    const id = Number(b.budget_id ?? b.id);
    const name = b.category_name ?? catName(b.category_id) ?? `Budget ${id}`;
    setConfirm({ id, name });
  };

  // ลบแบบตรวจสถานะเอง
  const doDelete = async () => {
    try {
      setDeletingId(String(confirm.id));

      const res = await api.request({
        url: `/protected/api/v1/budgets/${confirm.id}`,
        method: "DELETE",
        headers: {
          ...(api.defaults.headers?.common?.Authorization
            ? { Authorization: api.defaults.headers.common.Authorization }
            : {}),
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      });

      const ok = res.status === 200 || res.status === 204 || res.data?.success === true;
      if (!ok) throw new Error(res.data?.message || `Delete failed (status ${res.status})`);

      setConfirm(null);
      await loadAll();
    } catch (err) {
      console.error("Delete budget error:", err);
      alert(err?.message || "ลบ Budget ไม่สำเร็จ");
    } finally {
      setDeletingId("");
    }
  };

  // ช่วยเลือกหมวดที่ "ยังไม่มี budget เดือนนี้" อัตโนมัติ
  const openCreateBudgetModal = () => {
    setAmount("");
    setCreateBudError("");

    const taken = new Set(budgets.map((b) => String(b.category_id ?? "")));
    const firstFree = categories.find(
      (c) => !taken.has(String(c.category_id ?? c.id ?? ""))
    );

    if (firstFree) {
      setSelectedCategory(Number(firstFree.category_id ?? firstFree.id));
    } else if (categories[0]) {
      setSelectedCategory(Number(categories[0].category_id ?? categories[0].id));
    }

    setShowBudgetModal(true);
  };

  /* ===== UI ===== */
  return (
    <div className="app wallet-vars">
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
                setTxnType("");
                setTxnCategory("");
                setTxnAmount("");
                setTxnNote("");
                setTxnError("");
                setShowTxnModal(true);
              }}
            >
              + add transaction
            </button>

            <button className="btn btn-red" onClick={openCreateBudgetModal}>
              + create budget
            </button>
          </div>
        </div>

        {/* ===== Budget grid ===== */}
        <section className="budget-grid">
          {!didLoadOnce.current && loading && <div className="muted">กำลังโหลดข้อมูล…</div>}
          {budError && <div className="error">{budError}</div>}
          {didLoadOnce.current && !loading && !budError && budgetsView.length === 0 && (
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
                    <button className="icon-btn" title="Edit" onClick={() => setEdit({
                      id: b.budget_id ?? b.id,
                      category_id: String(b.category_id ?? ""),
                      budget_amount: String(b.budget_amount ?? ""),
                    })}>
                      <img className="icon" src="/edit.png" alt="edit" />
                    </button>
                    <button className="icon-btn" title="Delete" onClick={() => openConfirm({ ...b, id })}>
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
                {createBudError && (
                  <div className="error" style={{ marginBottom: 12, textAlign: "center" }}>
                    {createBudError}
                  </div>
                )}

                <div className="form-row">
                  <label>Category</label>
                  <select
                    className="input"
                    value={String(selectedCategory || 0)}
                    onChange={(e) => {
                      setSelectedCategory(Number(e.target.value));
                      setCreateBudError(""); // เปลี่ยนหมวดแล้วเคลียร์ error
                    }}
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
                    disabled={!selectedCategory || !amount || Number(amount) <= 0 || createBudSaving}
                    onClick={createBudget}
                  >
                    {createBudSaving ? "Creating..." : "Create"}
                  </button>
                  <button type="button" className="btn" onClick={() => setShowBudgetModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Edit Budget Modal (Category read-only) ===== */}
        {edit && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEdit(null)}>
            <div className="modal">
              <div className="modal-header center">
                <h3 className="modal-title">Edit Budget</h3>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <label>Category</label>
                  <input className="input" type="text" value={catName(edit.category_id)} readOnly />
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

                <div className="modal-actions center">
                  <button
                    type="button"
                    className="btn btn-purple"
                    disabled={savingEdit || !edit.budget_amount || Number(edit.budget_amount) <= 0}
                    onClick={async () => {
                      try {
                        setSavingEdit(true);
                        await api.put(`/protected/api/v1/budgets/${edit.id}`, {
                          category_id: Number(edit.category_id),
                          budget_amount: Number(edit.budget_amount),
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
                    }}
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
                      <option value="" disabled hidden>Type</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      className="input"
                      value={txnCategory}
                      onChange={(e) => setTxnCategory(e.target.value)}
                      ref={catSelectRef}
                    >
                      <option value="" disabled hidden>Category</option>
                      {categories.length === 0 && <option disabled>No categories</option>}
                      {categories.map((c) => {
                        const id = String(c.category_id ?? c.id ?? "");
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
                    disabled={txnSaving || !txnType || !txnCategory || !txnAmount || Number(txnAmount) <= 0}
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
