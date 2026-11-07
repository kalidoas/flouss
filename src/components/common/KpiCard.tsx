import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PrivacyCurrency } from './PrivacyCurrency';
import { formatMAD } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';

export type KpiColor = 'emerald' | 'rose' | 'indigo' | 'amber' | 'blue' | 'purple' | 'teal' | 'zinc';

export interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: 'MAD' | '%' | string;
  isCurrency?: boolean;
  color?: KpiColor | string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  change?: number;
  changeLabel?: string;
  changeSuffix?: string;
  count?: number;
  countLabel?: string;
  extraLine?: string;
  subtext?: React.ReactNode;
  footerRight?: React.ReactNode;
  badge?: string;
  isPositiveGood?: boolean;
}

const COLOR_MAP: Record<string, { iconBg: string; iconText: string; iconBorder: string }> = {
  emerald: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    iconBorder: 'border-emerald-500/20',
  },
  rose: {
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    iconText: 'text-rose-600 dark:text-rose-400',
    iconBorder: 'border-rose-500/20',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    iconBorder: 'border-indigo-500/20',
  },
  amber: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    iconBorder: 'border-amber-500/20',
  },
  blue: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    iconBorder: 'border-blue-500/20',
  },
  purple: {
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/15',
    iconText: 'text-purple-600 dark:text-purple-400',
    iconBorder: 'border-purple-500/20',
  },
  teal: {
    iconBg: 'bg-teal-500/10 dark:bg-teal-500/15',
    iconText: 'text-teal-600 dark:text-teal-400',
    iconBorder: 'border-teal-500/20',
  },
  zinc: {
    iconBg: 'bg-zinc-500/10 dark:bg-zinc-500/15',
    iconText: 'text-zinc-600 dark:text-zinc-400',
    iconBorder: 'border-zinc-500/20',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit = 'MAD',
  isCurrency,
  color = 'indigo',
  icon: Icon,
  change,
  changeLabel,
  changeSuffix,
  count,
  countLabel,
  extraLine,
  subtext,
  footerRight,
  badge,
  isPositiveGood = true,
}) => {
  const { language } = useAppStore();
  const themeStyles = COLOR_MAP[color] || COLOR_MAP.zinc;
  const isMAD = isCurrency || unit === 'MAD';

  // Trend determination
  const hasChange = typeof change === 'number' && !isNaN(change);
  const isZero = change === 0;
  const isPositive = (change || 0) > 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;

  const trendBadgeColor = isZero
    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/50'
    : isGood
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40'
    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40';

  const TrendIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-zinc-800/80 overflow-hidden min-h-[140px] shadow-xs hover:border-black/[0.12] dark:hover:border-zinc-700/80 transition-all group">
      {/* 1. Header: Icon + Uppercase Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${themeStyles.iconBg} ${themeStyles.iconText} ${themeStyles.iconBorder}`}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2.4]" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase truncate">
            {title}
          </span>
        </div>

        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50 shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* 2. Main Value: Middle row on its own line */}
      <div className="my-2 min-w-0">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate tabular-nums">
          {isMAD ? (
            typeof value === 'number' ? (
              <PrivacyCurrency amount={value} />
            ) : typeof value === 'string' && (value.includes('MAD') || value.includes('د.م.')) ? (
              <span>{value}</span>
            ) : (
              <span>
                {value} {language === 'ar' ? 'د.م.' : 'MAD'}
              </span>
            )
          ) : unit === '%' ? (
            typeof value === 'number' ? (
              `${value}%`
            ) : (
              value
            )
          ) : (
            value
          )}
        </div>
      </div>

      {/* 3. Footer / Subtext: Bottom row with trend badge and secondary metric */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
        <div className="flex items-center gap-1.5 min-w-0">
          {hasChange ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${trendBadgeColor} shrink-0`}
            >
              <TrendIcon className="w-3 h-3 stroke-[2.5]" />
              <span className="tabular-nums">
                {isZero ? '0' : `${isPositive ? '+' : '-'}${Math.abs(change)}`}
                {changeSuffix || ''}
              </span>
            </span>
          ) : null}

          {changeLabel && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {changeLabel}
            </span>
          )}

          {subtext && !changeLabel && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {subtext}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          {footerRight ? (
            footerRight
          ) : count !== undefined && countLabel ? (
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
              {count} {countLabel}
            </span>
          ) : extraLine ? (
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[140px] block">
              {extraLine}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
