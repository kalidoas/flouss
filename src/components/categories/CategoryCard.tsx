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
import { Money } from '../common/Money';
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
      className="group relative cursor-pointer rounded-card p-5 bg-surface dark:bg-bg/65 backdrop-blur-2xl border border-border/[0.06] dark:border-border-strong shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_0_rgba(0,0,0,0.3)] hover:border-border/[0.12] dark:hover:border-border/[0.18] transition-all flex flex-col justify-between min-h-[170px]"
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
          <IconComp className="w-6 h-6 border-2" />
        </div>

        <span
          className={`text-caption font-semibold px-2.5 py-0.5 rounded-full ${
            category.isGoal
              ? 'bg-info/10 text-info dark:text-info border border-info/20'
              : 'bg-surface-2 dark:bg-surface text-text-subtle dark:text-muted border border-border/[0.04] dark:border-border'
          }`}
        >
          {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
        </span>
      </div>

      {/* Middle: Category Name */}
      <div className="my-3">
        <h3 className="font-bold text-base sm:text-lg text-text-subtle dark:text-content tracking-tight truncate">
          {categoryName}
        </h3>
      </div>

      {/* Bottom: Clean Progress Bar & Amount */}
      <div className="space-y-2 pt-2 border-t border-border/[0.04] dark:border-border/[0.05]">
        {category.isGoal && goalCalc ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <Money
                amount={goalCalc.savedAmount}
                className="font-bold text-text-subtle dark:text-content"
              />
              <span className="text-xs font-semibold text-info dark:text-info tabular-nums">
                {goalCalc.progressPercent}%
              </span>
            </div>

            {/* Apple Fluid Progress Bar */}
            <div className="w-full bg-surface-2 dark:bg-surface rounded-full h-2 overflow-hidden">
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
              <Money
                amount={spentThisMonth}
                className="font-bold text-text-subtle dark:text-content"
              />
            </div>

            {budgetStatus.hasBudget ? (
              <div className="w-full bg-surface-2 dark:bg-surface rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    budgetStatus.percent >= 100
                      ? 'bg-negative'
                      : budgetStatus.percent >= 80
                      ? 'bg-warning'
                      : 'bg-positive'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, budgetStatus.percent))}%`,
                  }}
                />
              </div>
            ) : (
              <div className="w-full bg-surface-2 dark:bg-surface/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-surface-2 dark:bg-surface"
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
