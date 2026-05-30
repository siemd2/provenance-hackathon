"""Plain-English, grounded explanation of a detected anomaly.

Feeds the structured anomaly plus the cited attestation(s) to Claude and asks for
a procurement-officer-readable explanation. Falls back to a templated explanation
when ANTHROPIC_API_KEY is unset, so the demo works offline.
"""
from __future__ import annotations

import json
import os

_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-opus-4-8")

_TEMPLATES = {
    "signature_invalid": "This attestation's cryptographic signature does not verify against the public key registered to its supplier. The content was altered after signing, or the signature was forged — either way the record cannot be trusted as issued.",
    "parent_hash_mismatch": "This step references an upstream attestation by a content hash that no longer matches that upstream record. The parent was modified after this child committed to it — the chain has been tampered with.",
    "mass_balance_violation": "Downstream steps consume more of this part than the supplier ever attested producing. Quantity is being conjured from nothing — a sign of fabricated or double-counted inputs.",
    "origin_anomaly": "This supplier is recorded as producing in Canada, but it has never been seen sourcing from Canada in genuine chains. The Canadian-content claim looks laundered to inflate the designation.",
    "timestamp_inversion": "This step is timestamped before the upstream input it consumes — it claims to have used a part that did not yet exist. The chronology is impossible.",
    "circular_reference": "The provenance graph loops back on itself: a product cannot be an ancestor of its own input. The chain was fabricated.",
    "unit_mismatch": "This step consumes its parent in a different unit than the parent produced — the quantities don't refer to the same thing.",
    "dangling_parent": "This step references an upstream attestation that was not supplied — part of the provenance is missing and cannot be verified.",
    "cost_anomaly": "The implied labour rate here is far outside any plausible band — the cost figures appear fabricated.",
    "replay_within_chain": "The same attestation id appears more than once in this submission — a record is being replayed.",
    "signature_unknown_supplier": "This attestation claims a supplier that is not in the verified registry — its signature cannot be checked against any known key.",
    "transformation_implausible": "This is a manufacturing/integration step that consumes no inputs — you cannot transform nothing into something.",
    "anchor_mismatch": "This attestation's content differs from the immutable anchored record for the same id — it was rewritten after anchoring.",
    "replay_cross_chain": "This attestation is anchored to a different product than the one it was submitted under — it has been replayed across chains.",
    "labour_anomaly": "The labour hours on this step are far above what genuine chains show for this kind of work — the figures look padded.",
    "timing_anomaly": "This step's timestamp falls outside the regular production windows seen in genuine chains — an irregular, machine-generated time.",
}


def _fallback(anomaly: dict) -> str:
    base = _TEMPLATES.get(anomaly.get("type"), "This attestation was flagged as anomalous during verification.")
    details = anomaly.get("details")
    if details:
        return f"{base} (Detected: {details}.)"
    return base


def explain_anomaly(anomaly: dict, attestations: list[dict]) -> dict:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return {"explanation": _fallback(anomaly), "source": "template"}

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=key)
        cited = [a for a in attestations if a.get("attestation_id") == anomaly.get("attestation_id")]
        prompt = (
            "You are a supply-chain provenance verifier explaining a detected integrity "
            "anomaly to a Canadian defence procurement officer. Be concrete and brief "
            "(2-3 sentences). Name the specific attestation and what is wrong. Do not hedge.\n\n"
            f"Anomaly:\n{json.dumps(anomaly, indent=2)}\n\n"
            f"Cited attestation(s):\n{json.dumps(cited, indent=2)}"
        )
        msg = client.messages.create(
            model=_MODEL,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
        return {"explanation": text.strip() or _fallback(anomaly), "source": "claude"}
    except Exception:
        return {"explanation": _fallback(anomaly), "source": "template"}
