// Thin client for the FastAPI verification backend.
// Default to the SAME host the app is served from (port 8000) so a phone that
// scans a product QR and opens the app over the LAN still reaches the backend.
const BASE =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

export const api = {
  base: BASE,
  health: () => get("/health"),
  demo: () => get("/demo"),
  suppliers: () => get("/suppliers"),
  verify: (chain) => post("/verify", chain),
  sign: (attestation) => post("/sign", attestation),
  explain: (anomaly, attestations) => post("/explain", { anomaly, attestations }),
  scale: (chain) => post("/scale", chain),
};
