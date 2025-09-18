//test
"use client";

import { useState, useEffect } from 'react';
import DashboardContent from './DashboardContent';

// ส่วน Supabase ยังไม่พร้อม ไว้ก่อน
// const supabaseUrl = 'https://your-project-id.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const [viewType, setViewType] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expensesData, setExpensesData] = useState([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [yearlyExpense, setYearlyExpense] = useState(0);

  // ใช้ข้อมูล dummy แทนการ fetch จาก Supabase
  useEffect(() => {
    // ฟังก์ชัน mock แทน fetchExpenses
    const mockExpenses = () => {
      const dummyData = [
        { category: 'Investment', amount: 5000 },
        { category: 'Food', amount: 2000 },
        { category: 'Shopping', amount: 3000 },
      ];
      const grouped = dummyData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {});
      const processedData = Object.entries(grouped).map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      }));
      setExpensesData(processedData);
      setTotalExpenses(processedData.reduce((sum, item) => sum + item.value, 0));
    };

    // ฟังก์ชัน mock แทน fetchIncomeExpenses
    const mockIncomeExpenses = () => {
      const dummyData = [
        { month: 'Jan', type: 'income', amount: 10000 },
        { month: 'Jan', type: 'expense', amount: 4000 },
        { month: 'Feb', type: 'income', amount: 8000 },
        { month: 'Feb', type: 'expense', amount: 3000 },
      ];
      const monthlyData = {};
      dummyData.forEach(item => {
        if (!monthlyData[item.month]) {
          monthlyData[item.month] = { income: 0, expense: 0 };
        }
        if (item.type === 'income') {
          monthlyData[item.month].income += item.amount;
        } else {
          monthlyData[item.month].expense += item.amount;
        }
      });
      const processedData = Object.entries(monthlyData).map(([month, values]) => ({
        month,
        income: values.income,
        expense: values.expense,
      }));
      setIncomeExpenseData(processedData);
      setYearlyIncome(processedData.reduce((sum, item) => sum + item.income, 0));
      setYearlyExpense(processedData.reduce((sum, item) => sum + item.expense, 0));
    };

    // ฟังก์ชัน mock แทน fetchSummary
    const mockSummary = () => {
      setSummaryData([
        { period: 'Dec 24', income: 10000, expense: 4000, balance: 6000 },
        { period: 'Nov 24', income: 8000, expense: 3000, balance: 5000 },
        { period: 'Oct 24', income: 7000, expense: 2000, balance: 5000 },
      ]);
    };

    mockExpenses();
    mockIncomeExpenses();
    mockSummary();
  }, [categoryFilter]);

  const getCategoryColor = (category) => {
    const colors = {
      Investment: '#8B5CF6',
      Food: '#10B981',
      Shopping: '#F59E0B',
      Others: '#EF4444',
    };
    return colors[category] || '#6B7280';
  };

  const handleViewChange = (type) => {
    setViewType(type);
  };

  const handleCategoryChange = (category) => {
    setCategoryFilter(category);
  };

  return (
    <div className="min-h-screen bg-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardContent
          viewType={viewType}
          categoryFilter={categoryFilter}
          expensesData={expensesData}
          incomeExpenseData={incomeExpenseData}
          summaryData={summaryData}
          totalExpenses={totalExpenses}
          yearlyIncome={yearlyIncome}
          yearlyExpense={yearlyExpense}
          onViewChange={handleViewChange}
          onCategoryChange={handleCategoryChange}
          getCategoryColor={getCategoryColor}
        />
      </div>
    </div>
  );
}