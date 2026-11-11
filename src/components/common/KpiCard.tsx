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
  extraLine?: React.ReactNode;
  subtext?: React.ReactNode;
  footerRight?: React.ReactNode;
  badge?: string;
  isPositiveGood?: boolean;
}

const COLOR_MAP: Record<string, { iconBg: string; iconText: string; iconBorder: string; glow: string }> = {
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    iconBorder: 'border-emerald-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.12), transparent 70%)',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconText: 'text-rose-400',
    iconBorder: 'border-rose-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(244,63,94,0.12), transparent 70%)',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10',
    iconText: 'text-indigo-400',
    iconBorder: 'border-indigo-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.14), transparent 70%)',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    iconBorder: 'border-amber-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.12), transparent 70%)',
  },
  blue: {
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-400',
    iconBorder: 'border-blue-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.12), transparent 70%)',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-400',
    iconBorder: 'border-purple-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(168,85,247,0.12), transparent 70%)',
  },
  teal: {
    iconBg: 'bg-teal-500/10',
    iconText: 'text-teal-400',
    iconBorder: 'border-teal-500/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(20,184,166,0.12), transparent 70%)',
  },
  zinc: {
    iconBg: 'bg-white/[0.04]',
    iconText: 'text-zinc-400',
    iconBorder: 'border-white/[0.08]',
    glow: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.04), transparent 70%)',
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
    ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
    : isGood
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
    : 'bg-rose-500/15 text-rose-300 border-rose-500/25';

  const TrendIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      data-spotlight="true"
      className="spotlight-card flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden min-h-[142px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] transition-all group relative"
      style={{ backgroundImage: themeStyles.glow }}
    >
      {/* 1. Header: Icon + Uppercase Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${themeStyles.iconBg} ${themeStyles.iconText} ${themeStyles.iconBorder}`}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-zinc-400 truncate">
            {title}
          </span>
        </div>

        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08] shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* 2. Main Value: Middle row on its own line */}
      <div className="my-2 min-w-0">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate tabular-nums">
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

      {/* 3. Footer / Subtext: Clean unbreakable flex layout */}
      <div className="pt-2.5 mt-auto border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {hasChange ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${trendBadgeColor} shrink-0`}
            >
              <TrendIcon className="w-2.5 h-2.5 stroke-[2.5]" />
              <span className="tabular-nums">
                {isZero ? '0' : `${isPositive ? '+' : '-'}${Math.abs(change)}`}
                {changeSuffix || ''}
              </span>
            </span>
          ) : null}

          {changeLabel && (
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">
              {changeLabel}
            </span>
          )}

          {subtext && !changeLabel && (
            <div className="text-[11px] text-zinc-400">
              {subtext}
            </div>
          )}
        </div>

        {(footerRight || (count !== undefined && countLabel) || extraLine) && (
          <div className="shrink-0 text-end">
            {footerRight ? (
              footerRight
            ) : count !== undefined && countLabel ? (
              <span className="text-[11px] font-medium text-zinc-400 tabular-nums">
                {count} {countLabel}
              </span>
            ) : extraLine ? (
              <span className="text-[11px] font-medium text-zinc-400 block truncate max-w-[130px]">
                {extraLine}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export const StatCard = KpiCard;
