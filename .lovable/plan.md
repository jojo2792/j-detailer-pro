# Sprint 1B — Customer Membership Dashboard

## What exists already (verified)

- `/dashboard` (signed-in only) already renders `MembershipPanel`: current plan name + price, wash and interior usage meters, renewal date + days remaining, discount, rewards multiplier, pending-plan and cancellation notices, plan switching, pause/resume, auto-renew toggle, cancel, and an activity list.
- Backend reads/writes all exist: `getMyMembership`, `subscribeToPlan`, `changeMembershipPlan`, `pauseMembership`, `resumeMembership`, `cancelMembership`, `setMembershipAutoRenew`, `getMyAccount`. Each runs as the signed-in customer, so members only ever see their own row; admin access stays on the separate `/admin` and `/team` screens.
- Billing cycles already roll forward automatically on load, resetting monthly allowances.
- Plan values in the database match the stated allowances exactly (Essential 299/2/0/1/10%/2x, Premium 499/4/1/1/15%/2x, Platinum 799/5/2/1/20%/3x, Family 999/8/2/3/15%/2x, Fleet quote/5+/20%/2x). No schema or data change needed.

So this sprint is completion and polish, not new backend work.

## Gaps to close

1. **Vehicle allowance is not shown** on the dashboard (it is on the plans page). Add it beside discount and rewards.
2. **Cycle dates are not shown** — only the renewal date. Add the current cycle window (start to end) so "washes used" has an obvious period.
3. **Usage counters show remaining only.** Show used / allowance / remaining explicitly, and handle "not included" allowances (Essential interior = 0) clearly rather than an empty bar.
4. **No error state.** If the membership fails to load, the panel currently shows nothing useful. Add an error card with a retry action.
5. **Empty state is thin** for a member whose plan lapsed or was cancelled — make it state what happened and offer rejoining.
6. **History has no transaction detail.** Show plan-change from/to names and the amount context already stored, grouped with clearer labels, and a "show more" for long lists.
7. **Cancel has no confirmation**, and cancel-at-period-end vs. immediate is not offered to the customer. Add a confirm dialog with "end at renewal" as default.
8. **Mobile layout**: action row wraps into many full-width pills; tighten to a responsive action group.
9. **No account summary** — name, email, phone from `getMyAccount` is fetched by nothing on this page. Add a compact member identity card.

## Files to change

- `src/components/membership/MembershipPanel.tsx` — main work: add vehicle/cycle tiles, error + richer empty states, confirm-cancel flow, tightened action group.
- `src/components/membership/UsageMeter.tsx` — used/allowance/remaining display plus "not included" treatment.
- `src/components/membership/MembershipHistoryList.tsx` (new) — extracted history list with from/to plan names and show-more.
- `src/components/membership/MemberIdentityCard.tsx` (new) — name/email/phone from the existing account query.
- `src/components/membership/CancelMembershipDialog.tsx` (new) — confirm at-renewal vs. immediate.
- `src/hooks/use-membership.ts` — expose `isError`/`refetch` for the error state; add an account query hook wrapper if not already present.
- `src/routes/_authenticated/dashboard.tsx` — layout slots for identity card; keep existing head metadata.

Reused unchanged: `useMembership`, `useMembershipPlans`, `membership.service.ts`, all server functions, `PlanCard`, `MembershipStatusBadge`, `SkeletonCard`, `ErrorBoundary`, `formatTTD`/`formatDate`, existing gold/black tokens in `styles.css`.

Not touched: database schema, RLS, migrations, booking, auth, rewards, admin.

## Risks / blockers

- **No payments** — enrolment and plan changes still activate without charging. Out of scope here, as instructed.
- **"Transactions"** in the strict billing sense do not exist yet; there is no invoice/payment table. The dashboard will show the membership audit trail (joined, upgraded, paused, cycle reset, cancelled) as history. A real invoice list needs a new table and would come with the payment sprint — flagged, not built.
- **Fleet plan** is quote-based with zero allowances stored; the dashboard will render "Custom" / "5+ vehicles" and route to a quote request instead of showing empty meters.
- Vehicle allowance is displayed from plan data only; there is no vehicles table, so no "vehicles saved vs. allowed" count can be shown.
