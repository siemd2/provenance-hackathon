"""Provenance verification backend.

Ensures the repo root is importable so the official `reference_lib`
(byte-exact canonical serialization + Ed25519) can be used directly — it is the
source of truth for signatures and content hashes (see TECHNICAL_GUIDE.md §5).
"""
from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
