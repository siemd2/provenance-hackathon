import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ScanLine, X, Box } from "lucide-react";
import { useVerification } from "../state/verification";

// A drone's printed QR encodes a deep-link URL to this app for that product, e.g.
//   http://<host>:5173/?product=tamper
// so scanning it with ANY phone QR reader opens the product's provenance. The
// in-app camera also accepts a raw "PROV:<id>" for convenience.
export const productLink = (id) => `${window.location.origin}/?product=${id}`;

function resolveProductId(decoded) {
  let id = String(decoded || "").trim();
  try {
    id = new URL(id).searchParams.get("product") || id;
  } catch {
    /* not a URL */
  }
  return id.replace(/^PROV:/, "").trim();
}

export default function QrScan() {
  const { scenarios, selectScenario, setSurface } = useVerification();
  const [open, setOpen] = useState(false);
  const [camState, setCamState] = useState("idle"); // idle | running | error
  const regionRef = useRef(null);
  const h5Ref = useRef(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-qr", onOpen);
    return () => window.removeEventListener("open-qr", onOpen);
  }, []);

  function stopCam() {
    if (h5Ref.current) {
      try { h5Ref.current.stop().catch(() => {}); } catch { /* ignore */ }
      h5Ref.current = null;
    }
  }

  function close() {
    stopCam();
    setCamState("idle");
    setOpen(false);
  }

  function loadByCode(code) {
    const id = resolveProductId(code);
    const i = scenarios.findIndex((s) => s.id === id);
    if (i >= 0) {
      selectScenario(i);
      setSurface("verifier");
      close();
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !regionRef.current) return;
        const h = new Html5Qrcode(regionRef.current.id);
        h5Ref.current = h;
        await h.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          (decoded) => loadByCode(decoded),
          () => {},
        );
        if (!cancelled) setCamState("running");
      } catch {
        if (!cancelled) setCamState("error");
      }
    })();
    return () => { cancelled = true; stopCam(); };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div className="w-[760px] max-w-full overflow-hidden rounded-xl border border-border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ScanLine className="h-4 w-4 text-route" /> Scan a product QR
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-2">
          <div>
            <div className="label-xs mb-2">Camera</div>
            <div id="qr-scanner-region" ref={regionRef} className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-secondary" />
            <div className="mt-2 text-xs text-muted-foreground">
              {camState === "running" && "Point a product QR at the camera."}
              {camState === "error" && "Camera unavailable — pick a sample label to scan."}
              {camState === "idle" && "Starting camera…"}
            </div>
          </div>

          <div>
            <div className="label-xs mb-2">Or pick a product label</div>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadByCode(s.id)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-route"
                >
                  <div className="rounded bg-white p-1.5">
                    <QRCodeSVG value={productLink(s.id)} size={84} level="M" />
                  </div>
                  <div className="flex w-full items-center justify-center gap-1 text-[11px] font-medium">
                    <Box className="h-3 w-3 shrink-0 text-route" />
                    <span className="truncate">{s.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
