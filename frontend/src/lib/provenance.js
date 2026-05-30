// Derived views over a chain + its verification result, shared by the globe,
// the DAG, the KPIs, and the what-if panel.
import { countryName } from "./countries";

export const DESIGNATION = {
  product_of_canada: { label: "Product of Canada", tone: "verified" },
  made_in_canada: { label: "Made in Canada", tone: "canada" },
  none: { label: "Does not qualify", tone: "muted" },
};

export function designationMeta(d) {
  return DESIGNATION[d] || DESIGNATION.none;
}

export function nodeCost(a) {
  const c = a.costs || {};
  return (Number(c.material_cad) || 0) + (Number(c.labour_cost_cad) || 0);
}

export function shortId(id) {
  if (!id) return "";
  return id.length > 14 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id;
}

export function anomalyIds(result) {
  const m = {};
  for (const a of result?.anomalies || []) {
    (m[a.attestation_id] = m[a.attestation_id] || []).push(a);
  }
  return m;
}

// Aggregate cost by country, marking anomalous countries.
export function countrySummary(chain, result, excluded = new Set()) {
  const flagged = new Set((result?.anomalies || []).map((a) => a.attestation_id));
  const byCountry = {};
  let total = 0;
  let canadian = 0;
  for (const a of chain.attestations || []) {
    const code = a.performed_in_country || "??";
    const cost = nodeCost(a);
    const rec = (byCountry[code] = byCountry[code] || {
      code,
      name: countryName(code),
      cost: 0,
      nodes: 0,
      anomalies: 0,
      isCanada: code === "CA",
    });
    rec.cost += cost;
    rec.nodes += 1;
    if (flagged.has(a.attestation_id)) rec.anomalies += 1;
    if (!excluded.has(code)) {
      total += cost;
      if (code === "CA") canadian += cost;
    }
  }
  return { byCountry: Object.values(byCountry), total, canadian };
}

// Live what-if recompute when countries are excluded (client-side, fast).
export function recompute(chain, excluded) {
  const { total, canadian } = countrySummary(chain, null, excluded);
  const pct = total > 0 ? (canadian / total) * 100 : 0;
  let designation = "none";
  if (total > 0 && !excluded.has("CA")) {
    if (pct >= 98) designation = "product_of_canada";
    else if (pct >= 51) designation = "made_in_canada";
  }
  return { canadian_content_percentage: Math.round(pct * 100) / 100, designation };
}

// Arcs between consuming country and producing country (the flow of goods).
export function journeyArcs(chain, result) {
  const flagged = new Set((result?.anomalies || []).map((a) => a.attestation_id));
  const byId = {};
  for (const a of chain.attestations || []) byId[a.attestation_id] = a;
  const seen = new Set();
  const arcs = [];
  for (const a of chain.attestations || []) {
    for (const p of a.parents || []) {
      const parent = byId[p.attestation_id];
      if (!parent) continue;
      const from = parent.performed_in_country;
      const to = a.performed_in_country;
      if (!from || !to || from === to) continue;
      const key = `${from}->${to}`;
      const bad = flagged.has(a.attestation_id) || flagged.has(p.attestation_id);
      if (seen.has(key) && !bad) continue;
      seen.add(key);
      arcs.push({ from, to, bad });
    }
  }
  return arcs;
}
