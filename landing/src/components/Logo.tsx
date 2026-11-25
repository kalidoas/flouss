import type { Locale } from '../copy';

type Props = { locale: Locale; className?: string };

export function Logo({ locale, className = '' }: Props) {
  const wordmark = locale === 'ar' ? 'فلوس' : 'Flouss';
  const label = locale === 'ar' ? 'الصفحة الرئيسية لفلوس' : locale === 'fr' ? 'Accueil Flouss' : 'Flouss home';

  return (
    <a className={`brand ${className}`.trim()} href="#home" aria-label={label}>
      <svg className="brand__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="20" cy="20" r="9.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="brand__name" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>{wordmark}</span>
    </a>
  );
}
