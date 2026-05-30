import { useState } from "react";
import { AlertTriangle, Sparkles, Loader2, Crosshair } from "lucide-react";
import { useVerification } from "../../state/verification";
import { useSelection } from "../../state/selection";
import { shortId } from "../../lib/provenance";
import { api } from "../../lib/api";
import { SectionLabel, KV } from "../primitives";

export default function InspectorAnomaly({ id, type }) {
  const { scenario, baseResult, setView } = useVerification();
  const { select } = useSelection();
  const a = (baseResult?.anomalies || []).find((x) => x.attestation_id === id && x.type === type);
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(false);

  async function explain() {
    setLoading(true);
    try {
      const r = await api.explain(a, scenario.chain.attestations || []);
      setExp(r);
    } catch {
      setExp({ explanation: "Explanation unavailable.", source: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!a) return null;

  return (
    <div className="p-4">
      <SectionLabel>Finding</SectionLabel>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-anomaly">
        <AlertTriangle className="h-4 w-4" />
        {a.type}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <KV k="attestation" v={shortId(a.attestation_id)} mono />
      </div>
      {a.details && <div className="mt-2 text-xs text-foreground/80">{a.details}</div>}

      <button
        onClick={() => { select({ kind: "node", id: a.attestation_id }); setView("chain"); }}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1.5 text-xs hover:bg-secondary"
      >
        <Crosshair className="h-3.5 w-3.5" /> Locate in chain
      </button>

      {exp ? (
        <div className="mt-3 rounded-md border border-route/25 bg-route/5 p-2.5 text-xs leading-relaxed">
          <div className="label-xs mb-1 flex items-center gap-1 text-route">
            <Sparkles className="h-3 w-3" />
            {exp.source === "claude" ? "Claude explanation" : "Explanation"}
          </div>
          {exp.explanation}
        </div>
      ) : (
        <button
          onClick={explain}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-route/30 bg-route/10 px-2 py-1.5 text-xs font-medium text-route hover:bg-route/20 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Explain this finding
        </button>
      )}
    </div>
  );
}
