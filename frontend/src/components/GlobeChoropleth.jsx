import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { useVerification } from "../state/verification";
import { useSelection } from "../state/selection";
import { buildChoropleth } from "../lib/choropleth";
import { journeyArcs } from "../lib/provenance";
import { countryMeta } from "../lib/countries";

function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 700, h: 460 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

function featCode(feat) {
  const p = feat.properties || {};
  return p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
}

// light blue-grey ocean sphere (so the globe reads on the off-white theme)
const OCEAN =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR42mO4++QdHDEgcwAWuRV5nFMITgAAAABJRU5ErkJggg==";

const TT = (html) =>
  `<div style="background:#fff;border:1px solid rgba(15,23,42,0.12);border-radius:6px;padding:3px 7px;font:12px JetBrains Mono;color:#0f1b2e;box-shadow:0 2px 8px rgba(15,23,42,0.15)">${html}</div>`;

export default function GlobeChoropleth() {
  const { scenario, baseResult, excluded, layers } = useVerification();
  const { selection, select } = useSelection();
  const [ref, size] = useSize();
  const globeRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/countries.geojson")
      .then((r) => r.json())
      .then((g) => alive && setFeatures((g.features || []).filter((f) => f.properties.ISO_A3 !== "ATA")))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const choro = useMemo(() => buildChoropleth(scenario.chain, baseResult), [scenario, baseResult]);
  const arcs = useMemo(() => {
    if (!layers.arcs) return [];
    return journeyArcs(scenario.chain, baseResult)
      .filter((a) => !excluded.has(a.from) && !excluded.has(a.to)) // drop arcs touching an excluded country
      .map((a) => {
        const f = countryMeta(a.from), t = countryMeta(a.to);
        return { startLat: f.lat, startLng: f.lng, endLat: t.lat, endLng: t.lng, color: a.bad ? ["#dc2626", "#dc2626"] : ["#2563eb", "#22c55e"] };
      });
  }, [scenario, baseResult, layers.arcs, excluded]);

  const selCode = selection?.kind === "country" ? selection.id : null;

  // markers: anomaly + polygon-less contributors (HK/SG/EU)
  const points = useMemo(() => {
    return choro.markers
      .filter((m) => m.anomaly || ["HK", "SG", "EU"].includes(m.code))
      .map((m) => ({ ...m, color: m.anomaly ? "#dc2626" : m.isCanada ? "#2563eb" : "#8aa0bd" }));
  }, [choro]);

  useEffect(() => {
    if (globeRef.current) {
      const c = globeRef.current.controls();
      c.autoRotate = true;
      c.autoRotateSpeed = 0.3;
      globeRef.current.pointOfView({ lat: 30, lng: -50, altitude: 2.1 }, 0);
    }
  }, [features.length]);

  function capColor(feat) {
    if (!layers.choropleth) return "#cbd3df";
    const base = choro.capColor(feat, excluded);
    if (layers.anomalyOnly) {
      const stroke = choro.strokeColor(feat);
      return stroke === "#dc2626" ? base : "#d7dde6";
    }
    return base;
  }

  function isSel(feat) {
    const code = featCode(feat);
    return code === selCode || (code === "GB" && selCode === "UK");
  }

  return (
    <div ref={ref} className="relative h-full w-full">
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        showGlobe={true}
        showGraticules={true}
        globeImageUrl={OCEAN}
        atmosphereColor="#9ec1f0"
        atmosphereAltitude={0.14}
        polygonsData={features}
        polygonCapColor={capColor}
        polygonSideColor={() => "rgba(37,99,235,0.08)"}
        polygonStrokeColor={(f) => (isSel(f) ? "#1d4ed8" : choro.strokeColor(f))}
        polygonAltitude={(f) => (isSel(f) ? 0.07 : hovered === f ? 0.045 : 0.012)}
        polygonsTransitionDuration={220}
        onPolygonClick={(f) => {
          const code = featCode(f);
          const data = code === "GB" ? "UK" : code;
          select({ kind: "country", id: choro.byCode[data] ? data : code });
        }}
        onPolygonHover={setHovered}
        polygonLabel={(f) => {
          const code = featCode(f);
          const rec = choro.byCode[code] || (code === "GB" ? choro.byCode.UK : null);
          return rec ? TT(`${rec.name} — $${Math.round(rec.cost).toLocaleString()} CAD${rec.anomalies ? " ⚠" : ""}`) : "";
        }}
        arcsData={arcs}
        arcColor="color"
        arcStroke={0.5}
        arcAltitudeAutoScale={0.4}
        arcDashLength={0.5}
        arcDashGap={0.25}
        arcDashAnimateTime={2200}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={(p) => (p.anomaly ? 0.5 : 0.32)}
        pointLabel={(p) => TT(`${p.name}${p.anomaly ? " ⚠" : ""}`)}
        onPointClick={(p) => select({ kind: "country", id: p.code })}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-popover/80 px-2.5 py-1.5 text-[10px] text-muted-foreground backdrop-blur">
        Drag to rotate · click a country to inspect
      </div>
    </div>
  );
}
