import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CustomDatePicker } from '../common/CustomDatePicker';
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
import { getCategoryVisualColor } from '../../utils/categoryColor';
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
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
            {t.goalToFund}
          </label>
          {goalCategories.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted bg-surface-3 dark:bg-surface rounded-2xl">
              {translations[language].dashboard.noGoalsYet}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 rounded-2xl border border-border dark:border-border/80 bg-surface-3/50 dark:bg-surface/50">
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
                        ? 'border-positive bg-surface dark:bg-surface text-positive dark:text-positive ring-2 ring-positive shadow-sm'
                        : 'border-border/70 dark:border-border bg-surface dark:bg-surface/40 text-text dark:text-muted hover:bg-surface-3 dark:hover:bg-surface'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-positive text-accent-contrast flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-accent-contrast shrink-0 shadow-xs"
                      style={{ backgroundColor: getCategoryVisualColor(cat.id) }}
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
          <div className="p-3.5 rounded-2xl bg-positive/50 dark:bg-positive/20 border border-positive/60 dark:border-positive/40 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-positive dark:text-positive">
                {getCategoryName(selectedCategory, language)}
              </p>
              <p className="text-[11px] text-positive dark:text-positive mt-0.5 tabular-nums">
                {formatMAD(goalCalc.savedAmount, false, language)} /{' '}
                {formatMAD(selectedCategory.targetAmount || 0, false, language)} ({goalCalc.progressPercent}%)
              </p>
            </div>

            {goalCalc.monthlyNeeded > 0 && goalCalc.status !== 'completed' && (
              <button
                type="button"
                onClick={handlePreFillMonthly}
                className="px-2.5 py-1.5 rounded-xl bg-positive hover:bg-positive text-accent-contrast font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors shrink-0"
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
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
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
              className="w-full text-3xl font-bold py-3 px-4 rounded-2xl border border-border dark:border-border bg-surface dark:bg-surface text-positive dark:text-positive focus:border-positive focus:ring-4 focus:ring-positive/10 outline-none transition-all pr-20 tabular-nums"
            />
            <span className="absolute right-4 text-xs font-bold text-muted dark:text-muted bg-surface-3 dark:bg-surface px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
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
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-surface-3 hover:bg-surface-2 dark:bg-surface dark:hover:bg-surface text-text dark:text-muted transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>

          {error && <p className="text-xs font-medium text-negative mt-1.5">{error}</p>}
        </div>

        {/* Warning if exceeds available balance */}
        {isOverBalance && numericAmount > 0 && (
          <div className="p-3 bg-negative dark:bg-negative/40 border border-negative/80 dark:border-negative rounded-2xl flex items-start gap-2.5 text-xs text-negative dark:text-negative">
            <AlertTriangle className="w-4 h-4 text-negative shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t.insufficientBalance}</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {t.warningBalanceLow.replace('{available}', formatMAD(availableBalance, false, language))}
              </p>
            </div>
          </div>
        )}

        {/* Reused Custom Date & Time Picker */}
        <CustomDatePicker
          label={`${t.date} & ${t.time}`}
          value={date}
          onChange={(d) => setDate(d)}
          includeTime={true}
          timeValue={time}
          onTimeChange={(tm) => setTime(tm)}
        />

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
