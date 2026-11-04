import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { AppleGlassCard } from '../common/AppleGlassCard';
import { PrivacyCurrency } from '../common/PrivacyCurrency';
import { formatMAD, getCurrentMonthStr, isTransactionInMonth, getTransactionMonth } from '../../utils/formatters';
import { calculateAvailableBalance, selectAvailableBalance } from '../../utils/calculations';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ChartPoint {
  day: string;
  date: string;
  balance: number;
}

export const AppleCardBalanceChart: React.FC = () => {
  const { balance: storeBalance, initialBalance, transactions, language, isBalanceHidden, hideBalance } = useAppStore();
  const currentMonth = getCurrentMonthStr(); // "YYYY-MM"
  const isHidden = isBalanceHidden ?? hideBalance;

  // Single source of truth calculation matching WalletCard exactly
  const currentBalance = selectAvailableBalance({ initialBalance, transactions, balance: storeBalance });

  // Build daily balance curve for the current month
  const { data, deltaAmount, deltaPercent } = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();

    // Prior transactions determine the month-opening balance
    const priorTransactions = (transactions || []).filter((tx) => !tx.date || getTransactionMonth(tx.date) < currentMonth);
    const startingBalance = calculateAvailableBalance(initialBalance, priorTransactions);

    // Current month transactions sorted ascending by date
    const monthTx = (transactions || [])
      .filter((tx) => tx.date && isTransactionInMonth(tx.date, currentMonth))
      .sort((a, b) => a.date.localeCompare(b.date));

    const txDays = monthTx.map((t) => parseInt(t.date.slice(8, 10), 10)).filter((d) => !isNaN(d));
    const maxDay = Math.max(todayDay, 5, ...txDays);

    const points: ChartPoint[] = [];
    let runningBalance = startingBalance;

    // Build timeline for days 1 through maxDay
    for (let day = 1; day <= maxDay; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentMonth}-${dayStr}`;

      // Sum transactions that happened on this day
      const daysTx = monthTx.filter((t) => t.date.slice(0, 10) === dateStr);
      for (const tx of daysTx) {
        const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : parseFloat(String(tx.amount || 0)) || 0;
        if (tx.type === 'income') runningBalance += amt;
        else if (tx.type === 'expense') runningBalance -= amt;
        else if (tx.type === 'contribution') runningBalance -= amt;
        else if (tx.type === 'goal_withdraw') runningBalance += amt;
      }

      points.push({
        day: `J${day}`,
        date: dateStr,
        balance: Math.round(runningBalance * 100) / 100,
      });
    }

    // If flat (no current month transactions yet), all points consistently equal currentBalance
    if (points.length === 0 || points.every((p) => p.balance === points[0]?.balance)) {
      const flatPoints: ChartPoint[] = [];
      const numPoints = Math.max(5, todayDay);
      for (let day = 1; day <= numPoints; day++) {
        flatPoints.push({
          day: `J${day}`,
          date: `${currentMonth}-${String(day).padStart(2, '0')}`,
          balance: currentBalance,
        });
      }
      return {
        data: flatPoints,
        deltaAmount: 0,
        deltaPercent: 0,
      };
    }

    const firstBal = points[0]?.balance || 0;
    const lastBal = points[points.length - 1]?.balance ?? currentBalance;
    const diff = Math.round((lastBal - firstBal) * 100) / 100;
    const pct = firstBal !== 0 ? Math.round((diff / Math.abs(firstBal)) * 100) : 0;

    return {
      data: points,
      deltaAmount: diff,
      deltaPercent: pct,
    };
  }, [initialBalance, transactions, currentMonth, currentBalance]);

  const isPositive = deltaAmount >= 0;
  const isAr = language === 'ar';
  const isEn = language === 'en';

  return (
    <AppleGlassCard className="p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden" enableTilt={false}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 relative z-10 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 stroke-[2.4]" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {isAr ? 'منحنى الرصيد هذا الشهر' : isEn ? 'Monthly Balance Curve' : 'Courbe du Solde (Ce mois)'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <PrivacyCurrency
              amount={currentBalance}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {/* Dynamic Delta Badge */}
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
            isPositive
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span className="tabular-nums">
            {isPositive ? '+' : ''}
            {deltaPercent}%
          </span>
        </div>
      </div>

      {/* Apple Card Minimalist Smooth Spline Chart */}
      <div className="w-full h-32 sm:h-36 relative -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="appleCardSplineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="70%" stopColor="#6366f1" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="day" hide />
            <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  const item = payload[0].payload as ChartPoint;
                  return (
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/10 dark:border-white/15 px-3 py-1.5 rounded-xl shadow-xl text-xs space-y-0.5">
                      <div className="text-[10px] text-zinc-400 font-medium">{item.date}</div>
                      <div className="font-bold text-zinc-900 dark:text-white tabular-nums">
                        {isHidden ? '••••••' : formatMAD(val, false, language)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2.8}
              fill="url(#appleCardSplineGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#3b82f6',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AppleGlassCard>
  );
};

export const DashboardChart = AppleCardBalanceChart;
