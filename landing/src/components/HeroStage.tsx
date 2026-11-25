import { useRef, useLayoutEffect } from 'react';
import type { Locale } from '../copy';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Props = { locale: Locale; mockupLabel: string; balanceLabel: string };

const labels = {
  ar: { spend: 'المصاريف', today: 'اليوم', groceries: 'مشتريات', coffee: 'قهوة', saved: 'هدف الادخار', bill: 'فاتورة جاية', billName: 'الإنترنت', due: '28 نونبر', currency: 'د.م.' },
  fr: { spend: 'Dépenses', today: 'Aujourd’hui', groceries: 'Courses', coffee: 'Café', saved: 'Objectif d\'épargne', bill: 'Facture à venir', billName: 'Internet', due: '28 nov.', currency: 'MAD' },
  en: { spend: 'Spending', today: 'Today', groceries: 'Groceries', coffee: 'Coffee', saved: 'Savings goal', bill: 'Upcoming bill', billName: 'Internet', due: 'Nov 28', currency: 'MAD' },
} satisfies Record<Locale, Record<string, string>>;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HeroStage({ locale, mockupLabel, balanceLabel }: Props) {
  const phoneRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const goalChipRef = useRef<HTMLDivElement>(null);
  const billChipRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const copy = labels[locale];
  const isRTL = locale === 'ar';

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const phone = phoneRef.current!;
      const device = deviceRef.current!;
      const goalChip = goalChipRef.current!;
      const billChip = billChipRef.current!;

      // Initial state: phone starts in 3D perspective (rotateX ~55deg, rotateZ ~-12deg)
      gsap.set(phone, {
        transformStyle: 'preserve-3d',
        rotationX: 55,
        rotationZ: isRTL ? 12 : -12,
        transformOrigin: 'center center',
      });

      gsap.set(device, { transformStyle: 'preserve-3d' });

      // Goal and bill chips at different depths
      gsap.set(goalChip, { transformStyle: 'preserve-3d', transformOrigin: 'center center', z: 80 });
      gsap.set(billChip, { transformStyle: 'preserve-3d', transformOrigin: 'center center', z: 60 });

      // ScrollTrigger: camera flies over the phone
      const heroStage = document.querySelector('.hero-stage') as HTMLElement;
      if (heroStage) {
        gsap.set(heroStage, { perspective: 1000, perspectiveOrigin: '50% 48%' });
      }

      ScrollTrigger.create({
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          // Phone rotates to face user and scales up
          const rotationX = gsap.utils.interpolate(55, 0, progress);
          const rotationZ = gsap.utils.interpolate(isRTL ? 12 : -12, 0, progress);
          const scale = gsap.utils.interpolate(0.75, 1, progress);
          const y = gsap.utils.interpolate(60, 0, progress);

          gsap.set(phone, {
            rotationX,
            rotationZ,
            scale,
            y,
          });

          // Chips drift at different depths (parallax translateZ) with blur-to-sharp
          const goalZ = gsap.utils.interpolate(120, 0, progress);
          const billZ = gsap.utils.interpolate(100, 0, progress);
          const goalBlur = gsap.utils.interpolate(8, 0, progress);
          const billBlur = gsap.utils.interpolate(6, 0, progress);

          gsap.set(goalChip, { z: goalZ, filter: `blur(${goalBlur}px)` });
          gsap.set(billChip, { z: billZ, filter: `blur(${billBlur}px)` });

          // RTL mirror drift direction
          if (isRTL) {
            const goalX = gsap.utils.interpolate(-40, 0, progress);
            const billX = gsap.utils.interpolate(30, 0, progress);
            gsap.set(goalChip, { x: goalX });
            gsap.set(billChip, { x: billX });
          }
        },
      });
    });

    ctxRef.current = ctx;
    return () => ctx.revert();
  }, [isRTL]);

  return (
    <div className="hero-stage" aria-hidden="true">
      <span className="hero-stage__mockup-label">{mockupLabel}</span>
      <div className="hero-stage__phone" ref={phoneRef}>
        <div className="hero-stage__device" ref={deviceRef}>
          <div className="hero-stage__header">
            <span className="hero-stage__brand-mark">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="20" cy="20" r="9.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
            <span className="hero-stage__balance-label">{balanceLabel}</span>
            <span className="hero-stage__currency"><bdi dir="ltr">{copy.currency}</bdi></span>
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
            <strong><bdi dir="ltr">−120</bdi></strong>
          </div>
          <div className="hero-stage__transaction">
            <span className="hero-stage__transaction-icon hero-stage__transaction-icon--warm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
                <path d="M17 10h1a2.5 2.5 0 0 1 0 5h-1" />
                <path d="M8 4v2m5-2v2" />
              </svg>
            </span>
            <span>{copy.coffee}<small>{copy.today}</small></span>
            <strong><bdi dir="ltr">−28</bdi></strong>
          </div>
          <div className="hero-stage__goal">
            <div className="hero-stage__progress"><span>64%</span></div>
            <div><small>{copy.saved}</small><strong dir="ltr">3 200 <bdi dir="ltr">{copy.currency}</bdi></strong></div>
          </div>
        </div>
      </div>
      <div className="hero-stage__goal-chip" ref={goalChipRef}>
        <span className="hero-stage__mini-progress">64%</span>
        <span>{copy.saved}<strong dir="ltr">3 200 <bdi dir="ltr">{copy.currency}</bdi></strong></span>
      </div>
      <div className="hero-stage__bill-chip" ref={billChipRef}>
        <span className="hero-stage__bill-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h9l4 4v14H6z" />
            <path d="M15 3v5h5M9 13h7m-7 4h5" />
          </svg>
        </span>
        <span>{copy.bill}<strong>{copy.billName} · {copy.due}</strong></span>
        <b dir="ltr">340 <bdi dir="ltr">{copy.currency}</bdi></b>
      </div>
    </div>
  );
}