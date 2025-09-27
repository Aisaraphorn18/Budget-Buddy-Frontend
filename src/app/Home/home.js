"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/app/components/sidebar";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./home.css";

export default function Home() {
  const [dark, setDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Modal & ฟอร์ม
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");

  // Categories จาก backend
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState("");

  const firstInputRef = useRef(null);
  const router = useRouter();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeModal = () => setShowModal(false);

  // โหมดมืด
  useEffect(() => {
    if (dark) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [dark]);

  // โฟกัส input แรก + ปิดด้วย Esc + ล็อกสกรอลเมื่อเปิด modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    if (showModal) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
      setTimeout(() => firstInputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  // โหลดหมวดหมู่จาก backend (ต้องมี JWT)
  useEffect(() => {
    if (!showModal || catsLoading) return; // ยิงเมื่อเปิด modal เท่านั้น
    if (categories.length > 0) return; // มีแล้วไม่ดึงซ้ำ

    const controller = new AbortController();

    (async () => {
      try {
        setCatsLoading(true);
        setCatsError("");

        const token = localStorage.getItem("token");
        if (!token) {
          setCatsError("ยังไม่ได้ล็อกอิน");
          // ทางเลือก: ส่งไปหน้า Login
          // router.push("/Login");
          return;
        }

        const res = await axios.get(
          "http://localhost:4000/protected/api/v1/categories",
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal, // ยกเลิกได้ถ้า modal ปิด
          }
        );

        // รองรับทั้ง {data: [...]} และ [...]
        const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCategories(items);

        // ตั้งค่า default ของ select
        if (items.length > 0) {
          const firstId = (items[0].category_id ?? items[0].id)?.toString() ?? "";
          setSelectedCategory(firstId);
        } else {
          setSelectedCategory("");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.name === "CanceledError") return; // ถูกยกเลิก ไม่ต้องทำอะไร
          if (err.response?.status === 401) {
            setCatsError("สิทธิ์ไม่ถูกต้อง (401) — กรุณาเข้าสู่ระบบใหม่");
            // router.push("/Login");
          } else if (err.response?.status === 404) {
            setCatsError("ไม่พบข้อมูลหมวดหมู่ (404)");
          } else {
            setCatsError("โหลดหมวดหมู่ไม่สำเร็จ");
          }
        } else {
          setCatsError("เกิดข้อผิดพลาดขณะโหลดหมวดหมู่");
        }
        console.error(err);
      } finally {
        setCatsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [showModal, categories.length, catsLoading, router]);

  return (
    <div className="app">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="main">
        <header className="page-head">
          <button onClick={toggleSidebar}>
            <img src="/hamburger.png" alt="icon-ham" className="iconham" />
          </button>

          <h1>My Wallet</h1>
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

        {/* Budget header + actions */}
        <div className="budget-header">
          <h2 className="section-title">Budget</h2>
          <div className="actions">
            <button className="btn btn-green">+ add transaction</button>

            <button
              className="btn btn-red"
              onClick={() => {
                setAmount("");
                setSelectedCategory("");
                setShowModal(true);
              }}
            >
              + create wallet
            </button>
          </div>
        </div>

        {/* Budget grid */}
        <section className="budget-grid">
          {[
            { name: "Travel with us", paid: "August 31, 2025", value: 300, max: 10000, pct: 30, ic: "💖" },
            { name: "Travel Plan",    paid: "August 01, 2025", value: 1000, max: 20000, pct: 50, ic: "🧳" },
            { name: "Gift",           paid: "August 01, 2025", value: 7000, max: 10000, pct: 30, ic: "🎁" },
            { name: "Netflix",        paid: "August 25, 2025", value: 300, max: 1000,  pct: 30, ic: "🅽" },
            { name: "Food",           paid: "August 25, 2025", value: 300, max: 1000,  pct: 30, ic: "🍽️" },
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
                ฿{b.value}{" "}
                <span className="muted">/ {b.max.toLocaleString()}</span>
                <span className="pct">{b.pct}%</span>
              </div>

              <div className="progress">
                <div className="bar" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </section>

        {/* ===== Modal: Create Budget ===== */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <div className="modal">
              <div className="modal-header center">
                <h3 className="modal-title">Create Budget</h3>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <label>Category</label>
                  <select
                    className="input"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {catsLoading && <option>Loading…</option>}
                    {catsError && <option disabled>{catsError}</option>}
                    {!catsLoading && !catsError && categories.length === 0 && (
                      <option disabled>No categories</option>
                    )}
                    {!catsLoading && !catsError &&
                      categories.map((c) => {
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
                    onClick={closeModal}
                    disabled={!selectedCategory || !amount}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== End Modal ===== */}
      </main>
    </div>
  );
}
