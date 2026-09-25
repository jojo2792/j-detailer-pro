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
