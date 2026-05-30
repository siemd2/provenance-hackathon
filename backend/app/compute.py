"""Canadian-content percentage + designation (spec/computation.md, LOCKED).

Percentage is a FLAT sum (no recursive weighting), attributed by each
attestation's `performed_in_country`. `labour_hours` is NOT a cost. Designation
turns on the *last substantial transformation* — the qualifying node closest to
the leaf — being in Canada.
"""
from __future__ import annotations

from collections import deque

TRANSFORMATION_ACTIONS = {"component_manufacture", "subassembly", "final_integration"}
SUBSTANTIAL_MIN_HOURS = 4.0


def _num(x) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def node_cost(att: dict) -> float:
    costs = att.get("costs") or {}
    return _num(costs.get("material_cad")) + _num(costs.get("labour_cost_cad"))


def compute_percentage(attestations: list[dict]) -> tuple[float, float]:
    """Return (percentage, total_cost). Iterates the submission as given."""
    total = 0.0
    canadian = 0.0
    for a in attestations:
        c = node_cost(a)
        total += c
        if a.get("performed_in_country") == "CA":
            canadian += c
    pct = (canadian / total * 100.0) if total > 0 else 0.0
    return pct, total


def qualifies_substantial(att: dict) -> bool:
    costs = att.get("costs") or {}
    return (
        att.get("action_type") in TRANSFORMATION_ACTIONS
        and _num(costs.get("labour_hours")) >= SUBSTANTIAL_MIN_HOURS
    )


def last_substantial_transformation(attestations: list[dict], by_id: dict, leaf_id: str):
    """The qualifying node with the fewest hops from the leaf (latest in production).

    BFS by hop-distance from the leaf, following `parents`. Robust to cycles
    (visited set) and to a missing leaf (returns None).
    """
    if leaf_id not in by_id:
        return None
    dist = {leaf_id: 0}
    dq = deque([leaf_id])
    while dq:
        n = dq.popleft()
        for p in (by_id[n].get("parents") or []):
            pid = p.get("attestation_id")
            if pid in by_id and pid not in dist:
                dist[pid] = dist[n] + 1
                dq.append(pid)
    best = None
    best_d = None
    for a in attestations:
        aid = a.get("attestation_id")
        if aid in dist and qualifies_substantial(a):
            d = dist[aid]
            if best_d is None or d < best_d:
                best_d = d
                best = a
    return best


def designation(pct: float, total: float, lst: dict | None) -> str:
    if total <= 0 or lst is None:
        return "none"
    if lst.get("performed_in_country") != "CA":
        return "none"
    if pct >= 98:
        return "product_of_canada"
    if pct >= 51:
        return "made_in_canada"
    return "none"
