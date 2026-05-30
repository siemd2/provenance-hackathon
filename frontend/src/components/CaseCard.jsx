import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function CaseCard({ s, active, onClick }) {
  const valid = s.result.chain_valid;
  const pct = s.result.canadian_content_percentage ?? 0;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors ${
        active ? "border-route bg-route/10" : "border-border bg-background/40 hover:bg-secondary"
      }`}
    >
      {valid ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verified" />
      ) : (
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-anomaly" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{s.title}</div>
        <div className="truncate text-[10px] text-muted-foreground">{s.subtitle}</div>
      </div>
      <div className="tabular shrink-0 font-mono text-xs text-route">{pct.toFixed(1)}%</div>
    </button>
  );
}
