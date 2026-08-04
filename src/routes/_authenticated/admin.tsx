import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton-card";
import { KpiCards } from "@/components/admin/KpiCards";
import { MemberFilters } from "@/components/admin/MemberFilters";
import {
  useAdminAccess,
  useAdminMembers,
  useAdminOverview,
  useMemberExport,
  useMemberFilters,
} from "@/hooks/use-admin";
import { useMembershipPlans } from "@/hooks/use-membership";

const MembersTable = lazy(() => import("@/components/admin/MembersTable"));
const RevenueCharts = lazy(() => import("@/components/admin/RevenueCharts"));

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminCrm,
  head: () => ({
    meta: [
      { title: "Admin CRM — Revenue & Members | J The Detailer" },
      {
        name: "description",
        content:
          "Internal CRM for J The Detailer: recurring revenue charts, membership KPIs, advanced member filters and CSV exports.",
      },
      { property: "og:title", content: "Admin CRM | J The Detailer" },
      { property: "og:description", content: "Revenue analytics, member filters and exports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AdminCrm() {
  const { permissions, isLoading: accessLoading } = useAdminAccess();
  const { filters, update, reset } = useMemberFilters();
  const canViewMembers = Boolean(permissions?.canViewMembers);
  const canViewRevenue = Boolean(permissions?.canViewRevenue);

  const overview = useAdminOverview(canViewRevenue);
  const members = useAdminMembers(filters, canViewMembers);
  const plansQuery = useMembershipPlans();
  const exporter = useMemberExport(filters);

  const plans = (plansQuery.data ?? []).map((p) => ({ slug: p.slug, name: p.name }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Operations</div>
            <h1 className="mt-2 truncate font-display text-3xl font-bold sm:text-4xl">Admin CRM</h1>
          </div>
          <p className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">
            {canViewRevenue ? "Admin access" : canViewMembers ? "Technician access" : "Restricted"}
          </p>
        </header>

        {accessLoading ? (
          <div className="mt-10 space-y-6">
            <SkeletonGrid count={3} />
            <SkeletonCard rows={6} />
          </div>
        ) : !canViewMembers ? (
          <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" aria-hidden />
            <h2 className="mt-4 font-display text-xl font-bold">You don't have CRM access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This area is limited to admin and technician accounts. Ask an administrator to grant your role.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {canViewRevenue && (
              <ErrorBoundary title="Revenue analytics didn't load">
                {overview.isLoading ? (
                  <SkeletonGrid count={3} />
                ) : overview.data ? (
                  <>
                    <KpiCards kpis={overview.data.kpis} />
                    <Suspense fallback={<SkeletonCard rows={6} />}>
                      <RevenueCharts
                        revenue={overview.data.revenue}
                        planMix={overview.data.planMix}
                      />
                    </Suspense>
                  </>
                ) : null}
              </ErrorBoundary>
            )}

            <MemberFilters filters={filters} plans={plans} onChange={update} onReset={reset} />

            <ErrorBoundary title="The member list didn't load">
              {members.isLoading ? (
                <SkeletonCard rows={8} />
              ) : (
                <Suspense fallback={<SkeletonCard rows={8} />}>
                  <MembersTable
                    page={members.data}
                    filters={filters}
                    isFetching={members.isFetching}
                    canExport={Boolean(permissions?.canExport)}
                    isExporting={exporter.isPending}
                    onExport={() => exporter.mutate()}
                    onChange={update}
                  />
                </Suspense>
              )}
            </ErrorBoundary>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}