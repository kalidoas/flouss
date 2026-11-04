import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import {
  getMonthlyStats,
  getCategorySpendingBreakdown,
} from '../utils/calculations';
import { formatMAD, getCurrentMonthStr, isTransactionInMonth } from '../utils/formatters';
import { getCategoryName } from '../utils/i18nHelpers';
import { translations } from '../i18n/translations';
import { Transaction } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Percent,
  ShoppingBag,
  Award,
} from 'lucide-react';

export const StatsPage: React.FC = () => {
  const { transactions, categories, hideBalance, language } = useAppStore();
  const t = translations[language].stats;

  const currentMonth = getCurrentMonthStr();
  const monthlyStats = getMonthlyStats(transactions, 6, language);

  // Current month transactions
  const currentMonthTx = transactions.filter((tx: Transaction) => isTransactionInMonth(tx.date, currentMonth));
  const currentIncome = currentMonthTx
    .filter((tx: Transaction) => tx.type === 'income')
    .reduce((s: number, tx: Transaction) => s + tx.amount, 0);
  const currentExpense = currentMonthTx
    .filter((tx: Transaction) => tx.type === 'expense')
    .reduce((s: number, tx: Transaction) => s + tx.amount, 0);
  const currentSavings = currentMonthTx
    .filter((tx: Transaction) => tx.type === 'contribution')
    .reduce((s: number, tx: Transaction) => s + tx.amount, 0);

  // Savings rate calculation
  const savingsRate =
    currentIncome > 0
      ? Math.max(0, Math.min(100, Math.round((currentSavings / currentIncome) * 100)))
      : 0;

  // Category breakdown for current month (or all time if no expenses this month)
  const categoryBreakdownMonth = getCategorySpendingBreakdown(
    categories,
    transactions,
    currentMonth,
    language
  );

  const breakdownToDisplay =
    categoryBreakdownMonth.breakdown.length > 0
      ? categoryBreakdownMonth.breakdown
      : getCategorySpendingBreakdown(categories, transactions, undefined, language).breakdown;

  const topCategory = breakdownToDisplay[0];

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 sm:space-y-8 animate-page">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Savings Rate Card */}
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span className="font-medium text-[11px]">
              {t.savingsRate}
            </span>
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {savingsRate}%
          </div>
          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
            {currentSavings > 0 ? (
              <>
                <span className={`tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                  {formatMAD(currentSavings, false, language)}
                </span>{' '}
                mis de côté pour vos projets
              </>
            ) : (
              'Aucune contribution ce mois-ci'
            )}
          </p>
        </Card>

        {/* Top Spending Category */}
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span className="font-medium text-[11px]">
              {t.topSpendingCategory}
            </span>
            <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
          </div>
          {topCategory ? (
            <>
              <div className="text-lg font-semibold text-[#37352f] dark:text-[#ecebed] truncate">
                {(() => {
                  const cat = categories.find((c) => c.id === topCategory.id);
                  return cat ? getCategoryName(cat, language) : topCategory.name;
                })()}
              </div>
              <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
                <span className={`tabular-nums font-medium transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                  {formatMAD(topCategory.amount, false, language)}
                </span>{' '}
                ({topCategory.percentage}% du total)
              </p>
            </>
          ) : (
            <div className="text-xs text-[#787774] mt-2">Aucune dépense enregistrée</div>
          )}
        </Card>

        {/* Financial Health Status */}
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span className="font-medium text-[11px]">
              {t.summary}
            </span>
            <Award className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-lg font-semibold text-[#37352f] dark:text-[#ecebed]">
            {currentIncome >= currentExpense ? 'Budget Équilibré 👍' : 'Déficit mensuel ⚠️'}
          </div>
          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
            {currentIncome >= currentExpense ? (
              <>
                Excédent net de{' '}
                <span className={`tabular-nums font-medium transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                  {formatMAD(currentIncome - currentExpense, false, language)}
                </span>
              </>
            ) : (
              <>
                Dépenses supérieures aux revenus de{' '}
                <span className={`tabular-nums font-medium transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                  {formatMAD(currentExpense - currentIncome, false, language)}
                </span>
              </>
            )}
          </p>
        </Card>
      </div>

      {/* Monthly Bar Chart (Last 6 Months) */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.incomeVsExpense}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparaison mois par mois de vos flux financiers
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyStats}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatMAD(value, false, language),
                  name === 'income'
                    ? 'Revenus'
                    : name === 'expense'
                    ? 'Dépenses'
                    : 'Épargne',
                ]}
                contentStyle={{
                  borderRadius: '16px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) =>
                  value === 'income'
                    ? 'Revenus'
                    : value === 'expense'
                    ? 'Dépenses'
                    : 'Épargne'
                }
              />
              <Bar
                dataKey="income"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="savings"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Breakdown Table / Progress bars */}
      <Card padding="lg">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
          Répartition des dépenses par catégorie
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Classement de vos postes de dépenses par volume financier
        </p>

        {breakdownToDisplay.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucune dépense à analyser.
          </div>
        ) : (
          <div className="space-y-4">
            {breakdownToDisplay.map((item) => {
              const cat = categories.find((c) => c.id === item.id);
              const displayName = cat ? getCategoryName(cat, language) : item.name;
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#787774] text-[11px] tabular-nums">{item.percentage}%</span>
                      <span className={`font-medium text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                        {formatMAD(item.amount, false, language)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar: 0% empty */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: item.percentage === 0 ? '0%' : `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
