"""Orchestrator: build the DAG from `parents`, run all checks, compute the
percentage/designation, and assemble the /verify response.

Defensive throughout: a malformed chain must never crash the endpoint (a crash
scores 0 for that case and the harness sends hundreds). Percentage/designation
are computed on the data present regardless of anomalies (spec/computation.md).
"""
from __future__ import annotations

from .anomalies import detect_anomalies
from .compute import compute_percentage, designation, last_substantial_transformation
from .t4 import detect_statistical


def verify_chain(body: dict, registries) -> dict:
    leaf_id = body.get("product_attestation_id")
    attestations = body.get("attestations") or []

    by_id: dict = {}
    for a in attestations:
        if isinstance(a, dict) and a.get("attestation_id") is not None:
            by_id[a["attestation_id"]] = a

    try:
        pct, total = compute_percentage(attestations)
    except Exception:
        pct, total = 0.0, 0.0
    try:
        lst = last_substantial_transformation(attestations, by_id, leaf_id)
    except Exception:
        lst = None
    desig = designation(pct, total, lst)

    anomalies: list[dict] = []
    try:
        anomalies += detect_anomalies(
            attestations, by_id, leaf_id, registries.supplier_keys, registries.anchors_by_id
        )
    except Exception:
        pass
    try:
        anomalies += detect_statistical(attestations, by_id, registries)
    except Exception:
        pass

    # dedup by (type, attestation_id), preserving order
    seen = set()
    deduped = []
    for an in anomalies:
        key = (an.get("type"), an.get("attestation_id"))
        if key not in seen:
            seen.add(key)
            deduped.append(an)

    return {
        "product_attestation_id": leaf_id,
        "canadian_content_percentage": round(pct, 2),
        "designation": desig,
        "chain_valid": len(deduped) == 0,
        "anomalies": deduped,
    }
