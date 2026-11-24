import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Transaction } from '../../types';
import { selectCashRunwayKpi } from '../../utils/dashboardKpis';
import { GaugeArc } from '../../motion';

interface Props {
  initialBalance: number | null;
  transactions: Transaction[];
  language: 'ar' | 'fr' | 'en';
}

export const RunwayGauge: React.FC<Props> = ({
  initialBalance,
  transactions,
  language,
}) => {
  const t = translations[language].dashboard;
  const balance = useAppStore((s) => s.initialBalance) ?? 0;
  const txList = transactions || [];

  const runwayKpi = useMemo(
    () => selectCashRunwayKpi(balance, txList),
    [balance, txList]
  );

  const { runwayDays, dailyBurn, historyDays, hasEnoughHistory } = runwayKpi;

  if (!hasEnoughHistory || balance <= 0) {
    return (
      <div className="spotlight-card rounded-2xl bg-surface dark:bg-surface-3/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h2 className="text-[15px] sm:text-base font-semibold text-content dark:text-content truncate">
            {t.runwayGauge}
          </h2>
        </div>
        <p className="mt-4 text-xs text-muted dark:text-muted text-center">
          {t.runwayNeedsHistory}
        </p>
      </div>
    );
  }

  const progress = runwayDays && runwayDays > 0 ? Math.min(100, (runwayDays / 60) * 100) : 0;
  const arcColor = runwayDays && runwayDays <= 30 ? 'var(--color-negative)' : 'var(--color-positive)';

  return (
    <div className="spotlight-card rounded-2xl bg-surface dark:bg-surface-3/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h2 className="text-[15px] sm:text-base font-semibold text-content dark:text-content truncate">
          {t.runwayGauge}
        </h2>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="relative" style={{ width: 120, height: 120 }}>
          <GaugeArc
            value={progress}
            max={100}
            size={120}
            strokeWidth={10}
            arcColor={arcColor}
            className="transform -rotate-90"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-content dark:text-content tabular-nums">
                {runwayDays !== null ? runwayDays : '—'}
              </div>
              <div className="text-[11px] text-muted dark:text-content mt-1">
                {t.days}
              </div>
            </div>
          </GaugeArc>
        </div>

        <div className="text-center text-xs text-muted dark:text-content">
          <p>{t.dailyBurn}: {dailyBurn.toFixed(2)} {t.perDay}</p>
          <p>{t.historyDays}: {historyDays} {t.days}</p>
        </div>
      </div>
    </div>
  );
};