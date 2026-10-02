import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/site/Logo";
import { getStaffAccess } from "@/lib/staff.functions";

export const Route = createFileRoute("/team-login")({
  component: TeamLogin,
  head: () => ({
    meta: [
      { title: "Team Login | J The Detailer" },
      { name: "description", content: "Private sign-in for J The Detailer administrators and technicians." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Team Login | J The Detailer" },
      { property: "og:description", content: "Private sign-in for J The Detailer team members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Phase = "idle" | "checking" | "denied";

/** Server-side role check (same check the staff portal uses). Portals re-check on every request. */
async function portalFor(_userId: string): Promise<"/admin" | "/staff" | null> {
  const access = await getStaffAccess();
  if (access.isAdmin) return "/admin";
  if (access.isTechnician) return "/staff";
  return null;
}

function TeamLogin() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) {
      if (!user) setPhase("idle");
      return;
    }
    let active = true;
    setPhase("checking");
    portalFor(user.id)
      .then((to) => {
        if (!active) return;
        if (to) void navigate({ to, replace: true });
        else setPhase("denied");
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't check your team access. Please try again.");
        setPhase("idle");
      });
    return () => {
      active = false;
    };
  }, [user, isLoading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (err) setError("Those details didn't match a team account.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Private</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Team Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            For authorized J The Detailer administrators and technicians.
          </p>
        </div>

        {phase === "checking" || isLoading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> Checking team access…
          </div>
        ) : phase === "denied" ? (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
            <ShieldAlert className="mx-auto h-7 w-7 text-destructive" aria-hidden />
            <h2 className="mt-3 font-display text-lg font-bold">No team access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This account isn&apos;t set up as an administrator or technician. Ask an administrator to grant
              your role.
            </p>
            <Link
              to="/dashboard"
              className="mt-5 inline-flex rounded-full bg-gradient-gold px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
            >
              Go to my dashboard
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                required
                maxLength={255}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                required
                maxLength={72}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Sign in
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
