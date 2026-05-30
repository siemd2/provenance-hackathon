import { cn } from "../lib/utils";

export function Panel({ className, title, icon: Icon, right, children }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {(title || right) && (
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="label-xs">{title}</span>
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

const TONES = {
  verified: "bg-verified/15 text-verified border-verified/30",
  anomaly: "bg-anomaly/15 text-anomaly border-anomaly/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  route: "bg-route/15 text-route border-route/40",
  canada: "bg-route/15 text-route border-route/40",
  muted: "bg-secondary text-muted-foreground border-border",
};

export function Badge({ tone = "muted", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONES[tone] || TONES.muted,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children, className }) {
  return <div className={cn("label-xs", className)}>{children}</div>;
}

export function KV({ k, v, mono = false, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <span className="shrink-0 text-xs text-muted-foreground">{k}</span>
      <span
        className={cn(
          "truncate text-right text-xs text-foreground/90",
          mono && "font-mono tabular",
          tone === "verified" && "text-verified",
          tone === "anomaly" && "text-anomaly",
        )}
      >
        {v}
      </span>
    </div>
  );
}
