// Build the country -> color mapping for the globe choropleth.
// Canadian content shades on a BLUE ramp (deepest = Canada); foreign contribution
// shades on a SLATE ramp by cost magnitude; anomaly countries get a red stroke +
// a shield marker (never a red fill). Joined on ISO_A2_EH (Natural Earth's ISO_A2
// is -99 for France et al.), with UK->GB and HK->CN aliases.
import { countrySummary } from "./provenance";
import { countryMeta } from "./countries";

// tuned for the light map surface (deep = more)
const BLUE = ["#93c5fd", "#3b82f6", "#2563eb", "#1d4ed8"];
const SLATE = ["#aab6c8", "#8492a8", "#647189", "#4a566e"];
const DIM = "#cbd3df"; // land with no contribution
const EXCLUDED = "#d7dde6";

function ramp(stops, t) {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  return stops[Math.min(stops.length - 1, Math.round(x))];
}

function featureCode(feat) {
  const p = feat.properties || {};
  return p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
}

// data code that a GeoJSON polygon should pull its value from
function dataCodeFor(geoCode, byCode) {
  if (byCode[geoCode]) return geoCode;
  if (geoCode === "GB" && byCode.UK) return "UK";
  if (geoCode === "CN" && byCode.HK) return "CN_with_HK"; // handled below
  return null;
}

export function buildChoropleth(chain, result) {
  const { byCountry } = countrySummary(chain, result);
  const byCode = {};
  let maxCost = 1;
  for (const c of byCountry) {
    byCode[c.code] = c;
    maxCost = Math.max(maxCost, c.cost);
  }

  function capColor(feat, excluded) {
    const geo = featureCode(feat);
    let rec = byCode[geo] || (geo === "GB" ? byCode.UK : null);
    // China polygon also carries HK contribution (HK has no polygon at 110m)
    if (geo === "CN" && byCode.HK) rec = rec ? { ...rec, cost: rec.cost + byCode.HK.cost, anomalies: rec.anomalies + byCode.HK.anomalies, isCanada: rec.isCanada } : byCode.HK;
    if (!rec) return DIM;
    if (excluded && excluded.has(rec.code)) return EXCLUDED;
    const t = Math.sqrt(rec.cost / maxCost);
    return rec.isCanada ? ramp(BLUE, 0.45 + 0.55 * t) : ramp(SLATE, 0.25 + 0.75 * t);
  }

  function strokeColor(feat) {
    const geo = featureCode(feat);
    const rec = byCode[geo] || (geo === "GB" ? byCode.UK : null) || (geo === "CN" ? byCode.HK : null);
    if (rec && rec.anomalies > 0) return "#dc2626";
    return "rgba(15,23,42,0.18)";
  }

  // markers: every contributing country (esp. polygon-less HK/SG/EU) + anomalies
  const markers = byCountry.map((c) => {
    const m = countryMeta(c.code);
    return {
      lat: m.lat, lng: m.lng, code: c.code, name: c.name,
      cost: c.cost, anomaly: c.anomalies > 0, isCanada: c.isCanada,
    };
  });

  return { capColor, strokeColor, markers, byCode };
}
