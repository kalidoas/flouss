import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, Delete } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../common/BottomSheet';
import { getCategoryName, getIncomeSourceName } from '../../utils/i18nHelpers';
import { translations } from '../../i18n/translations';

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
  const { categories, incomeSources, transactions, addTransaction, language } = useAppStore();
  const t = translations[language].common;
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
    setSelectionId('');
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

  useEffect(() => {
    if (options.length && !options.some((option) => option.id === selectionId)) {
      setSelectionId(options[0].id);
    }
  }, [options, selectionId]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError(t.amountRequired);
      return;
    }
    if (!selectionId) {
      setError(type === 'expense' ? t.categoryRequired : t.sourceRequired);
      return;
    }

    const now = new Date().toISOString();
    addTransaction({
      id: `tx_${Date.now()}`,
      type,
      amount: Math.round(value * 100) / 100,
      ...(type === 'expense' ? { categoryId: selectionId } : { sourceId: selectionId }),
      note: note.trim() || undefined,
      date: new Date(dateTime).toISOString(),
      createdAt: now,
    });
    onClose();
  };

  const isArabic = language === 'ar';
  const amountColor = type === 'expense' ? 'text-rose-400' : 'text-emerald-400';
  const selectedOptionStyle = type === 'expense'
    ? 'border-rose-400 bg-rose-500/15 text-rose-300'
    : 'border-emerald-400 bg-emerald-500/15 text-emerald-300';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t.quickAdd}
      maxHeight="max-h-[90dvh]"
      className="!p-0"
      scrollable={false}
    >
      <form onSubmit={submit} className="flex h-full min-h-0 flex-col gap-3" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="grid shrink-0 grid-cols-2 gap-1.5 rounded-control bg-surface-raised p-1">
          {(['expense', 'income'] as const).map((entryType) => (
            <button
              key={entryType}
              type="button"
              aria-pressed={type === entryType}
              onClick={() => { setType(entryType); setSelectionId(''); setError(''); }}
              className={`min-h-11 rounded-control px-3 text-sm font-bold transition-colors ${type === entryType
                ? entryType === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                : 'text-muted hover:bg-surface'}`}
            >
              {entryType === 'expense' ? t.addExpense : t.addIncome}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-1">
          <label className="block rounded-card border border-border-subtle bg-surface px-3.5 py-2.5">
            <span className="mb-1 block text-[11px] font-medium text-muted">{t.amount} · MAD</span>
            <span className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) => {
                  const clean = event.target.value.replace(',', '.').replace(/[^\d.]/g, '');
                  const [whole, ...fraction] = clean.split('.');
                  setAmount(fraction.length ? `${whole}.${fraction.join('').slice(0, 2)}` : whole);
                  setError('');
                }}
                placeholder="0.00"
                aria-label={t.amount}
                className={`min-w-0 flex-1 bg-transparent text-2xl font-bold tabular-nums ${amountColor} placeholder:text-muted focus:outline-none`}
              />
              <span className="shrink-0 rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs font-semibold text-muted">MAD</span>
              {amount && <button type="button" onClick={() => setAmount('')} aria-label={t.delete} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-raised"><Delete className="h-4 w-4" /></button>}
            </span>
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block min-w-0 rounded-control border border-border-subtle bg-surface px-3 py-2">
              <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted"><CalendarDays className="h-3 w-3" />{t.date} · {t.time}</span>
              <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} aria-label={`${t.date} ${t.time}`} className="min-h-9 w-full min-w-0 bg-transparent text-xs text-content focus:outline-none" />
            </label>
            <label className="block min-w-0 rounded-control border border-border-subtle bg-surface px-3 py-2">
              <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted"><Clock3 className="h-3 w-3" />{t.note}</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={type === 'expense' ? t.notePlaceholderExpense : t.notePlaceholderIncome} className="min-h-9 w-full bg-transparent text-xs text-content placeholder:text-muted focus:outline-none" />
            </label>
          </div>

          <section aria-label={type === 'expense' ? t.category : t.source}>
            <p className="mb-1.5 text-xs font-semibold text-content">{type === 'expense' ? t.category : t.source}</p>
            <div className="grid max-h-36 grid-cols-3 gap-1.5 overflow-y-auto rounded-card border border-border-subtle bg-surface/50 p-1.5 sm:grid-cols-4">
              {options.map((option) => {
                const selected = option.id === selectionId;
                const label = type === 'expense'
                  ? getCategoryName(option as (typeof categories)[number], language)
                  : getIncomeSourceName(option as (typeof incomeSources)[number], language);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectionId(option.id)}
                    className={`min-h-10 min-w-0 rounded-control border px-2 py-1.5 text-[11px] font-medium leading-tight transition-colors ${selected
                      ? selectedOptionStyle
                      : 'border-border-subtle bg-surface text-content hover:bg-surface-raised'}`}
                  >{label}</button>
                );
              })}
              {!options.length && <span className="col-span-full py-3 text-center text-xs text-muted">{t.noCategoryFound}</span>}
            </div>
          </section>

          {error && <p role="alert" className="text-sm text-negative">{error}</p>}
        </div>

        <div className="shrink-0 border-t border-border-subtle bg-canvas pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <button type="submit" className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-control px-5 font-bold text-white shadow-sm transition active:scale-[0.98] ${type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
            <Check className="h-4 w-4" /> {t.save}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
