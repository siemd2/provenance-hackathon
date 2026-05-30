// Mocked procurement-assistant logic. The opening briefing and the answers are
// generated from the REAL loaded scenarios so the demo feels live, but there is
// no model call — responses are deterministic. Each of the four cases in the UI
// has a hardcoded, case-specific deep-dive (CASE_BUILDERS) keyed by scenario id.
import { designationMeta } from "./provenance";

function summarize(scenarios) {
  const items = (scenarios || []).map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    attack: s.attack,
    valid: s.result.chain_valid,
    pct: s.result.canadian_content_percentage ?? 0,
    designation: s.result.designation,
    anomalies: s.result.anomalies || [],
  }));
  return { items, flagged: items.filter((i) => !i.valid), clean: items.filter((i) => i.valid) };
}

const pct = (s) => (s.result.canadian_content_percentage ?? 0).toFixed(1);

// Hardcoded per-case responses (interpolating the real % so the numbers stay accurate).
const CASE_BUILDERS = {
  clean: (s) =>
    `The **${s.title}** is the clean reference unit — **${designationMeta(s.result.designation).label} at ${pct(s)}%** Canadian content. The parachute recovery assembly and the final integration are both performed in Canada (clearing the 51% threshold and the substantial-transformation rule), while the ripstop fabric, suspension line, flight controller and GNSS module come from France, the US, Hong Kong and China.\n\nAll **12 attestations carry valid Ed25519 signatures**, every parent hash-link reconciles, mass balance holds, and nothing is replayed from another product.\n\n**No action needed — this unit can proceed to award.**`,

  tamper: (s) =>
    `This is the same drone with a supplier's cost **rewritten after signing**. The parachute assembly's labour was bumped to inflate the Canadian figure (now reading **${pct(s)}%**), but it was never re-signed. The verifier catches it two independent ways:\n\n• **signature_invalid** — the edited attestation's Ed25519 signature no longer validates against the supplier's key.\n• **parent_hash_mismatch** — the final drone integration still references the *old* content hash, so the hash-link breaks.\n\nTwo cryptographic checks fail on the same edit. **Recommend rejecting the submission and flagging the supplier — the record was altered after issuance.**`,

  origin: (s) =>
    `This is the subtle one. The **TBS flight controller is genuinely from Hong Kong**, but its attestation was relabelled as produced in **Canada**, pushing the figure to **${pct(s)}%**. Crucially, **every signature and hash-link is valid** — the chain is cryptographically perfect, so a naïve checker passes it.\n\nWe flag it **statistically (origin_anomaly)**: that supplier has never sourced from Canada in any genuine chain, so a sudden Canadian origin on a high-value foreign part is a laundering signal.\n\n**Recommend holding it and requesting the original country-of-origin documentation for the flight controller.**`,

  massbalance: (s) =>
    `Here the final integration claims to **consume 9 of the O-ring seal lot when the supplier only produced 4** — a **mass_balance_violation**. Signatures and hashes are valid, but you cannot consume more of a part than was ever made, so either the consumption figure is wrong or quantities are being padded.\n\nThe Canadian percentage is unaffected (**${pct(s)}%**), but the integrity check fails.\n\n**Recommend a data correction from the integrator before this is trusted** — most likely clerical, but it has to be reconciled.`,
};

function detectCase(t, scenarios, activeId) {
  const byKey = [
    ["tamper", /(tamper|rewrote|rewritten|re-?sign|altered|cost.*chang)/],
    ["origin", /(origin|launder|relabel|hong ?kong|flight controller|foreign part)/],
    ["massbalance", /(over-?consum|mass.?balance|o-?ring|consume|quantity|too many)/],
    ["clean", /(clean|verified|reference|genuine|the good one|passes)/],
  ];
  for (const [id, re] of byKey) if (re.test(t) && scenarios.some((s) => s.id === id)) return id;
  for (const s of scenarios) if (s.title && t.includes(s.title.toLowerCase())) return s.id;
  if (/(this|current|here|selected|that one|explain it|what happened|why is|why did)/.test(t) && activeId) return activeId;
  return null;
}

export function buildReport(scenarios) {
  const { items, flagged, clean } = summarize(scenarios);
  const lines = [
    `Welcome back. **${items.length} new drone submissions** since your last review — **${clean.length} verified clean, ${flagged.length} blocked** on integrity issues.`,
  ];
  for (const c of clean) {
    lines.push(`✓ **${c.title}** — ${designationMeta(c.designation).label}, ${c.pct.toFixed(1)}% Canadian, chain verified.`);
  }
  for (const f of flagged) {
    lines.push(`⚠ **${f.title}** — ${f.subtitle.toLowerCase()}.`);
  }
  if (flagged.length) {
    lines.push(`**Recommend holding the ${flagged.length} flagged unit${flagged.length > 1 ? "s" : ""}** pending supplier follow-up. Ask me about any product, or open one on the left to investigate.`);
  }
  return lines.join("\n\n");
}

export function respond(q, scenarios, activeId) {
  const { items, flagged, clean } = summarize(scenarios);
  const t = (q || "").toLowerCase();

  // 1) hardcoded, case-specific deep-dive
  const caseId = detectCase(t, scenarios, activeId);
  if (caseId) {
    const s = scenarios.find((x) => x.id === caseId);
    if (s && CASE_BUILDERS[caseId]) return CASE_BUILDERS[caseId](s);
  }

  // 2) batch-level answers
  if (/(flag|fail|problem|issue|risk|wrong|bad|block)/.test(t)) {
    return (
      `**${flagged.length} of ${items.length} products are flagged:**\n\n` +
      flagged.map((f) => `⚠ **${f.title}** — ${f.anomalies.map((a) => a.type).join(", ")}`).join("\n\n") +
      `\n\nAsk me about any one and I'll break it down.`
    );
  }
  if (/(recommend|prioriti|next|should|action|first|do)/.test(t)) {
    return `Priority order:\n\n1. **Tampered chain** first — a rewritten cost without re-signing is unambiguous tampering.\n2. **Origin laundering** — a foreign part relabelled Canadian, which inflates the content figure.\n3. **Over-consumption** — likely a data error, but it still breaks mass balance.\n\nThe verified clean unit can proceed to award.`;
  }
  if (/(canad|qualif|made in|designation|percent|content|%)/.test(t)) {
    const c = clean[0] || items[0];
    return `The **${c.title}** qualifies as **${designationMeta(c.designation).label}** at **${c.pct.toFixed(1)}%** Canadian content — ≥51% domestic cost plus the last substantial transformation in Canada, with a chain that verifies end-to-end.`;
  }
  if (/(how many|count|total|number|summary|overview)/.test(t)) {
    return `This batch has **${items.length} products**: ${clean.length} clean, ${flagged.length} flagged (signature tampering, origin laundering, and a mass-balance violation). Open any product on the left, or ask me about one by name.`;
  }
  return `Across this batch, **${clean.length} of ${items.length}** products verify clean and **${flagged.length}** are flagged. Ask me about a specific product — *the tampered chain*, *origin laundering*, *over-consumption*, or *the verified drone* — or click a product on the left to explore.`;
}
