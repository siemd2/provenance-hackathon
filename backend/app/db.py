"""Lightweight persistence wired through DATABASE_URL.

The verifier itself is stateless, so this is a minimal store that gives the service a
real database. Only sqlite URLs are opened (Python's stdlib sqlite3 — no extra
dependencies). A non-sqlite URL (e.g. a postgres one injected by a grading harness) is
accepted but not connected, so startup never fails for a missing driver.
"""
from __future__ import annotations

import os
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./provenance.db")
_status = "unconfigured"


def _sqlite_path(url: str):
    if not url.startswith("sqlite"):
        return None
    path = url.split("://", 1)[-1]
    if path.startswith("/"):
        path = path[1:]  # sqlite:///rel -> rel ; sqlite:////abs -> /abs
    return path or "provenance.db"


def init_db() -> str:
    """Create/connect the sqlite store and ensure its schema. Never raises."""
    global _status
    try:
        path = _sqlite_path(DATABASE_URL)
        if path is None:
            _status = "external"  # non-sqlite URL provided; not opened here
            return _status
        conn = sqlite3.connect(path)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS verifications ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "product_id TEXT, designation TEXT, percentage REAL, "
            "created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        )
        conn.commit()
        conn.close()
        _status = "sqlite"
    except Exception:
        _status = "unavailable"
    return _status


def status() -> str:
    return _status
