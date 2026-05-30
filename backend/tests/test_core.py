"""Core gates: the worked example must verify exactly, and the canonical/crypto
core must match the reference library's golden vectors.
"""
import json
from pathlib import Path

from backend.app.registries import Registries
from backend.app.verify import verify_chain

REPO = Path(__file__).resolve().parents[2]


def _load(name):
    with open(REPO / "worked-example" / name) as f:
        return json.load(f)


def test_worked_example_matches_expected():
    chain = _load("recovery_drone_chain.json")
    expected = _load("recovery_drone_expected.json")
    result = verify_chain(chain, Registries.load())

    assert result["product_attestation_id"] == expected["product_attestation_id"]
    assert abs(result["canadian_content_percentage"] - expected["canadian_content_percentage"]) <= 0.5
    assert result["designation"] == expected["designation"]
    assert result["chain_valid"] is True
    assert result["anomalies"] == []


def test_clean_chain_has_no_anomalies():
    chain = _load("recovery_drone_chain.json")
    result = verify_chain(chain, Registries.load())
    assert result["anomalies"] == [], result["anomalies"]


def test_tampered_content_trips_signature_and_hash():
    """Mutate a node's cost without re-signing: the node's signature fails and any
    child referencing it trips parent_hash_mismatch (the tamper_no_resign pattern)."""
    chain = _load("recovery_drone_chain.json")
    # att-anchor-0005 is a parent of the leaf att-anchor-0012
    for a in chain["attestations"]:
        if a["attestation_id"] == "att-anchor-0005":
            a["costs"]["labour_cost_cad"] = 99999.0  # tamper, no re-sign
    result = verify_chain(chain, Registries.load())
    types_by_id = {}
    for an in result["anomalies"]:
        types_by_id.setdefault(an["attestation_id"], set()).add(an["type"])
    assert "signature_invalid" in types_by_id.get("att-anchor-0005", set())
    assert "parent_hash_mismatch" in types_by_id.get("att-anchor-0012", set())
    assert result["chain_valid"] is False
