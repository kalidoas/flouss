import React from 'react';
import { Category } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import {
  calculateCategorySpentAmount,
  calculateGoalProgress,
  calculateCategoryBudgetStatus,
} from '../../utils/calculations';
import { formatMAD, getCurrentMonthStr } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { Badge } from '../common/Badge';
import { translations } from '../../i18n/translations';
import { getCategoryName } from '../../utils/i18nHelpers';
import { ArrowUpRight, Plus, Target, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

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
  const subcatCount = category.subcategories?.length || 0;

  // Determine budget bar color and warning styling
  const getBudgetBarStyles = (percent: number) => {
    if (percent >= 100) {
      return {
        barBg: 'bg-rose-500 animate-pulse',
        textClass: 'text-rose-600 dark:text-rose-400 font-bold',
      };
    }
    if (percent >= 80) {
      return {
        barBg: 'bg-amber-500',
        textClass: 'text-amber-600 dark:text-amber-400 font-bold',
      };
    }
    return {
      barBg: 'bg-emerald-500',
      textClass: 'text-slate-500 dark:text-slate-400',
    };
  };

  const budgetStyles = budgetStatus.hasBudget ? getBudgetBarStyles(budgetStatus.percent) : null;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-lg p-4 bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f] transition-all duration-150 flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Icon, Name & Type Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: category.color }}
            >
              <IconComp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-xs sm:text-sm text-[#37352f] dark:text-[#ecebed] line-clamp-1 truncate">
                {categoryName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] text-[#787774] dark:text-[#9b9a97]">
                  {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
                </p>
                {subcatCount > 0 && (
                  <span className="text-[10px] text-[#787774] bg-[#f1f0ee] dark:bg-[#282828] px-1 py-0.2 rounded">
                    {subcatCount} {language === 'ar' ? 'فروع' : 'sous-cat.'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {category.isGoal ? (
            <Badge
              variant={goalCalc?.status === 'completed' ? 'emerald' : 'blue'}
              size="sm"
            >
              {goalCalc?.status === 'completed' ? tCat.completed : tCat.goalBadge}
            </Badge>
          ) : (
            <Badge variant="slate" size="sm">
              {tCat.expenseBadge}
            </Badge>
          )}
        </div>

        {/* Goal specific content */}
        {category.isGoal && goalCalc ? (
          <div className="space-y-2 mt-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className={`font-semibold text-sm sm:text-base text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                {formatMAD(goalCalc.savedAmount, false, language)}
              </span>
              <span className={`text-[#787774] dark:text-[#9b9a97] tabular-nums text-[11px] transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                / {formatMAD(category.targetAmount || 0, false, language)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#f1f0ee] dark:bg-[#282828] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: goalCalc.progressPercent === 0 ? '0%' : `${Math.min(100, goalCalc.progressPercent)}%`,
                  backgroundColor: category.color || '#2383e2',
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#787774] dark:text-[#9b9a97] pt-0.5">
              <span className="tabular-nums">{goalCalc.progressPercent}% {language === 'ar' ? 'مدخر' : 'épargné'}</span>
              {goalCalc.status !== 'completed' ? (
                <span className={`text-emerald-600 dark:text-emerald-400 font-medium tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                  +{formatMAD(goalCalc.monthlyNeeded, false, language)}/{tDash.monthlyTarget}
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {language === 'ar' ? 'تم بلوغ الهدف' : 'Objectif atteint'}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Simple Expense content with Optional Monthly Budget */
          <div className="mt-2 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] block">{tCat.spentThisMonth} :</span>
                <span className={`text-sm sm:text-base font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                  {formatMAD(spentThisMonth, false, language)}
                </span>
              </div>
              {budgetStatus.hasBudget && (
                <div className="text-right">
                  <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] block">
                    {language === 'ar' ? 'سقف الميزانية' : 'Plafond'}
                  </span>
                  <span className={`text-xs font-medium text-[#787774] dark:text-[#9b9a97] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                    {formatMAD(budgetStatus.budget, false, language)}
                  </span>
                </div>
              )}
            </div>

            {/* Optional Monthly Budget Progress Bar */}
            {budgetStatus.hasBudget && budgetStyles && (
              <div className="space-y-1 p-2 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f]">
                <div className="w-full bg-[#f1f0ee] dark:bg-[#282828] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${budgetStyles.barBg}`}
                    style={{
                      width: budgetStatus.percent === 0 ? '0%' : `${Math.min(100, budgetStatus.percent)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`flex items-center gap-1 ${budgetStyles.textClass}`}>
                    {budgetStatus.percent >= 80 && <AlertTriangle className="w-3 h-3 shrink-0" />}
                    <span>{budgetStatus.percent}% {language === 'ar' ? 'مستهلك' : 'consommé'}</span>
                  </span>
                  <span className={`text-[#787774] dark:text-[#9b9a97] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                    {language === 'ar' ? 'المتبقي' : 'Reste'} : {formatMAD(budgetStatus.remaining, false, language)}
                  </span>
                </div>
              </div>
            )}

            {/* "Définir un objectif" button for categories without a goal */}
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSetGoal) onSetGoal();
                }}
                className="w-full py-1 px-2 rounded-md text-xs font-normal text-[#2383e2] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] border border-[#e3e2de] dark:border-[#2f2f2f] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Target className="w-3 h-3" />
                <span>{tCat.setGoal}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Quick Action buttons */}
      <div className="pt-2.5 mt-2.5 border-t border-[#e3e2de] dark:border-[#2f2f2f] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickExpense) onQuickExpense();
          }}
          className="flex-1 py-1 px-2 rounded-md text-xs font-normal text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{tDash.addExpense}</span>
        </button>

        {category.isGoal && onQuickContribute && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickContribute();
            }}
            className="flex-1 py-1 px-2 rounded-md text-xs font-medium text-[#2383e2] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors flex items-center justify-center gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{tDash.contribute}</span>
          </button>
        )}
      </div>
    </div>
  );
};
