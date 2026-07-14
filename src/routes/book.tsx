import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Car, CreditCard, ListChecks, MapPin, User } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/book")({
  component: Book,
  head: () => ({
    meta: [
      { title: "Book Now — Schedule Your Detail | J The Detailer" },
      { name: "description", content: "Book a mobile detail, ceramic coating, or paint correction in Trinidad. Live availability and secure card payment." },
    ],
  }),
});

const steps = [
  { icon: ListChecks, title: "Select Service", desc: "Choose from exterior, interior, premium detail, correction or ceramic." },
  { icon: Car, title: "Vehicle Type", desc: "Car, SUV, truck, van, motorcycle or boat." },
  { icon: Calendar, title: "Pick a Date", desc: "See live availability and lock in your slot." },
  { icon: MapPin, title: "Add Location", desc: "Where should we bring the shop?" },
  { icon: User, title: "Your Details", desc: "Name, contact and vehicle info." },
  { icon: CreditCard, title: "Payment", desc: "Card, bank transfer, cash or member credits." },
];

function Book() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="border-b border-border bg-[color:var(--onyx)]">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Booking</div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">
            Book your <span className="text-gradient-gold">next detail.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Our full 6-step live booking system launches in the next release. In the meantime,
            reach out and we'll lock in your appointment personally.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="tel:+18680000000" className="inline-flex items-center justify-center rounded-full bg-gradient-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold">
              Call to Book
            </a>
            <a href="https://wa.me/18680000000" className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary">
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Coming Soon</div>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">The 6-step booking flow</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Step {i + 1}</div>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}