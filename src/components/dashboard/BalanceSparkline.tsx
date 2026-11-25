import React, { useMemo, useState } from 'react';
import { Transaction, Language } from '../../types';
import { Money } from '../common/Money';
import { selectDashboardFinancials, selectFinancialSummary } from '../../utils/calculations';
import { formatDate, formatMAD, getIntlLocale } from '../../utils/formatters';
import { Sparkles } from 'lucide-react';

export interface BalancePoint {
  date: string;
  balance: number;
  change: number;
}

interface Props {
  initialBalance: number | null;
  transactions: Transaction[];
  selectedMonth: string;
  currentMonth: string;
  language: Language;
  chartLabel: string;
  balanceLabel: string;
  changeLabel: string;
}

export const buildBalanceSeries = (
  initialBalance: number | null,
  transactions: Transaction[] = [],
  selectedMonth: string,
  currentMonth: string,
  now = new Date()
): BalancePoint[] => {
  const safeMonth = selectedMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = safeMonth.split('-').map(Number);
  const daysInMonth = new Date(year || now.getFullYear(), month || now.getMonth() + 1, 0).getDate();
  const visibleDays = safeMonth === currentMonth ? Math.max(1, now.getDate()) : daysInMonth;
  const priorDate = new Date(year || now.getFullYear(), (month || 1) - 2, 1);
  const priorMonth = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;
  let balance = selectDashboardFinancials(initialBalance, transactions || [], priorMonth).balance;
  const points: BalancePoint[] = [];

  for (let day = 1; day <= visibleDays; day += 1) {
    const date = `${safeMonth}-${String(day).padStart(2, '0')}`;
    const dailyTransactions = (transactions || []).filter((transaction) => transaction?.date?.slice(0, 10) === date);
    const change = selectFinancialSummary(dailyTransactions).net;
    balance = Math.round((balance + change) * 100) / 100;
    points.push({ date, balance, change });
  }
  return points;
};

export const BalanceSparkline: React.FC<Props> = ({
  initialBalance, transactions, selectedMonth, currentMonth, language,
  chartLabel, balanceLabel, changeLabel,
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const points = useMemo(
    () => buildBalanceSeries(initialBalance, transactions, selectedMonth, currentMonth),
    [initialBalance, transactions, selectedMonth, currentMonth]
  );
  const dimensions = { width: 800, height: 120, padX: 0, padY: 10 };
  const values = points.map((point) => point.balance);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const span = Math.max(maxValue - minValue, 1);
  const coordinates = points.map((point, index) => ({
    x: points.length <= 1 ? dimensions.width / 2 : index * (dimensions.width / (points.length - 1)),
    y: dimensions.padY + (maxValue - point.balance) * (dimensions.height - dimensions.padY * 2) / span,
  }));
  const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const last = coordinates[coordinates.length - 1] || { x: 0, y: 0 };
  const areaPath = `${linePath} L ${last.x} ${dimensions.height} L ${coordinates[0]?.x || 0} ${dimensions.height} Z`;
  const safeIndex = activeIndex < 0 ? Math.max(points.length - 1, 0) : Math.min(activeIndex, Math.max(points.length - 1, 0));
  const point = points[safeIndex];
  const coordinate = coordinates[safeIndex];
  const endpoint = coordinates[coordinates.length - 1];
  const locale = getIntlLocale(language);
  const tooltipDate = point ? new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${point.date}T12:00:00`)) : '';
  const summary = points.length
    ? `${chartLabel}: ${formatDate(points[0].date, language)} – ${formatDate(points[points.length - 1].date, language)}`
    : chartLabel;
  const xRatio = dimensions.width > 0 ? (coordinate?.x || 0) / dimensions.width : 0.5;
  const clampedPercent = Math.max(12, Math.min(88, xRatio * 100));

  const emptyState = points.length === 0 || points.every((p) => p.balance === 0);

  return (
    <div className="relative mt-2 pt-2 w-full overflow-hidden">
      {emptyState ? (
        <div className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle dark:border-border-subtle/30 bg-surface text-muted">
          <Sparkles className="w-8 h-8 opacity-20 shrink-0" />
          <p className="text-[11px] font-medium text-muted dark:text-muted">
            {language === 'ar' ? 'لا بيانات حالياً' : language === 'fr' ? 'Aucune donnée' : 'No data yet'}
          </p>
        </div>
      ) : (
        <>
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-xl border border-border-subtle bg-surface dark:bg-zinc-900/95 dark:border-white/10 px-3 py-1.5 text-xs shadow-sm backdrop-blur-md text-content dark:text-white transition-[left] duration-75"
            style={{
              left: `${clampedPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="mb-0.5 text-[10px] text-muted dark:text-zinc-400">{tooltipDate}</p>
            <p className="font-semibold text-content dark:text-white leading-tight"><span className="sr-only">{balanceLabel}: </span><Money amount={point?.balance || 0} /></p>
            <p className="text-[10px] text-muted dark:text-zinc-400"><span>{changeLabel}: </span><Money amount={point?.change || 0} showSign /></p>
          </div>
          <svg
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="none"
            role="slider"
            aria-label={summary}
            aria-valuemin={1}
            aria-valuemax={Math.max(points.length, 1)}
            aria-valuenow={safeIndex + 1}
            aria-valuetext={`${tooltipDate}, ${balanceLabel} ${formatMADForAria(point?.balance || 0, language)}, ${changeLabel} ${formatMADForAria(point?.change || 0, language)}`}
            tabIndex={0}
            onFocus={() => setActiveIndex(points.length - 1)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
              event.preventDefault();
              const direction = event.key === 'ArrowRight' ? 1 : -1;
              setActiveIndex(Math.max(0, Math.min(points.length - 1, safeIndex + direction)));
            }}
            className="h-24 w-full touch-pan-y outline-none focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
          >
            <defs>
              <linearGradient id="balance-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A84FF" stopOpacity=".28" />
                <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#balance-sparkline-fill)" />
            <path d={linePath} fill="none" stroke="#0A84FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {endpoint && <circle cx={endpoint.x} cy={endpoint.y} r="6" fill="#0A84FF" stroke="#F5F5F7" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
            {coordinate && safeIndex !== points.length - 1 && <circle cx={coordinate.x} cy={coordinate.y} r="4" fill="#F5F5F7" stroke="#0A84FF" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
          </svg>
        </>
      )}
    </div>
  );
};

function formatMADForAria(amount: number, language: Language) {
  return formatMAD(amount, false, language);
}
