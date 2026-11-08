import React from 'react';
import { motion } from 'framer-motion';
import { Category } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import {
  calculateCategorySpentAmount,
  calculateGoalProgress,
  calculateCategoryBudgetStatus,
} from '../../utils/calculations';
import { formatMAD, getCurrentMonthStr } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getCategoryName } from '../../utils/i18nHelpers';
import { MoneyText } from '../common/PrivacyCurrency';
import { getCategoryVisualColor } from '../../utils/categoryColor';

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
  onQuickContribute?: () => void;
  onQuickExpense?: () => void;
  onSetGoal?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onClick,
}) => {
  const { transactions, hideBalance, language } = useAppStore();
  const tCat = translations[language].categories;
  const IconComp = getCategoryIcon(category.icon);
  const visualColor = getCategoryVisualColor(category.id);

  const currentMonth = getCurrentMonthStr();
  const spentThisMonth = calculateCategorySpentAmount(category.id, transactions, currentMonth);
  const goalCalc = category.isGoal ? calculateGoalProgress(category, transactions) : null;
  const budgetStatus = calculateCategoryBudgetStatus(category, spentThisMonth);
  const categoryName = getCategoryName(category, language);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer rounded-card p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_0_rgba(0,0,0,0.3)] hover:border-black/[0.12] dark:hover:border-white/[0.18] transition-all flex flex-col justify-between min-h-[170px]"
    >
      {/* Top: Prominent Apple Frosted Icon & Type Pill */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-12 h-12 rounded-card flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${visualColor}18`,
            color: visualColor,
            border: `1px solid ${category.color}30`,
          }}
        >
          <IconComp className="w-6 h-6 stroke-[2]" />
        </div>

        <span
          className={`text-caption font-semibold px-2.5 py-0.5 rounded-full ${
            category.isGoal
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-muted border border-black/[0.04] dark:border-white/[0.06]'
          }`}
        >
          {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
        </span>
      </div>

      {/* Middle: Category Name */}
      <div className="my-3">
        <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight truncate">
          {categoryName}
        </h3>
      </div>

      {/* Bottom: Clean Progress Bar & Amount */}
      <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
        {category.isGoal && goalCalc ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <MoneyText
                amount={goalCalc.savedAmount}
                className="font-bold text-zinc-900 dark:text-white"
              />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {goalCalc.progressPercent}%
              </span>
            </div>

            {/* Apple Fluid Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, goalCalc.progressPercent))}%`,
                  backgroundColor: visualColor,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-caption text-muted font-medium">
                {tCat.spentThisMonth}
              </span>
              <MoneyText
                amount={spentThisMonth}
                className="font-bold text-zinc-900 dark:text-white"
              />
            </div>

            {budgetStatus.hasBudget ? (
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    budgetStatus.percent >= 100
                      ? 'bg-rose-500'
                      : budgetStatus.percent >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, budgetStatus.percent))}%`,
                  }}
                />
              </div>
            ) : (
              <div className="w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-300 dark:bg-zinc-700"
                  style={{ width: spentThisMonth > 0 ? '100%' : '0%' }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
