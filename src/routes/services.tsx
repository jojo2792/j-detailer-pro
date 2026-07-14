import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/services")({
  component: Services,
  head: () => ({
    meta: [
      { title: "Services — Mobile Detailing, Ceramic Coating & Paint Correction | J The Detailer" },
      { name: "description", content: "Full menu of professional car detailing services in Trinidad: exterior, interior, premium full detail, paint correction, ceramic coating and more." },
    ],
  }),
});

const services = [
  {
    title: "Exterior Detail",
    duration: "60–90 min",
    price: "From TT$180",
    items: ["Foam wash", "Wheel cleaning", "Tire dressing", "Exterior glass", "Spray protection"],
  },
  {
    title: "Interior Detail",
    duration: "60–90 min",
    price: "From TT$220",
    items: ["Vacuum", "Dashboard cleaning", "Plastic protection", "Glass cleaning", "Door jambs"],
  },
  {
    title: "Premium Full Detail",
    duration: "2–3 hours",
    price: "From TT$380",
    items: ["Complete interior detail", "Complete exterior detail", "Wheels & tires", "All glass surfaces", "Interior protection"],
  },
  {
    title: "Paint Correction",
    duration: "4–8 hours",
    price: "From TT$900",
    items: ["1-Step Correction", "2-Step Correction", "3-Step Correction", "Paint enhancement", "Machine polish"],
  },
  {
    title: "Ceramic Coating",
    duration: "1–2 days",
    price: "From TT$1,800",
    items: ["3-Year coating", "5-Year coating", "Graphene coating", "Paint prep included", "Care kit included"],
  },
  {
    title: "Add-On Services",
    duration: "Varies",
    price: "From TT$80",
    items: ["Engine bay cleaning", "Headlight restoration", "Leather conditioning", "Odor removal", "Fleet detailing"],
  },
];

function Services() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="border-b border-border bg-[color:var(--onyx)]">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Our Services</div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">
            Every service, <span className="text-gradient-gold">executed to spec.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Professional-grade products, dealer-level care and a mobile service that comes to you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <div className="mt-2 flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration}</span>
                <span className="text-primary">{s.price}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {s.items.map((i) => (
                  <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {i}</li>
                ))}
              </ul>
              <Link to="/book" className="mt-6 inline-flex justify-center rounded-full border border-primary/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/10">
                Book This Service
              </Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}