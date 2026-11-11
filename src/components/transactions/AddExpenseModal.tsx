import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import {
  getTodayDateStr,
  getCurrentTimeStr,
  toIsoDateTime,
  formatMAD,
} from '../../utils/formatters';
import { calculateAvailableBalance } from '../../utils/calculations';
import { getCategoryIcon } from '../../utils/icons';
import { getCategoryVisualColor } from '../../utils/categoryColor';
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
    balance: storeBalance,
    initialBalance,
    transactions,
    recentNotes,
    language,
  } = useAppStore();

  const t = translations[language].common;

  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategoryId(defaultCategoryId || '');
      setSubCategoryId(null);
      setCategorySearch('');
      setError('');
    }
  }, [isOpen, defaultCategoryId]);

  const availableBalance =
    typeof storeBalance === 'number' && !isNaN(storeBalance)
      ? storeBalance
      : calculateAvailableBalance(initialBalance, transactions);
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
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'expense',
      amount: numericAmount,
      categoryId,
      subCategoryId: subCategoryId || undefined,
      date: isoDate,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    setAmountStr('');
    setNote('');
    setSubCategoryId(null);
    setCategorySearch('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t.transactionTitleExpense}
      subtitle={t.transactionSubtitleExpense}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
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
              className="w-full text-3xl font-bold py-3 px-4 rounded-2xl border border-white/10 bg-white/5 text-rose-400 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all pr-20 rtl:pr-4 rtl:pl-20 tabular-nums"
            />
            <span className="absolute right-4 rtl:right-auto rtl:left-4 text-xs font-bold text-zinc-300 bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl uppercase tracking-wider select-none">
              {translations[language].currency}
            </span>
          </div>

          {/* Quick amount adder chips */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[10, 50, 100, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="rounded-full px-3 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer"
              >
                +{val}
              </button>
            ))}
          </div>

          {error && <p className="text-xs font-medium text-rose-400 mt-1.5">{error}</p>}
        </div>

        {/* Warning if exceeds available balance */}
        {isOverBalance && numericAmount > 0 && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t.insufficientBalance}</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {t.warningBalanceLow.replace('{available}', formatMAD(availableBalance, false, language))}
              </p>
            </div>
          </div>
        )}

        {/* Category Picker (Responsive Grid: 3 cols mobile, 4 desktop, FULL name, icon on top) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {t.category}
            </label>
            {activeCategories.length > 8 && (
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t.searchCategory}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 rtl:pl-2.5 rtl:pr-8 py-1.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl border border-white/10 bg-white/[0.02]">
            {filteredCategories.map((cat) => {
              const IconComp = getCategoryIcon(cat.icon);
              const isSelected = categoryId === cat.id;
              const catName = getCategoryName(cat, language);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`relative p-2.5 rounded-2xl text-center border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 text-xs font-semibold min-h-[76px] cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white'
                      : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: getCategoryVisualColor(cat.id) }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight line-clamp-2 px-0.5 break-words">
                    {catName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sub-categories Chips (ONLY visible when a parent category is selected) */}
        <AnimatePresence>
          {Boolean(categoryId && selectedCategory && availableSubcategories.length > 0) && (
            <motion.div
              key="subcategories-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  {t.subcategory}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {/* "Sans précision" chip */}
                  <button
                    type="button"
                    onClick={() => setSubCategoryId(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                      subCategoryId === null
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
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
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                          isSubSelected
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {subName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date AND Time Pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs font-mono py-2.5 px-3.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.time}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-xs font-mono py-2.5 px-3.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Note with suggestions */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
            {t.note}
          </label>
          <input
            type="text"
            placeholder={t.notePlaceholderExpense}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />

          {recentNotes && recentNotes.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-400" /> {t.suggestions}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {recentNotes.slice(0, 10).map((n, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNote(n)}
                    className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
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
    </BottomSheet>
  );
};
