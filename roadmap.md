# Roadmap

- [x] Sprint 1B: customer membership dashboard polish (vehicle allowance, cycle dates, usage used/remaining, error state, cancel confirm, history list, identity card)
- [x] Sprint 2: production booking system (services catalogue, saved vehicles, bookings tables + RLS, slot availability with duplicate-slot protection, membership-aware pricing, booking wizard on /book, My appointments with cancel/reschedule on dashboard)
- [x] Sprint 3: production J Rewards (service reward points, reward_transactions ledger with RLS, reward_catalog, award-on-completion trigger with membership multipliers, atomic redeem_reward RPC, live balance/history on /rewards and dashboard summary)
- [x] Validate: typecheck clean; /, /rewards, /dashboard, /book, /memberships, /auth, /services all 200; rewards migration 0001_create_rewards_engine applied (5 catalog rewards, 5 earning services, 3 reward functions)
