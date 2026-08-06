import { Check, Loader2, ShieldCheck, User, Wrench } from "lucide-react";
import type { AppRole, StaffMemberRow } from "@/types/admin";

const ROLE_META: { role: AppRole; label: string; description: string; icon: typeof User }[] = [
  { role: "admin", label: "Admin", description: "Revenue, exports, role management", icon: ShieldCheck },
  { role: "technician", label: "Technician", description: "Read-only member lists", icon: Wrench },
  { role: "customer", label: "Customer", description: "Standard member access", icon: User },
];

interface Props {
  rows: StaffMemberRow[];
  isFetching: boolean;
  pendingKey: string | null;
  onToggle: (input: { userId: string; role: AppRole; grant: boolean }) => void;
}

export default function RoleManager({ rows, isFetching, pendingKey, onToggle }: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No accounts match that search.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${isFetching ? "opacity-70" : ""}`}>
      {rows.map((row) => (
        <div key={row.userId} className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-display text-base font-bold">{row.fullName}</span>
                {row.isSelf && (
                  <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                    You
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {row.email || "No email"}
                {row.phone ? ` · ${row.phone}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {ROLE_META.map((meta) => {
                const active = row.roles.includes(meta.role);
                const key = `${row.userId}:${meta.role}`;
                const busy = pendingKey === key;
                return (
                  <button
                    key={meta.role}
                    type="button"
                    disabled={busy}
                    aria-pressed={active}
                    title={meta.description}
                    onClick={() => onToggle({ userId: row.userId, role: meta.role, grant: !active })}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : active ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <meta.icon className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
