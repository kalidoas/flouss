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
import { getCategoryName, getCategoryGroupName } from '../../utils/i18nHelpers';
import { getSemanticBadgeClass } from '../../utils/categoryTheme';
import { ArrowUpRight, Plus, Target, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

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
  onQuickContribute,
  onQuickExpense,
  onSetGoal,
}) => {
  const { transactions, hideBalance, language } = useAppStore();
  const tCat = translations[language].categories;
  const tDash = translations[language].dashboard;
  const IconComp = getCategoryIcon(category.icon);

  const currentMonth = getCurrentMonthStr();
  const spentThisMonth = calculateCategorySpentAmount(category.id, transactions, currentMonth);

  const goalCalc = category.isGoal ? calculateGoalProgress(category, transactions) : null;
  const budgetStatus = calculateCategoryBudgetStatus(category, spentThisMonth);

  const categoryName = getCategoryName(category, language);
  const groupName = category.group ? getCategoryGroupName(category.group, language) : null;
  const subcatCount = category.subcategories?.length || 0;

  // Determine budget bar color and warning styling
  const getBudgetBarStyles = (percent: number) => {
    if (percent >= 100) {
      return {
        barBg: 'bg-rose-500',
        textClass: 'text-rose-600 dark:text-rose-400 font-semibold',
      };
    }
    if (percent >= 80) {
      return {
        barBg: 'bg-amber-500',
        textClass: 'text-amber-600 dark:text-amber-400 font-semibold',
      };
    }
    return {
      barBg: 'bg-emerald-500',
      textClass: 'text-zinc-500 dark:text-zinc-400',
    };
  };

  const budgetStyles = budgetStatus.hasBudget ? getBudgetBarStyles(budgetStatus.percent) : null;
  const badgeClass = getSemanticBadgeClass(category.color, category.isGoal);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
      whileTap={{ scale: 0.985 }}
      className="group relative cursor-pointer rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:border-black/[0.12] dark:hover:border-white/[0.16] transition-all flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Icon, Name & Translucent Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
                border: `1px solid ${category.color}35`,
              }}
            >
              <IconComp className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white truncate tracking-tight">
                {categoryName}
              </h3>

              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {/* Group Badge */}
                {groupName && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-black/[0.04] dark:border-white/[0.06]">
                    {groupName}
                  </span>
                )}

                {/* Subcategory count */}
                {subcatCount > 0 && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md tabular-nums">
                    {tCat.subcatCount.replace('{count}', String(subcatCount))}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Goal vs Expense Semantic Badge */}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}
          >
            {category.isGoal
              ? goalCalc?.status === 'completed'
                ? tCat.completed
                : tCat.goalBadge
              : tCat.expenseBadge}
          </span>
        </div>

        {/* Goal Specific Content */}
        {category.isGoal && goalCalc ? (
          <div className="space-y-2.5 mt-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  {tCat.targetGoalLabel}
                </span>
                <span
                  className={`font-bold text-lg sm:text-xl text-zinc-900 dark:text-white tabular-nums tracking-tight transition-[filter] duration-200 ${
                    hideBalance ? 'privacy-blur' : ''
                  }`}
                >
                  {formatMAD(goalCalc.savedAmount, false, language)}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs text-zinc-500 dark:text-zinc-400 tabular-nums transition-[filter] duration-200 ${
                    hideBalance ? 'privacy-blur' : ''
                  }`}
                >
                  / {formatMAD(category.targetAmount || 0, false, language)}
                </span>
                <span className="text-[10px] font-semibold block text-blue-600 dark:text-blue-400 tabular-nums">
                  {goalCalc.progressPercent}%
                </span>
              </div>
            </div>

            {/* Apple Fluid Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{
                  width: `${Math.min(100, Math.max(0, goalCalc.progressPercent))}%`,
                  backgroundColor: category.color || '#3b82f6',
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
              <span className="tabular-nums">
                {tCat.remaining} :{' '}
                <span
                  className={`font-semibold text-zinc-800 dark:text-zinc-200 ${
                    hideBalance ? 'privacy-blur' : ''
                  }`}
                >
                  {formatMAD(goalCalc.remainingAmount, false, language)}
                </span>
              </span>

              {goalCalc.status !== 'completed' ? (
                <span
                  className={`text-emerald-600 dark:text-emerald-400 font-medium tabular-nums ${
                    hideBalance ? 'privacy-blur' : ''
                  }`}
                >
                  +{formatMAD(goalCalc.monthlyNeeded, false, language)}/{tDash.monthlyTarget}
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {tCat.completed}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Simple Expense Content with Optional Monthly Budget */
          <div className="space-y-2.5 mt-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  {tCat.spentThisMonth}
                </span>
                <span
                  className={`font-bold text-lg sm:text-xl text-zinc-900 dark:text-white tabular-nums tracking-tight transition-[filter] duration-200 ${
                    hideBalance ? 'privacy-blur' : ''
                  }`}
                >
                  {formatMAD(spentThisMonth, false, language)}
                </span>
              </div>

              {budgetStatus.hasBudget && (
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    {tCat.monthlyBudgetLabel}
                  </span>
                  <span
                    className={`text-xs font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums ${
                      hideBalance ? 'privacy-blur' : ''
                    }`}
                  >
                    {formatMAD(budgetStatus.budget, false, language)}
                  </span>
                </div>
              )}
            </div>

            {/* Optional Monthly Budget Progress Bar */}
            {budgetStatus.hasBudget && budgetStyles && (
              <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.05]">
                <div className="w-full bg-zinc-200 dark:bg-zinc-700/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${budgetStyles.barBg}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, budgetStatus.percent))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`flex items-center gap-1 ${budgetStyles.textClass}`}>
                    {budgetStatus.percent >= 80 && <AlertTriangle className="w-3 h-3 shrink-0" />}
                    <span className="tabular-nums">
                      {budgetStatus.percent}% {tCat.ofBudget}
                    </span>
                  </span>
                  <span
                    className={`text-zinc-500 dark:text-zinc-400 tabular-nums ${
                      hideBalance ? 'privacy-blur' : ''
                    }`}
                  >
                    {tCat.remaining} :{' '}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatMAD(budgetStatus.remaining, false, language)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Set Goal Prompt when no goal configured */}
            {!category.isGoal && !budgetStatus.hasBudget && onSetGoal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetGoal();
                }}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-blue-500/20 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                <span>{tCat.setGoal}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Quick Actions: Apple HIG translucent tactile buttons */}
      <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickExpense) onQuickExpense();
          }}
          className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-black/[0.04] dark:border-white/[0.06] transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{tCat.quickExpense}</span>
        </button>

        {category.isGoal && onQuickContribute ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickContribute();
            }}
            className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 border border-blue-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{tCat.quickContribute}</span>
          </button>
        ) : (
          <div className="text-zinc-400 dark:text-zinc-600 flex items-center pr-1">
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
