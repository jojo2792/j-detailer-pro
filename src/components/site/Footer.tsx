import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Instagram, Facebook, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-[color:var(--onyx)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <div>
                <div className="font-display text-base font-bold tracking-widest text-gradient-gold">
                  J THE DETAILER
                </div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Premium Automotive Care
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Mobile detailing, ceramic coating and paint correction across
              Trinidad. Membership plans built for owners who expect more.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" aria-label="Instagram" className="rounded-full border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="rounded-full border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Explore</div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
              <li><Link to="/memberships" className="hover:text-foreground">Memberships</Link></li>
              <li><Link to="/rewards" className="hover:text-foreground">J Rewards</Link></li>
              <li><Link to="/book" className="hover:text-foreground">Book Now</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +1 (868) 000-0000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> hello@jthedetailer.com</li>
              <li>Serving all of Trinidad</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} J The Detailer. All rights reserved.</div>
          <div className="uppercase tracking-widest">Trinidad · Mobile Service</div>
        </div>
      </div>
    </footer>
  );
}