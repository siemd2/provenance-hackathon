import { Loader2 } from "lucide-react";
import { useVerification } from "../state/verification";
import { useIsMobile } from "../lib/useIsMobile";
import TopBar from "./TopBar";
import LeftRail from "./LeftRail";
import CenterCanvas from "./CenterCanvas";
import RightInspector from "./RightInspector";
import StatusTicker from "./StatusTicker";
import CommandPalette from "./CommandPalette";
import QrScan from "./QrScan";
import SupplierForm from "./SupplierForm";
import MobileConsole from "./MobileConsole";
import { api } from "../lib/api";

export default function Console() {
  const { surface, scenario, error } = useVerification();
  const isMobile = useIsMobile();

  if (error) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-md rounded-lg border border-anomaly/30 bg-anomaly/10 p-6 text-sm text-anomaly">
          Could not reach the verification backend on {api.base}. Start it with{" "}
          <code className="font-mono">docker compose up</code> (or uvicorn on port 8000).
        </div>
      </div>
    );
  }
  if (!scenario) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading provenance scenarios…
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileConsole />
      ) : (
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          <TopBar />
          <div className="flex min-h-0 flex-1">
            {surface === "supplier" ? (
              <SupplierForm />
            ) : (
              <>
                <LeftRail />
                <CenterCanvas />
                <RightInspector />
              </>
            )}
          </div>
          <StatusTicker />
        </div>
      )}
      <CommandPalette />
      <QrScan />
    </>
  );
}
