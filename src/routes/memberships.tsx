import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/memberships")({
  component: Memberships,
  head: () => ({
    meta: [
      { title: "Membership Plans — Monthly Car Detailing Trinidad | J The Detailer" },
      { name: "description", content: "Essential, Premium, Platinum and Family membership plans from TT$299/month. Recurring detailing, priority booking and member discounts." },
    ],
  }),
});

const plans = [
  {
    name: "Essential",
    price: "299",
    tag: "Great starter plan",
    includes: ["2 Maintenance Washes", "Interior Vacuum", "Dashboard Wipe", "Tire Shine", "Glass Cleaning", "10% Service Discount", "Double Reward Points"],
    limits: ["Max 2 visits monthly", "One registered vehicle", "No rollover visits"],
  },
  {
    name: "Premium",
    price: "499",
    tag: "Most popular",
    featured: true,
    includes: ["4 Maintenance Washes", "Premium Interior Detail", "Spray Sealant", "Priority Booking", "15% Service Discount", "Double Reward Points"],
    limits: ["Max 4 visits monthly", "One registered vehicle", "No rollover visits"],
  },
  {
    name: "Platinum",
    price: "799",
    tag: "The full experience",
    includes: ["5 Maintenance Washes", "2 Deep Interior Cleans", "Ceramic Booster", "Rain Repellent", "Priority Scheduling", "20% Service Discount", "Triple Reward Points", "Annual Paint Inspection"],
    limits: ["Max 5 maintenance visits", "Max 2 interior details", "One registered vehicle"],
  },
  {
    name: "Family",
    price: "999",
    tag: "3 vehicles",
    includes: ["3 Registered Vehicles", "8 Shared Maintenance Washes", "15% Service Discount", "Priority Scheduling", "Double Reward Points"],
    limits: ["8 shared washes/month", "Up to 3 vehicles", "No rollover visits"],
  },
];

function Memberships() {
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                p.featured
                  ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-gold"
                  : "border-border bg-card"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">TT$</span>
                <span className="font-display text-5xl font-bold text-gradient-gold">{p.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <div className="mt-1 text-xs text-primary">{p.tag}</div>

              <div className="mt-6 space-y-3 text-sm">
                {p.includes.map((f) => (
                  <div key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Plan limits</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {p.limits.map((l) => <li key={l}>• {l}</li>)}
                </ul>
              </div>

              <Link
                to="/book"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-widest ${
                  p.featured ? "bg-gradient-gold text-primary-foreground" : "border border-primary/40 text-primary hover:bg-primary/10"
                }`}
              >
                Join {p.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Fleet Plan</div>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">5+ vehicles? Let's build a custom plan.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Dedicated account manager · Monthly reporting · Flexible billing
          </p>
          <Link to="/book" className="mt-6 inline-flex rounded-full border border-primary/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/10">
            Request a Quote
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}