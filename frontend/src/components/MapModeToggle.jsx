import { Globe2, Map } from "lucide-react";
import { useVerification } from "../state/verification";

export default function MapModeToggle() {
  const { mapMode, setMapMode } = useVerification();
  const opt = (key, Icon, label) => (
    <button
      onClick={() => setMapMode(key)}
      className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
        mapMode === key ? "bg-route/15 text-route" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-md border border-border bg-popover/90 p-0.5 shadow-sm backdrop-blur">
      {opt("3d", Globe2, "3D")}
      {opt("2d", Map, "2D")}
    </div>
  );
}
