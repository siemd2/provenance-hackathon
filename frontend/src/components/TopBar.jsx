import { ShieldCheck, Search, CircleDot, Globe2, FileSignature, ScanLine } from "lucide-react";
import { useVerification } from "../state/verification";

function openPalette() {
  window.dispatchEvent(new Event("open-cmdk"));
}
function openQr() {
  window.dispatchEvent(new Event("open-qr"));
}

function SurfaceBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? "bg-route/15 text-route" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export default function TopBar() {
  const { surface, setSurface, health } = useVerification();
  const online = health && health.status === "ok";

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-popover px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-route/15">
          <ShieldCheck className="h-4 w-4 text-route" />
        </div>
        <div className="leading-none">
          <div className="text-sm font-semibold tracking-tight">PROVENANCE</div>
          <div className="label-xs mt-1">Verification Console</div>
        </div>
      </div>

      <button
        onClick={openPalette}
        className="group flex h-9 w-[340px] items-center gap-2 rounded-md border border-input bg-background/60 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-route/50"
      >
        <Search className="h-4 w-4" />
        Look up a drone…
        <kbd className="ml-auto rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <button
        onClick={openQr}
        title="Scan a product QR"
        className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-background/60 px-2.5 text-sm text-muted-foreground transition-colors hover:border-route/50 hover:text-foreground"
      >
        <ScanLine className="h-4 w-4" /> Scan
      </button>

      <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background/60 p-0.5">
        <SurfaceBtn active={surface === "verifier"} onClick={() => setSurface("verifier")} icon={Globe2}>
          Verifier
        </SurfaceBtn>
        <SurfaceBtn active={surface === "supplier"} onClick={() => setSurface("supplier")} icon={FileSignature}>
          Issue Attestation
        </SurfaceBtn>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <CircleDot className={`h-3.5 w-3.5 ${online ? "text-verified" : "text-anomaly"}`} />
        <span className="tabular text-muted-foreground">
          {online ? (
            <>live · {health.suppliers} sup · {health.anchors.toLocaleString()} anch</>
          ) : (
            "offline"
          )}
        </span>
      </div>
    </header>
  );
}
