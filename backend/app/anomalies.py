"""Integrity checks. Each emits a short snake_case `type` matching the corpus
labels (for the classification bonus) and flags the offending `attestation_id`
(what the anomaly F1 is scored on).

Detectors are independent and data-driven, which is what makes cascading attacks
work out: e.g. `tamper_no_resign` changes a node's content without re-signing, so
the node trips `signature_invalid` AND its child trips `parent_hash_mismatch`;
an injected back-edge trips `circular_reference` on the cycle plus
`timestamp_inversion` / `parent_hash_mismatch` on the nodes the edit touched.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime

import reference_lib

from .compute import TRANSFORMATION_ACTIONS, _num

try:
    import networkx as nx
except Exception:  # pragma: no cover
    nx = None

# Labour rate (CAD/hr) hard-implausibility band. Clean corpus rates are 40–142;
# the cost_anomaly attack injects ~1000/hr. Threshold leaves wide margin.
COST_RATE_MAX = 200.0


def _parse_ts(s):
    if not isinstance(s, str):
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def _safe_content_hash(att: dict):
    try:
        return reference_lib.content_hash(att)
    except Exception:
        return None


def detect_anomalies(attestations, by_id, leaf_id, supplier_keys, anchors_by_id):
    """Return a list of {type, attestation_id, details}, deduped by (type, id)."""
    out = []
    seen = set()

    def add(t, aid, details=""):
        key = (t, aid)
        if key not in seen:
            seen.add(key)
            out.append({"type": t, "attestation_id": aid, "details": details})

    # --- replay_within_chain: same attestation_id submitted more than once ---
    counts = defaultdict(int)
    for a in attestations:
        counts[a.get("attestation_id")] += 1
    for aid, c in counts.items():
        if aid is not None and c > 1:
            add("replay_within_chain", aid, "duplicate attestation_id in submission")

    # --- per-node checks (unique nodes) ---
    for a in by_id.values():
        aid = a.get("attestation_id")
        sid = a.get("supplier_id")

        # signature / supplier
        if sid not in supplier_keys:
            add("signature_unknown_supplier", aid, f"supplier {sid} not in registry")
        else:
            try:
                ok = reference_lib.verify_attestation(a, supplier_keys[sid])
            except Exception:
                ok = False
            if not ok:
                add("signature_invalid", aid, "signature does not verify vs claimed supplier key")

        # transformation that consumes nothing
        parents = a.get("parents") or []
        if a.get("action_type") in TRANSFORMATION_ACTIONS and len(parents) == 0:
            add("transformation_implausible", aid, f"{a.get('action_type')} consumes nothing")

        # implausible labour rate
        costs = a.get("costs") or {}
        lh = _num(costs.get("labour_hours"))
        lc = _num(costs.get("labour_cost_cad"))
        if lh > 0:
            rate = lc / lh
            if rate > COST_RATE_MAX:
                add("cost_anomaly", aid, f"labour rate {round(rate, 1)} CAD/hr outside band")

        # parent-link checks
        a_ts = _parse_ts(a.get("timestamp"))
        ts_flagged = False
        for p in parents:
            pid = p.get("attestation_id")
            parent = by_id.get(pid)
            if parent is None:
                add("dangling_parent", aid, f"parent {pid} not in submission")
                continue
            # unit mismatch
            p_unit = p.get("unit")
            parent_unit = (parent.get("output") or {}).get("unit")
            if p_unit != parent_unit:
                add("unit_mismatch", aid, f"consumes {p_unit} but parent outputs {parent_unit}")
            # parent content hash mismatch
            ch = _safe_content_hash(parent)
            if ch is not None and p.get("content_hash") != ch:
                add("parent_hash_mismatch", aid, f"content_hash mismatch for parent {pid}")
            # timestamp inversion (child before parent)
            if not ts_flagged:
                p_ts = _parse_ts(parent.get("timestamp"))
                if a_ts is not None and p_ts is not None and a_ts < p_ts:
                    add("timestamp_inversion", aid, "child timestamp precedes parent")
                    ts_flagged = True  # one inversion flag per child is enough

        # anchor registry (held-out only; 0 training hits)
        anc = anchors_by_id.get(aid)
        if anc:
            ch = _safe_content_hash(a)
            if ch is not None and ch != anc.get("content_hash"):
                add("anchor_mismatch", aid, "content differs from anchored record")
            elif anc.get("product_id") and anc.get("product_id") != leaf_id:
                add("replay_cross_chain", aid,
                    f"anchored to product {anc.get('product_id')}, submitted under {leaf_id}")

    # --- mass balance: per-node consumption budget, same-unit consumers only ---
    consumed = defaultdict(float)
    for a in by_id.values():
        for p in (a.get("parents") or []):
            pid = p.get("attestation_id")
            parent = by_id.get(pid)
            if parent is None:
                continue
            if p.get("unit") == (parent.get("output") or {}).get("unit"):
                consumed[pid] += _num(p.get("quantity_consumed"))
    for pid, total_consumed in consumed.items():
        produced = _num((by_id[pid].get("output") or {}).get("quantity_produced"))
        if total_consumed > produced + 1e-6:
            add("mass_balance_violation", pid,
                f"consumed {round(total_consumed, 3)} > produced {round(produced, 3)}")

    # --- circular references: every node in a non-trivial SCC (or self-loop) ---
    if nx is not None and by_id:
        g = nx.DiGraph()
        g.add_nodes_from(by_id.keys())
        for a in by_id.values():
            for p in (a.get("parents") or []):
                pid = p.get("attestation_id")
                if pid in by_id:
                    g.add_edge(a.get("attestation_id"), pid)  # child -> parent
        try:
            cycle_nodes = set()
            for comp in nx.strongly_connected_components(g):
                if len(comp) > 1:
                    cycle_nodes |= comp
            for aid in g.nodes():
                if g.has_edge(aid, aid):
                    cycle_nodes.add(aid)
            if cycle_nodes:
                # The corpus attributes circular_reference to the leaf (product);
                # the other cycle members surface via their own hash / timestamp
                # checks (the injected back-edge perturbs exactly those nodes).
                if leaf_id in cycle_nodes:
                    add("circular_reference", leaf_id, "cycle detected in parent references")
                else:
                    for aid in cycle_nodes:
                        add("circular_reference", aid, "cycle detected in parent references")
        except Exception:
            pass

    return out
