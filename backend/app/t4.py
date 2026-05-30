"""Statistical (t4) anomaly detection.

These attestations break no hard rule but are distributional outliers vs genuine
chains (timing, origin, labour-hours, cost). Scored purely on flagging the right
attestation_id, so precision matters as much as recall — see tune_t4.py.

A profile of clean-chain distributions is learned offline (scripts/build_t4_profile.py
-> t4_profile.json) and loaded here. Until that profile exists this is a no-op.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from .compute import _num

_PROFILE_PATH = Path(
    os.environ.get("T4_PROFILE", str(Path(__file__).resolve().parent / "t4_profile.json"))
)

_PROFILE = None


def _load_profile():
    global _PROFILE
    if _PROFILE is None:
        if _PROFILE_PATH.exists():
            with open(_PROFILE_PATH) as f:
                _PROFILE = json.load(f)
        else:
            _PROFILE = {}
    return _PROFILE


def detect_statistical(attestations, by_id, registries):
    """Return a list of {type, attestation_id, details} for statistical outliers."""
    profile = _load_profile()
    if not profile:
        return []

    out = []
    seen = set()

    def add(t, aid, details=""):
        if aid not in seen:
            seen.add(aid)
            out.append({"type": t, "attestation_id": aid, "details": details})

    canonical_times = set(profile.get("canonical_times", []))
    labour_hours_max = profile.get("labour_hours_max", {})  # per action_type
    rate_band = profile.get("rate_band", {})                # global [lo, hi]
    supplier_countries = profile.get("supplier_countries", {})  # supplier_id -> [countries]

    for a in by_id.values():
        aid = a.get("attestation_id")
        costs = a.get("costs") or {}
        action = a.get("action_type")

        # timing outlier: time-of-day not seen in clean data
        ts = a.get("timestamp")
        if canonical_times and isinstance(ts, str) and "T" in ts:
            tod = ts.split("T", 1)[1].rstrip("Z")
            if tod not in canonical_times:
                add("timing_anomaly", aid, f"timestamp time-of-day {tod} is atypical")
                continue

        # labour-hours outlier for this action type
        lh = _num(costs.get("labour_hours"))
        cap = labour_hours_max.get(action)
        if cap is not None and lh > cap:
            add("labour_anomaly", aid, f"labour_hours {lh} above typical max {cap} for {action}")
            continue

        # origin outlier: a CA claim from a supplier never seen producing in CA
        # (the attack relabels foreign sourcing as Canadian to inflate content).
        sid = a.get("supplier_id")
        country = a.get("performed_in_country")
        known = supplier_countries.get(sid)
        if country == "CA" and known and "CA" not in known:
            add("origin_anomaly", aid, f"supplier {sid} not seen producing in CA")
            continue

    return out
