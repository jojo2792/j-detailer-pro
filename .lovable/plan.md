# Customer booking and membership journey audit

Read-only audit of the code. No pages were changed and nothing was submitted.

## What works today
- `/services` → `/book`: the booking steps (service, vehicle, time slot, review) load live services and open slots. The price quote includes the member discount, and the server recalculates the price (guard from migration 0005).
- After submitting, the receipt and toast say "Booking received / Awaiting team confirmation" (`BookingWizard.tsx`). `/dashboard` → My Appointments shows the progress steps, help text for each status, a two-tap cancel and reschedule. Booking AFBAE2E1 was checked end to end earlier.
- On `/memberships`, guests who click "Join" go to `/auth?next=/memberships?plan=…` and come back to the plan they picked. Signed-in users can join or switch plans. If live plans can't load, the standard prices show with a clear notice.

## Prioritized findings
1. **High, business risk: "Join plan" turns a membership on right away with no payment.** `src/lib/membership.server.ts` `startMembership` saves the membership as `active`, renewing in 1 month. The page says "Join" and "Cancel anytime" but never says how billing works. A customer gets member discounts on bookings straight away. Payments are on hold, so this isn't a code bug, but customers can't see how it works.
2. **Medium, confusing wording:** `/book` says "instant confirmation" in its page description (`src/routes/book.tsx` head). Bookings actually start as *pending* until the team confirms. The button says "Confirm booking", but the result is only a request.
3. **Medium, lost progress:** the "Sign in to book" link in `BookingWizard.tsx` (around line 466) has no `next` setting. Guests who pick a service and slot land on `/auth` and don't come back to `/book`, so their choices are lost.
4. **Low:** each "Book" button on `/services` links to plain `/book` and doesn't pre-select that service.
5. **Low:** Fleet's "Request a Quote" (`memberships.tsx`) goes to the normal booking steps. There is no quote form, so the button doesn't do what it says.

## Smallest safe next step (text and links only)
- Add a short billing note under the plan cards and in the join confirmation toast, e.g. "Membership starts today; our team will arrange monthly billing with you." The exact wording needs your approval because it describes how you bill.
- Change "instant confirmation" to "request a time; we confirm shortly" in the `/book` description. Rename the button to "Request booking".
- Add `search={{ next: "/book" }}` to the sign-in link. Optional: keep the chosen service in the address, e.g. `/book?service=slug`.
- Optional: change the Fleet button to "Contact us for a Fleet quote" so it matches what the button actually does.

No backend, schema, price, auth or data changes. To check: the existing unit tests and a browser view of `/book`, `/memberships` and `/services`, signed out and signed in, without submitting anything.

## Not verified in this audit
- I didn't submit any live booking or join any plan (by request).
- The way plan activation works is from reading the code only.
