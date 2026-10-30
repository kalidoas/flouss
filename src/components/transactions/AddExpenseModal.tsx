import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  getTodayDateStr,
  getCurrentTimeStr,
  toIsoDateTime,
  formatMAD,
} from '../../utils/formatters';
import { calculateAvailableBalance } from '../../utils/calculations';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getCategoryName, getSubCategoryName } from '../../utils/i18nHelpers';
import { AlertTriangle, ArrowDownRight, Tag, Check, Search } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  defaultCategoryId,
}) => {
  const {
    categories,
    addTransaction,
    initialBalance,
    transactions,
    recentNotes,
    language,
  } = useAppStore();

  const t = translations[language].common;

  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId || (categories[0]?.id ?? ''));
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const availableBalance = calculateAvailableBalance(initialBalance, transactions);
  const numericAmount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
  const isOverBalance = numericAmount > availableBalance;

  // Active non-archived categories
  const activeCategories = useMemo(
    () => categories.filter((c) => !c.isArchived),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return activeCategories;
    const q = categorySearch.toLowerCase().trim();
    return activeCategories.filter((cat) =>
      getCategoryName(cat, language).toLowerCase().includes(q)
    );
  }, [activeCategories, categorySearch, language]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const availableSubcategories = selectedCategory?.subcategories || [];

  const handleSelectCategory = (id: string) => {
    setCategoryId(id);
    setSubCategoryId(null); // reset subcategory on category change
    setError('');
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
    setAmountStr((current + addValue).toString());
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

    addTransaction({
      type: 'expense',
      amount: numericAmount,
      categoryId,
      subCategoryId: subCategoryId || undefined,
      date: isoDate,
      note: note.trim() || undefined,
    });

    setAmountStr('');
    setNote('');
    setSubCategoryId(null);
    setCategorySearch('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.transactionTitleExpense}
      subtitle={t.transactionSubtitleExpense}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t.amount}
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError('');
              }}
              className="w-full text-3xl font-bold py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all pr-20 tabular-nums"
            />
            <span className="absolute right-4 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
              {translations[language].currency}
            </span>
          </div>

          {/* Quick amount adder chips */}
          <div className="flex gap-1.5 mt-2">
            {[10, 50, 100, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>

          {error && <p className="text-xs font-medium text-rose-500 mt-1.5">{error}</p>}
        </div>

        {/* Warning if exceeds available balance */}
        {isOverBalance && numericAmount > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t.insufficientBalance}</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {t.warningBalanceLow.replace('{available}', formatMAD(availableBalance, false, language))}
              </p>
            </div>
          </div>
        )}

        {/* Category Picker (Responsive Grid: 3 cols mobile, 4 desktop, FULL name, icon on top) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.category}
            </label>
            {activeCategories.length > 8 && (
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchCategory}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            {filteredCategories.map((cat) => {
              const IconComp = getCategoryIcon(cat.icon);
              const isSelected = categoryId === cat.id;
              const catName = getCategoryName(cat, language);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`relative p-2.5 rounded-2xl text-center border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold min-h-[76px] ${
                    isSelected
                      ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500 shadow-sm'
                      : 'border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold leading-tight line-clamp-2 px-0.5 break-words">
                    {catName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sub-categories Chips (optional, with "Sans précision") */}
        {availableSubcategories.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.subcategory}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {/* "Sans précision" chip */}
              <button
                type="button"
                onClick={() => setSubCategoryId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  subCategoryId === null
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t.noPrecision}
              </button>

              {availableSubcategories.map((sub) => {
                const isSubSelected = subCategoryId === sub.id;
                const subName = getSubCategoryName(sub, language);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubCategoryId(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSubSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {subName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date AND Time Pickers */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t.date}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label={t.time}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* Note with suggestions */}
        <div>
          <Input
            label={t.note}
            type="text"
            placeholder={t.notePlaceholderExpense}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {recentNotes && recentNotes.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {t.suggestions}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {recentNotes.slice(0, 10).map((n, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNote(n)}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            icon={<ArrowDownRight className="w-4 h-4" />}
          >
            {t.validateExpense}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
