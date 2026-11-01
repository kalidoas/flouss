import React, { useState, useEffect, useMemo } from 'react';
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
import {
  calculateAvailableBalance,
  calculateGoalProgress,
  calculateCategorySavedAmount,
} from '../../utils/calculations';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getCategoryName, getSubCategoryName } from '../../utils/i18nHelpers';
import { Target, Sparkles, AlertTriangle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export const AddContributionModal: React.FC<AddContributionModalProps> = ({
  isOpen,
  onClose,
  defaultCategoryId,
}) => {
  const { categories, addTransaction, balance: storeBalance, initialBalance, transactions, language } = useAppStore();
  const t = translations[language].common;
  const tCat = translations[language].categories;

  const goalCategories = useMemo(
    () => categories.filter((c) => c.isGoal && !c.isArchived),
    [categories]
  );

  const [categoryId, setCategoryId] = useState(
    defaultCategoryId || goalCategories[0]?.id || ''
  );
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultCategoryId) {
      setCategoryId(defaultCategoryId);
    } else if (!categoryId && goalCategories.length > 0) {
      setCategoryId(goalCategories[0].id);
    }
  }, [defaultCategoryId, goalCategories, categoryId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const goalCalc = selectedCategory
    ? calculateGoalProgress(selectedCategory, transactions)
    : null;

  const availableBalance =
    typeof storeBalance === 'number' && !isNaN(storeBalance)
      ? storeBalance
      : calculateAvailableBalance(initialBalance, transactions);
  const numericAmount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
  const isOverBalance = numericAmount > availableBalance;

  const handlePreFillMonthly = () => {
    if (goalCalc && goalCalc.monthlyNeeded > 0) {
      setAmountStr(goalCalc.monthlyNeeded.toString());
      setError('');
    }
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
    setAmountStr((current + addVal).toString());
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError(t.amountRequired);
      return;
    }
    if (!categoryId) {
      setError(t.goalRequired);
      return;
    }

    const isoDate = toIsoDateTime(date, time);
    const catName = getCategoryName(selectedCategory, language);

    addTransaction({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'contribution',
      amount: numericAmount,
      categoryId,
      subCategoryId: selectedCategory?.subCategoryId || undefined,
      date: isoDate,
      note: note.trim() || `${t.savingFor} ${catName}`,
      createdAt: new Date().toISOString(),
    });

    // If this contribution completes the goal, fire celebration!
    if (selectedCategory && selectedCategory.targetAmount) {
      const currentSaved = calculateCategorySavedAmount(categoryId, transactions);
      if (currentSaved + numericAmount >= selectedCategory.targetAmount) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (_) {}
      }
    }

    setAmountStr('');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.contributionTitle}
      subtitle={t.contributionSubtitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t.goalToFund}
          </label>
          {goalCategories.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              {translations[language].dashboard.noGoalsYet}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              {goalCategories.map((cat) => {
                const IconComp = getCategoryIcon(cat.icon);
                const isSelected = categoryId === cat.id;
                const catName = getCategoryName(cat, language);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setError('');
                    }}
                    className={`relative p-2.5 rounded-2xl text-center border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold min-h-[76px] ${
                      isSelected
                        ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500 shadow-sm'
                        : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
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
          )}
        </div>

        {/* Goal Quick Info Card & Monthly Auto-Fill */}
        {goalCalc && selectedCategory && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-emerald-950 dark:text-emerald-200">
                {getCategoryName(selectedCategory, language)}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                {formatMAD(goalCalc.savedAmount, false, language)} /{' '}
                {formatMAD(selectedCategory.targetAmount || 0, false, language)} ({goalCalc.progressPercent}%)
              </p>
            </div>

            {goalCalc.monthlyNeeded > 0 && goalCalc.status !== 'completed' && (
              <button
                type="button"
                onClick={handlePreFillMonthly}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors shrink-0"
                title="Pré-remplir avec la mensualité recommandée"
              >
                <Sparkles className="w-3 h-3" />
                <span className="tabular-nums">
                  +{formatMAD(goalCalc.monthlyNeeded, false, language)}
                </span>
              </button>
            )}
          </div>
        )}

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
              className="w-full text-3xl font-bold py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all pr-20 tabular-nums"
            />
            <span className="absolute right-4 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
              {translations[language].currency}
            </span>
          </div>

          {/* Quick amount adder chips */}
          <div className="flex gap-1.5 mt-2">
            {[50, 100, 500, 1000].map((val) => (
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

        {/* Date AND Time */}
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

        {/* Note */}
        <Input
          label={t.note}
          type="text"
          placeholder="ex : Versement mensuel, prime, économie..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Submit */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            icon={<Target className="w-4 h-4" />}
          >
            {t.saveContribution}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
