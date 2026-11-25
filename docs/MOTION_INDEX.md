# Flouss motion index

One signature moment per screen. The product specification and eligibility rules are in `REDESIGN_SPEC.md`. Durations use the shared motion scale.

| Screen | Signature moment | Implementation file | Duration |
| --- | --- | --- | ---: |
| Landing | Kinetic headline reveal | `src/motion/KineticHeadline.tsx` | 320ms |
| Login / Signup | Headline and card entrance | `src/motion/KineticHeadline.tsx` | 320ms |
| OTP / PIN | Focus indicator spring | `src/motion/Indicator.tsx` | 200ms |
| Onboarding | Balance roll with floating coin | `src/motion/BalanceRoll.tsx`, `src/motion/Coin3D.tsx` | 600ms |
| Dashboard | Balance roll and hero coin | `src/motion/BalanceRoll.tsx`, `src/motion/Coin3D.tsx` | 600ms |
| Empty states | Single illustrated reveal | `src/motion/PageTransition.tsx` | 320ms |
| Add-expense sheet | Spring sheet entrance | `src/motion/SpringSheet.tsx` | 320ms |
| Income | Shared-card detail transition | `src/motion/SharedCard.tsx` | 320ms |
| Expenses | Staggered row entrance | `src/motion/Stagger.tsx` | 200ms |
| History | Swipe row action | `src/motion/SwipeRow.tsx` | 200ms |
| Categories | Shared-card detail transition | `src/motion/SharedCard.tsx` | 320ms |
| Budgets | Pace indicator fill | `src/motion/Indicator.tsx` | 320ms |
| Accounts | Shared-card detail transition | `src/motion/SharedCard.tsx` | 320ms |
| Goals | Goal progress arc | `src/motion/GaugeArc.tsx` | 600ms |
| Debts | Balance roll | `src/motion/BalanceRoll.tsx` | 320ms |
| Subscriptions / Recurring | Staggered row entrance | `src/motion/Stagger.tsx` | 200ms |
| Today | Staggered task entrance | `src/motion/Stagger.tsx` | 200ms |
| Notes | Shared-card detail transition | `src/motion/SharedCard.tsx` | 320ms |
| Analytics / Reports | Chart draw-in | `src/motion/ChartDraw.tsx` | 600ms |
| Settings | Animation preference selection | `src/pages/SettingsPage.tsx` | 200ms |

The screen-specific entries are a rollout map. Update each row to the concrete screen component and verified duration as it is implemented. `Full`, `Calm`, `Off`, and the operating-system reduced-motion preference must remain respected.
