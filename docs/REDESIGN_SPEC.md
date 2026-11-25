# Flouss redesign spec v1

Goal: premium, calm, editorial fintech. Feel: prompt-motion.com product clips (big type, serif-italic accent word, depth, floating cards) with Revolut/Monzo clarity. ONE memorable moment per screen; everything else fast and readable.

1. SURFACES
EXPRESSIVE (3D, kinetic type, scroll scenes allowed): landing, login/signup/OTP/PIN, onboarding, dashboard hero card, empty states, goal-reached and weekly-review moments.

UTILITY (lists, tables, forms, modals, charts, settings, history, subscriptions, debts): no 3D, no animated backgrounds, no parallax. Allowed: number roll, staggered entry (max 8 items, 30ms), shared-element card->detail, spring sheet, chart draw-in, swipe actions, skeleton shimmer.
Every screen has exactly ONE named signature moment, recorded in docs/MOTION_INDEX.md (screen, moment, file, duration).

2. LOOK
Existing tokens (light+dark, AA contrast). One accent (warm orange). Green/red only for money direction. No gradient text. At most one soft radial glow per expressive surface (<= 10% opacity). Type: Inter + Noto Arabic; ONE serif italic accent word per marquee heading (AR: accent colour instead of italics). <Money/> everywhere (tabular digits, muted currency, NBSP, minus U+2212, never "0,00MAD"). English default; FR and AR complete; RTL mirrors layout AND motion direction. No hardcoded strings; check:i18n and qa:lang must pass (AR: no Latin words except Flouss/MAD/PIN/PWA/iOS).

3. TECH
Allowed: framer-motion (app), CSS 3D, GSAP+ScrollTrigger and Lenis (landing and onboarding scenes only), three + @react-three/fiber (+drei) lazy-loaded and ONLY for hero coin / login / onboarding / landing (chunk <= 150KB gz; CSS-3D fallback is the DEFAULT on touch devices, low power, reduced motion and when offscreen). Small helpers: cmdk, sonner, @use-gesture/react. Anything else: propose it first with its gz size. No remote assets, fonts, models or images. Route-level code splitting; initial app JS grows <= 60KB gz in total.
Motion: only transform/opacity; durations 120/200/320/600ms; spring stiffness 380 damping 32; respect prefers-reduced-motion and Settings -> Animations; pause offscreen; CLS 0; INP < 200ms; 60fps on iPhone; Lighthouse mobile Performance >= 85 on the dashboard preview.

4. SCREENS (each: loading, empty, error, populated; light/dark; EN/FR/AR)
Login/Signup/OTP/PIN, Onboarding, Dashboard, Add-expense sheet, Income, Expenses, History, Categories, Budgets, Accounts, Goals, Debts, Subscriptions/Recurring, Today (tasks+habits), Notes, Analytics/Reports, Settings.

5. FEATURES (additive, optional Firestore fields only; old documents keep working; no destructive migration; never deploy rules: print the rules diff for the owner)
Quick add (keypad first, last-5 category chips, date today). "Safe to spend today" in the hero. Monthly budgets per category with pace marker. Recurring transactions merged with Subscriptions. Accounts (cash/bank/wallet) + transfers. Goals with date and "needed per month". Weekly review (rule-based, no AI claims). Debts with due dates + WhatsApp reminder link (wa.me). Monthly report PDF/CSV. Cmd+K palette. History search/filters. Auto-lock.

6. PROOF
Every claim = commit hash + PNG/video path. qa:shots: Playwright WebKit iPhone 390x844 + Chromium 1280x800, EN/FR/AR x light/dark, empty AND seeded fixtures; config+specs in e2e/ (committed), outputs in qa/ (gitignored). 20s .webm of dashboard + add-expense per release. Gates per commit: typecheck, check:i18n, qa:lang, tests, build. If a check cannot run: NOT VERIFIED + the exact command for the owner to approve.
