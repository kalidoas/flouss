import React, { useState, useMemo, useEffect } from 'react';
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
import { Money } from '../components/common/Money';
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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const handleEditTx = (e: Event) => {
      const custom = e as CustomEvent<{ transaction: Transaction }>;
      if (custom.detail?.transaction && custom.detail.transaction.type === 'income') {
        setEditingTx(custom.detail.transaction);
        setIsAddIncomeOpen(true);
      }
    };
    window.addEventListener('flouss:edit-transaction', handleEditTx);
    return () => window.removeEventListener('flouss:edit-transaction', handleEditTx);
  }, []);

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
          label = t.today;
        } else if (d === yesterdayKey) {
          label = t.yesterday;
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddSourceOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-surface border border-border-subtle text-content hover:bg-canvas/[0.04] dark:bg-surface/[0.04] dark:hover:bg-surface/[0.08] dark:border-border/[0.08] dark:text-text px-4 py-2 text-xs font-medium backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <Layers className="w-3.5 h-3.5 text-muted" />
            <span>{t.newSource}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPrefilledSourceId(undefined);
              setIsAddIncomeOpen(true);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-surface text-text font-semibold px-5 py-2 text-sm shadow-sm hover:bg-surface-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newIncome}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Emerald Corner Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="rounded-2xl bg-surface/5 p-5 sm:p-6 backdrop-blur-xl border border-border/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.15), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-muted mb-2">
            <span>
              {t.totalEarned} ({selectedMonth === 'all' ? t.allPeriods : formatMonthYear(selectedMonth, language)})
            </span>
            <span className="p-1.5 rounded-xl bg-positive/10 border border-positive/20 text-positive">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold text-positive tracking-tight tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            <Money amount={totalFilteredIncome} />
          </div>
          <p className="text-xs text-muted mt-1.5 font-medium">
            {t.depositsLogged.replace('{count}', String(filteredIncomeTransactions.length))}
          </p>
        </div>

        <div
          className="rounded-2xl bg-surface/5 p-5 sm:p-6 backdrop-blur-xl border border-border/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-muted mb-2">
            <span>{t.allTimeIncome}</span>
            <span className="p-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold text-accent-contrast tracking-tight tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            <Money amount={totalAllTimeIncome} />
          </div>
          <p className="text-xs text-muted mt-1.5 font-medium">
            {t.sinceStart}
          </p>
        </div>
      </div>

      {/* Breakdown by Source Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            {t.sources}
          </h2>
          <span className="text-xs text-muted font-medium">
            {t.activeSources.replace('{count}', String(incomeSources.length))}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sourceStats.filter(({ count }) => count > 0).map(({ source, total, count }: { source: IncomeSource; total: number; count: number }) => {
            const IconComp = getCategoryIcon(source.icon);
            return (
              <div
                key={source.id}
                className="p-4 rounded-2xl bg-surface/5 backdrop-blur-xl border border-border/10 hover:border-border/20 transition-all flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-accent-contrast shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: source.color || 'bg-positive' }}
                  >
                    <IconComp className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm text-text truncate group-hover:text-accent-contrast transition-colors">
                      {getIncomeSourceName(source, language)}
                    </h3>
                    <p className="text-[11px] text-muted mt-0.5">
                      {t.depositsLogged.replace('{count}', String(count))}
                    </p>
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <div className={`text-xs sm:text-sm font-bold text-positive tabular-nums ${hideBalance ? 'privacy-blur' : ''}`}>
                    <Money amount={total} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForSource(source.id)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-positive hover:text-positive transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.cashIn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <details className="mt-3 rounded-2xl border border-border/10 bg-surface/5 backdrop-blur-xl px-4 py-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold text-muted">
            <span>{t.newSource}</span>
            <Plus className="h-4 w-4 text-accent" />
          </summary>
          <div className="flex flex-wrap gap-2 border-t border-border/[0.06] py-3">
            {sourceStats.filter(({ count }) => count === 0).map(({ source }) => (
              <button key={source.id} type="button" onClick={() => handleOpenAddForSource(source.id)} className="min-h-9 rounded-full border border-border-subtle bg-surface hover:bg-canvas/[0.04] text-text dark:border-border/[0.08] dark:bg-surface/[0.03] dark:hover:bg-surface/[0.06] dark:text-muted px-3.5 text-xs transition-colors">
                {getIncomeSourceName(source, language)}
              </button>
            ))}
            <button type="button" onClick={() => setIsAddSourceOpen(true)} className="min-h-9 rounded-full bg-accent/15 border border-accent/25 px-4 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors">
              {t.newSource}
            </button>
          </div>
        </details>
      </div>

      {/* Filter bar for Income History */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
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
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {group.label}
                </span>
                <span className="text-xs font-bold tabular-nums text-positive">
                  + <Money amount={group.total} />
                </span>
              </div>
              <div className="rounded-2xl bg-surface/5 border border-border/10 overflow-hidden divide-y divide-border/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
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
        onClose={() => {
          setIsAddIncomeOpen(false);
          setEditingTx(null);
          setPrefilledSourceId(undefined);
        }}
        defaultSourceId={prefilledSourceId}
        transactionToEdit={editingTx}
      />

      <IncomeSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
      />
    </div>
  );
};
