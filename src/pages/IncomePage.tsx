import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { AddIncomeModal } from '../components/transactions/AddIncomeModal';
import { IncomeSourceModal } from '../components/income/IncomeSourceModal';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { formatMAD, getCurrentMonthStr, formatMonthYear, isTransactionInMonth, getTransactionMonth, formatDate } from '../utils/formatters';
import { selectFinancialSummary } from '../utils/calculations';
import { getCategoryIcon } from '../utils/icons';
import { translations } from '../i18n/translations';
import { IncomeSource, Transaction } from '../types';
import { getIncomeSourceName } from '../utils/i18nHelpers';
import { EmptyState } from '../components/common/EmptyState';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { StyledSelect } from '../components/common/StyledSelect';
import {
  Plus,
  Briefcase,
  TrendingUp,
  Layers,
  ArrowDownLeft,
} from 'lucide-react';

export const IncomePage: React.FC = () => {
  const { incomeSources = [], transactions = [], hideBalance, language } = useAppStore();
  const t = translations[language].income;

  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [prefilledSourceId, setPrefilledSourceId] = useState<string | undefined>();

  // Filter only income transactions
  const allIncomeTransactions = (transactions || []).filter((tx: Transaction) => tx?.type === 'income');

  // Income transactions filtered by month and source
  const filteredIncomeTransactions = allIncomeTransactions.filter((tx: Transaction) => {
    if (selectedMonth !== 'all' && !isTransactionInMonth(tx.date, selectedMonth)) {
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
      if (selectedMonth !== 'all' && !isTransactionInMonth(tx.date, selectedMonth)) return false;
      return true;
    });

    const total = selectFinancialSummary(txForSource).income;
    const count = txForSource.length;

    return {
      source,
      total,
      count,
    };
  });

  // Total for the selected period with exact currency arithmetic
  const totalFilteredIncome = selectFinancialSummary(filteredIncomeTransactions).income;

  // All-time total
  const totalAllTimeIncome = selectFinancialSummary(allIncomeTransactions).income;

  // Month list available in transactions
  const availableMonths: string[] = Array.from(
    new Set(allIncomeTransactions.map((tx: Transaction) => getTransactionMonth(tx.date)))
  ).filter(Boolean).sort((a: string, b: string) => b.localeCompare(a));

  if (!availableMonths.includes(getCurrentMonthStr())) {
    availableMonths.unshift(getCurrentMonthStr());
  }

  const handleOpenAddForSource = (sourceId: string) => {
    setPrefilledSourceId(sourceId);
    setIsAddIncomeOpen(true);
  };

  // Group filtered income transactions by date
  const groupedIncomeTransactions = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const map = new Map<string, { dateKey: string; label: string; total: number; transactions: Transaction[] }>();

    filteredIncomeTransactions.forEach((tx) => {
      const d = tx.date.split('T')[0];
      if (!map.has(d)) {
        let label = formatDate(d, language);
        if (d === todayKey) {
          label = language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today';
        } else if (d === yesterdayKey) {
          label = language === 'ar' ? 'أمس' : language === 'fr' ? 'Hier' : 'Yesterday';
        }
        map.set(d, { dateKey: d, label, total: 0, transactions: [] });
      }
      const g = map.get(d)!;
      g.transactions.push(tx);
      g.total += Number(tx.amount) || 0;
    });

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredIncomeTransactions, language]);

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-page select-text pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddSourceOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 px-4 py-2 text-xs font-medium backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.newSource}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPrefilledSourceId(undefined);
              setIsAddIncomeOpen(true);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white text-zinc-950 font-semibold px-5 py-2 text-sm shadow-sm hover:bg-zinc-200 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newIncome}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Emerald Corner Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.15), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-2">
            <span>
              {t.totalEarned} ({selectedMonth === 'all' ? t.allPeriods : formatMonthYear(selectedMonth, language)})
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold text-emerald-400 tracking-tight tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            <MoneyText amount={totalFilteredIncome} />
          </div>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            {t.depositsLogged.replace('{count}', String(filteredIncomeTransactions.length))}
          </p>
        </div>

        <div
          className="rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-2">
            <span>{t.allTimeIncome}</span>
            <span className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            <MoneyText amount={totalAllTimeIncome} />
          </div>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            {t.sinceStart}
          </p>
        </div>
      </div>

      {/* Breakdown by Source Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
            {t.sources}
          </h2>
          <span className="text-xs text-zinc-500 font-medium">
            {t.activeSources.replace('{count}', String(incomeSources.length))}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sourceStats.filter(({ count }) => count > 0).map(({ source, total, count }: { source: IncomeSource; total: number; count: number }) => {
            const IconComp = getCategoryIcon(source.icon);
            return (
              <div
                key={source.id}
                className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: source.color || '#10b981' }}
                  >
                    <IconComp className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                      {getIncomeSourceName(source, language)}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {t.depositsLogged.replace('{count}', String(count))}
                    </p>
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <div className={`text-xs sm:text-sm font-bold text-emerald-400 tabular-nums ${hideBalance ? 'privacy-blur' : ''}`}>
                    <MoneyText amount={total} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForSource(source.id)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.cashIn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <details className="mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold text-zinc-300">
            <span>{t.newSource}</span>
            <Plus className="h-4 w-4 text-indigo-400" />
          </summary>
          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] py-3">
            {sourceStats.filter(({ count }) => count === 0).map(({ source }) => (
              <button key={source.id} type="button" onClick={() => handleOpenAddForSource(source.id)} className="min-h-9 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-3.5 text-xs text-zinc-300 transition-colors">
                {getIncomeSourceName(source, language)}
              </button>
            ))}
            <button type="button" onClick={() => setIsAddSourceOpen(true)} className="min-h-9 rounded-full bg-indigo-500/15 border border-indigo-500/25 px-4 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors">
              {t.newSource}
            </button>
          </div>
        </details>
      </div>

      {/* Filter bar for Income History */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
          {t.historyTitle} ({filteredIncomeTransactions.length})
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month selector */}
          <StyledSelect
            label={t.allMonths}
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="min-w-36"
            options={[
              { value: 'all', label: t.allMonths },
              ...availableMonths.map((m: string) => ({
                value: m,
                label: formatMonthYear(m, language),
              })),
            ]}
          />

          {/* Source filter */}
          <StyledSelect
            label={t.allSources}
            value={selectedSourceFilter}
            onChange={setSelectedSourceFilter}
            className="min-w-36"
            options={[
              { value: 'all', label: t.allSources },
              ...incomeSources.map((s: IncomeSource) => ({
                value: s.id,
                label: getIncomeSourceName(s, language),
              })),
            ]}
          />
        </div>
      </div>

      {/* Date-Grouped Income Ledger List */}
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
              {t.cashIn}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {groupedIncomeTransactions.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {group.label}
                </span>
                <span className="text-xs font-bold tabular-nums text-emerald-400">
                  + <MoneyText amount={group.total} />
                </span>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                {group.transactions.map((tx: Transaction) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    hideBalance={hideBalance}
                  />
                ))}
              </div>
            </div>
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
