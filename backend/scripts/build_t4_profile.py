"""Learn the clean-chain distribution and write t4_profile.json.

Run:  .venv/bin/python backend/scripts/build_t4_profile.py
Reads the labeled training corpus, uses ONLY attack=='clean' rows to model what
genuine chains look like, and writes the profile the t4 detector loads. Built
once, offline; not part of the request path.
"""
from __future__ import annotations

import collections
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CORPUS = REPO / "training_corpus.jsonl"
OUT = REPO / "backend" / "app" / "t4_profile.json"

# Held-out safety margin on per-action labour-hours caps (training clean may not
# contain the global max). Strictly-greater comparison + this margin avoids
# false positives on slightly-higher genuine nodes.
LABOUR_MARGIN = 1.0


def main():
    rows = [json.loads(l) for l in open(CORPUS)]

    times = set()
    labour_max = collections.defaultdict(float)
    supplier_countries = collections.defaultdict(set)

    clean = 0
    for r in rows:
        if r["labels"].get("attack", "clean") != "clean":
            continue
        clean += 1
        for a in r["chain"]["attestations"]:
            ts = a.get("timestamp", "")
            if "T" in ts:
                times.add(ts.split("T", 1)[1].rstrip("Z"))
            costs = a.get("costs") or {}
            action = a.get("action_type")
            lh = float(costs.get("labour_hours") or 0)
            if lh > labour_max[action]:
                labour_max[action] = lh
            sid = a.get("supplier_id")
            ctry = a.get("performed_in_country")
            if sid and ctry:
                supplier_countries[sid].add(ctry)

    profile = {
        "canonical_times": sorted(times),
        "labour_hours_max": {k: round(v + LABOUR_MARGIN, 2) for k, v in labour_max.items()},
        "supplier_countries": {k: sorted(v) for k, v in supplier_countries.items()},
        "_meta": {"clean_chains": clean, "total_rows": len(rows)},
    }
    OUT.write_text(json.dumps(profile, indent=2))
    print(f"wrote {OUT}")
    print("canonical_times:", profile["canonical_times"])
    print("labour_hours_max:", profile["labour_hours_max"])
    print("suppliers profiled:", len(profile["supplier_countries"]))


if __name__ == "__main__":
    main()
