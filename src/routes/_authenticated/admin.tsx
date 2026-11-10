import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { CalendarCheck, ShieldAlert, Users2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton-card";
import { KpiCards } from "@/components/admin/KpiCards";
import { CustomerPageActivity, OperationsOverview, SnapshotState } from "@/components/admin/OperationsOverview";
import { Button } from "@/components/ui/button";
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
  const { permissions, isLoading: accessLoading, error: accessError } = useAdminAccess();
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
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Operations</div>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Admin CRM</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild><Link to="/staff">
              <CalendarCheck className="h-4 w-4" aria-hidden /> Jobs
            </Link></Button>
            {Boolean(permissions?.canManageMembers) && (
              <Button variant="outline" size="sm" asChild><Link to="/team">
                <Users2 className="h-4 w-4" aria-hidden /> Roles
              </Link></Button>
            )}
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {canViewRevenue ? "Admin access" : canViewMembers ? "Technician access" : "Restricted"}
            </p>
          </div>
        </header>

        {accessLoading ? (
          <div className="mt-10 space-y-6">
            <SkeletonGrid count={3} />
            <SkeletonCard rows={6} />
          </div>
        ) : accessError ? (
          <p role="alert" className="mt-10 border-y border-border py-8 text-sm text-muted-foreground">Access check failed. Refresh the page to retry; no business summaries are shown.</p>
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
              <ErrorBoundary title="Business summaries didn't load">
                <OperationsOverview />
                <section aria-labelledby="membership-snapshot-heading" className="mt-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="membership-snapshot-heading" className="font-display text-xl font-bold">Membership snapshot</h2>
                    <Button variant="outline" size="sm" asChild><a href="#member-management">Review members</a></Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Existing returned memberships/plans only; unpaginated reads may be capped at 1,000 rows each. Not verified business-wide totals. Event history uses an ordered read limited to 5,000, also subject to API limits; recent events may be missing. Summary is independent of member filters below.</p>
                  <SnapshotState updatedAt={overview.data?.generatedAt} fetching={overview.isFetching} stale={overview.isStale}
                    error={overview.isError} retry={() => void overview.refetch()} />
                {overview.isLoading ? (
                  <SkeletonGrid count={3} />
                ) : overview.data ? (
                  <>
                    <KpiCards kpis={overview.data.kpis} month={overview.data.revenue[overview.data.revenue.length - 1]?.month ?? "Month unavailable"} />
                    <Suspense fallback={<SkeletonCard rows={6} />}>
                      <RevenueCharts
                        revenue={overview.data.revenue}
                        planMix={overview.data.planMix}
                      />
                    </Suspense>
                  </>
                ) : <p className="text-sm text-muted-foreground">Membership summary unavailable; no zero totals assumed.</p>}
                </section>
              </ErrorBoundary>
            )}

            <section id="member-management" aria-labelledby="member-management-heading" className="space-y-4 scroll-mt-24">
              <h2 id="member-management-heading" className="font-display text-xl font-bold">Member management</h2>
              <p className="text-xs text-muted-foreground">Joined-date filters below apply to this list only; without dates, all returned membership start dates are included. Matching totals are derived from loaded records, not an uncapped customer directory.</p>
              <MemberFilters filters={filters} plans={plans} onChange={update} onReset={reset} />
              <SnapshotState updatedAt={members.data ? new Date(members.dataUpdatedAt).toISOString() : undefined}
                fetching={members.isFetching} stale={members.isStale} error={members.isError} retry={() => void members.refetch()} />
              {canViewRevenue && members.data && <CustomerPageActivity page={members.data} updatedAt={members.dataUpdatedAt} />}

            <ErrorBoundary title="The member list didn't load">
              {members.isLoading ? (
                <SkeletonCard rows={8} />
              ) : members.data ? (
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
              ) : <p role="alert" className="text-sm text-muted-foreground">Member list unavailable. Retry above; no empty customer total assumed.</p>}
            </ErrorBoundary>
            </section>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}