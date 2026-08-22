import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PlanCard } from "@/components/membership/PlanCard";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useAuth } from "@/hooks/use-auth";
import { useMembership, useMembershipPlans } from "@/hooks/use-membership";
import { myMembershipQuery } from "@/services/membership.service";
import { FALLBACK_MEMBERSHIP_PLANS } from "@/lib/membership-plans.fallback";
import { formatDate } from "@/lib/format";
import type { MembershipPlan } from "@/types/membership";

export const Route = createFileRoute("/memberships")({
  component: Memberships,
  validateSearch: (s: Record<string, unknown>): { plan?: string } =>
    typeof s.plan === "string" && /^[a-z0-9-]{1,50}$/.test(s.plan) ? { plan: s.plan } : {},
  head: () => ({
    meta: [
      { title: "Membership Plans — Monthly Car Detailing Trinidad | J The Detailer" },
      {
        name: "description",
        content:
          "Essential, Premium, Platinum, Family and Fleet membership plans from TT$299/month. Recurring detailing, priority booking and member discounts.",
      },
      { property: "og:title", content: "Membership Plans | J The Detailer" },
      {
        property: "og:description",
        content: "Recurring premium detailing from TT$299/month with member discounts and bonus rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Memberships() {
  const { plan: requestedPlan } = Route.useSearch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const plansQuery = useMembershipPlans();

  const plans: MembershipPlan[] =
    plansQuery.data && plansQuery.data.length > 0 ? plansQuery.data : FALLBACK_MEMBERSHIP_PLANS;
  const usingFallback = !plansQuery.isLoading && (plansQuery.isError || (plansQuery.data?.length ?? 0) === 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="border-b border-border bg-[color:var(--onyx)]">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Membership Plans</div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">
            One plan. <span className="text-gradient-gold">Year-round shine.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Recurring premium detailing, priority booking and member-only discounts. Cancel anytime.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {usingFallback && (
          <p className="mb-8 flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Showing our standard plan line-up — live pricing couldn&apos;t be loaded just now.
          </p>
        )}

        {plansQuery.isLoading || authLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} rows={6} />
            ))}
          </div>
        ) : isAuthenticated ? (
          <MemberPlanGrid plans={plans} requestedPlan={requestedPlan} />
        ) : (
          <GuestPlanGrid plans={plans} />
        )}

        <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Fleet Plan</div>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            5+ vehicles? Let&apos;s build a custom plan.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Dedicated account manager · Monthly reporting · Flexible billing · 20% service discount · 2×
            rewards
          </p>
          <Link
            to="/book"
            className="mt-6 inline-flex rounded-full border border-primary/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/10"
          >
            Request a Quote
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function PlanGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

/** Guests: every join sends them to sign-in and back to enrollment for that plan. */
function GuestPlanGrid({ plans }: { plans: MembershipPlan[] }) {
  const navigate = useNavigate();
  return (
    <PlanGrid>
      {plans
        .filter((p) => !p.requiresQuote)
        .map((plan) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            actionLabel={`Join ${plan.name}`}
            onAction={() =>
              void navigate({ to: "/auth", search: { next: `/memberships?plan=${plan.slug}` } })
            }
          />
        ))}
    </PlanGrid>
  );
}

/** Signed-in members: real enrollment / plan-change flow against the live membership. */
function MemberPlanGrid({
  plans,
  requestedPlan,
}: {
  plans: MembershipPlan[];
  requestedPlan?: string;
}) {
  const membershipQuery = useQuery(myMembershipQuery());
  const { membership, isMutating, subscribe, changePlan } = useMembership();

  const isLive = Boolean(membership && ["active", "paused", "pending"].includes(membership.status));
  const joinable = plans.filter((p) => !p.requiresQuote);
  const requested = requestedPlan ? joinable.find((p) => p.slug === requestedPlan) : undefined;

  if (membershipQuery.isLoading) {
    return (
      <PlanGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} rows={6} />
        ))}
      </PlanGrid>
    );
  }

  return (
    <div>
      {membershipQuery.isError && (
        <p className="mb-8 flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          We couldn&apos;t load your membership status. You can still browse plans.
        </p>
      )}

      {isLive && membership ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <div className="font-display text-lg font-bold">
                You&apos;re on {membership.plan.name}
                <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {membership.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {membership.usage.washesRemaining} washes and {membership.usage.interiorRemaining} interior
                details left · renews {formatDate(membership.renewalDate)}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex rounded-full bg-gradient-gold px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
          >
            Manage membership
          </Link>
        </div>
      ) : (
        requested && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <div>
              <div className="font-display text-lg font-bold">Finish joining {requested.name}</div>
              <p className="text-sm text-muted-foreground">
                Confirm to activate your membership — no card required today.
              </p>
            </div>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => subscribe(requested.slug)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-50"
            >
              {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm {requested.name}
            </button>
          </div>
        )
      )}

      <PlanGrid>
        {joinable.map((plan) => {
          const isCurrent = isLive && membership?.plan.slug === plan.slug;
          const isPending = membership?.pendingPlan?.slug === plan.slug;
          return (
            <PlanCard
              key={plan.slug}
              plan={plan}
              isCurrent={isCurrent}
              isPending={isPending}
              disabled={isMutating || isCurrent || isPending}
              actionLabel={
                isCurrent ? "Current plan" : isLive ? "Switch to this" : `Join ${plan.name}`
              }
              onAction={() => (isLive ? changePlan(plan.slug) : subscribe(plan.slug))}
            />
          );
        })}
      </PlanGrid>

      {joinable.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No membership plans are open for enrolment right now. Please check back soon.
        </p>
      )}
    </div>
  );
}
