"""Issue/repair signatures with the shipped supplier private keys.

Key theft is out of scope for the challenge (all private keys ship in the kit),
so the supplier UI and the demo-scenario generator can mint genuinely-signed
attestations. All signing goes through reference_lib so bytes match exactly.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import reference_lib

_REPO_ROOT = Path(__file__).resolve().parents[2]
_PRIV_PATH = Path(
    os.environ.get("PRIVATE_KEYS", str(_REPO_ROOT / "private_keys" / "supplier_private_keys.json"))
)


def load_private_keys() -> dict:
    if not _PRIV_PATH.exists():
        return {}
    with open(_PRIV_PATH) as f:
        d = json.load(f)
    return d.get("keys", d)


def sign(attestation: dict, private_key_b64: str) -> dict:
    return reference_lib.sign_attestation(attestation, private_key_b64)


def content_hash(attestation: dict) -> str:
    return reference_lib.content_hash(attestation)


def _topo_order(by_id: dict) -> list[str]:
    """Attestation ids with every parent before its children (DFS post-order)."""
    order: list[str] = []
    visited: set[str] = set()

    def dfs(nid: str):
        if nid in visited or nid not in by_id:
            return
        visited.add(nid)
        for p in (by_id[nid].get("parents") or []):
            dfs(p.get("attestation_id"))
        order.append(nid)

    for nid in list(by_id.keys()):
        dfs(nid)
    return order


def repair_chain(chain: dict, private_keys: dict) -> dict:
    """Recompute parent content-hashes bottom-up and re-sign every node, yielding a
    cryptographically-consistent chain. Used to build demo scenarios whose ONLY
    anomaly is semantic/statistical (origin laundering, over-consumption) rather
    than a broken signature."""
    atts = chain.get("attestations") or []
    by_id = {a["attestation_id"]: a for a in atts if a.get("attestation_id")}
    for nid in _topo_order(by_id):
        a = by_id[nid]
        for p in (a.get("parents") or []):
            parent = by_id.get(p.get("attestation_id"))
            if parent is not None:
                p["content_hash"] = content_hash(parent)
        sid = a.get("supplier_id")
        if sid in private_keys:
            a["signature"] = sign(a, private_keys[sid])["signature"]
    return chain
