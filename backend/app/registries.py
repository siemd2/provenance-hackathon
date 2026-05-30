"""Load the public registries once at startup.

- `supplier_public_keys.json` : supplier_id -> Ed25519 public key (verifies signatures).
- `anchor_registry.json`      : genuine attestation_id -> {content_hash, product_id}.
  The signed, immutable ledger an attacker cannot forge. NOT exhaustive — absence
  is not a violation (see spec/anchor-registry.md).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_REGISTRY_DIR = Path(os.environ.get("REGISTRY_DIR", str(_REPO_ROOT / "registry")))


class Registries:
    def __init__(self, supplier_keys: dict, anchors_by_id: dict, authority_public_key=None):
        self.supplier_keys = supplier_keys
        self.anchors_by_id = anchors_by_id
        self.authority_public_key = authority_public_key

    @classmethod
    def load(cls, registry_dir: Path | None = None) -> "Registries":
        d = Path(registry_dir) if registry_dir else _REGISTRY_DIR
        with open(d / "supplier_public_keys.json") as f:
            spk = json.load(f)
        supplier_keys = spk.get("keys", spk)

        anchors_by_id: dict = {}
        authority = None
        anchor_path = d / "anchor_registry.json"
        if anchor_path.exists():
            with open(anchor_path) as f:
                ar = json.load(f)
            anchors_by_id = {a["attestation_id"]: a for a in ar.get("anchors", [])}
            authority = ar.get("authority_public_key")
        return cls(supplier_keys, anchors_by_id, authority)
