import React from 'react';
import { IconType } from 'lucide-react';
import { formatMAD } from '../../utils/formatters';
import { translations } from '../../i18n/translations';
import { useAppStore } from '../../store/useAppStore';

type KpiCardProps = {
  title: string;
  value: number;
  change: number;
  icon: IconType;
  color: string;
  unit: 'MAD' | '%';
  count?: number;
  countLabel?: string;
  extraLine?: string;
  changeLabel?: string;
  changeSuffix?: string;
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  unit,
  count,
  countLabel,
  extraLine,
  changeLabel,
  changeSuffix,
}) => {
  const { language } = useAppStore();
  const t = translations[language].stats;

  const formatValue = (val: number) => {
    if (unit === 'MAD') {
      return formatMAD(val, false, language);
    } else {
      return `${val.toFixed(0)}${unit}`; // For percentages without decimal
    }
  };

  const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}-500/15 text-${color}-600 dark:text-${color}-400 border border-${color}-500/20`}>
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
            {count !== undefined && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {countLabel ? `${count} ${countLabel}` : `${count} ${t.kpiIncomeCount || ''}`}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${color}-600 dark:text-${color}-400 tabular-nums`}>
            {formatValue(value)}
          </h2>
          {extraLine && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{extraLine}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <ChangeIcon className={`w-4 h-4 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'} dark:text-opacity-90`} />
          <span>
            {changeLabel ? (
              <>
                {changeLabel}:
                <span className="font-medium ml-1">
                  {change !== 0 ? `${change >= 0 ? '+' : '-'}${Math.abs(change)}${changeSuffix || ''}` : t.kpiNoChange}
                </span>
              </>
            ) : (
              <>
                {change !== 0 ? `${change >= 0 ? '+' : '-'}${Math.abs(change)}${changeSuffix || ''}` : t.kpiNoChange}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
