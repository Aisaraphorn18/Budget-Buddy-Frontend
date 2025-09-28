"use client";

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
