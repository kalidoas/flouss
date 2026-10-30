import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { AddIncomeModal } from '../components/transactions/AddIncomeModal';
import { IncomeSourceModal } from '../components/income/IncomeSourceModal';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { formatMAD, getCurrentMonthStr, formatMonthYear } from '../utils/formatters';
import { getCategoryIcon } from '../utils/icons';
import { translations } from '../i18n/translations';
import { IncomeSource, Transaction } from '../types';
import { getIncomeSourceName } from '../utils/i18nHelpers';
import { EmptyState } from '../components/common/EmptyState';
import {
  Plus,
  Briefcase,
  TrendingUp,
  Layers,
  ArrowDownLeft,
} from 'lucide-react';

export const IncomePage: React.FC = () => {
  const { incomeSources, transactions, hideBalance, language } = useAppStore();
  const t = translations[language].income;

  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [prefilledSourceId, setPrefilledSourceId] = useState<string | undefined>();

  // Filter only income transactions
  const allIncomeTransactions = transactions.filter((tx: Transaction) => tx.type === 'income');

  // Income transactions filtered by month and source
  const filteredIncomeTransactions = allIncomeTransactions.filter((tx: Transaction) => {
    if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) {
      return false;
    }
    if (selectedSourceFilter !== 'all' && tx.sourceId !== selectedSourceFilter) {
      return false;
    }
    return true;
  });

  // Calculate total earned per source for the selected period
  const sourceStats = incomeSources.map((source: IncomeSource) => {
    const txForSource = allIncomeTransactions.filter((tx: Transaction) => {
      if (tx.sourceId !== source.id) return false;
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
      return true;
    });

    const total = txForSource.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    const count = txForSource.length;

    return {
      source,
      total,
      count,
    };
  });

  // Total for the selected period
  const totalFilteredIncome = filteredIncomeTransactions.reduce(
    (sum: number, tx: Transaction) => sum + tx.amount,
    0
  );

  // All-time total
  const totalAllTimeIncome = allIncomeTransactions.reduce(
    (sum: number, tx: Transaction) => sum + tx.amount,
    0
  );

  // Month list available in transactions
  const availableMonths: string[] = Array.from(
    new Set(allIncomeTransactions.map((tx: Transaction) => tx.date.substring(0, 7)))
  ).sort((a: string, b: string) => b.localeCompare(a));

  if (!availableMonths.includes(getCurrentMonthStr())) {
    availableMonths.unshift(getCurrentMonthStr());
  }

  const handleOpenAddForSource = (sourceId: string) => {
    setPrefilledSourceId(sourceId);
    setIsAddIncomeOpen(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 sm:space-y-8 animate-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsAddSourceOpen(true)}
            icon={<Layers className="w-4 h-4" />}
          >
            {t.newSource}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setPrefilledSourceId(undefined);
              setIsAddIncomeOpen(true);
            }}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            + {t.newIncome}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span className="font-medium text-[11px]">
              {t.totalEarned} ({selectedMonth === 'all' ? 'Toutes périodes' : formatMonthYear(selectedMonth, language)})
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className={`text-xl sm:text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            {formatMAD(totalFilteredIncome, false, language)}
          </div>
          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
            {filteredIncomeTransactions.length} versement(s) comptabilisé(s)
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span className="font-medium text-[11px]">
              {t.allTimeIncome}
            </span>
            <Briefcase className="w-3.5 h-3.5 text-[#787774]" />
          </div>
          <div className={`text-xl sm:text-2xl font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            {formatMAD(totalAllTimeIncome, false, language)}
          </div>
          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
            Depuis le début
          </p>
        </Card>
      </div>

      {/* Breakdown by Source Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] uppercase tracking-wider">
            {t.sources}
          </h2>
          <span className="text-xs text-[#787774]">
            {incomeSources.length} sources actives
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sourceStats.map(({ source, total, count }: { source: IncomeSource; total: number; count: number }) => {
            const IconComp = getCategoryIcon(source.icon);
            return (
              <div
                key={source.id}
                className="p-3.5 rounded-lg bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm flex items-center justify-between gap-3 group hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: source.color }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm text-[#37352f] dark:text-[#ecebed] truncate">
                      {getIncomeSourceName(source, language)}
                    </h3>
                    <p className="text-[11px] text-[#787774]">
                      {count} versement(s)
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                    {formatMAD(total, false, language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForSource(source.id)}
                    className="mt-0.5 text-[10px] text-[#2383e2] hover:underline"
                  >
                    + Encaisser
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar for Income History */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-3 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
        <h2 className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] uppercase tracking-wider">
          {t.historyTitle} ({filteredIncomeTransactions.length})
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
          >
            <option value="all">Tous les mois</option>
            {availableMonths.map((m: string) => (
              <option key={m} value={m}>
                {formatMonthYear(m, language)}
              </option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
          >
            <option value="all">Toutes les sources</option>
            {incomeSources.map((s: IncomeSource) => (
              <option key={s.id} value={s.id}>
                {getIncomeSourceName(s, language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Income Transactions List */}
      {filteredIncomeTransactions.length === 0 ? (
        <EmptyState
          icon={<ArrowDownLeft className="w-5 h-5" />}
          title={t.noIncomeFound}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPrefilledSourceId(undefined);
                setIsAddIncomeOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Encaisser un revenu
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredIncomeTransactions.map((tx: Transaction) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              hideBalance={hideBalance}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        defaultSourceId={prefilledSourceId}
      />

      <IncomeSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
      />
    </div>
  );
};
