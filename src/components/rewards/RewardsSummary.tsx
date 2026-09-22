import { Link } from "@tanstack/react-router";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyRewards } from "@/hooks/use-rewards";
import { formatDate } from "@/lib/format";

export function RewardsSummary() {
  const { user } = useAuth();
  const rewards = useMyRewards(Boolean(user));

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">J Rewards</div>
          {rewards.isLoading ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading your points…
            </div>
          ) : rewards.isError || !rewards.data ? (
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              Points didn&apos;t load.
              <button
                type="button"
                onClick={() => void rewards.refetch()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mt-2 font-display text-3xl font-bold">
                {rewards.data.balance.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-muted-foreground">pts</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {rewards.data.planName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Earning {rewards.data.multiplier}x as a {rewards.data.planName} member
                  </span>
                ) : rewards.data.transactions[0] ? (
                  `Last activity ${formatDate(rewards.data.transactions[0].createdAt)}`
                ) : (
                  "Points are added after each completed service."
                )}
              </p>
            </>
          )}
        </div>
        <Link
          to="/rewards"
          className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
        >
          View rewards
        </Link>
      </div>
    </section>
  );
}
