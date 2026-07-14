import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Truck, Sparkles, Award, Wrench, Star, Check } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import heroImg from "@/assets/hero-car.jpg";
import extImg from "@/assets/service-exterior.jpg";
import intImg from "@/assets/service-interior.jpg";
import premImg from "@/assets/service-premium.jpg";
import corrImg from "@/assets/service-correction.jpg";
import ceramicImg from "@/assets/service-ceramic.jpg";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "J The Detailer — Mobile Detailing, Ceramic Coating & Membership Plans Trinidad" },
      { name: "description", content: "Premium automotive care delivered to you. Professional detailing, paint correction, and ceramic coating with flexible membership plans across Trinidad." },
    ],
  }),
});

const whyChoose = [
  { icon: Truck, title: "Mobile Service", desc: "We come to your home, office or job site — anywhere in Trinidad." },
  { icon: Sparkles, title: "Premium Products", desc: "Only professional-grade coatings, polishes and microfibre." },
  { icon: Wrench, title: "Pro Equipment", desc: "Dual-action polishers, steam extractors, water-fed systems." },
  { icon: Award, title: "Member Benefits", desc: "Recurring care with priority booking and up to 20% off." },
];

const services = [
  { img: extImg, title: "Exterior Detail", desc: "Foam wash, wheels, tire dressing, glass and spray protection.", price: "TT$180" },
  { img: intImg, title: "Interior Detail", desc: "Vacuum, dashboard, plastics, glass and door jambs.", price: "TT$220" },
  { img: premImg, title: "Premium Full Detail", desc: "Complete interior + exterior in one visit.", price: "TT$380" },
  { img: corrImg, title: "Paint Correction", desc: "1–3 step correction to remove swirls and restore gloss.", price: "TT$900" },
  { img: ceramicImg, title: "Ceramic Coating", desc: "3-year, 5-year and graphene coatings for lasting shine.", price: "TT$1,800" },
];

const memberships = [
  {
    name: "Essential",
    price: "299",
    features: ["2 Maintenance Washes / month", "Interior Vacuum + Dashboard", "Tire Shine + Glass", "10% off all services", "Double reward points"],
  },
  {
    name: "Premium",
    price: "499",
    features: ["4 Maintenance Washes / month", "Premium Interior Detail", "Spray Sealant", "Priority Booking", "15% off all services", "Double reward points"],
    featured: true,
  },
  {
    name: "Platinum",
    price: "799",
    features: ["5 Maintenance Washes / month", "2 Deep Interior Cleans", "Ceramic Booster", "Rain Repellent", "Priority Scheduling", "20% off + Triple points"],
  },
];

const rewards = [
  { pts: "500", reward: "Tire Shine Upgrade" },
  { pts: "1,000", reward: "Free Engine Bay Cleaning" },
  { pts: "2,000", reward: "Free Interior Shampoo" },
  { pts: "3,000", reward: "Free Maintenance Wash" },
  { pts: "5,000", reward: "TT$250 Service Credit" },
];

const testimonials = [
  { name: "Ryan M.", text: "Turned up on time, did the ceramic coat at my office. Car looks factory-fresh months later.", rating: 5 },
  { name: "Aisha S.", text: "The Premium membership pays for itself. Never wash my own car anymore.", rating: 5 },
  { name: "David K.", text: "Best paint correction I've seen in Trinidad. Zero swirls, mirror finish.", rating: 5 },
];

function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Luxury vehicle being professionally detailed"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="mx-auto max-w-5xl px-4 py-32 text-center sm:px-6 sm:py-40 lg:py-48">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Mobile Detailing · Trinidad
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Premium Automotive Care{" "}
            <span className="text-gradient-gold">Delivered To You</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Professional detailing, paint correction and ceramic coating services
            with flexible membership plans designed to keep your vehicle looking
            its best year-round.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition-transform hover:-translate-y-0.5"
            >
              Book Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/memberships"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              View Memberships
            </Link>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Why Choose Us</div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built for owners who expect more.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((w) => (
            <div key={w.title} className="group rounded-2xl border border-border/60 bg-card/60 p-6 transition-colors hover:border-primary/50">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <w.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-[color:var(--onyx)] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Featured Services</div>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Signature care, à la carte.</h2>
            </div>
            <Link to="/services" className="text-sm font-semibold uppercase tracking-widest text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.title} className="group overflow-hidden rounded-2xl border border-border/50 bg-card">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Starting at</div>
                      <div className="font-display text-lg font-bold text-primary">{s.price}</div>
                    </div>
                    <Link to="/book" className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline">
                      Book →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIPS */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Memberships</div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Recurring care. Real savings.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Pick the plan that matches your driving. Cancel anytime.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {memberships.map((m) => (
            <div
              key={m.name}
              className={`relative rounded-2xl border p-8 ${
                m.featured
                  ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-gold"
                  : "border-border bg-card"
              }`}
            >
              {m.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{m.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">TT$</span>
                <span className="font-display text-5xl font-bold text-gradient-gold">{m.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {m.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/memberships"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-widest ${
                  m.featured
                    ? "bg-gradient-gold text-primary-foreground"
                    : "border border-primary/40 text-primary hover:bg-primary/10"
                }`}
              >
                Join Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[color:var(--onyx)] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Testimonials</div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Trusted across Trinidad.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  — {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REWARDS */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">J Rewards</div>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Earn rewards every time you detail.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every completed service earns points automatically. No loyalty cards.
              No signups. Rewards tracked in your account.
            </p>
            <Link
              to="/rewards"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/10"
            >
              How it works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-2">
            <ul className="divide-y divide-border">
              {rewards.map((r) => (
                <li key={r.reward} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm">{r.reward}</span>
                  <span className="font-display text-sm font-bold text-primary">{r.pts} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-y border-border bg-[color:var(--onyx)] py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">
            Ready to protect your <span className="text-gradient-gold">investment?</span>
          </h2>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/book" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold">
              Book Appointment
            </Link>
            <Link to="/memberships" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-semibold uppercase tracking-widest hover:border-primary hover:text-primary">
              Become a Member
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
