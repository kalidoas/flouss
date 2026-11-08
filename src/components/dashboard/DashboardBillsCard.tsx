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

  return <Card padding="md" className="flex min-h-[190px] flex-col gap-3">
    <button type="button" onClick={onOpen} className="flex min-h-11 items-center justify-between gap-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <span className="flex items-center gap-2 text-sm font-semibold text-content"><CalendarClock aria-hidden="true" className="h-4 w-4 text-accent" />{t.nextBills}</span>
      <span className="text-xs font-medium text-accent">{translations[language].nav.subscriptions}<span aria-hidden="true"> →</span></span>
    </button>
    {dueItems.length ? <div className="space-y-1">
      {dueItems.map(({ subscription, dueDate, days }) => {
        const dueLabel = days < 0 ? t.overdue : days === 0 ? t.dueToday : t.inDays.replace('{count}', String(days));
        const dateLabel = new Intl.DateTimeFormat(getIntlLocale(language), { day: 'numeric', month: 'short' }).format(new Date(`${dueDate}T12:00:00`));
        return <div key={subscription.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-border-subtle py-1.5 last:border-0">
          <div className="min-w-0"><p title={subscription.name} className="truncate text-sm font-medium text-content">{subscription.name}</p><p className="text-xs text-muted">{dueLabel} · {dateLabel}</p></div>
          <MoneyText amount={subscription.amount} className="shrink-0 text-xs font-semibold text-content" />
        </div>;
      })}
    </div> : <p className="mt-auto flex min-h-11 items-center gap-2 text-xs text-muted"><CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-positive" />{t.billsUpToDate.replace('{count}', String(activeCount))}</p>}
  </Card>;
};
