import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Pause, Play, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { MembershipStatusBadge } from "@/components/membership/MembershipStatusBadge";
import { MembershipHistoryList } from "@/components/membership/MembershipHistoryList";
import { CancelMembershipDialog } from "@/components/membership/CancelMembershipDialog";
import { UsageMeter } from "@/components/membership/UsageMeter";
import { PlanCard } from "@/components/membership/PlanCard";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { formatDate, formatTTD } from "@/lib/format";
import { useMembership, useMembershipPlans } from "@/hooks/use-membership";

export function MembershipPanel() {
  const {
    membership,
    history,
    isLoading,
    isError,
    refetch,
    isMutating,
    subscribe,
    changePlan,
    pause,
    resume,
    cancel,
    setAutoRenew,
  } = useMembership();
  const plansQuery = useMembershipPlans();
  const [showPlans, setShowPlans] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <SkeletonCard rows={5} />;

  if (isError) {
    return (
      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
        <h2 className="mt-3 font-display text-xl font-bold">Your membership didn't load</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is usually temporary. Your plan and allowances are safe.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </section>
    );
  }

  const plans = (plansQuery.data ?? []).filter((p) => !p.requiresQuote);
  const isLive = membership && ["active", "paused", "pending"].includes(membership.status);
  const isFleet = membership?.plan.requiresQuote ?? false;

  return (
    <div className="space-y-8">
      {isLive && membership ? (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Your membership
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold">
                {membership.plan.name}{" "}
                <span className="text-gradient-gold">
                  {isFleet ? "Custom" : `${formatTTD(membership.plan.monthlyPriceCents)}/mo`}
                </span>
              </h2>
            </div>
            <MembershipStatusBadge status={membership.status} />
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <UsageMeter
              label="Maintenance washes"
              used={membership.usage.washesUsed}
              limit={membership.usage.monthlyWashLimit}
            />
            <UsageMeter
              label="Interior details"
              used={membership.usage.interiorUsed}
              limit={membership.usage.monthlyInteriorLimit}
            />
          </div>

          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Current cycle</dt>
              <dd className="mt-1 font-display font-semibold">
                {formatDate(membership.currentPeriodStart)} – {formatDate(membership.currentPeriodEnd)}
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Renews</dt>
              <dd className="mt-1 font-display font-semibold">
                {formatDate(membership.renewalDate)}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({membership.daysUntilRenewal} days)
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Vehicles</dt>
              <dd className="mt-1 font-display font-semibold">
                {isFleet ? `${membership.plan.vehicleLimit}+` : membership.plan.vehicleLimit}
                <span className="ml-1 text-xs text-muted-foreground">
                  {membership.plan.vehicleLimit === 1 && !isFleet ? "vehicle" : "vehicles"}
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Service discount</dt>
              <dd className="mt-1 font-display font-semibold">{membership.plan.discountPercentage}% off</dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Reward points</dt>
              <dd className="mt-1 font-display font-semibold">{membership.plan.rewardMultiplier}× earning</dd>
            </div>
          </dl>

          {membership.pendingPlan && (
            <p className="mt-6 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
              <CalendarClock className="h-4 w-4" />
              Switching to {membership.pendingPlan.name} on {formatDate(membership.renewalDate)}.
            </p>
          )}
          {membership.cancelAtPeriodEnd && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Your membership ends on {formatDate(membership.currentPeriodEnd)}.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/book"
              className="inline-flex items-center rounded-full bg-gradient-gold px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
            >
              Use a visit
            </Link>
            <button
              type="button"
              onClick={() => setShowPlans((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Change plan
            </button>
            {membership.status === "paused" ? (
              <button
                type="button"
                disabled={isMutating}
                onClick={() => resume()}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" /> Resume
              </button>
            ) : (
              <button
                type="button"
                disabled={isMutating || membership.status !== "active"}
                onClick={() => pause()}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
            )}
            <button
              type="button"
              disabled={isMutating}
              onClick={() => setAutoRenew(!membership.autoRenew)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-50"
            >
              Auto-renew {membership.autoRenew ? "on" : "off"}
            </button>
            {!membership.cancelAtPeriodEnd && (
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setConfirmCancel(true)}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>

          <CancelMembershipDialog
            open={confirmCancel}
            periodEnd={membership.currentPeriodEnd}
            isMutating={isMutating}
            onClose={() => setConfirmCancel(false)}
            onConfirm={(immediate) => {
              cancel(immediate);
              setConfirmCancel(false);
            }}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {membership ? "Membership ended" : "No active plan"}
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {membership
              ? "Your membership is no longer active."
              : "Join a membership and keep your vehicle showroom-ready."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {membership
              ? "Rejoin below to restore your washes, discounts and reward multiplier right away."
              : "Recurring washes, member discounts and multiplied reward points."}
          </p>
          {membership && (
            <p className="mt-4 text-xs text-muted-foreground">
              Previous plan: {membership.plan.name} · {membership.status}
              {membership.cancelledAt ? ` · ended ${formatDate(membership.cancelledAt)}` : ""}
            </p>
          )}
        </section>
      )}

      {(showPlans || !isLive) && (
        <section>
          <h3 className="font-display text-xl font-bold">
            {isLive ? "Switch your plan" : membership ? "Rejoin with a plan" : "Choose your plan"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrades apply right away. Downgrades take effect at your next renewal so you keep what you paid
            for.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = membership?.plan.id === plan.id && Boolean(isLive);
              const isPending = membership?.pendingPlan?.id === plan.id;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={isCurrent}
                  isPending={isPending}
                  disabled={isMutating || isCurrent || isPending}
                  actionLabel={isCurrent ? "Current plan" : isLive ? "Switch to this" : `Join ${plan.name}`}
                  onAction={() => (isLive ? changePlan(plan.slug) : subscribe(plan.slug))}
                />
              );
            })}
          </div>
        </section>
      )}

      <MembershipHistoryList history={history} />
    </div>
  );
}
