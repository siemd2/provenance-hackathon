import { AlertTriangle, ShieldCheck, Crosshair } from "lucide-react";
import { useVerification } from "../state/verification";
import { useSelection } from "../state/selection";
import { shortId } from "../lib/provenance";

function CleanState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-verified/30 bg-verified/10">
        <ShieldCheck className="h-8 w-8 text-verified" />
      </div>
      <div className="text-sm font-medium text-verified">Verified end-to-end</div>
      <div className="max-w-xs text-xs leading-relaxed text-muted-foreground">
        Every attestation's signature, hash-link, mass balance and provenance checks out. No tampering,
        forgery, or replay detected.
      </div>
    </div>
  );
}

export default function FindingsList() {
  const { baseResult, setView } = useVerification();
  const { selection, select } = useSelection();
  const anomalies = baseResult?.anomalies || [];

  if (!anomalies.length) return <CleanState />;

  return (
    <div className="scroll-region h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-2">
        {anomalies.map((a, i) => {
          const sel = selection?.kind === "anomaly" && selection.id === a.attestation_id && selection.type === a.type;
          return (
            <div
              key={`${a.type}-${a.attestation_id}-${i}`}
              onClick={() => select({ kind: "anomaly", id: a.attestation_id, type: a.type })}
              className={`cursor-pointer rounded-lg border p-3 transition ${
                sel ? "border-anomaly/60 bg-anomaly/10" : "border-border bg-card hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-anomaly/30 bg-anomaly/15 px-2 py-0.5 text-xs font-medium text-anomaly">
                  <AlertTriangle className="h-3 w-3" />
                  {a.type}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); select({ kind: "node", id: a.attestation_id }); setView("chain"); }}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-route"
                >
                  <Crosshair className="h-3 w-3" /> locate in chain
                </button>
              </div>
              <div className="tabular mt-1.5 font-mono text-[11px] text-muted-foreground">{shortId(a.attestation_id)}</div>
              {a.details && <div className="mt-1 text-xs text-foreground/80">{a.details}</div>}
              <div className="mt-1.5 text-[11px] text-route">Select to explain in inspector →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
