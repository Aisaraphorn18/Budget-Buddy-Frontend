'use client';
import { useState, useEffect } from 'react';
import './Tran.css';

const TransactionsPage = () => {
    const mockTransactions = [
        { category: 'Income', note: 'Mom give', date: '08 Jan, 2022', type: 'income', amount: '217.90' },
        { category: 'Income', note: 'Mom give', date: '06 Jan, 2022', type: 'income', amount: '329.90' },
        { category: 'Foods and Groceries', note: 'Suki Tei', date: '03 Jan, 2022', type: 'expense', amount: '-549.90' },
        { category: 'Foods and Groceries', note: 'KFC', date: '01 Jan, 2022', type: 'expense', amount: '-238.90' },
        { category: 'Foods and Groceries', note: 'Spotify', date: '31 Dec, 2021', type: 'expense', amount: '-283.90' },
        { category: 'Income', note: 'Mom give', date: '24 Dec, 2021', type: 'income', amount: '237.90' },
        { category: 'Income', note: 'Bonus', date: '20 Dec, 2021', type: 'income', amount: '500.00' },
        { category: 'Shopping', note: 'Clothes', date: '18 Dec, 2021', type: 'expense', amount: '-450.00' },
        { category: 'Foods and Groceries', note: 'Market', date: '15 Dec, 2021', type: 'expense', amount: '-150.00' },
        { category: 'Income', note: 'Freelance', date: '10 Dec, 2021', type: 'income', amount: '300.00' },
        { category: 'Transport', note: 'Taxi', date: '08 Dec, 2021', type: 'expense', amount: '-200.00' },
        { category: 'Income', note: 'Gift', date: '05 Dec, 2021', type: 'income', amount: '100.00' }
    ];

    const [transactions, setTransactions] = useState(mockTransactions);

    return (
        <div>
            <header>
                <h1>Recent Transactions</h1>
                <p>ดูธุรกรรมล่าสุดของคุณ</p>
            </header>
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
                        {transactions.map((transaction, index) => (
                            <tr key={index}>
                                <td className="category-note">{transaction.category} / {transaction.note}</td>
                                <td className="date">{transaction.date}</td>
                                <td className={`type-${transaction.type}`}>
                                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                </td>
                                <td className={transaction.type === 'income' ? 'income-amount' : 'expense-amount'}>
                                    {transaction.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="data-date">
                    ข้อมูล ณ วันที่ {new Date().toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
            </div>
        </div>
    );
};

export default TransactionsPage;