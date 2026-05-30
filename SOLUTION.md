# Provenance — Buy-Canadian Verification Layer

Cryptographic provenance for "Buy Canadian" defence procurement. Every supplier
contribution is an Ed25519-signed attestation; attestations hash-link across tiers
into a tamper-evident chain that can be independently verified, scored for Canadian
content, and checked for forgery, tampering, replay, and statistical anomalies.

> Today, Canadian-content claims rest on supplier self-attestation — a SACC clause,
> "evidence available on request," that nobody checks. The Auditor General (Dec 2024)
> found 10 of 60 defence procurements failed the rule, unnoticed for years. This is the
> evidence-based layer that catches it at submission instead.

## Run everything

```bash
# 1) Docker (the graded backend serves /verify on :8000)
docker compose up --build
#   backend  -> http://localhost:8000
#   frontend -> http://localhost:8080
```

Optional: `cp .env.example .env` and add an `ANTHROPIC_API_KEY` for Claude-written
anomaly explanations (otherwise the UI uses built-in template explanations).

### Run locally without Docker

```bash
# backend
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn backend.app.main:app --port 8000

# frontend (new terminal)
npm --prefix frontend install
npm --prefix frontend run dev      # http://localhost:5173
```

## Grade the backend

```bash
.venv/bin/python self_test.py http://localhost:8000/verify
# overall: 97.5%  (1000 cases)  — clean 100%, all hard-anomaly families 100%
```

## What's here

| Path | What |
|---|---|
| `backend/app/verify.py` | orchestrator: build DAG from `parents`, run checks, compute, respond |
| `backend/app/compute.py` | Canadian-content % (flat sum) + designation (last substantial transformation) |
| `backend/app/anomalies.py` | signature, hash-link, mass-balance, cycle, replay, timestamp, unit, anchor checks |
| `backend/app/t4.py` + `t4_profile.json` | statistical (t4) outlier detection — timing / origin / labour |
| `backend/app/demo.py` | curated purchaser scenarios (clean, tamper, origin laundering, over-consumption) |
| `backend/app/{signing,explain}.py` | `/sign` for the supplier UI, grounded `/explain` (Claude + fallback) |
| `frontend/` | React + Vite dashboard: 3D globe, supply-chain DAG, what-if, anomaly panel |
| `reference_lib/` | official byte-exact canonical serialization + Ed25519 (the verifier's source of truth) |

## Backend approach

- **Correctness:** all canonical serialization / signing / hashing go through the official
  `reference_lib`, validated against its golden vectors — so signatures and `content_hash`
  match the grader byte-for-byte. The worked example verifies to 58.4% / `made_in_canada`.
- **Anomalies** are independent, data-driven detectors emitting the corpus's `type` labels.
  Cascading attacks fall out naturally (a `tamper_no_resign` trips `signature_invalid` on the
  edited node and `parent_hash_mismatch` on its child).
- **t4 statistical** detection learns the clean-chain distribution
  (`backend/scripts/build_t4_profile.py`) and flags only extreme outliers, keeping clean-chain
  precision at 100% (the grader's F1 punishes over-flagging as hard as misses).

## API

`POST /verify` — `{product_attestation_id, attestations[]}` → `{canadian_content_percentage,
designation, chain_valid, anomalies[]}`. Also: `/demo`, `/sign`, `/explain`, `/scale`,
`/suppliers`, `/health`.
