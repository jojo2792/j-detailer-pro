import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const Route = createFileRoute("/book")({
  component: Book,
  head: () => ({
    meta: [
      { title: "Book Now — Schedule Your Detail | J The Detailer" },
      { name: "description", content: "Book a mobile detail, ceramic coating, or paint correction in Trinidad. Live availability, member discounts and instant confirmation." },
      { property: "og:title", content: "Book Your Detail | J The Detailer" },
      { property: "og:description", content: "Pick your service, vehicle and time slot. Members get automatic discounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Book() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="border-b border-border bg-[color:var(--onyx)]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Booking</div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Book your <span className="text-gradient-gold">next detail.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Choose your service, vehicle and time. We bring the shop to you — and member
            discounts apply automatically.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <ErrorBoundary title="The booking form didn't load">
          <BookingWizard />
        </ErrorBoundary>
      </section>
      <Footer />
    </div>
  );
}
