import { useMemo } from "react";
import ReactFlow, { Background, Controls, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { useVerification } from "../state/verification";
import { useSelection } from "../state/selection";
import { anomalyIds } from "../lib/provenance";
import { countryName } from "../lib/countries";

const TX = new Set(["component_manufacture", "subassembly", "final_integration"]);

function StepNode({ data }) {
  return (
    <div
      onClick={data.onClick}
      className={`min-w-[152px] cursor-pointer rounded-md border px-2.5 py-1.5 shadow-sm transition ${
        data.anomaly
          ? "border-anomaly bg-anomaly/15 pulse-anomaly"
          : data.isCanada
            ? "border-route/50 bg-route/10"
            : "border-border bg-card"
      } ${data.selected ? "ring-2 ring-route" : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex items-center gap-1.5">
        {data.lst && (
          <span title="last substantial transformation" className="rounded bg-route/30 px-1 py-0.5 font-mono text-[8px] font-semibold text-route">
            LST
          </span>
        )}
        <div className="truncate text-[11px] font-semibold">{data.name}</div>
      </div>
      <div className="tabular mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{data.country}</span>
        <span>${Math.round(data.cost).toLocaleString()}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />
    </div>
  );
}
const nodeTypes = { step: StepNode };

export default function ChainGraph() {
  const { scenario, baseResult } = useVerification();
  const { selection, select } = useSelection();
  const chain = scenario.chain;
  const selId = selection?.kind === "node" ? selection.id : null;

  const { nodes, edges } = useMemo(() => {
    const atts = chain.attestations || [];
    const byId = {};
    atts.forEach((a) => (byId[a.attestation_id] = a));
    const leaf = chain.product_attestation_id;
    const flagged = anomalyIds(baseResult);

    const dist = { [leaf]: 0 };
    const q = [leaf];
    while (q.length) {
      const n = q.shift();
      for (const p of byId[n]?.parents || []) {
        const pid = p.attestation_id;
        if (byId[pid] && !(pid in dist)) {
          dist[pid] = dist[n] + 1;
          q.push(pid);
        }
      }
    }
    let lstId = null, lstD = Infinity;
    for (const a of atts) {
      const aid = a.attestation_id;
      if (aid in dist && TX.has(a.action_type) && (a.costs?.labour_hours || 0) >= 4 && dist[aid] < lstD) {
        lstD = dist[aid];
        lstId = aid;
      }
    }
    const maxD = Math.max(0, ...Object.values(dist));
    const rowByCol = {};
    const nodes = atts.map((a) => {
      const d = dist[a.attestation_id] ?? maxD + 1;
      const col = maxD - d;
      rowByCol[col] = (rowByCol[col] || 0) + 1;
      const cost = (a.costs?.material_cad || 0) + (a.costs?.labour_cost_cad || 0);
      return {
        id: a.attestation_id,
        type: "step",
        position: { x: col * 212, y: (rowByCol[col] - 1) * 82 },
        data: {
          name: a.output?.name || a.action_type,
          country: countryName(a.performed_in_country),
          cost,
          isCanada: a.performed_in_country === "CA",
          anomaly: !!flagged[a.attestation_id],
          lst: a.attestation_id === lstId,
          selected: selId === a.attestation_id,
          onClick: () => select({ kind: "node", id: a.attestation_id }),
        },
      };
    });
    const edges = [];
    atts.forEach((a) =>
      (a.parents || []).forEach((p) => {
        if (!byId[p.attestation_id]) return;
        const bad = flagged[a.attestation_id] || flagged[p.attestation_id];
        edges.push({
          id: `${p.attestation_id}-${a.attestation_id}`,
          source: p.attestation_id,
          target: a.attestation_id,
          animated: !!bad,
          style: { stroke: bad ? "#dc2626" : "#94a3b8", strokeWidth: bad ? 2 : 1.2 },
        });
      }),
    );
    return { nodes, edges };
  }, [chain, baseResult, selId, select]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.15}
      >
        <Background color="#c8d2e0" gap={20} />
        <Controls showInteractive={false} className="!border-border !bg-card" />
      </ReactFlow>
    </div>
  );
}
