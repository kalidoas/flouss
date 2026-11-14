import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AmountKeypad } from '../common/AmountKeypad';
import { CategoryChipRow } from '../common/CategoryChipRow';
import { CustomDatePicker } from '../common/CustomDatePicker';
import {
  getTodayDateStr,
  getCurrentTimeStr,
  toIsoDateTime,
  formatMAD,
} from '../../utils/formatters';
import { calculateAvailableBalance } from '../../utils/calculations';
import { translations } from '../../i18n/translations';
import { getSubCategoryName } from '../../utils/i18nHelpers';
import { Transaction } from '../../types';
import { AlertTriangle, Check, Clock3 } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  transactionToEdit?: Transaction | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  defaultCategoryId,
  transactionToEdit,
}) => {
  const {
    categories,
    addTransaction,
    updateTransaction,
    balance: storeBalance,
    initialBalance,
    transactions,
    language,
  } = useAppStore();

  const t = translations[language].common;

  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setAmountStr(transactionToEdit.amount.toString());
        setCategoryId(transactionToEdit.categoryId || defaultCategoryId || '');
        setSubCategoryId(transactionToEdit.subCategoryId || null);
        setDate(transactionToEdit.date.slice(0, 10));
        setTime(transactionToEdit.date.slice(11, 16) || getCurrentTimeStr());
        setNote(transactionToEdit.note || '');
        setError('');
      } else {
        setCategoryId(defaultCategoryId || '');
        setSubCategoryId(null);
        setError('');
        setAmountStr('');
        setNote('');
        setDate(getTodayDateStr());
        setTime(getCurrentTimeStr());
      }
    }
  }, [isOpen, defaultCategoryId, transactionToEdit]);

  const availableBalance =
    typeof storeBalance === 'number' && !isNaN(storeBalance)
      ? storeBalance
      : calculateAvailableBalance(initialBalance, transactions);
  const numericAmount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
  const isOverBalance = numericAmount > availableBalance;

  // Active non-archived categories
  const activeCategories = useMemo(
    () => categories.filter((c) => !c.isArchived && !c.isGoal),
    [categories]
  );

  useEffect(() => {
    if (activeCategories.length && !categoryId) {
      setCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, categoryId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const availableSubcategories = selectedCategory?.subcategories || [];

  const handleSelectCategory = (id: string) => {
    setCategoryId(id);
    setSubCategoryId(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError(t.amountRequired);
      return;
    }
    if (!categoryId) {
      setError(t.categoryRequired);
      return;
    }

    const isoDate = toIsoDateTime(date, time);

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        amount: numericAmount,
        categoryId,
        subCategoryId: subCategoryId || undefined,
        date: isoDate,
        note: note.trim() || undefined,
      });
    } else {
      addTransaction({
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: 'expense',
        amount: numericAmount,
        categoryId,
        subCategoryId: subCategoryId || undefined,
        date: isoDate,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    setAmountStr('');
    setNote('');
    setSubCategoryId(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? t.transactionTitleExpenseEdit : t.transactionTitleExpense}
      subtitle={transactionToEdit ? t.transactionSubtitleExpenseEdit : t.transactionSubtitleExpense}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* 1. Large Amount Readout with tactile In-App Keypad */}
        <AmountKeypad
          amount={amountStr}
          onChange={(val) => {
            setAmountStr(val);
            setError('');
          }}
          currency={translations[language].currency}
        />

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        {/* Over balance warning */}
        {isOverBalance && numericAmount > 0 && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-semibold">{t.insufficientBalance}</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {t.warningBalanceLow.replace('{available}', formatMAD(availableBalance, false, language))}
              </p>
            </div>
          </div>
        )}

        {/* 2. One-Row Category Chips */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
            {t.category}
          </span>
          <CategoryChipRow
            categories={activeCategories}
            selectedId={categoryId}
            onSelect={handleSelectCategory}
            language={language}
            type="expense"
          />
        </div>

        {/* Optional Subcategories Chips */}
        {availableSubcategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {availableSubcategories.map((sub) => {
              const isSelected = subCategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubCategoryId(isSelected ? null : sub.id)}
                  className={`min-h-[36px] px-3 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-surface-raised border border-border-subtle text-muted hover:text-content'
                  }`}
                >
                  {getSubCategoryName(sub, language)}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Reused Date & Time Picker */}
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

        {/* 4. Optional Note Input */}
        <label className="block rounded-2xl border border-border-subtle bg-surface px-3.5 py-2">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            <Clock3 className="h-3 w-3" />
            {t.note}
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholderExpense}
            className="min-h-9 w-full bg-transparent text-xs text-content placeholder:text-muted focus:outline-none"
          />
        </label>

        {/* 5. Sticky Full-Width Save Button */}
        <div className="sticky bottom-0 bg-surface/95 dark:bg-[#0A0A0C]/95 pt-2 border-t border-border-subtle dark:border-white/10 backdrop-blur-md">
          <Button
            type="submit"
            variant="danger"
            fullWidth
            icon={<Check className="w-4 h-4 stroke-[2.5]" />}
            className="min-h-[48px] text-sm font-bold"
          >
            {t.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
