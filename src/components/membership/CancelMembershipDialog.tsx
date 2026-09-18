import { XCircle } from "lucide-react";
import { formatDate } from "@/lib/format";

export function CancelMembershipDialog({
  open,
  periodEnd,
  isMutating,
  onClose,
  onConfirm,
}: {
  open: boolean;
  periodEnd: string;
  isMutating: boolean;
  onClose: () => void;
  onConfirm: (immediate: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cancel membership"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-gold"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          <h3 className="font-display text-xl font-bold">Cancel membership</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Choose how you'd like to end your membership. Either way, you'll receive a confirmation
          and can rejoin any time.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onConfirm(false)}
            className="w-full rounded-xl border border-primary/40 bg-primary/5 p-4 text-left hover:bg-primary/10 disabled:opacity-50"
          >
            <div className="text-sm font-semibold text-primary">End at renewal (recommended)</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Keep your remaining washes and benefits until {formatDate(periodEnd)}. Auto-renew
              turns off; nothing more is charged.
            </div>
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onConfirm(true)}
            className="w-full rounded-xl border border-destructive/40 p-4 text-left hover:bg-destructive/5 disabled:opacity-50"
          >
            <div className="text-sm font-semibold text-destructive">End immediately</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Your membership stops now. Unused allowances for this cycle are forfeited.
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isMutating}
          className="mt-6 w-full rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Keep my membership
        </button>
      </div>
    </div>
  );
}
