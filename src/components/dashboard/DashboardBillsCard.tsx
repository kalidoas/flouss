import React from 'react';
import { CalendarClock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Money } from '../common/Money';
import { SubscriptionItem, Language } from '../../types';
import { calculateNextDueDate } from '../../utils/subscriptions';
import { getIntlLocale } from '../../utils/formatters';
import { translations } from '../../i18n/translations';

interface Props {
  subscriptions: SubscriptionItem[];
  language: Language;
  onOpen: () => void;
  now?: Date;
}

export const DashboardBillsCard: React.FC<Props> = ({
  subscriptions = [],
  language,
  onOpen,
  now = new Date(),
}) => {
  const t = translations[language].dashboard;
  const list = subscriptions || [];
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const todayStart = Date.parse(`${todayKey}T00:00:00`);

  const allDueItems = list
    .filter((subscription) => !subscription.endDate || subscription.endDate >= todayKey)
    .map((subscription) => {
      const dueDate = subscription.nextDueDate || calculateNextDueDate(subscription, now);
      const paid =
        subscription.payments?.some((payment) => payment.cycleDate === dueDate) ||
        subscription.paidMonths?.includes(dueDate.slice(0, 7));
      const days = Math.round((Date.parse(`${dueDate}T00:00:00`) - todayStart) / 86_400_000);
      return { subscription, dueDate, days, paid: Boolean(paid) };
    })
    .filter((item) => !item.paid)
    .sort((a, b) => a.days - b.days);

  // ONLY bills due within 14 days (and not overdue by more than 30 days)
  const dueWithin14Days = allDueItems
    .filter((item) => item.days <= 14 && item.days >= -30)
    .slice(0, 3);
  const nextFutureBill = allDueItems.find((item) => item.days > 14);

  const nextBillFormatted = nextFutureBill
    ? new Intl.DateTimeFormat(getIntlLocale(language), { day: 'numeric', month: 'short' }).format(
        new Date(`${nextFutureBill.dueDate}T12:00:00`)
      )
    : null;

  return (
    <div
      data-spotlight="true"
      className="spotlight-card flex flex-col justify-between gap-3.5 rounded-2xl bg-surface dark:bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-white/10 h-fit min-w-0"
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h2 className="flex items-center gap-1.5 text-[15px] sm:text-base font-semibold text-content dark:text-white truncate">
          <CalendarClock aria-hidden="true" className="h-4 w-4 text-muted dark:text-muted shrink-0" />
          <span>{t.nextBills}</span>
        </h2>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted dark:text-muted hover:text-content dark:hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <span>{translations[language].nav.subscriptions}</span>
          <ArrowRight aria-hidden="true" className="h-3 w-3 rtl:rotate-180" />
        </button>
      </div>

      {dueWithin14Days.length > 0 ? (
        <div className="space-y-2 min-w-0">
          {dueWithin14Days.map(({ subscription, dueDate, days }) => {
            const isOverdue = days < 0;
            const isToday = days === 0;
            const dueLabel = isOverdue
              ? t.overdue
              : isToday
              ? t.dueToday
              : t.inDays.replace('{count}', String(days));
            const dateLabel = new Intl.DateTimeFormat(getIntlLocale(language), {
              day: 'numeric',
              month: 'short',
            }).format(new Date(`${dueDate}T12:00:00`));

            return (
              <div
                key={subscription.id}
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-raised/60 dark:bg-white/[0.03] border border-border-subtle dark:border-white/[0.05] p-2.5 hover:bg-surface-raised dark:hover:bg-white/[0.05] transition-all min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <p title={subscription.name} className="truncate text-xs font-semibold text-content dark:text-zinc-200">
                    {subscription.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted dark:text-zinc-400">{dateLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums shrink-0 whitespace-nowrap ${
                      isOverdue
                        ? 'bg-negative/15 text-negative dark:text-negative border border-negative/20'
                        : isToday
                        ? 'bg-positive/15 text-positive dark:text-positive border border-positive/20'
                        : 'bg-surface-raised dark:bg-white/[0.05] text-muted dark:text-zinc-300 border border-border-subtle dark:border-white/[0.06]'
                    }`}
                  >
                    {dueLabel}
                  </span>
                  <Money
                    amount={subscription.amount}
                    className="text-xs font-bold tabular-nums text-content dark:text-white shrink-0 whitespace-nowrap"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-11 items-center justify-between gap-2 text-xs min-w-0 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-muted dark:text-zinc-300 font-medium truncate">
              {t.nothingDueSoon}
            </span>
          </div>
          {nextBillFormatted && (
            <span className="text-[11px] text-muted dark:text-zinc-400 shrink-0 whitespace-nowrap">
              {t.nextBillDue.replace('{date}', nextBillFormatted)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
