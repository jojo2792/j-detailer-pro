import { Check } from "lucide-react";
import { formatTTD } from "@/lib/format";
import type { MembershipPlan } from "@/types/membership";

export function PlanCard({
  plan,
  isCurrent,
  isPending,
  actionLabel,
  disabled,
  onAction,
}: {
  plan: MembershipPlan;
  isCurrent?: boolean;
  isPending?: boolean;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        isCurrent
          ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-gold"
          : plan.isFeatured
            ? "border-primary/50 bg-card"
            : "border-border bg-card"
      }`}
    >
      {(isCurrent || plan.isFeatured) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
          {isCurrent ? "Your plan" : "Most popular"}
        </div>
      )}

      <div className="text-xs uppercase tracking-widest text-muted-foreground">{plan.name}</div>
      <div className="mt-2 flex items-baseline gap-1">
        {plan.requiresQuote ? (
          <span className="font-display text-4xl font-bold text-gradient-gold">Custom</span>
        ) : (
          <>
            <span className="font-display text-5xl font-bold text-gradient-gold">
              {formatTTD(plan.monthlyPriceCents)}
            </span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </>
        )}
      </div>
      {plan.tagline && <div className="mt-1 text-xs text-primary">{plan.tagline}</div>}

      <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-background/40 p-4 text-center">
        <div>
          <div className="font-display text-lg font-bold text-primary">{plan.monthlyWashLimit || "—"}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Washes / mo</div>
        </div>
        <div>
          <div className="font-display text-lg font-bold text-primary">{plan.monthlyInteriorLimit || "—"}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Interiors / mo</div>
        </div>
        <div>
          <div className="font-display text-lg font-bold text-primary">{plan.discountPercentage}%</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Off services</div>
        </div>
        <div>
          <div className="font-display text-lg font-bold text-primary">{plan.rewardMultiplier}×</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reward points</div>
        </div>
      </div>

      <div className="mt-6 space-y-3 text-sm">
        {plan.features.map((f) => (
          <div key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
          </div>
        ))}
      </div>

      {plan.limits.length > 0 && (
        <div className="mt-6 rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Plan limits
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {plan.limits.map((l) => (
              <li key={l}>• {l}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isCurrent
            ? "border border-border text-muted-foreground"
            : plan.isFeatured
              ? "bg-gradient-gold text-primary-foreground"
              : "border border-primary/40 text-primary hover:bg-primary/10"
        }`}
      >
        {isPending ? "Scheduled for renewal" : actionLabel}
      </button>
    </div>
  );
}