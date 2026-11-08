import React from 'react';
import { Card } from './common/Card';
import { useAppStore } from '../store/useAppStore';
import { calculateAvailableBalance, selectFinancialSummary } from '../utils/calculations';
import { formatMAD } from '../utils/formatters';

export const Analytics: React.FC = () => {
  const { transactions, initialBalance, language } = useAppStore();

  // Calculate analytics data with exact currency arithmetic
  const summary = selectFinancialSummary(transactions);
  const totalIncome = summary.income;
  const totalExpenses = summary.expenses;
  const balance = calculateAvailableBalance(initialBalance, transactions);

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h2>Total Income</h2>
          <p>{formatMAD(totalIncome, false, language)}</p>
        </Card>
        <Card>
          <h2>Total Expenses</h2>
          <p>{formatMAD(totalExpenses, false, language)}</p>
        </Card>
        <Card>
          <h2>Current Balance</h2>
          <p>{formatMAD(balance, false, language)}</p>
        </Card>
      </div>
    </div>
  );
};
