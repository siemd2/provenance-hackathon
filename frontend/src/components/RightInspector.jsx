import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelRight, Sparkles } from "lucide-react";
import { useSelection } from "../state/selection";
import InspectorEmpty from "./inspector/InspectorEmpty";
import InspectorCountry from "./inspector/InspectorCountry";
import InspectorNode from "./inspector/InspectorNode";
import InspectorAnomaly from "./inspector/InspectorAnomaly";
import DecisionZone from "./DecisionZone";
import AssistantPanel from "./AssistantPanel";

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
        active ? "border-route text-route" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export default function RightInspector() {
  const { selection } = useSelection();
  const [tab, setTab] = useState("inspector");
  const key = selection ? `${selection.kind}:${selection.id}:${selection.type || ""}` : "empty";

  // selecting an entity pulls focus back to the inspector
  useEffect(() => {
    if (selection) setTab("inspector");
  }, [selection]);

  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex shrink-0 border-b border-border">
        <TabBtn active={tab === "inspector"} onClick={() => setTab("inspector")} icon={PanelRight}>
          Inspector
        </TabBtn>
        <TabBtn active={tab === "assistant"} onClick={() => setTab("assistant")} icon={Sparkles}>
          Assistant
        </TabBtn>
      </div>

      {tab === "inspector" ? (
        <>
          <div className="scroll-region min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14 }}
              >
                {!selection && <InspectorEmpty />}
                {selection?.kind === "country" && <InspectorCountry code={selection.id} />}
                {selection?.kind === "node" && <InspectorNode id={selection.id} />}
                {selection?.kind === "anomaly" && <InspectorAnomaly id={selection.id} type={selection.type} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <DecisionZone />
        </>
      ) : (
        <AssistantPanel />
      )}
    </aside>
  );
}
