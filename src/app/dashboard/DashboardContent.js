"use client";

import { useState } from 'react';

export default function DashboardContent({
  viewType,
  categoryFilter,
  expensesData,
  incomeExpenseData,
  summaryData,
  totalExpenses,
  yearlyIncome,
  yearlyExpense,
  onViewChange,
  onCategoryChange,
  getCategoryColor,
}) {
  const [language, setLanguage] = useState('th');

  const categories = ['all', 'Investment', 'Food', 'Shopping', 'Others'];

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">All Expenses</h2>
            {/* PieChart component would go here */}
            <div className="flex justify-center mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{totalExpenses.toLocaleString()} บาท</div>
                <div className="text-sm text-gray-500">Total Expenses</div>
              </div>
            </div>
            <div className="flex justify-center mt-4 space-x-8">
              {expensesData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-4 h-4" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">Data as of December 20, 2024</div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          {expensesData.map((item) => (
            <div key={item.name} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: item.color }}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{((item.value / totalExpenses) * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{item.value.toFixed(2)} บาท</div>
                <div className="text-sm text-pink-500">→</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Total Income (บาท)</h2>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500"></div>
              <span className="text-sm">Total Income (บาท)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500"></div>
              <span className="text-sm">Total Expense (บาท)</span>
            </div>
          </div>
        </div>
        {/* BarChart component would go here */}
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          <div>{yearlyIncome.toLocaleString()} Income & Expense Summary January 2024 - December 2024</div>
          <div>{yearlyExpense.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryData.map((item) => (
          <div key={item.period} className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">{item.period}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Income :</span>
                <span className="text-green-600 font-medium">{item.income.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expenses :</span>
                <span className="text-red-600 font-medium">{item.expense.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span>Net Balance :</span>
                <span className="text-green-600 font-bold">{item.balance.toLocaleString()} บาท</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderCategory = () => (
    <div className="lg:col-span-1 space-y-4">
      {expensesData.map((item) => (
        <div key={item.name} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: item.color }}>
              {item.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{((item.value / totalExpenses) * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">{item.value.toFixed(2)} บาท</div>
            <div className="text-sm text-pink-500">→</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Chart</h1>
          <p className="text-gray-600">Keep track your financial plan</p>
        </div>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${language === 'th' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setLanguage('th')}
          >
            ภาษาไทย
          </button>
          <button
            className={`px-4 py-2 rounded-md ${language === 'en' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
        </div>
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border rounded-md"
            value={viewType}
            onChange={(e) => onViewChange(e.target.value)}
          >
            <option value="overview">Overview</option>
            <option value="category">Category</option>
          </select>
          <select
            className="px-4 py-2 border rounded-md"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={viewType === 'overview'}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewType === 'overview' ? renderOverview() : renderCategory()}
    </>
  );
}