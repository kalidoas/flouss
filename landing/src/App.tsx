import { Fragment, useEffect, useState, type ReactNode, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { copy, localeLabels, type Locale } from './copy';
import { Logo } from './components/Logo';
import { HeroStage } from './components/HeroStage';

gsap.registerPlugin(ScrollTrigger);

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
    share: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 13v6h14v-6" /></>,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    open: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  };
  return <svg {...shared}>{paths[name] ?? paths.spark}</svg>;
}

function AnimatedWords({ text, locale, tail = false }: { text: string; locale: Locale; tail?: boolean }) {
  const words = text.trim().split(/\s+/);

  return (
    <span
      className={`hero__headline-line${tail ? ' hero__headline-line--tail' : ''}`}
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="hero__word" style={{ animationDelay: `${index * 90}ms` }}>{word}</span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const appUrl = import.meta.env.VITE_APP_URL || 'https://staging.flouss.live';
  const phoneRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const darkPhoneRef = useRef<HTMLDivElement>(null);
  const balanceNumberRef = useRef<HTMLSpanElement>(null);

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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0b0c' : '#fafaf9');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.hero.description);
    const wordmark = locale === 'ar' ? 'فلوس' : 'Flouss';
    document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', wordmark);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${wordmark} — ${t.hero.title} ${t.hero.accent}`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', t.hero.description);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', `https://flouss.live/images/og${locale === 'ar' ? '' : `-${locale}`}.png`);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', `${locale}_${locale === 'ar' ? 'MA' : locale === 'fr' ? 'FR' : 'US'}`);
    document.title = `${wordmark} — ${t.hero.title} ${t.hero.accent}`;
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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // SCENE 1: Hero headline per-word reveal on scroll (words glued fix: letter-spacing -0.02em max, proper spaces)
      gsap.utils.toArray<HTMLElement>('.hero__word').forEach((word, i) => {
        gsap.fromTo(word, 
          { opacity: 0, y: '1.5em', filter: 'blur(8px)' },
          { 
            opacity: 1, y: 0, filter: 'blur(0px)', 
            duration: 0.8, ease: 'cubic-bezier(.22,1,.36,1)', 
            scrollTrigger: { trigger: '.hero', start: 'top 80%', end: 'top 30%', scrub: 0.3, toggleActions: 'play none none reverse' },
            delay: i * 0.06
          }
        );
      });

      // SCENE 2: Kinetic type — words slide/scale/mask on scroll
      const kinetic = document.querySelector<HTMLElement>('.kinetic-type');
      if (kinetic) {
        const lead = kinetic.querySelector('.kinetic-lead');
        const emphasis = kinetic.querySelector('.kinetic-emphasis');
        if (lead) {
          gsap.fromTo(lead, { opacity: 0, x: -80, scale: 0.8 }, { opacity: 1, x: 0, scale: 1, duration: 1, ease: 'cubic-bezier(.22,1,.36,1)', scrollTrigger: { trigger: kinetic, start: 'top 85%', end: 'top 40%', scrub: 0.5 } });
        }
        if (emphasis) {
          gsap.fromTo(emphasis, { opacity: 0, x: 80, scale: 0.8 }, { opacity: 1, x: 0, scale: 1, duration: 1, ease: 'cubic-bezier(.22,1,.36,1)', scrollTrigger: { trigger: kinetic, start: 'top 75%', end: 'top 30%', scrub: 0.5 } });
        }
      }

      // SCENE 3: How it works — sticky phone mockup with content swap + progress line
      const howSection = document.querySelector<HTMLElement>('.how-section');
      if (howSection) {
        const phoneSteps = [...howSection.querySelectorAll<HTMLElement>('.phone-content')];
        const progressBar = progressBarRef.current;
        phoneSteps.forEach((step, i) => gsap.set(step, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 20 }));
        const tl = gsap.timeline({ scrollTrigger: { trigger: howSection, start: 'top top', end: 'bottom bottom', scrub: 1 } });
        if (progressBar) tl.fromTo(progressBar, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: Math.max(phoneSteps.length, 1) }, 0);
        phoneSteps.forEach((step, i) => {
          if (i === 0) return;
          tl.to(phoneSteps[i - 1], { opacity: 0, y: -20, duration: 0.3 }, i).to(step, { opacity: 1, y: 0, duration: 0.3 }, i);
        });
      }

      // SCENE 4: Features — stacked cards reveal with mini-demos
      const featuresSection = document.querySelector<HTMLElement>('.features-section');
      if (featuresSection) {
        const featureCards = [...featuresSection.querySelectorAll<HTMLElement>('.feature')];
        featureCards.forEach((feature, i) => {
          const fromX = dir === 'rtl' ? 24 : -24;
          gsap.fromTo(feature,
            { opacity: 0, y: 28, x: fromX },
            {
              opacity: 1, y: 0, x: 0,
              duration: 0.6,
              ease: 'cubic-bezier(.22,1,.36,1)',
              delay: (i % 3) * 0.08,
              scrollTrigger: { trigger: feature, start: 'top 88%', end: 'top 60%', scrub: 0.5 },
            }
          );
        });
      }

      // SCENE 5: Dark scene — color flip, balance count-up, phone tilt
      const darkSection = document.querySelector<HTMLElement>('.dark-scene');
      if (darkSection) {
        const balanceEl = balanceNumberRef.current;
        const darkPhone = darkPhoneRef.current;
        const tl = gsap.timeline({ scrollTrigger: { trigger: darkSection, start: 'top top', end: 'bottom bottom', scrub: 1 } });

        const panel = darkSection.querySelector<HTMLElement>('.privacy-panel');
        if (panel) {
          tl.fromTo(panel, { backgroundColor: 'transparent' }, { backgroundColor: '#121214', duration: 1, ease: 'cubic-bezier(.22,1,.36,1)' }, 0);
        }
        if (balanceEl) {
          const counter = { value: 0 };
          const target = 8450;
          tl.to(counter, {
            value: target,
            duration: 2,
            ease: 'cubic-bezier(.22,1,.36,1)',
            onUpdate: () => {
              balanceEl.textContent = Math.round(counter.value).toLocaleString(locale === 'ar' ? 'fr' : 'en-US');
            },
          }, 0);
        }
        if (darkPhone) {
          tl.fromTo(darkPhone, { transform: 'perspective(900px) rotateX(24deg) rotateY(-16deg)' }, { transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)', duration: 2, ease: 'cubic-bezier(.22,1,.36,1)' }, 0);
        }
      }
    });
    return () => ctx.revert();
  }, [locale]);

  const chooseLocale = (next: Locale) => {
    setLocale(next);
    const path = next === 'ar' ? '/' : `/${next}/`;
    window.history.pushState({}, '', `${path}${window.location.search}${window.location.hash}`);
  };

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');

  return (
    <div className="site" data-theme={theme} lang={locale} dir={dir}>
      <header className="topbar">
        <Logo locale={locale} />
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
              <h1>
                <AnimatedWords text={t.hero.title} locale={locale} />
                <AnimatedWords text={t.hero.accent} locale={locale} tail />
              </h1>
              <p className="hero__description">{t.hero.description}</p>
              <div className="hero__actions">
                <a className="button button--primary" href={appUrl} target="_blank" rel="noreferrer">{t.hero.primary}<Icon name="arrow" size={18} /></a>
                <a className="text-link" href="#how">{t.hero.secondary}<span aria-hidden="true">↓</span></a>
              </div>
            </div>
            <div className="hero__visual" role="img" aria-label={locale === 'ar' ? 'عرض توضيحي لتطبيق فلوس' : locale === 'fr' ? 'Aperçu de l’application Flouss' : 'Flouss app preview'}>
              <HeroStage locale={locale} mockupLabel={t.hero.mockupLabel} balanceLabel={t.hero.balanceLabel} />
            </div>
          </div>
          <a className="scroll-cue" href="#how"><span className="scroll-cue__line" />{t.hero.scroll}</a>
          <span className="hero__corner hero__corner--one" aria-hidden="true">✳</span>
          <span className="hero__corner hero__corner--two" aria-hidden="true">✳</span>
        </section>

        <section className="kinetic-section section-wrap" id="kinetic">
          <h2 className="kinetic-type" lang={locale} dir={dir}>
            <span className="kinetic-lead">{t.kinetic.lead}</span>
            <span className="kinetic-emphasis">{t.kinetic.emphasis}</span>
          </h2>
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

        <section className="install-section section-wrap" id="install">
          <div className="section-heading">
            <p className="eyebrow"><span className="eyebrow__dot" />{t.install.eyebrow}</p>
            <h2>{t.install.title}</h2>
            <p>{t.install.body}</p>
          </div>
          <div className="install-steps">
            {t.install.steps.map((step, index) => (
              <article className="install-step" key={step.title}>
                <span className="install-step__number">0{index + 1}</span>
                <span className="install-step__icon"><Icon name={step.icon} size={21} /></span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <p className="install-note"><Icon name="check" size={16} />{t.install.note}</p>
        </section>

        <section className="how-section section-wrap" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow"><span className="eyebrow__dot" />{t.how.eyebrow}</p>
            <h2>{t.how.title}</h2>
            <p>{t.how.body}</p>
          </div>
          <div className="how-stage">
            <div className="how-stage__phone" ref={phoneRef}>
              <div className="how-stage__screen">
                {t.how.steps.map((step, i) => (
                  <div className="phone-content" key={step.title} data-step={i + 1}>
                    <span className="phone-screen__title">{step.title}</span>
                    <p>{step.body}</p>
                  </div>
                ))}
              </div>
              <div className="how-stage__progress" ref={progressBarRef} />
            </div>
            <div className="how-steps">
              {t.how.steps.map((step, index) => (
                <div className="how-step" key={step.title} data-step={index + 1}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
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

        <section className="privacy-section section-wrap dark-scene" id="privacy">
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
          <div className="dark-scene__phone" ref={darkPhoneRef}>
            <div className="dark-scene__balance">
              <span className="dark-scene__balance-number" ref={balanceNumberRef}>0</span>
              <span className="dark-scene__balance-label">{t.hero.balanceLabel}</span>
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
        <Logo locale={locale} />
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
        <span className="footer__copyright">© {new Date().getFullYear()} {locale === 'ar' ? 'فلوس' : 'Flouss'}</span>
      </footer>
    </div>
  );
}
