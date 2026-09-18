import { History } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import type { MembershipHistoryEntry } from "@/types/membership";

const PAGE = 8;

export function MembershipHistoryList({ history }: { history: MembershipHistoryEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? history : history.slice(0, PAGE);

  return (
    <section className="rounded-2xl border border-border bg-card p-8">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-bold">Membership activity</h3>
      </div>
      {history.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No membership activity yet.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border">
            {visible.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold capitalize">{entry.event.replace(/_/g, " ")}</span>
                  {(entry.fromPlanName || entry.toPlanName) && (
                    <span className="ml-2 text-muted-foreground">
                      {entry.fromPlanName && entry.toPlanName
                        ? `${entry.fromPlanName} → ${entry.toPlanName}`
                        : (entry.toPlanName ?? entry.fromPlanName)}
                    </span>
                  )}
                  {entry.note && <span className="ml-2 text-muted-foreground">{entry.note}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
          {history.length > PAGE && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
            >
              {expanded ? "Show less" : `Show all ${history.length} entries`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
