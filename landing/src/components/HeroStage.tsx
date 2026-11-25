import type { Locale } from '../copy';

type Props = { locale: Locale; mockupLabel: string; balanceLabel: string };

const labels = {
  ar: { spend: 'المصاريف', today: 'اليوم', groceries: 'مشتريات', coffee: 'قهوة', saved: 'هدف الادخار', bill: 'فاتورة جاية', billName: 'الإنترنت', due: '28 نونبر' },
  fr: { spend: 'Dépenses', today: 'Aujourd’hui', groceries: 'Courses', coffee: 'Café', saved: 'Objectif d’épargne', bill: 'Facture à venir', billName: 'Internet', due: '28 nov.' },
  en: { spend: 'Spending', today: 'Today', groceries: 'Groceries', coffee: 'Coffee', saved: 'Savings goal', bill: 'Upcoming bill', billName: 'Internet', due: 'Nov 28' },
} satisfies Record<Locale, Record<string, string>>;

export function HeroStage({ locale, mockupLabel, balanceLabel }: Props) {
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
          <span className="hero-stage__balance-label">{balanceLabel}</span>
          <span className="hero-stage__currency">MAD</span>
        </div>
        <div className="hero-stage__balance" dir="ltr">8 450</div>
        <div className="hero-stage__divider" />
        <div className="hero-stage__subhead">{copy.spend}<span>{copy.today}</span></div>
        <div className="hero-stage__transaction">
          <span className="hero-stage__transaction-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.4 11h10.8l2-7H6.1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="17" cy="19" r="1" />
            </svg>
          </span>
          <span>{copy.groceries}<small>{copy.today}</small></span>
          <strong>−120</strong>
        </div>
        <div className="hero-stage__transaction">
          <span className="hero-stage__transaction-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
              <path d="M17 10h1a2.5 2.5 0 0 1 0 5h-1" />
              <path d="M8 4v2m5-2v2" />
            </svg>
          </span>
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
        <span className="hero-stage__bill-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h9l4 4v14H6z" />
            <path d="M15 3v5h5M9 13h7m-7 4h5" />
          </svg>
        </span>
        <span>{copy.bill}<strong>{copy.billName} · {copy.due}</strong></span>
        <b dir="ltr">340 MAD</b>
      </div>
    </div>
  );
}
