import { useEffect, useState, type ReactNode } from 'react';
import { copy, localeLabels, type Locale } from './copy';
import { HeroFlight } from './HeroFlight';

type Theme = 'light' | 'dark';

function getInitialLocale(): Locale {
  const pathLocale = window.location.pathname.split('/')[1];
  return pathLocale === 'fr' || pathLocale === 'en' || pathLocale === 'ar' ? pathLocale : 'ar';
}

function getInitialTheme(): Theme {
  try {
    const savedTheme = window.localStorage.getItem('flouss-landing-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    return 'light';
  }
  return 'light';
}

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const shared = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    gauge: <><path d="M4.6 18a9 9 0 1 1 14.8 0" /><path d="m12 13 4-4" /><path d="M7 18h10" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    cloud: <><path d="M20 16.2A4.5 4.5 0 0 0 18 7.5h-1.1A6 6 0 1 0 5 16.5h14" /><path d="M12 12v8m-3-3 3 3 3-3" /></>,
    moon: <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };
  return <svg {...shared}>{paths[name] ?? paths.spark}</svg>;
}

export function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const appUrl = import.meta.env.VITE_APP_URL || 'https://staging.flouss.live';

  useEffect(() => {
    const localeFromPath = () => setLocale(getInitialLocale());
    window.addEventListener('popstate', localeFromPath);
    return () => window.removeEventListener('popstate', localeFromPath);
  }, []);

  useEffect(() => {
    const localePath = locale === 'ar' ? '/' : `/${locale}/`;
    if (window.location.pathname !== localePath) {
      window.history.replaceState({}, '', `${localePath}${window.location.search}${window.location.hash}`);
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101a15' : '#f6f7f4');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.hero.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `Flouss — ${t.hero.title} ${t.hero.accent}`);
    document.title = `Flouss — ${t.hero.title} ${t.hero.accent}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://flouss.live${localePath}`);
    document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
      const alternate = link.hreflang === 'x-default' ? '/' : `/${link.hreflang}/`;
      link.href = `https://flouss.live${alternate}`;
    });
    document.body.dataset.theme = theme;
    try {
      window.localStorage.setItem('flouss-landing-theme', theme);
    } catch {
      // Theme selection remains available for the current page view.
    }
  }, [dir, locale, t, theme]);

  const chooseLocale = (next: Locale) => {
    setLocale(next);
    const path = next === 'ar' ? '/' : `/${next}/`;
    window.history.pushState({}, '', `${path}${window.location.search}${window.location.hash}`);
  };

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');

  return (
    <div className="site" data-theme={theme} lang={locale} dir={dir}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Flouss home">
          <span className="brand__mark" aria-hidden="true">ف</span>
          <span className="brand__name">Flouss</span>
        </a>
        <nav className="topnav" aria-label={locale === 'ar' ? 'التنقل الرئيسي' : locale === 'fr' ? 'Navigation principale' : 'Main navigation'}>
          <a href="#how">{t.nav.how}</a>
          <a href="#features">{t.nav.features}</a>
          <a href="#privacy">{t.nav.privacy}</a>
        </nav>
        <div className="topbar__actions">
          <label className="locale-control">
            <span className="visually-hidden">{t.nav.language}</span>
            <select value={locale} onChange={(event) => chooseLocale(event.target.value as Locale)} aria-label={t.nav.language}>
              {(['ar', 'fr', 'en'] as const).map((item) => <option value={item} key={item}>{localeLabels[item]}</option>)}
            </select>
          </label>
          <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`${t.nav.theme}: ${theme === 'light' ? t.footer.themeDark : t.footer.themeLight}`}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={19} />
          </button>
          <a className="button button--small button--dark" href={appUrl} target="_blank" rel="noreferrer">{t.nav.open}<Icon name="arrow" size={16} /></a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__wash" aria-hidden="true" />
          <div className="hero__grid">
            <div className="hero__copy">
              <p className="eyebrow"><span className="eyebrow__dot" />{t.hero.eyebrow}</p>
              <h1>{t.hero.title}<br /><span>{t.hero.accent}</span></h1>
              <p className="hero__description">{t.hero.description}</p>
              <div className="hero__actions">
                <a className="button button--primary" href={appUrl} target="_blank" rel="noreferrer">{t.hero.primary}<Icon name="arrow" size={18} /></a>
                <a className="text-link" href="#how">{t.hero.secondary}<span aria-hidden="true">↓</span></a>
              </div>
              <p className="hero__proof"><span className="proof-mark"><Icon name="check" size={15} /></span>{t.hero.proof}</p>
            </div>
            <div className="hero__visual" role="img" aria-label={locale === 'ar' ? 'عرض توضيحي لتطبيق فلوس' : locale === 'fr' ? 'Aperçu de l’application Flouss' : 'Flouss app preview'}>
              <HeroFlight locale={locale} dir={dir} />
              <div className="float-card float-card--balance" aria-hidden="true">
                <span className="float-card__label">{t.hero.balanceLabel}</span>
                <strong>{t.hero.balance} <small>{locale === 'ar' ? 'د.م.' : 'MAD'}</small></strong>
                <span className="float-card__trend"><span>↗</span> {t.hero.online}</span>
              </div>
              <div className="float-card float-card--goal" aria-hidden="true">
                <span className="mini-ring"><span>64%</span></span>
                <span><small>{t.hero.goalCaption}</small><strong>{t.hero.goal}</strong><em>{t.hero.goalValue}</em></span>
              </div>
              <div className="hero__seal" aria-hidden="true"><span>د.م.</span><small>MADE FOR MOROCCO</small></div>
            </div>
          </div>
          <a className="scroll-cue" href="#how"><span className="scroll-cue__line" />{t.hero.scroll}</a>
          <span className="hero__corner hero__corner--one" aria-hidden="true">✳</span>
          <span className="hero__corner hero__corner--two" aria-hidden="true">✳</span>
        </section>

        <section className="intro-section section-wrap" id="how">
          <div className="section-heading">
            <p className="eyebrow"><span className="eyebrow__dot" />{t.intro.eyebrow}</p>
            <h2>{t.intro.title}</h2>
            <p>{t.intro.body}</p>
          </div>
          <div className="steps">
            {t.steps.map((step, index) => (
              <article className="step" key={step.number}>
                <div className="step__top"><span>{step.number}</span><span className="step__icon"><Icon name={index === 0 ? 'spark' : index === 1 ? 'gauge' : 'target'} size={20} /></span></div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-wrap">
            <div className="section-heading section-heading--wide">
              <div><p className="eyebrow"><span className="eyebrow__dot" />{t.features.eyebrow}</p><h2>{t.features.title}</h2></div>
              <p>{t.features.body}</p>
            </div>
            <div className="feature-grid">
              {t.features.items.map((item, index) => (
                <article className="feature" key={item.title}>
                  <span className={`feature__icon feature__icon--${index + 1}`}><Icon name={item.icon} size={22} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {item.demo && <span className="feature__demo"><span aria-hidden="true">↳</span>{item.demo}</span>}
                  <span className="feature__number">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="privacy-section section-wrap" id="privacy">
          <div className="privacy-panel">
            <div className="privacy-panel__seal"><Icon name="shield" size={30} /><span>FL / 01</span></div>
            <div className="privacy-panel__content">
              <p className="eyebrow"><span className="eyebrow__dot" />{t.privacy.eyebrow}</p>
              <h2>{t.privacy.title}</h2>
              <p className="privacy-panel__intro">{t.privacy.body}</p>
              <div className="privacy-points">
                {t.privacy.points.map((point) => <div className="privacy-point" key={point.title}><span><Icon name="check" size={16} /></span><div><h3>{point.title}</h3><p>{point.body}</p></div></div>)}
              </div>
              <p className="privacy-panel__note">{t.privacy.note}</p>
            </div>
          </div>
        </section>

        <section className="closing-section section-wrap">
          <div className="closing-panel">
            <span className="closing-panel__ornament" aria-hidden="true">✳</span>
            <p className="eyebrow"><span className="eyebrow__dot" />{t.closing.eyebrow}</p>
            <h2>{t.closing.title}<br /><em>{t.closing.accent}</em></h2>
            <p>{t.closing.body}</p>
            <a className="button button--primary" href={appUrl} target="_blank" rel="noreferrer">{t.closing.cta}<Icon name="arrow" size={18} /></a>
            <span className="closing-panel__footnote">{t.closing.footnote}</span>
          </div>
        </section>
      </main>

      <footer className="footer section-wrap">
        <a className="brand" href="#home">
          <span className="brand__mark" aria-hidden="true">ف</span>
          <span className="brand__name">Flouss</span>
        </a>
        <p>{t.footer.note}</p>
        <div className="footer__tools">
          <label className="locale-control locale-control--footer">
            <span className="visually-hidden">{t.nav.language}</span>
            <select value={locale} onChange={(event) => chooseLocale(event.target.value as Locale)} aria-label={t.nav.language}>
              {(['ar', 'fr', 'en'] as const).map((item) => <option value={item} key={item}>{localeLabels[item]}</option>)}
            </select>
          </label>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label={theme === 'light' ? t.footer.themeDark : t.footer.themeLight}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
        </div>
        <span className="footer__copyright">© {new Date().getFullYear()} Flouss</span>
      </footer>
    </div>
  );
}
