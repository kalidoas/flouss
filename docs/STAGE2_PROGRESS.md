# Stage 2 Progress

## Done

- Stage 1 foundation is present at `302a393d` (motion primitives, `<Money />`, animation preferences, onboarding, dashboard hero, and QA harness).
- Worktree is on `codex/stage2`; upstream redesign and `feat/ui-mobile-first` branches were fetched and are already ancestors/current baseline. No incoming commits were available to merge.
- Categories and Tasks translations were already present in EN/FR/AR (`bd9bc602`, `c4fafa30`); `check:i18n` and `qa:lang` pass. No duplicate translation changes needed.
- Baseline gates: `typecheck` PASS; `check:i18n` PASS (1,212 keys, locale parity); `qa:lang` PASS (12/12); server build PASS; root tests PASS (206/206); root build PASS.
- The original `qa:shots` run is invalid as a Flouss_codex baseline: Playwright reused a Vite server from another local project on port 5174. The config now starts its own strict preview on port 4173. The old 2 WebKit AR timeouts are not attributed to this app; rerun the full suite after item 3.
- First visual review found mobile clipping in the seeded French Dashboard and a low-contrast Categories tile in Arabic. Track these for items 2 and 3 respectively.
- Item 2 implemented: QuickAdd now limits options to the five most recently used sources/categories and converts entered local date/time to UTC correctly; daily safe-to-spend is shown in the hero; duplicate Dashboard KPI panel was removed; mobile hero balance/coin and chart tooltip are constrained to the viewport; Playwright preview is isolated from other projects. `qa:lang` 12/12, server build, 206/206 tests, root build, and targeted WebKit FR/light seeded screenshot all pass. Screenshot: `qa/integration/webkit-iphone-dashboard-fr-light.png`.
- Item 3 implemented: Categories is now a compact spend-sorted list with per-category inline monthly budget editing, spend progress (amber from 80%, red when over), zero-spend categories collapsed behind a translated count button, and horizontally scrollable group filters with logical edge fades. Reused the existing optional `monthlyBudget` field; no schema field or migration was added. Verification: typecheck, check:i18n (1,213 keys), qa:lang (12/12), root tests (206/206), server tests (22/22), server build, root build, and qa:shots (26/26). Reviewed Arabic light iPhone and Arabic dark desktop captures; seeded Category screenshots are generated for EN/FR/AR and both themes on Chromium desktop and WebKit iPhone. Proof: `qa/integration/webkit-iphone-categories-ar-light.png` and `qa/integration/chromium-desktop-categories-ar-dark.png`.

## Next

1. Categories/Tasks i18n verified in existing commits; progress doc records the baseline and QA findings.
2. Add-expense sheet, quick add, and safe-to-spend hero — implemented in current uncommitted item commit.
3. Monthly category budgets and Categories restyle — complete.
4. Recurring transactions with Subscriptions — implemented on `codex/stage2`. Subscriptions now includes a recurring-income schedule alongside bills, with translated create/edit/delete controls and an explicit once-per-month receipt confirmation that records an income transaction. Added shared date/due/idempotency helpers and unit coverage. No required Firestore field or migration added; `recurringRules` is an existing optional account field. Verification: typecheck PASS, check:i18n PASS (1,225 keys), focused utility tests 29/29, full root tests 208/208, qa:lang 12/12, root build PASS. Full visual screenshot suite remains intentionally deferred until the post-merge `qa:shots` run requested by the rollout sequence.
5. Accounts and transfers — implemented on `codex/stage2` with an optional `financialAccounts` field (legacy users receive a derived primary cash account without migration). Added cash/bank/wallet balances, account attribution on income/expense/quick-add, internal transfers that stay neutral in the global balance and History totals, and safeguards against overdrawing a source account or deleting accounts with linked transactions. History has a translated transfer filter; the accounts screen uses reduced-motion-aware staggered balance cards. Verification: typecheck PASS, check:i18n PASS (1,247 keys), focused financial/store/calculation tests PASS, full root tests 213/213, qa:lang 12/12, root build PASS. Screenshot review is deferred to the standalone post-merge `qa:shots` step as requested.
6. Goals and goal-reached moment.
7. Today hub and Tasks restyle.
8. Debts due dates, progress, and WhatsApp reminder link.
9. History, Analytics/Reports, monthly PDF/CSV.
10. Weekly review, Cmd+K palette, and auto-lock.

## Blockers

- Run the full `qa:shots` suite by itself after the requested upstream merge and before asking for release approval.
- Staging rollout requires separate owner approval after each group; never deploy Firestore rules.
- Record each commit, gate result, and PNG proof here as work proceeds.
