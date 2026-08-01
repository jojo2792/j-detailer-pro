import type { MembershipStatus } from "@/types/membership";

const styles: Record<MembershipStatus, string> = {
  active: "border-primary/40 bg-primary/10 text-primary",
  pending: "border-border bg-muted text-muted-foreground",
  paused: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
  expired: "border-border bg-muted text-muted-foreground",
};

const labels: Record<MembershipStatus, string> = {
  active: "Active",
  pending: "Pending",
  paused: "Paused",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}