import React from 'react';
import { Category, GoalCalculation } from '../../types';
import { formatMAD } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

interface GoalProgressBarProps {
  category: Category;
  calc: GoalCalculation;
  hideBalance?: boolean;
  onContribute?: () => void;
  showContributeButton?: boolean;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  category,
  calc,
  hideBalance = false,
  onContribute,
  showContributeButton = true,
}) => {
  const { language } = useAppStore();
  const tCat = translations[language].categories;
  const { savedAmount, remainingAmount, progressPercent, remainingMonths, monthlyNeeded, status } =
    calc;

  const statusConfig = {
    completed: {
      label: tCat.completed,
      variant: 'emerald' as const,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    on_track: {
      label: tCat.onTrack,
      variant: 'emerald' as const,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    behind: {
      label: tCat.behind,
      variant: 'amber' as const,
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    not_started: {
      label: tCat.notStarted,
      variant: 'slate' as const,
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  };

  const statusInfo = statusConfig[status];

  return (
    <div className="space-y-3">
      {/* Header: Progress % & Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {progressPercent}%
          </span>
          <span className="text-xs text-slate-400 font-medium">atteint</span>
        </div>
        <Badge variant={statusInfo.variant} icon={statusInfo.icon}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-[#f1f0ee] dark:bg-[#282828] rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: progressPercent === 0 ? '0%' : `${Math.min(100, progressPercent)}%`,
            backgroundColor: category.color || '#2383e2',
          }}
        />
      </div>

      {/* Amount details */}
      <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
        <div>
          <span>Épargné : </span>
          <strong className={`text-[#37352f] dark:text-[#ecebed] font-medium tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            {formatMAD(savedAmount, false, language)}
          </strong>
        </div>
        <div>
          <span>Cible : </span>
          <strong className={`text-[#37352f] dark:text-[#ecebed] font-medium tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            {formatMAD(category.targetAmount || 0, false, language)}
          </strong>
        </div>
      </div>

      {/* Monthly Calculation / Recommendation advice */}
      {status !== 'completed' && (
        <div className="p-2.5 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] text-xs text-[#5f5e5b] dark:text-[#9b9a97] flex items-center justify-between gap-2">
          <div className="flex-1">
            <span className="text-[#787774] dark:text-[#9b9a97] block text-[11px]">{tCat.monthlyAdvice} :</span>
            <span className="font-medium text-[#37352f] dark:text-[#ecebed]">
              <span className={`text-emerald-600 dark:text-emerald-400 tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                {formatMAD(monthlyNeeded, false, language)}
              </span>{' '}
              / mois
            </span>
            <span className="text-[10px] text-[#787774] block mt-0.5">
              ({remainingMonths} mois restants • Reste <span className={hideBalance ? 'privacy-blur' : ''}>{formatMAD(remainingAmount, false, language)}</span>)
            </span>
          </div>

          {showContributeButton && onContribute && (
            <button
              onClick={onContribute}
              className="px-2.5 py-1 rounded bg-[#2383e2] hover:bg-[#1a73cb] text-white font-medium text-xs shadow-sm flex items-center gap-1 transition-colors shrink-0"
            >
              <span>+ Épargner</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
