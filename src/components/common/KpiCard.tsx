import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Money } from './Money';
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
    iconBg: 'bg-positive/10',
    iconText: 'text-positive',
    iconBorder: 'border-positive/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.12), transparent 70%)',
  },
  rose: {
    iconBg: 'bg-negative/10',
    iconText: 'text-negative',
    iconBorder: 'border-negative/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(244,63,94,0.12), transparent 70%)',
  },
  indigo: {
    iconBg: 'bg-accent/10',
    iconText: 'text-accent',
    iconBorder: 'border-accent/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.14), transparent 70%)',
  },
  amber: {
    iconBg: 'bg-warning/10',
    iconText: 'text-warning',
    iconBorder: 'border-warning/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.12), transparent 70%)',
  },
  blue: {
    iconBg: 'bg-info/10',
    iconText: 'text-info',
    iconBorder: 'border-info/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.12), transparent 70%)',
  },
  purple: {
    iconBg: 'bg-accent/10',
    iconText: 'text-accent',
    iconBorder: 'border-accent/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(168,85,247,0.12), transparent 70%)',
  },
  teal: {
    iconBg: 'bg-positive/10',
    iconText: 'text-positive',
    iconBorder: 'border-positive/20',
    glow: 'radial-gradient(circle at 100% 0%, rgba(20,184,166,0.12), transparent 70%)',
  },
  zinc: {
    iconBg: 'bg-surface-3',
    iconText: 'text-text-subtle',
    iconBorder: 'border-border-strong',
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
    ? 'bg-surface-3 text-text-subtle border-border-strong'
    : isGood
    ? 'bg-positive/15 text-positive border-positive/25'
    : 'bg-negative/15 text-negative border-negative/25';

  const TrendIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      data-spotlight="true"
      className="spotlight-card flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface-3 backdrop-blur-xl border border-border overflow-hidden min-h-[142px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] transition-all group relative"
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
          <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-text-subtle truncate">
            {title}
          </span>
        </div>

        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-3 text-muted border border-border-strong shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* 2. Main Value: Middle row on its own line */}
      <div className="my-2 min-w-0">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-content truncate tabular-nums">
          {isMAD ? (
            typeof value === 'number' ? (
              <Money amount={value} />
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
      <div className="pt-2.5 mt-auto border-t border-border flex items-center justify-between gap-2 text-xs">
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
            <span className="text-[11px] text-text-subtle font-medium whitespace-nowrap">
              {changeLabel}
            </span>
          )}

          {subtext && !changeLabel && (
            <div className="text-[11px] text-text-subtle">
              {subtext}
            </div>
          )}
        </div>

        {(footerRight || (count !== undefined && countLabel) || extraLine) && (
          <div className="shrink-0 text-end">
            {footerRight ? (
              footerRight
            ) : count !== undefined && countLabel ? (
              <span className="text-[11px] font-medium text-text-subtle tabular-nums">
                {count} {countLabel}
              </span>
            ) : extraLine ? (
              <span className="text-[11px] font-medium text-text-subtle block truncate max-w-[130px]">
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
