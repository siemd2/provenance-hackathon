"""FastAPI entrypoint. Serves POST /verify on port 8000 (Docker-composed).

/verify reads the raw JSON body (no Pydantic coercion) so attestation dicts are
byte-identical to what was signed — essential for content-hash / signature checks.
"""
from __future__ import annotations

import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .demo import demo_scenarios
from .explain import explain_anomaly
from .registries import Registries
from .signing import content_hash, load_private_keys, sign
from .verify import verify_chain

app = FastAPI(
    title="Provenance Verifier — Buy Canadian",
    description="Verifies cryptographically signed supply-chain attestation chains.",
    version="1.0.0",
)

# Frontend (supplier + purchaser UIs) calls this from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

REGISTRIES = Registries.load()
PRIVATE_KEYS = load_private_keys()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "suppliers": len(REGISTRIES.supplier_keys),
        "anchors": len(REGISTRIES.anchors_by_id),
    }


@app.post("/verify")
async def verify(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid JSON body"})
    if not isinstance(body, dict):
        body = {}
    return verify_chain(body, REGISTRIES)


@app.get("/demo")
def demo() -> dict:
    """Curated scenarios for the purchaser dashboard, each with its verification."""
    out = []
    for sc in demo_scenarios():
        result = verify_chain(sc["chain"], REGISTRIES)
        out.append({**sc, "result": result})
    return {"scenarios": out}


@app.get("/suppliers")
def suppliers() -> dict:
    """Supplier ids the supplier UI can issue attestations as (those we can sign for)."""
    ids = sorted(set(REGISTRIES.supplier_keys) & set(PRIVATE_KEYS))
    return {"suppliers": ids}


@app.post("/sign")
async def sign_attestation(request: Request):
    """Build a signed attestation from supplier form data (mock auth)."""
    try:
        att = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid JSON body"})
    sid = att.get("supplier_id")
    if sid not in PRIVATE_KEYS:
        return JSONResponse(status_code=400, content={"error": f"no signing key for {sid}"})
    att.pop("signature", None)
    signed = sign(att, PRIVATE_KEYS[sid])
    return {"attestation": signed, "content_hash": content_hash(signed)}


@app.post("/explain")
async def explain(request: Request):
    """Grounded plain-English explanation of one anomaly."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid JSON body"})
    anomaly = body.get("anomaly") or {}
    attestations = body.get("attestations") or []
    return explain_anomaly(anomaly, attestations)


@app.post("/scale")
async def scale(request: Request):
    """Performance demo: verify a chain and report wall-clock + node count."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid JSON body"})
    if not isinstance(body, dict):
        body = {}
    t0 = time.perf_counter()
    result = verify_chain(body, REGISTRIES)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return {
        "node_count": len(body.get("attestations") or []),
        "elapsed_ms": round(elapsed_ms, 2),
        "result": result,
    }
