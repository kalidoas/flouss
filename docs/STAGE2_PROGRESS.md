# Stage 2 Progress

## Done

- Stage 1 foundation is present at `302a393d` (motion primitives, `<Money />`, animation preferences, onboarding, dashboard hero, and QA harness).
- Worktree is on `codex/stage2`; upstream redesign and `feat/ui-mobile-first` branches were fetched and are already ancestors/current baseline. No incoming commits were available to merge.
- Categories and Tasks translations were already present in EN/FR/AR (`bd9bc602`, `c4fafa30`); `check:i18n` and `qa:lang` pass. No duplicate translation changes needed.
- Baseline gates: `typecheck` PASS; `check:i18n` PASS (1,212 keys, locale parity); `qa:lang` PASS (12/12); server build PASS; root tests PASS (206/206); root build PASS.
- Baseline `qa:shots`: 191/193 PASS. Two seeded WebKit iPhone AR tests timed out (light and dark); error context shows the light test reached Settings, while the dark test remained on the auth-loading screen. Root cause is still under investigation. Example reviewed screenshots: `qa/integration/webkit-iphone-categories-ar-light.png`, `qa/integration/webkit-iphone-dashboard-fr-light.png`.
- First visual review found mobile clipping in the seeded French Dashboard and a low-contrast Categories tile in Arabic. Track these for items 2 and 3 respectively.

## Next

1. Categories/Tasks i18n verified in existing commits; progress doc records the baseline and QA findings.
2. Add-expense sheet, quick add, and safe-to-spend hero.
3. Monthly category budgets and Categories restyle.
4. Recurring transactions with Subscriptions.
5. Accounts and transfers.
6. Goals and goal-reached moment.
7. Today hub and Tasks restyle.
8. Debts due dates, progress, and WhatsApp reminder link.
9. History, Analytics/Reports, monthly PDF/CSV.
10. Weekly review, Cmd+K palette, and auto-lock.

## Blockers

- QA issue: investigate and fix the two WebKit iPhone seeded AR screenshot timeouts before the next screenshot milestone.
- Staging rollout requires separate owner approval after each group; never deploy Firestore rules.
- Record each commit, gate result, and PNG proof here as work proceeds.
