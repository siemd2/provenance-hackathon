"""Curated demo scenarios for the purchaser dashboard, built from the worked
example. Each maps to a beat in the pitch:

  clean      -> verified, made_in_canada, 58.4%
  tamper     -> a supplier rewrote a cost without re-signing (signature_invalid
                + the child's parent_hash_mismatch) — the loud catch
  origin     -> a foreign flight controller relabelled as Canadian to inflate
                content; signatures + hashes are valid, caught statistically
  massbalance-> the leaf consumes more of a part than was ever produced
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

from .signing import load_private_keys, repair_chain

_REPO_ROOT = Path(__file__).resolve().parents[2]


def _worked() -> dict:
    with open(_REPO_ROOT / "worked-example" / "recovery_drone_chain.json") as f:
        return json.load(f)


def _find(chain: dict, aid: str) -> dict | None:
    for a in chain["attestations"]:
        if a["attestation_id"] == aid:
            return a
    return None


def build_demo_scenarios() -> list[dict]:
    priv = load_private_keys()
    scenarios = []

    # 1. clean
    scenarios.append({
        "id": "clean",
        "title": "Verified Canadian drone",
        "subtitle": "Recovery-Capable ISR Drone — genuine chain",
        "attack": None,
        "chain": _worked(),
    })

    # 2. tamper_no_resign: rewrite a parent's labour cost, do NOT re-sign
    tamper = _worked()
    node = _find(tamper, "att-anchor-0005")  # parachute assembly, parent of leaf
    node["costs"]["labour_cost_cad"] = 900.0  # inflate Canadian labour (rate stays plausible)
    scenarios.append({
        "id": "tamper",
        "title": "Tampered chain",
        "subtitle": "A supplier rewrote a cost without re-signing",
        "attack": "tamper_no_resign",
        "chain": tamper,
    })

    # 3. origin laundering: relabel the HK flight controller as Canadian, repair
    #    crypto so only the statistical origin flag remains
    origin = _worked()
    fc = _find(origin, "att-anchor-0007")  # TBS flight controller, HK
    fc["performed_in_country"] = "CA"
    origin = repair_chain(origin, priv)
    scenarios.append({
        "id": "origin",
        "title": "Origin laundering",
        "subtitle": "A foreign flight controller relabelled as Canadian",
        "attack": "t4_origin_outlier",
        "chain": origin,
    })

    # 4. mass-balance: leaf over-consumes the O-ring lot (produced 4)
    mb = _worked()
    leaf = _find(mb, "att-anchor-0012")
    for p in leaf["parents"]:
        if p["attestation_id"] == "att-anchor-0009":
            p["quantity_consumed"] = 9  # > produced 4
    mb = repair_chain(mb, priv)
    scenarios.append({
        "id": "massbalance",
        "title": "Over-consumption",
        "subtitle": "More of a part consumed than was ever produced",
        "attack": "mass_balance",
        "chain": mb,
    })

    return scenarios


_CACHE = None


def demo_scenarios() -> list[dict]:
    global _CACHE
    if _CACHE is None:
        _CACHE = build_demo_scenarios()
    return copy.deepcopy(_CACHE)
