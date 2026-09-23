import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { StaffBoard } from "@/components/staff/StaffBoard";
import { useStaffAccess } from "@/hooks/use-staff";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffPortal,
  head: () => ({
    meta: [
      { title: "Staff Job Board — Today's Appointments | J The Detailer" },
      {
        name: "description",
        content:
          "Technician portal for J The Detailer: today's appointments, customer and vehicle details, job claiming and status updates.",
      },
      { property: "og:title", content: "Staff Job Board | J The Detailer" },
      { property: "og:description", content: "Today's appointments and job status updates for staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function StaffPortal() {
  const { isStaff, isLoading, access } = useStaffAccess();

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <header>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Operations</div>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Job board</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {access?.isAdmin ? "Admin access" : access?.isTechnician ? "Technician access" : ""}
          </p>
        </header>

        <div className="mt-10">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> Checking your access…
            </div>
          ) : !isStaff ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
              <ShieldAlert className="mx-auto h-8 w-8 text-destructive" aria-hidden />
              <h2 className="mt-4 font-display text-xl font-bold">Staff access only</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This job board is limited to technician and admin accounts. Ask an administrator to grant
                your role.
              </p>
            </div>
          ) : (
            <ErrorBoundary title="The job board didn't load">
              <StaffBoard />
            </ErrorBoundary>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
