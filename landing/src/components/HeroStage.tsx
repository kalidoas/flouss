import type { Locale } from '../copy';

type Props = { locale: Locale; mockupLabel: string };

const labels = {
  ar: { spend: 'المصاريف', today: 'اليوم', groceries: 'مشتريات', coffee: 'قهوة', saved: 'هدف الادخار', bill: 'فاتورة جاية', billName: 'الإنترنت', due: '28 نونبر' },
  fr: { spend: 'Dépenses', today: 'Aujourd’hui', groceries: 'Courses', coffee: 'Café', saved: 'Objectif d’épargne', bill: 'Facture à venir', billName: 'Internet', due: '28 nov.' },
  en: { spend: 'Spending', today: 'Today', groceries: 'Groceries', coffee: 'Coffee', saved: 'Savings goal', bill: 'Upcoming bill', billName: 'Internet', due: 'Nov 28' },
} satisfies Record<Locale, Record<string, string>>;

export function HeroStage({ locale, mockupLabel }: Props) {
  const copy = labels[locale];

  return (
    <div className="hero-stage" aria-hidden="true">
      <span className="hero-stage__mockup-label">{mockupLabel}</span>
      <div className="hero-stage__phone">
        <div className="hero-stage__device">
        <div className="hero-stage__header">
          <span className="hero-stage__brand-mark">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="20" cy="20" r="9.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <span className="hero-stage__balance-label">{copy.spend}</span>
          <span className="hero-stage__currency">MAD</span>
        </div>
        <div className="hero-stage__balance" dir="ltr">8 450</div>
        <div className="hero-stage__divider" />
        <div className="hero-stage__subhead">{copy.spend}<span>{copy.today}</span></div>
        <div className="hero-stage__transaction">
          <span className="hero-stage__transaction-icon">+</span>
          <span>{copy.groceries}<small>{copy.today}</small></span>
          <strong>−120</strong>
        </div>
        <div className="hero-stage__transaction">
          <span className="hero-stage__transaction-icon hero-stage__transaction-icon--warm">·</span>
          <span>{copy.coffee}<small>{copy.today}</small></span>
          <strong>−28</strong>
        </div>
        <div className="hero-stage__goal">
          <div className="hero-stage__progress"><span>64%</span></div>
          <div><small>{copy.saved}</small><strong dir="ltr">3 200 MAD</strong></div>
        </div>
        </div>
      </div>
      <div className="hero-stage__goal-chip">
        <span className="hero-stage__mini-progress">64%</span>
        <span>{copy.saved}<strong dir="ltr">3 200 MAD</strong></span>
      </div>
      <div className="hero-stage__bill-chip">
        <span className="hero-stage__bill-icon">•</span>
        <span>{copy.bill}<strong>{copy.billName} · {copy.due}</strong></span>
        <b dir="ltr">340 MAD</b>
      </div>
    </div>
  );
}
