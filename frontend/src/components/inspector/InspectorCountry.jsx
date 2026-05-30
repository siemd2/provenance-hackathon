import { MapPin, ShieldAlert, Network } from "lucide-react";
import { useVerification } from "../../state/verification";
import { useSelection } from "../../state/selection";
import { nodeCost, anomalyIds } from "../../lib/provenance";
import { countryName } from "../../lib/countries";
import { SectionLabel, KV } from "../primitives";

export default function InspectorCountry({ code }) {
  const { scenario, baseResult, setView } = useVerification();
  const { select } = useSelection();
  const atts = (scenario.chain.attestations || []).filter((a) => a.performed_in_country === code);
  const flagged = anomalyIds(baseResult);
  const cost = atts.reduce((s, a) => s + nodeCost(a), 0);
  const isCA = code === "CA";

  return (
    <div className="p-4">
      <SectionLabel>Country</SectionLabel>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        <MapPin className="h-4 w-4 text-route" />
        {countryName(code)}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <KV k="contribution" v={`$${Math.round(cost).toLocaleString()} CAD`} mono />
        <KV k="steps here" v={atts.length} mono />
        <KV k="counts as Canadian" v={isCA ? "yes" : "no"} tone={isCA ? "verified" : undefined} />
      </div>

      <SectionLabel className="mb-1.5 mt-4">Steps in {code}</SectionLabel>
      <div className="space-y-1">
        {atts.map((a) => {
          const bad = !!flagged[a.attestation_id];
          return (
            <button
              key={a.attestation_id}
              onClick={() => { select({ kind: "node", id: a.attestation_id }); setView("chain"); }}
              className={`flex w-full items-center justify-between gap-2 rounded border px-2 py-1.5 text-left text-xs ${
                bad ? "border-anomaly/40 bg-anomaly/10" : "border-border bg-background/40 hover:bg-secondary"
              }`}
            >
              <span className="truncate">{a.output?.name || a.action_type}</span>
              {bad ? <ShieldAlert className="h-3 w-3 shrink-0 text-anomaly" /> : <span className="tabular shrink-0 text-muted-foreground">${Math.round(nodeCost(a))}</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setView("chain")}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-route/30 bg-route/10 px-2 py-1.5 text-xs font-medium text-route hover:bg-route/20"
      >
        <Network className="h-3.5 w-3.5" /> View these nodes in Chain
      </button>
    </div>
  );
}
