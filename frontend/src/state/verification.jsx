import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { recompute } from "../lib/provenance";

// Active scenario + what-if + view/surface — the single verification source of truth.
const Ctx = createContext(null);

export function VerificationProvider({ children }) {
  const [scenarios, setScenarios] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState("map"); // map | chain | findings
  const [mapMode, setMapMode] = useState("3d"); // 3d globe | 2d mercator
  const [surface, setSurface] = useState("verifier"); // verifier | supplier
  const [excluded, setExcluded] = useState(() => new Set());
  const [layers, setLayers] = useState({ choropleth: true, arcs: true, anomalyOnly: false });
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(false);

  const toggleLayer = (key) => setLayers((p) => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ status: "down" }));
    api
      .demo()
      .then((d) => {
        setScenarios(d.scenarios);
        // deep link from a scanned product QR: ?product=<id>
        try {
          const want = new URLSearchParams(window.location.search).get("product");
          if (want) {
            const i = d.scenarios.findIndex((s) => s.id === want);
            if (i >= 0) {
              setActiveIndex(i);
              setSurface("verifier");
            }
          }
        } catch {
          /* ignore */
        }
      })
      .catch(() => setError(true));
  }, []);

  const scenario = scenarios[activeIndex] || null;
  const baseResult = scenario?.result || null;

  const liveResult = useMemo(() => {
    if (!scenario) return null;
    if (excluded.size === 0) return baseResult;
    return { ...baseResult, ...recompute(scenario.chain, excluded) };
  }, [scenario, baseResult, excluded]);

  function selectScenario(i) {
    setActiveIndex(i);
    setExcluded(new Set());
    setView("map");
  }
  function toggleCountry(code) {
    setExcluded((prev) => {
      const n = new Set(prev);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  }

  const value = {
    scenarios, scenario, baseResult, liveResult, activeIndex,
    selectScenario, view, setView, mapMode, setMapMode, surface, setSurface,
    excluded, setExcluded, toggleCountry, layers, toggleLayer, health, error,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useVerification = () => useContext(Ctx);
