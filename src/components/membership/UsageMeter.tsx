export function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const included = limit > 0;
  const remaining = Math.max(limit - used, 0);
  const pct = included ? Math.min((used / limit) * 100, 100) : 0;
  const exhausted = included && remaining === 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-display text-sm font-bold">
          {included ? (
            <>
              <span className={exhausted ? "text-destructive" : "text-primary"}>{remaining}</span>
              <span className="text-muted-foreground"> of {limit} left</span>
            </>
          ) : (
            <span className="text-muted-foreground">Not included</span>
          )}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            exhausted ? "bg-destructive" : "bg-gradient-gold"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">
        {included ? (
          <>
            <span className="font-semibold text-foreground">{used}</span> used this cycle ·{" "}
            <span className="font-semibold text-foreground">{limit}</span> monthly allowance
          </>
        ) : (
          "Available as a paid add-on with your member discount"
        )}
      </div>
    </div>
  );
}
