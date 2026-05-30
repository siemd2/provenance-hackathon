import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath, geoGraticule10 } from "d3-geo";
import { useVerification } from "../state/verification";
import { useSelection } from "../state/selection";
import { buildChoropleth } from "../lib/choropleth";
import { journeyArcs } from "../lib/provenance";
import { countryMeta } from "../lib/countries";

function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 460 });
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

export default function Map2D() {
  const { scenario, baseResult, excluded, layers } = useVerification();
  const { selection, select } = useSelection();
  const [ref, size] = useSize();
  const [features, setFeatures] = useState([]);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/countries.geojson")
      .then((r) => r.json())
      .then((g) => alive && setFeatures((g.features || []).filter((f) => f.properties.ISO_A3 !== "ATA")))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const choro = useMemo(() => buildChoropleth(scenario.chain, baseResult), [scenario, baseResult]);

  const { path, projection } = useMemo(() => {
    const proj = geoMercator();
    if (features.length) proj.fitExtent([[10, 10], [size.w - 10, size.h - 10]], { type: "FeatureCollection", features });
    return { path: geoPath(proj), projection: proj };
  }, [features, size.w, size.h]);

  const selCode = selection?.kind === "country" ? selection.id : null;
  const isSel = (f) => { const c = featCode(f); return c === selCode || (c === "GB" && selCode === "UK"); };

  const markers = useMemo(() => {
    return choro.markers
      .filter((m) => m.anomaly || ["HK", "SG", "EU"].includes(m.code))
      .map((m) => { const p = projection([m.lng, m.lat]); return p ? { ...m, x: p[0], y: p[1] } : null; })
      .filter(Boolean);
  }, [choro, projection]);

  const arcs = useMemo(() => {
    if (!layers.arcs) return [];
    return journeyArcs(scenario.chain, baseResult)
      .filter((a) => !excluded.has(a.from) && !excluded.has(a.to)) // drop arcs touching an excluded country
      .map((a, i) => {
        const f = countryMeta(a.from), t = countryMeta(a.to);
        const p1 = projection([f.lng, f.lat]), p2 = projection([t.lng, t.lat]);
        if (!p1 || !p2) return null;
        const [x1, y1] = p1, [x2, y2] = p2;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - Math.max(40, len * 0.28); // bow upward, continuous
        return { id: i, d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, bad: a.bad };
      })
      .filter(Boolean);
  }, [scenario, baseResult, projection, layers.arcs, excluded]);

  const capColor = (f) => {
    if (!layers.choropleth) return "#cbd3df";
    const base = choro.capColor(f, excluded);
    if (layers.anomalyOnly) return choro.strokeColor(f) === "#dc2626" ? base : "#d7dde6";
    return base;
  };

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width={size.w} height={size.h} className="block">
        <path d={path({ type: "Sphere" })} fill="#dde4ee" stroke="rgba(15,23,42,0.12)" />
        <path d={path(geoGraticule10())} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth={0.5} />
        {features.map((f, i) => (
          <path
            key={i}
            d={path(f)}
            fill={capColor(f)}
            stroke={isSel(f) ? "#1d4ed8" : choro.strokeColor(f)}
            strokeWidth={isSel(f) ? 1.4 : 0.5}
            className="cursor-pointer transition-[fill] duration-200"
            onMouseEnter={() => setHover(featCode(f))}
            onMouseLeave={() => setHover(null)}
            onClick={() => {
              const code = featCode(f);
              const data = code === "GB" ? "UK" : code;
              select({ kind: "country", id: choro.byCode[data] ? data : code });
            }}
          />
        ))}
        {arcs.map((a) => (
          <path
            key={a.id}
            d={a.d}
            fill="none"
            stroke={a.bad ? "#dc2626" : "#2563eb"}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="6 6"
            className="arc-flow"
            opacity={0.95}
          />
        ))}
        {markers.map((m, i) => (
          <g key={i} className="cursor-pointer" onClick={() => select({ kind: "country", id: m.code })}>
            <circle cx={m.x} cy={m.y} r={m.anomaly ? 6 : 4} fill={m.anomaly ? "#dc2626" : m.isCanada ? "#2563eb" : "#64748b"} stroke="#fff" strokeWidth={1.2} />
            {m.anomaly && <circle cx={m.x} cy={m.y} r={6} fill="none" stroke="#dc2626" strokeWidth={1.5} className="pulse-anomaly" />}
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-popover/90 px-2.5 py-1.5 text-[10px] text-muted-foreground backdrop-blur">
        Mercator projection · click a country to inspect
      </div>
    </div>
  );
}
