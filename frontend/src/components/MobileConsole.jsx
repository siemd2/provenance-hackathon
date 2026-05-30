import { useEffect, useState } from "react";
import {
  ShieldCheck, ScanLine, CircleDot, Globe2, PanelRight, Sparkles, LayoutGrid, ChevronLeft,
} from "lucide-react";
import { useVerification } from "../state/verification";
import { useSelection } from "../state/selection";
import VerdictSlab from "./VerdictSlab";
import ViewSwitcher from "./ViewSwitcher";
import MapModeToggle from "./MapModeToggle";
import GlobeChoropleth from "./GlobeChoropleth";
import Map2D from "./Map2D";
import ChainGraph from "./ChainGraph";
import FindingsList from "./FindingsList";
import AssistantPanel from "./AssistantPanel";
import DecisionZone from "./DecisionZone";
import SupplierForm from "./SupplierForm";
import CaseCard from "./CaseCard";
import { SectionLabel } from "./primitives";
import InspectorEmpty from "./inspector/InspectorEmpty";
import InspectorCountry from "./inspector/InspectorCountry";
import InspectorNode from "./inspector/InspectorNode";
import InspectorAnomaly from "./inspector/InspectorAnomaly";

const openQr = () => window.dispatchEvent(new Event("open-qr"));

function Header({ right }) {
  const { health } = useVerification();
  const online = health && health.status === "ok";
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-popover px-3">
      <div className="flex h-6 w-6 items-center justify-center rounded bg-route/15">
        <ShieldCheck className="h-4 w-4 text-route" />
      </div>
      <span className="text-sm font-semibold tracking-tight">PROVENANCE</span>
      <CircleDot className={`h-3 w-3 ${online ? "text-verified" : "text-anomaly"}`} />
      <div className="ml-auto flex items-center gap-1">
        {right}
        <button onClick={openQr} aria-label="Scan a product QR" className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground">
          <ScanLine className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function CanvasBody() {
  const { view, mapMode } = useVerification();
  return (
    <div className="relative min-h-0 flex-1 bg-canvas">
      {view === "map" && <MapModeToggle />}
      {view === "map" && (mapMode === "3d" ? <GlobeChoropleth /> : <Map2D />)}
      {view === "chain" && <ChainGraph />}
      {view === "findings" && <FindingsList />}
    </div>
  );
}

function MobileInspector() {
  const { selection } = useSelection();
  return (
    <div className="flex h-full flex-col">
      <div className="scroll-region min-h-0 flex-1 overflow-y-auto">
        {!selection && <InspectorEmpty />}
        {selection?.kind === "country" && <InspectorCountry code={selection.id} />}
        {selection?.kind === "node" && <InspectorNode id={selection.id} />}
        {selection?.kind === "anomaly" && <InspectorAnomaly id={selection.id} type={selection.type} />}
      </div>
      <DecisionZone />
    </div>
  );
}

function LayerToggle({ on, onClick, children }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary">
      <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? "border-route bg-route/20" : "border-input"}`}>
        {on && <span className="h-1.5 w-1.5 rounded-[2px] bg-route" />}
      </span>
      <span className={on ? "text-foreground" : "text-muted-foreground"}>{children}</span>
    </button>
  );
}

function Browse({ onPickCase }) {
  const { scenarios, activeIndex, layers, toggleLayer, surface, setSurface } = useVerification();
  return (
    <div className="scroll-region h-full space-y-5 overflow-y-auto p-3">
      <div>
        <SectionLabel className="mb-2">Surface</SectionLabel>
        <div className="flex gap-2">
          {["verifier", "supplier"].map((s) => (
            <button
              key={s}
              onClick={() => setSurface(s)}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium ${surface === s ? "border-route bg-route/10 text-route" : "border-border text-muted-foreground"}`}
            >
              {s === "verifier" ? "Verifier" : "Issue Attestation"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel className="mb-2">Products</SectionLabel>
        <div className="space-y-1.5">
          {scenarios.map((s, i) => (
            <CaseCard key={s.id} s={s} active={i === activeIndex} onClick={() => onPickCase(i)} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel className="mb-2">Map layers</SectionLabel>
        <LayerToggle on={layers.choropleth} onClick={() => toggleLayer("choropleth")}>Choropleth shading</LayerToggle>
        <LayerToggle on={layers.arcs} onClick={() => toggleLayer("arcs")}>Journey arcs</LayerToggle>
        <LayerToggle on={layers.anomalyOnly} onClick={() => toggleLayer("anomalyOnly")}>Anomalies only</LayerToggle>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium ${active ? "text-route" : "text-muted-foreground"}`}>
      <Icon className="h-5 w-5" />
      {children}
    </button>
  );
}

export default function MobileConsole() {
  const { surface, setSurface, selectScenario } = useVerification();
  const { selection } = useSelection();
  const [tab, setTab] = useState("verify");

  // tapping an entity (country/node/finding) pulls up its details
  useEffect(() => {
    if (selection) setTab("details");
  }, [selection]);

  if (surface === "supplier") {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <Header
          right={
            <button onClick={() => setSurface("verifier")} className="flex h-9 items-center gap-1 rounded-md border border-input px-2 text-xs text-muted-foreground">
              <ChevronLeft className="h-4 w-4" /> Verifier
            </button>
          }
        />
        <SupplierForm />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {tab === "verify" && (
          <div className="flex h-full flex-col">
            <VerdictSlab />
            <ViewSwitcher />
            <CanvasBody />
          </div>
        )}
        {tab === "details" && <MobileInspector />}
        {tab === "assistant" && <AssistantPanel />}
        {tab === "browse" && (
          <Browse onPickCase={(i) => { selectScenario(i); setTab("verify"); }} />
        )}
      </div>
      <nav className="flex shrink-0 border-t border-border bg-popover">
        <NavBtn active={tab === "verify"} onClick={() => setTab("verify")} icon={Globe2}>Verify</NavBtn>
        <NavBtn active={tab === "details"} onClick={() => setTab("details")} icon={PanelRight}>Details</NavBtn>
        <NavBtn active={tab === "assistant"} onClick={() => setTab("assistant")} icon={Sparkles}>Assistant</NavBtn>
        <NavBtn active={tab === "browse"} onClick={() => setTab("browse")} icon={LayoutGrid}>Browse</NavBtn>
      </nav>
    </div>
  );
}
