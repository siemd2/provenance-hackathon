import { AnimatePresence, motion } from "framer-motion";
import { useVerification } from "../state/verification";
import VerdictSlab from "./VerdictSlab";
import ViewSwitcher from "./ViewSwitcher";
import MapModeToggle from "./MapModeToggle";
import GlobeChoropleth from "./GlobeChoropleth";
import Map2D from "./Map2D";
import ChainGraph from "./ChainGraph";
import FindingsList from "./FindingsList";

export default function CenterCanvas() {
  const { view, mapMode } = useVerification();
  const viewKey = view === "map" ? `map:${mapMode}` : view;

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-canvas">
      <VerdictSlab />
      <ViewSwitcher />
      <div className="relative min-h-0 flex-1">
        {view === "map" && <MapModeToggle />}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0"
          >
            {view === "map" && (mapMode === "3d" ? <GlobeChoropleth /> : <Map2D />)}
            {view === "chain" && <ChainGraph />}
            {view === "findings" && <FindingsList />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
