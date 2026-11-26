# Stage 2 Progress

## Done

- Stage 1 foundation is present at `302a393d` (motion primitives, `<Money />`, animation preferences, onboarding, dashboard hero, and QA harness).
- Worktree is on `codex/stage2`; upstream redesign and `feat/ui-mobile-first` branches were fetched and are already ancestors/current baseline. No incoming commits were available to merge.
- Categories and Tasks translations were already present in EN/FR/AR (`bd9bc602`, `c4fafa30`); `check:i18n` and `qa:lang` pass. No duplicate translation changes needed.
- Baseline gates: `typecheck` PASS; `check:i18n` PASS (1,212 keys, locale parity); `qa:lang` PASS (12/12); server build PASS; root tests PASS (206/206); root build PASS.
- The original `qa:shots` run is invalid as a Flouss_codex baseline: Playwright reused a Vite server from another local project on port 5174. The config now starts its own strict preview on port 4173. The old 2 WebKit AR timeouts are not attributed to this app; rerun the full suite after item 3.
- First visual review found mobile clipping in the seeded French Dashboard and a low-contrast Categories tile in Arabic. Track these for items 2 and 3 respectively.
- Item 2 implemented: QuickAdd now limits options to the five most recently used sources/categories and converts entered local date/time to UTC correctly; daily safe-to-spend is shown in the hero; duplicate Dashboard KPI panel was removed; mobile hero balance/coin and chart tooltip are constrained to the viewport; Playwright preview is isolated from other projects. `qa:lang` 12/12, server build, 206/206 tests, root build, and targeted WebKit FR/light seeded screenshot all pass. Screenshot: `qa/integration/webkit-iphone-dashboard-fr-light.png`.

## Next

1. Categories/Tasks i18n verified in existing commits; progress doc records the baseline and QA findings.
2. Add-expense sheet, quick add, and safe-to-spend hero — implemented in current uncommitted item commit.
3. Monthly category budgets and Categories restyle.
4. Recurring transactions with Subscriptions.
5. Accounts and transfers.
6. Goals and goal-reached moment.
7. Today hub and Tasks restyle.
8. Debts due dates, progress, and WhatsApp reminder link.
9. History, Analytics/Reports, monthly PDF/CSV.
10. Weekly review, Cmd+K palette, and auto-lock.

## Blockers

- Full `qa:shots` must be rerun after items 1–3 using the isolated preview configuration.
- Staging rollout requires separate owner approval after each group; never deploy Firestore rules.
- Record each commit, gate result, and PNG proof here as work proceeds.
