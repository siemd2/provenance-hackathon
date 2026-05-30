import { FileSignature, ShieldAlert, ArrowUp, ArrowDown } from "lucide-react";
import { useVerification } from "../../state/verification";
import { useSelection } from "../../state/selection";
import { anomalyIds, shortId } from "../../lib/provenance";
import { countryName } from "../../lib/countries";
import { SectionLabel, KV } from "../primitives";

export default function InspectorNode({ id }) {
  const { scenario, baseResult } = useVerification();
  const { select } = useSelection();
  const atts = scenario.chain.attestations || [];
  const a = atts.find((x) => x.attestation_id === id);
  if (!a) return null;

  const byId = {};
  atts.forEach((x) => (byId[x.attestation_id] = x));
  const nameFor = (aid) => byId[aid]?.output?.name || byId[aid]?.action_type || shortId(aid);

  const flagged = anomalyIds(baseResult);
  const myTypes = (flagged[id] || []).map((x) => x.type);
  const sigInvalid = myTypes.includes("signature_invalid") || myTypes.includes("signature_unknown_supplier");
  const children = atts.filter((x) => (x.parents || []).some((p) => p.attestation_id === id));

  return (
    <div className="p-4">
      <SectionLabel>Attestation</SectionLabel>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        <FileSignature className="h-4 w-4 text-route" />
        {a.output?.name || a.action_type}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <KV k="id" v={shortId(id)} mono />
        <KV k="supplier" v={a.supplier_id} mono />
        <KV k="country" v={countryName(a.performed_in_country)} />
        <KV k="action" v={a.action_type} mono />
        <KV k="material" v={`$${a.costs?.material_cad ?? 0}`} mono />
        <KV k="labour" v={`${a.costs?.labour_hours ?? 0}h · $${a.costs?.labour_cost_cad ?? 0}`} mono />
        <KV k="timestamp" v={a.timestamp} mono />
        <KV k="signature" v={sigInvalid ? "INVALID" : "ed25519 ✓"} tone={sigInvalid ? "anomaly" : "verified"} mono />
      </div>

      {myTypes.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-md border border-anomaly/40 bg-anomaly/10 p-2 text-xs font-medium text-anomaly">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          {myTypes.join(", ")}
        </div>
      )}

      <SectionLabel className="mb-1.5 mt-4">Search around</SectionLabel>
      <div className="space-y-1">
        {(a.parents || []).map((p) => (
          <button key={p.attestation_id} onClick={() => select({ kind: "node", id: p.attestation_id })} className="flex w-full items-center gap-2 rounded border border-border bg-background/40 px-2 py-1.5 text-left hover:bg-secondary">
            <ArrowUp className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs">{nameFor(p.attestation_id)}</span>
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">consumes</span>
          </button>
        ))}
        {children.map((c) => (
          <button key={c.attestation_id} onClick={() => select({ kind: "node", id: c.attestation_id })} className="flex w-full items-center gap-2 rounded border border-border bg-background/40 px-2 py-1.5 text-left hover:bg-secondary">
            <ArrowDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs">{nameFor(c.attestation_id)}</span>
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">used in</span>
          </button>
        ))}
        {(a.parents || []).length === 0 && children.length === 0 && (
          <div className="text-xs text-muted-foreground">No linked attestations.</div>
        )}
      </div>
    </div>
  );
}
