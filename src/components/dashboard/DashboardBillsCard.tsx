import React from 'react';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { MoneyText } from '../common/PrivacyCurrency';
import { SubscriptionItem, Language } from '../../types';
import { calculateNextDueDate } from '../../utils/subscriptions';
import { getIntlLocale } from '../../utils/formatters';
import { translations } from '../../i18n/translations';

interface Props { subscriptions: SubscriptionItem[]; language: Language; onOpen: () => void; now?: Date; }

export const DashboardBillsCard: React.FC<Props> = ({ subscriptions, language, onOpen, now = new Date() }) => {
  const t = translations[language].dashboard;
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayStart = Date.parse(`${todayKey}T00:00:00`);
  const activeCount = subscriptions.filter((subscription) => !subscription.endDate || subscription.endDate >= todayKey).length;
  const dueItems = subscriptions
    .filter((subscription) => !subscription.endDate || subscription.endDate >= todayKey)
    .map((subscription) => {
      const dueDate = subscription.nextDueDate || calculateNextDueDate(subscription, now);
      const paid = subscription.payments?.some((payment) => payment.cycleDate === dueDate) || subscription.paidMonths?.includes(dueDate.slice(0, 7));
      const days = Math.round((Date.parse(`${dueDate}T00:00:00`) - todayStart) / 86_400_000);
      return { subscription, dueDate, days, paid: Boolean(paid) };
    })
    .filter((item) => !item.paid && item.days <= 45 && item.days >= -30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  return (
    <div
      data-spotlight="true"
      className="spotlight-card flex flex-col justify-between gap-3.5 rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] h-fit"
    >
    <button type="button" onClick={onOpen} className="flex items-center justify-between gap-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400"><CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-indigo-400" />{t.nextBills}</span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-white transition-colors">{translations[language].nav.subscriptions}<span aria-hidden="true"> →</span></span>
    </button>
    {dueItems.length ? <div className="space-y-2">
      {dueItems.map(({ subscription, dueDate, days }) => {
        const isOverdue = days < 0;
        const isToday = days === 0;
        const dueLabel = isOverdue ? t.overdue : isToday ? t.dueToday : t.inDays.replace('{count}', String(days));
        const dateLabel = new Intl.DateTimeFormat(getIntlLocale(language), { day: 'numeric', month: 'short' }).format(new Date(`${dueDate}T12:00:00`));
        return <div key={subscription.id} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-2.5 hover:bg-white/[0.05] transition-all">
          <div className="min-w-0 flex-1">
            <p title={subscription.name} className="truncate text-xs font-semibold text-zinc-200">{subscription.name}</p>
            <p className="mt-0.5 text-[10px] text-zinc-400">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-shrink-0 whitespace-nowrap">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums shrink-0 flex-shrink-0 whitespace-nowrap ${isOverdue ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' : isToday ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'bg-white/[0.05] text-zinc-300 border border-white/[0.06]'}`}>
              {dueLabel}
            </span>
            <MoneyText amount={subscription.amount} className="text-xs font-bold tabular-nums text-white shrink-0 flex-shrink-0 whitespace-nowrap" />
          </div>
        </div>;
      })}
    </div> : <p className="mt-auto flex min-h-11 items-center gap-2 text-xs text-zinc-400"><CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-400" />{t.billsUpToDate.replace('{count}', String(activeCount))}</p>}
    </div>
  );
};
