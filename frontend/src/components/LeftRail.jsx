import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { useVerification } from "../state/verification";
import { useSelection } from "../state/selection";
import { countrySummary } from "../lib/provenance";
import { SectionLabel } from "./primitives";
import CaseCard from "./CaseCard";

function LayerToggle({ on, onClick, children }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-secondary">
      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${on ? "border-route bg-route/20" : "border-input"}`}>
        {on && <span className="h-1.5 w-1.5 rounded-[2px] bg-route" />}
      </span>
      <span className={on ? "text-foreground" : "text-muted-foreground"}>{children}</span>
    </button>
  );
}

export default function LeftRail() {
  const { scenarios, activeIndex, selectScenario, scenario, baseResult, layers, toggleLayer, excluded } = useVerification();
  const { selection, select } = useSelection();

  const countries = useMemo(() => {
    const { byCountry } = countrySummary(scenario.chain, baseResult);
    return [...byCountry].sort((a, b) => b.cost - a.cost);
  }, [scenario, baseResult]);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3">
        <SectionLabel className="mb-2">Cases</SectionLabel>
        <div className="space-y-1.5">
          {scenarios.map((s, i) => (
            <CaseCard key={s.id} s={s} active={i === activeIndex} onClick={() => selectScenario(i)} />
          ))}
        </div>
      </div>

      <div className="border-b border-border p-3">
        <SectionLabel className="mb-2">Map layers</SectionLabel>
        <div className="space-y-0.5">
          <LayerToggle on={layers.choropleth} onClick={() => toggleLayer("choropleth")}>Choropleth shading</LayerToggle>
          <LayerToggle on={layers.arcs} onClick={() => toggleLayer("arcs")}>Journey arcs</LayerToggle>
          <LayerToggle on={layers.anomalyOnly} onClick={() => toggleLayer("anomalyOnly")}>Anomalies only</LayerToggle>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <SectionLabel className="mb-2">Countries · contribution</SectionLabel>
        <div className="scroll-region -mr-1 space-y-0.5 overflow-y-auto pr-1">
          {countries.map((c) => {
            const sel = selection?.kind === "country" && selection.id === c.code;
            const excl = excluded.has(c.code);
            const swatch = c.anomalies ? "#dc2626" : c.isCanada ? "#2563eb" : "#46587a";
            return (
              <button
                key={c.code}
                onClick={() => select({ kind: "country", id: c.code })}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  sel ? "bg-route/15" : "hover:bg-secondary"
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: swatch, opacity: excl ? 0.3 : 1 }} />
                <span className={`flex-1 truncate ${excl ? "text-muted-foreground line-through" : ""}`}>{c.name}</span>
                {c.anomalies > 0 && <ShieldAlert className="h-3 w-3 shrink-0 text-anomaly" />}
                <span className="tabular shrink-0 text-muted-foreground">${Math.round(c.cost).toLocaleString()}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-sm" style={{ background: "linear-gradient(90deg,#1e3a8a,#60a5fa)" }} />Canadian
          </span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#46587a]" />Foreign</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-anomaly" />Flagged</span>
        </div>
      </div>
    </aside>
  );
}
