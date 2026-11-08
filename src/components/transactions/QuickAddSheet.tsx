import React, { useEffect, useMemo, useState } from 'react';
import { Check, Delete } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../common/BottomSheet';
import { getCategoryName, getIncomeSourceName } from '../../utils/i18nHelpers';
import { translations } from '../../i18n/translations';
import { Transaction } from '../../types';
import { MoneyText } from '../common/PrivacyCurrency';
import { deriveFrequentExpenseCombos } from '../../utils/dashboard';
import { formatMAD } from '../../utils/formatters';

export type QuickAddType = 'expense' | 'income';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: QuickAddType;
}

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({ isOpen, onClose, initialType = 'expense' }) => {
  const { categories, incomeSources, transactions, addTransaction, deleteTransaction, showToast, language } = useAppStore();
  const t = translations[language].common;
  const tDashboard = translations[language].dashboard;
  const [type, setType] = useState<QuickAddType>(initialType);
  const [amount, setAmount] = useState('');
  const [selectionId, setSelectionId] = useState('');
  const [note, setNote] = useState('');
  const [dateTime, setDateTime] = useState(toLocalInputValue(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setType(initialType);
    setAmount('');
    setNote('');
    setError('');
    setDateTime(toLocalInputValue(new Date()));
  }, [isOpen, initialType]);

  const options = useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((tx) => {
      if (type === 'expense' && tx.type === 'expense' && tx.categoryId) {
        counts.set(tx.categoryId, (counts.get(tx.categoryId) || 0) + 1);
      }
      if (type === 'income' && tx.type === 'income' && tx.sourceId) {
        counts.set(tx.sourceId, (counts.get(tx.sourceId) || 0) + 1);
      }
    });

    const sourceOptions = type === 'income'
      ? incomeSources
      : categories.filter((category) => !category.isArchived && !category.isGoal);
    return [...sourceOptions].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  }, [categories, incomeSources, transactions, type]);

  const frequentExpenses = useMemo(
    () => deriveFrequentExpenseCombos(transactions, categories),
    [transactions, categories]
  );

  const addFrequentExpense = (categoryId: string, value: number) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'expense',
      amount: value,
      categoryId,
      date: now,
      createdAt: now,
    };
    addTransaction(transaction);
    showToast({ message: tDashboard.quickExpenseAdded, actionText: t.undo, onAction: () => deleteTransaction(transaction.id) });
    onClose();
  };

  useEffect(() => {
    if (options.length && !options.some((option) => option.id === selectionId)) {
      setSelectionId(options[0].id);
    }
  }, [options, selectionId]);

  const appendDigit = (digit: string) => {
    setError('');
    setAmount((current) => {
      if (digit === '.' && current.includes('.')) return current;
      if (digit === '.' && !current) return '0.';
      const [whole, fraction] = current.split('.');
      if (fraction !== undefined && fraction.length >= 2) return current;
      return `${current}${digit}`;
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t.amountRequired);
      return;
    }
    if (!selectionId) {
      setError(type === 'expense' ? t.categoryRequired : t.sourceRequired);
      return;
    }

    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type,
      amount: Math.round(value * 100) / 100,
      ...(type === 'expense' ? { categoryId: selectionId } : { sourceId: selectionId }),
      note: note.trim() || undefined,
      date: new Date(dateTime).toISOString(),
      createdAt: now,
    };
    addTransaction(transaction);
    onClose();
  };

  const isArabic = language === 'ar';
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t.quickAdd}
      maxHeight="max-h-[94dvh]"
      className="!p-0"
    >
      <form onSubmit={submit} className="space-y-4 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-2 gap-2 rounded-control bg-surface-raised p-1">
          {(['expense', 'income'] as const).map((entryType) => (
            <button
              key={entryType}
              type="button"
              onClick={() => { setType(entryType); setSelectionId(''); setError(''); }}
              className={`min-h-11 rounded-control px-3 text-sm font-semibold transition-colors ${type === entryType ? 'bg-surface text-content shadow-sm' : 'text-muted'}`}
            >
              {entryType === 'expense' ? t.addExpense : t.addIncome}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-card border border-border-subtle bg-canvas px-4 py-3">
          <div>
            <p className="text-xs text-muted">{t.amount}</p>
            <p className="mt-1 flex items-baseline gap-2 text-3xl font-bold tabular-nums text-content">
              {amount || '0.00'} <span className="text-sm font-medium text-muted">MAD</span>
            </p>
          </div>
          <button type="button" onClick={() => setAmount((current) => current.slice(0, -1))} className="min-h-11 min-w-11 rounded-control text-muted hover:bg-surface-raised" aria-label={t.delete}>
            <Delete className="mx-auto h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2" aria-label={t.amount}>
          {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => key === '⌫' ? setAmount((current) => current.slice(0, -1)) : appendDigit(key)}
              className="min-h-11 rounded-control border border-border-subtle bg-surface text-lg font-semibold text-content hover:bg-surface-raised active:scale-[0.98]"
            >{key}</button>
          ))}
        </div>

        {type === 'expense' && frequentExpenses.length > 0 && <section aria-label={tDashboard.frequentExpenses} className="space-y-2">
          <p className="text-xs font-medium text-muted">{tDashboard.frequentExpenses}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {frequentExpenses.map((item) => {
              const category = categories.find((entry) => entry.id === item.categoryId);
              if (!category) return null;
              const label = getCategoryName(category, language);
              const formattedAmount = formatMAD(item.amount, false, language);
              return <button key={`${item.categoryId}:${item.amount}`} type="button" onClick={() => addFrequentExpense(item.categoryId, item.amount)} aria-label={`${label}, ${formattedAmount}`} title={`${label} · ${formattedAmount} · ${item.count}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-border-subtle bg-surface px-3 text-xs font-medium text-content hover:border-accent/40 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <span className="max-w-28 truncate">{label}</span><MoneyText amount={item.amount} className="font-semibold text-content" />
              </button>;
            })}
          </div>
        </section>}

        <div>
          <p className="mb-2 text-xs font-medium text-muted">{type === 'expense' ? t.category : t.source}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {options.map((option) => {
              const selected = option.id === selectionId;
              const label = type === 'expense'
                ? getCategoryName(option as (typeof categories)[number], language)
                : getIncomeSourceName(option as (typeof incomeSources)[number], language);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectionId(option.id)}
                  className={`min-h-11 shrink-0 rounded-control border px-3 text-xs font-medium ${selected ? 'border-accent bg-accent/10 text-accent' : 'border-border-subtle bg-surface text-content'}`}
                >{label}</button>
              );
            })}
            {!options.length && <span className="py-3 text-xs text-muted">{t.noCategoryFound}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-muted">
            {t.date} · {t.time}
            <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="min-h-11 w-full rounded-control border border-border-subtle bg-surface px-3 text-sm text-content" />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted">
            {t.note}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'expense' ? t.notePlaceholderExpense : t.notePlaceholderIncome} className="min-h-11 w-full rounded-control border border-border-subtle bg-surface px-3 text-sm text-content placeholder:text-muted" />
          </label>
        </div>

        {error && <p role="alert" className="text-sm text-negative">{error}</p>}
        <button type="submit" className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-control font-semibold text-white ${type === 'expense' ? 'bg-negative' : 'bg-positive'}`}>
          <Check className="h-4 w-4" /> {t.save}
        </button>
      </form>
    </BottomSheet>
  );
};
