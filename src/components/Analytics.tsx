import React from 'react';
import { Card } from './common/Card';
import { useAppStore } from '../store/useAppStore';

export const Analytics: React.FC = () => {
  const { transactions } = useAppStore();

  // Calculate analytics data
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h2>Total Income</h2>
          <p>{totalIncome.toFixed(2)} MAD</p>
        </Card>
        <Card>
          <h2>Total Expenses</h2>
          <p>{totalExpenses.toFixed(2)} MAD</p>
        </Card>
        <Card>
          <h2>Current Balance</h2>
          <p>{balance.toFixed(2)} MAD</p>
        </Card>
      </div>
    </div>
  );
};