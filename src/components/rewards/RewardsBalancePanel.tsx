import { Link } from "@tanstack/react-router";
import { Gift, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyRewards, useRedeemReward, useRewardCatalog } from "@/hooks/use-rewards";
import { formatDate } from "@/lib/format";

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">{children}</section>;
}

export function RewardsBalancePanel() {
  const { user, isLoading: authLoading } = useAuth();
  const rewards = useMyRewards(Boolean(user));
  const catalog = useRewardCatalog();
  const redeem = useRedeemReward();

  if (authLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading your points…
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Your points</div>
        <h2 className="mt-2 font-display text-2xl font-bold">Sign in to see your balance</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Your points are added automatically after every completed service. Sign in to view your balance,
          activity and available rewards.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-full bg-gradient-gold px-7 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
        >
          Sign in
        </Link>
      </Shell>
    );
  }

  if (rewards.isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading your points…
        </div>
      </Shell>
    );
  }

  if (rewards.isError || !rewards.data) {
    return (
      <Shell>
        <h2 className="font-display text-xl font-bold">Your points didn&apos;t load</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
        <button
          type="button"
          onClick={() => void rewards.refetch()}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </Shell>
    );
  }

  const { balance, lifetimeEarned, lifetimeRedeemed, multiplier, planName, transactions } = rewards.data;
  const items = catalog.data ?? [];

  return (
    <div className="space-y-6">
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Your balance</div>
            <div className="mt-2 font-display text-4xl font-bold sm:text-5xl">
              {balance.toLocaleString()} <span className="text-lg font-semibold text-muted-foreground">pts</span>
            </div>
            {planName && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {planName} member — earning {multiplier}x points
              </p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Earned</dt>
            <dd className="text-right font-semibold">{lifetimeEarned.toLocaleString()}</dd>
            <dt className="text-muted-foreground">Redeemed</dt>
            <dd className="text-right font-semibold">{lifetimeRedeemed.toLocaleString()}</dd>
          </dl>
        </div>
      </Shell>

      <Shell>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Redeem</div>
        <h2 className="mt-2 font-display text-2xl font-bold">Available rewards</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Rewards are being updated. Check back soon.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {items.map((item) => {
              const affordable = balance >= item.pointsCost;
              const busy = redeem.isPending && redeem.variables === item.id;
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.pointsCost.toLocaleString()} pts
                      {!affordable && ` — ${(item.pointsCost - balance).toLocaleString()} more needed`}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!affordable || redeem.isPending}
                    onClick={() => redeem.mutate(item.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
                    Redeem
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Shell>

      <Shell>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Activity</div>
        <h2 className="mt-2 font-display text-2xl font-bold">Points history</h2>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No activity yet. Points appear here once a service is completed.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="text-sm">{tx.description}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</div>
                </div>
                <span
                  className={`font-display text-sm font-bold ${tx.points >= 0 ? "text-primary" : "text-muted-foreground"}`}
                >
                  {tx.points >= 0 ? "+" : ""}
                  {tx.points.toLocaleString()} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </Shell>
    </div>
  );
}
