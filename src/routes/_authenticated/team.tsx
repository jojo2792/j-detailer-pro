import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { ArrowLeft, Search, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useAdminAccess } from "@/hooks/use-admin";
import { useSetStaffRole, useStaffDirectory } from "@/hooks/use-roles";

const RoleManager = lazy(() => import("@/components/admin/RoleManager"));

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamAccess,
  head: () => ({
    meta: [
      { title: "Team & Role Permissions | J The Detailer" },
      {
        name: "description",
        content:
          "Admin-only screen to review accounts and grant or remove admin, technician and customer permissions for J The Detailer staff.",
      },
      { property: "og:title", content: "Team & Role Permissions | J The Detailer" },
      { property: "og:description", content: "Grant or remove staff access without editing code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function TeamAccess() {
  const { permissions, isLoading: accessLoading } = useAdminAccess();
  const canManage = Boolean(permissions?.canManageMembers);
  const [search, setSearch] = useState("");
  const directory = useStaffDirectory(search, canManage);
  const setRole = useSetStaffRole();
  const pendingKey = setRole.isPending && setRole.variables
    ? `${setRole.variables.userId}:${setRole.variables.role}`
    : null;
  const counts = directory.data?.counts;

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to CRM
        </Link>
        <header className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Operations</div>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Role permissions</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Grant or remove access for any account. Admins see revenue and exports, technicians get read-only
            member lists, customers keep standard membership access.
          </p>
        </header>

        {accessLoading ? (
          <div className="mt-10">
            <SkeletonCard rows={6} />
          </div>
        ) : !canManage ? (
          <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" aria-hidden />
            <h2 className="mt-4 font-display text-xl font-bold">Admins only</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Role permissions can only be changed by an administrator.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Admins", value: counts?.admin ?? 0 },
                { label: "Technicians", value: counts?.technician ?? 0 },
                { label: "Customers", value: counts?.customer ?? 0 },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {card.label}
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold">{card.value}</div>
                </div>
              ))}
            </div>

            <label className="relative block">
              <span className="sr-only">Search accounts</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or phone"
                className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </label>

            <ErrorBoundary title="The account directory didn't load">
              {directory.isLoading ? (
                <SkeletonCard rows={6} />
              ) : (
                <Suspense fallback={<SkeletonCard rows={6} />}>
                  <RoleManager
                    rows={directory.data?.rows ?? []}
                    isFetching={directory.isFetching}
                    pendingKey={pendingKey}
                    onToggle={(input) => setRole.mutate(input)}
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
