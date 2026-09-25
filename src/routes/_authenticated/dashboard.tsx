import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { MembershipPanel } from "@/components/membership/MembershipPanel";
import { MemberIdentityCard } from "@/components/membership/MemberIdentityCard";
import { MyAppointments } from "@/components/booking/MyAppointments";
import { RewardsSummary } from "@/components/rewards/RewardsSummary";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { useAuth, useSignOut } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "My Dashboard — Membership & Visits | J The Detailer" },
      { name: "description", content: "Track your membership status, remaining monthly visits, renewal date and plan history." },
      { property: "og:title", content: "My Dashboard | J The Detailer" },
      { property: "og:description", content: "Manage your membership, visits and renewals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Dashboard() {
  const { user } = useAuth();
  const signOut = useSignOut();

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Dashboard</div>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              {user?.user_metadata?.["full_name"] ?? user?.email}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
          >
            Sign out
          </button>
        </div>
        <div className="mt-10 space-y-6">
          <MemberIdentityCard />
          <ErrorBoundary title="Your notifications didn't load">
            <NotificationsPanel />
          </ErrorBoundary>
          <ErrorBoundary title="Your membership didn't load">
            <MembershipPanel />
          </ErrorBoundary>
          <ErrorBoundary title="Your points didn't load">
            <RewardsSummary />
          </ErrorBoundary>
          <ErrorBoundary title="Your appointments didn't load">
            <MyAppointments />
          </ErrorBoundary>
        </div>
      </section>
      <Footer />
    </div>
  );
}