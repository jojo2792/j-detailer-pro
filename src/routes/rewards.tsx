import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/rewards")({
  component: Rewards,
  head: () => ({
    meta: [
      { title: "J Rewards — Earn Points With Every Detail | J The Detailer" },
      { name: "description", content: "Every completed service earns points automatically. Redeem for free washes, engine bay cleaning, interior shampoo, and service credits." },
    ],
  }),
});

const earn = [
  { service: "Exterior Detail", pts: 100 },
  { service: "Interior Detail", pts: 150 },
  { service: "Premium Detail", pts: 250 },
  { service: "Paint Correction", pts: 750 },
  { service: "Ceramic Coating", pts: 1000 },
];

const redeem = [
  { reward: "Tire Shine Upgrade", pts: 500 },
  { reward: "Free Engine Bay Cleaning", pts: 1000 },
  { reward: "Free Interior Shampoo", pts: 2000 },
  { reward: "Free Maintenance Wash", pts: 3000 },
  { reward: "TT$250 Service Credit", pts: 5000 },
];

function Rewards() {
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

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Earn</div>
            <h2 className="mt-2 font-display text-2xl font-bold">Points per service</h2>
            <ul className="mt-6 divide-y divide-border">
              {earn.map((e) => (
                <li key={e.service} className="flex items-center justify-between py-3 text-sm">
                  <span>{e.service}</span>
                  <span className="font-display font-bold text-primary">+{e.pts}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Redeem</div>
            <h2 className="mt-2 font-display text-2xl font-bold">Reward tiers</h2>
            <ul className="mt-6 divide-y divide-border">
              {redeem.map((r) => (
                <li key={r.reward} className="flex items-center justify-between py-3 text-sm">
                  <span>{r.reward}</span>
                  <span className="font-display font-bold text-primary">{r.pts.toLocaleString()} pts</span>
                </li>
              ))}
            </ul>
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