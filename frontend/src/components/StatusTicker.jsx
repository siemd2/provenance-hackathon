import { useEffect, useMemo, useState } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { useVerification } from "../state/verification";
import { countrySummary } from "../lib/provenance";
import { api } from "../lib/api";

function genChain(n) {
  const attestations = [];
  const raws = [];
  for (let i = 0; i < n - 1; i++) {
    const id = `att-scale-${i}`;
    raws.push(id);
    attestations.push({
      attestation_id: id, version: "1.0", supplier_id: "sup-0001",
      timestamp: "2026-03-01T09:00:00Z", action_type: "raw_material_supply",
      performed_in_country: i % 2 ? "CA" : "US", parents: [],
      output: { name: `Part ${i}`, quantity_produced: 1, unit: "units" },
      costs: { material_cad: 10, labour_hours: 0, labour_cost_cad: 0 },
      signature: { algorithm: "ed25519", value: "AA==" },
    });
  }
  const leaf = "att-scale-leaf";
  attestations.push({
    attestation_id: leaf, version: "1.0", supplier_id: "sup-0001",
    timestamp: "2026-04-01T14:30:00Z", action_type: "final_integration",
    performed_in_country: "CA",
    parents: raws.map((r) => ({ attestation_id: r, content_hash: "0".repeat(64), quantity_consumed: 1, unit: "units" })),
    output: { name: "Assembled", quantity_produced: 1, unit: "units" },
    costs: { material_cad: 0, labour_hours: 5, labour_cost_cad: 400 },
    signature: { algorithm: "ed25519", value: "AA==" },
  });
  return { product_attestation_id: leaf, attestations };
}

export default function StatusTicker() {
  const { scenario, baseResult, surface } = useVerification();
  const [scale, setScale] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runScale() {
    setLoading(true);
    try {
      const r = await api.scale(genChain(10000));
      setScale(r);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const h = () => runScale();
    window.addEventListener("run-scale", h);
    return () => window.removeEventListener("run-scale", h);
  }, []);

  const stats = useMemo(() => {
    if (surface !== "verifier" || !scenario) return null;
    const { byCountry } = countrySummary(scenario.chain, baseResult);
    return { atts: scenario.chain.attestations.length, countries: byCountry.length };
  }, [scenario, baseResult, surface]);

  return (
    <footer className="tabular flex h-9 shrink-0 items-center gap-4 border-t border-border bg-popover px-4 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-verified" /> SYSTEM NOMINAL
      </span>
      {stats && (
        <>
          <span>· {stats.atts} attestations</span>
          <span>· {stats.countries} countries</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-3">
        {scale && (
          <span className="text-verified">
            verified {scale.node_count.toLocaleString()} nodes in {scale.elapsed_ms} ms
          </span>
        )}
        <button
          onClick={runScale}
          disabled={loading}
          className="flex items-center gap-1.5 rounded border border-border px-2 py-0.5 transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gauge className="h-3 w-3" />}
          Verify at scale (10k)
        </button>
      </div>
    </footer>
  );
}
