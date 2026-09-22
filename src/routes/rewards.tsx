import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { RewardsBalancePanel } from "@/components/rewards/RewardsBalancePanel";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRewardCatalog, useRewardEarnRates } from "@/hooks/use-rewards";

export const Route = createFileRoute("/rewards")({
  component: Rewards,
  head: () => ({
    meta: [
      { title: "J Rewards — Earn Points With Every Detail | J The Detailer" },
      { name: "description", content: "Every completed service earns points automatically. Redeem for free washes, engine bay cleaning, interior shampoo, and service credits." },
      { property: "og:title", content: "J Rewards | J The Detailer" },
      { property: "og:description", content: "Track your points balance, activity and available rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Rewards() {
  const earnRates = useRewardEarnRates();
  const catalog = useRewardCatalog();

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="border-b border-border bg-[color:var(--onyx)]">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Loyalty, simplified
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-6xl">
            Earn rewards <span className="text-gradient-gold">every time you detail.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            No cards. No signups. Points added automatically after every completed service and tracked in your account.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <ErrorBoundary title="Your points didn't load">
          <RewardsBalancePanel />
        </ErrorBoundary>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Earn</div>
            <h2 className="mt-2 font-display text-2xl font-bold">Points per service</h2>
            {earnRates.isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ul className="mt-6 divide-y divide-border">
                {(earnRates.data ?? []).map((e) => (
                  <li key={e.slug} className="flex items-center justify-between py-3 text-sm">
                    <span>{e.name}</span>
                    <span className="font-display font-bold text-primary">+{e.points}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-xs text-muted-foreground">
              Members earn multiplied points — up to 3x on Platinum.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Redeem</div>
            <h2 className="mt-2 font-display text-2xl font-bold">Reward tiers</h2>
            {catalog.isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ul className="mt-6 divide-y divide-border">
                {(catalog.data ?? []).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                    <span>{r.name}</span>
                    <span className="font-display font-bold text-primary">
                      {r.pointsCost.toLocaleString()} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-12 text-center">
          <Link to="/book" className="inline-flex rounded-full bg-gradient-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold">
            Start Earning
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
