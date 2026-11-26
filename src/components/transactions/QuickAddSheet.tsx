import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock3 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { AmountKeypad } from '../common/AmountKeypad';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CategoryChipRow } from '../common/CategoryChipRow';
import { translations } from '../../i18n/translations';
import { getCurrentTimeStr, getTodayDateStr } from '../../utils/formatters';

export type QuickAddType = 'expense' | 'income';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: QuickAddType;
}

export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({ isOpen, onClose, initialType = 'expense' }) => {
  const { categories, incomeSources, financialAccounts, transactions, addTransaction, language } = useAppStore();
  const t = translations[language].common;
  const tAccounts = translations[language].accounts;
  const [type, setType] = useState<QuickAddType>(initialType);
  const [amount, setAmount] = useState('');
  const [selectionId, setSelectionId] = useState('');
  const [financialAccountId, setFinancialAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setType(initialType);
    setAmount('');
    setSelectionId('');
    setFinancialAccountId(financialAccounts.find((account) => account.isPrimary)?.id || '');
    setNote('');
    setError('');
    setDate(getTodayDateStr());
    setTime(getCurrentTimeStr());
  }, [isOpen, initialType, financialAccounts]);

  const options = useMemo(() => {
    const sourceOptions = type === 'income'
      ? incomeSources
      : categories.filter((category) => !category.isArchived && !category.isGoal);
    const recentIds = [...transactions]
      .filter((tx) => tx.type === type)
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .map((tx) => type === 'expense' ? tx.categoryId : tx.sourceId)
      .filter((id): id is string => Boolean(id));
    const recentRank = new Map<string, number>();
    recentIds.forEach((id, index) => {
      if (!recentRank.has(id)) recentRank.set(id, index);
    });
    return [...sourceOptions]
      .sort((a, b) => (recentRank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (recentRank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 5);
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
    const txDateTime = new Date(`${date}T${time || '12:00'}:00`).toISOString();

    addTransaction({
      id: `tx_${Date.now()}`,
      type,
      amount: Math.round(value * 100) / 100,
      ...(type === 'expense' ? { categoryId: selectionId } : { sourceId: selectionId }),
      accountId: financialAccountId || undefined,
      note: note.trim() || undefined,
      date: txDateTime,
      createdAt: now,
    });
    onClose();
  };

  const isArabic = language === 'ar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'expense' ? t.addExpense : t.addIncome}
      maxWidth="md"
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5" dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Expense / Income Segmented Switcher */}
        <div className="grid grid-cols-2 gap-1.5 rounded-control bg-surface-raised p-1">
          {(['expense', 'income'] as const).map((entryType) => (
            <button
              key={entryType}
              type="button"
              aria-pressed={type === entryType}
              onClick={() => {
                setType(entryType);
                setSelectionId('');
                setError('');
              }}
              className={`min-h-[44px] rounded-control px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                type === entryType
                  ? entryType === 'income'
                    ? 'bg-positive text-accent-contrast shadow-xs'
                    : 'bg-negative text-accent-contrast shadow-xs'
                  : 'text-muted hover:text-content hover:bg-surface'
              }`}
            >
              {entryType === 'expense' ? t.addExpense : t.addIncome}
            </button>
          ))}
        </div>

        {/* 1. Large Amount Readout with in-app numeric Keypad */}
        <AmountKeypad
          amount={amount}
          onChange={(val) => {
            setAmount(val);
            setError('');
          }}
          currency={translations[language].currency}
        />

        {/* 2. One-Row Category Chips */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
            {type === 'expense' ? t.category : t.source}
          </span>
          <CategoryChipRow
            categories={type === 'expense' ? (options as any) : undefined}
            incomeSources={type === 'income' ? (options as any) : undefined}
            selectedId={selectionId}
            onSelect={(id) => setSelectionId(id)}
            language={language}
            type={type}
          />
        </div>

        {financialAccounts.length > 1 && (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{tAccounts.accountType}</span>
            <select value={financialAccountId} onChange={(event) => setFinancialAccountId(event.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3 text-sm text-content">
              {financialAccounts.map((account) => <option key={account.id} value={account.id}>{account.isPrimary ? tAccounts.cash : account.name}</option>)}
            </select>
          </label>
        )}

        {/* 3. Reused Date Control (Today / Yesterday / Calendar / Time) */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
            {t.date} & {t.time}
          </span>
          <CustomDatePicker
            value={date}
            onChange={(d) => setDate(d)}
            includeTime={true}
            timeValue={time}
            onTimeChange={(tm) => setTime(tm)}
          />
        </div>

        {/* 4. Note Input */}
        <label className="block rounded-2xl border border-border-subtle bg-surface px-3.5 py-2">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            <Clock3 className="h-3 w-3" />
            {t.note}
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={type === 'expense' ? t.notePlaceholderExpense : t.notePlaceholderIncome}
            className="min-h-9 w-full bg-transparent text-xs text-content placeholder:text-muted focus:outline-none"
          />
        </label>

        {error && <p role="alert" className="text-xs font-semibold text-negative">{error}</p>}

        {/* 5. Sticky Full-Width Save Button */}
        <div className="sticky bottom-0 bg-surface/95 dark:bg-[bg-bg]/95 pt-2 border-t border-border-subtle dark:border-border/10 backdrop-blur-md">
          <button
            type="submit"
            className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-accent-contrast shadow-md transition-all active:scale-[0.98] cursor-pointer ${
              type === 'expense' ? 'bg-negative hover:bg-negative' : 'bg-positive hover:bg-positive'
            }`}
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>{t.save}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
