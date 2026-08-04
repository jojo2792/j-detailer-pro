import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { adminAccessQuery } from "@/services/admin.service";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/memberships", label: "Memberships" },
  { to: "/rewards", label: "J Rewards" },
  { to: "/book", label: "Book" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const access = useQuery({ ...adminAccessQuery(), enabled: isAuthenticated, retry: false });
  const isStaff = Boolean(access.data?.permissions.canViewMembers);
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-bold tracking-widest text-gradient-gold">
              J THE DETAILER
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Premium Automotive Care
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth"}
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            {isAuthenticated ? "My Account" : "Sign In"}
          </Link>
          {isStaff && (
            <Link
              to="/admin"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              CRM
            </Link>
          )}
          <Link
            to="/book"
            className="inline-flex items-center rounded-full bg-gradient-gold px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition-transform hover:-translate-y-0.5"
          >
            Book Now
          </Link>
        </nav>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden rounded-md p-2 text-foreground"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="flex flex-col px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-foreground/90 hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to={isAuthenticated ? "/dashboard" : "/auth"}
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-medium text-foreground/90 hover:text-primary"
            >
              {isAuthenticated ? "My Account" : "Sign In"}
            </Link>
            {isStaff && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-foreground/90 hover:text-primary"
              >
                CRM
              </Link>
            )}
            <Link
              to="/book"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
            >
              Book Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}