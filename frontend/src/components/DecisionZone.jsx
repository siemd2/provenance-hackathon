import { useMemo } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useVerification } from "../state/verification";
import { countrySummary } from "../lib/provenance";
import { SectionLabel } from "./primitives";

export default function DecisionZone() {
  const { scenario, baseResult, excluded, toggleCountry, setExcluded } = useVerification();
  const countries = useMemo(() => {
    const { byCountry } = countrySummary(scenario.chain, baseResult);
    return [...byCountry].sort((a, b) => b.cost - a.cost);
  }, [scenario, baseResult]);

  return (
    <div className="shrink-0 border-t border-border bg-popover/50 p-3">
      <div className="flex items-center justify-between">
        <SectionLabel className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3 w-3" /> Decision · what-if sourcing
        </SectionLabel>
        {excluded.size > 0 && (
          <button onClick={() => setExcluded(new Set())} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-route">
            <RotateCcw className="h-3 w-3" /> reset
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {countries.map((c) => {
          const off = excluded.has(c.code);
          return (
            <button
              key={c.code}
              onClick={() => toggleCountry(c.code)}
              title={`${c.name} · $${Math.round(c.cost).toLocaleString()}`}
              className={`flex items-center justify-between gap-1 rounded border px-1.5 py-1 text-[11px] transition-colors ${
                off
                  ? "border-border bg-background/40 text-muted-foreground line-through"
                  : c.isCanada
                    ? "border-route/40 bg-route/10"
                    : "border-border bg-secondary/50"
              }`}
            >
              <span className="font-mono">{c.code}</span>
              <span className="tabular text-[10px] text-muted-foreground">${Math.round(c.cost)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">Exclude a country — the verdict recomputes live.</p>
    </div>
  );
}
