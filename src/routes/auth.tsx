import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useAuth, useEmailPasswordAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account | J The Detailer" },
      { name: "description", content: "Sign in to manage your J The Detailer membership, bookings and rewards, or create an account in seconds." },
      { property: "og:title", content: "Sign In | J The Detailer" },
      { property: "og:description", content: "Manage your membership, bookings and J Rewards in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { signIn, signUp, google } = useEmailPasswordAuth("/dashboard");

  useEffect(() => {
    if (isAuthenticated) void navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  const busy = signIn.isPending || signUp.isPending || google.isPending;

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Members</div>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            {mode === "signin" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your membership, bookings and J Rewards in one place.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => google.mutate()}
          className="mt-8 inline-flex items-center justify-center gap-3 rounded-full border border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "signin") signIn.mutate({ email, password });
            else signUp.mutate({ email, password, fullName, phone });
          }}
        >
          {mode === "signup" && (
            <>
              <Field label="Full name" value={fullName} onChange={setFullName} required maxLength={100} />
              <Field label="Phone" value={phone} onChange={setPhone} type="tel" maxLength={30} />
            </>
          )}
          <Field label="Email" value={email} onChange={setEmail} type="email" required maxLength={255} />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            required
            minLength={8}
            maxLength={72}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-center text-sm text-muted-foreground hover:text-primary"
        >
          {mode === "signin" ? "New here? Create an account" : "Already a member? Sign in"}
        </button>

        <Link to="/memberships" className="mt-2 text-center text-xs text-muted-foreground hover:text-primary">
          Browse membership plans
        </Link>
      </section>
      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}