import React, { useMemo } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Money } from '../common/Money';
import { translations } from '../../i18n/translations';
import { getWeeklySpendComparison } from '../../utils/weeklyReview';

export const WeeklyReviewCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const { transactions = [], language } = useAppStore();
  const review = useMemo(() => getWeeklySpendComparison(transactions), [transactions]);
  if (review.current === 0 && review.previous === 0) return null;
  const t = translations[language].dashboard;
  const copy = review.difference > 0 ? t.weeklyReviewUp : review.difference < 0 ? t.weeklyReviewDown : t.weeklyReviewSteady;
  const amount = Math.abs(review.difference);
  const [beforeAmount, afterAmount = ''] = copy.split('{amount}');
  return (
    <section className="rounded-card border border-border-subtle bg-surface p-4 shadow-xs" aria-labelledby="weekly-review-title">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent/10 text-accent"><CalendarDays className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="weekly-review-title" className="text-sm font-semibold text-content">{t.weeklyReviewTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{beforeAmount}{copy.includes('{amount}') && <Money amount={amount} />}{afterAmount}</p>
          <button type="button" onClick={onOpen} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            {t.weeklyReviewOpen}<ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </section>
  );
};
