import { Globe2, Network, AlertTriangle } from "lucide-react";
import { useVerification } from "../state/verification";

export default function ViewSwitcher() {
  const { view, setView, baseResult, scenario } = useVerification();
  const nAnom = baseResult?.anomalies?.length || 0;
  const nAtt = scenario?.chain?.attestations?.length || 0;

  const items = [
    { key: "map", label: "Map", icon: Globe2 },
    { key: "chain", label: "Chain", icon: Network, badge: nAtt },
    { key: "findings", label: "Findings", icon: AlertTriangle, badge: nAnom, danger: nAnom > 0 },
  ];

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border bg-popover/30 px-4 py-1.5">
      {items.map((it) => {
        const active = view === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setView(it.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-route/15 text-route" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
            {it.badge != null && (
              <span
                className={`tabular rounded px-1 py-0.5 text-[10px] font-semibold ${
                  it.danger ? "bg-anomaly/20 text-anomaly" : active ? "bg-route/20 text-route" : "bg-secondary text-muted-foreground"
                }`}
              >
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
