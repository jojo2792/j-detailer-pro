# Roadmap

- [x] Sprint 1B: customer membership dashboard polish (vehicle allowance, cycle dates, usage used/remaining, error state, cancel confirm, history list, identity card)
- [x] Sprint 2: production booking system (services catalogue, saved vehicles, bookings tables + RLS, slot availability with duplicate-slot protection, membership-aware pricing, booking wizard on /book, My appointments with cancel/reschedule on dashboard)
- [x] Sprint 3: production J Rewards (service reward points, reward_transactions ledger with RLS, reward_catalog, award-on-completion trigger with membership multipliers, atomic redeem_reward RPC, live balance/history on /rewards and dashboard summary)
- [x] Validate: typecheck clean; /, /rewards, /dashboard, /book, /memberships, /auth, /services all 200; rewards migration 0001_create_rewards_engine applied (5 catalog rewards, 5 earning services, 3 reward functions)
- [x] Sprint 4: technician/staff portal (/staff job board: today/upcoming/mine, claim/release, validated status transitions, optional bookings.technician_id)
- [x] Validate Sprint 4: typecheck clean; build OK; /, /book, /memberships, /rewards, /dashboard, /auth, /services, /admin, /staff all 200; staff access enforced by RLS (has_role admin/technician) + server re-check; rewards trigger AFTER UPDATE OF status with unique earn-per-booking index (idempotent). Live signed-in test pending: no user accounts exist yet
- [x] Fix: rewards/booking plan lookup (ambiguous memberships→plans link) and appointments loading before sign-in
- [x] Fix: staff login diagnosed — auth + role checks work; no account holds technician/admin yet (both accounts are customers). /staff now distinguishes "access check failed" from "customer only". Needs owner to name first admin account
- [x] Validate fixes: typecheck clean; signed-in member smoke test of /auth, /dashboard, /memberships, /staff, /admin, /book, /rewards — no browser errors; plans match authoritative allowances
- [x] Sprint 5: notifications (notifications table + RLS; DB trigger creates booking received / status change / cancelled / rescheduled notices; 48h upcoming reminders derived from bookings; dashboard panel with mark-read; admin feed on /staff). Email/SMS delivery not configured — notices are in-app only (delivery_status in_app_only)

- 2026-10-01 re-validation: typecheck + build OK; /auth /dashboard /memberships /staff /admin /book /rewards load signed in with no browser errors; Premium plan shows 4 washes/1 interior/1 vehicle/15%/2x. Staff access still blocked only because no admin/technician role is assigned yet.

## Private team login + first-admin bootstrap (2026-10-01)
- Private route `/team-login` (noindex, not linked from any public page). Signs in with existing auth; admin → /admin, technician → /staff, others see "No team access" with a link to /dashboard. Signed-in staff are redirected automatically. /admin and /staff keep their own server + RLS role checks.
- First admin: database function `bootstrap_first_admin(email)` — executable only by the backend service role (not by browsers/signed-in users). Refuses if any admin already exists; returns `already_admin` if re-run for the same person. The person must sign up first; the operator (Lovable agent) runs it once on the owner's explicit instruction. Later roles are managed in /team.
- Team login now uses the server-side staff access check (same as /staff) to decide the redirect.
- First-admin setup steps (owner): 1) the intended admin signs up normally at /auth; 2) the owner tells the Lovable agent in chat which email to make admin; 3) the agent runs `select public.bootstrap_first_admin('<email>')` from the backend (service role only; browsers get "permission denied"); 4) the admin signs in at /team-login and grants technicians on /team.
- [x] 2026-10-03 first admin set via bootstrap (owner-designated account); verified /team-login → /admin and /staff shows admin access.

## Next (not yet defined by owner)
- [ ] Live end-to-end check: book → staff status changes → notifications + points awarded once (creates real records; needs owner OK)
- [ ] Payments (Stripe) — only when requested
- [ ] Email/SMS delivery for notifications — needs provider choice

## Live end-to-end validation — 2026-10-04 (complete)
- [x] Booking AFBAE2E1 (Exterior Detail, Mon 5 Oct 9:00 AM, jojo_gettogirl@yahoo.com, Premium 15% → TT$153) → confirmed → in progress → completed via /staff.
- [x] 4 notifications created (received, confirmed, in progress, completed); shown on dashboard.
- [x] Exactly one earn entry: 100 × 2 = 200 pts; balance 200 on /rewards and dashboard; job no longer offers completion.
- [x] Fix: appointment times now always shown in Trinidad time (was showing the viewer's local time).
- Note: Add-on Services earns 0 points, so Exterior Detail (lowest-priced service that earns points) was used.
- [x] 2026-10-04 follow-up: dates (renewals, points history) also shown in Trinidad time, so late-evening entries no longer show the next day for viewers or the server elsewhere.
- Remaining blockers: email/SMS notices (owner must choose a provider); online payments (only when requested).
