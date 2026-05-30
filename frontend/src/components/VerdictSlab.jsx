import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { useVerification } from "../state/verification";
import { designationMeta } from "../lib/provenance";

export default function VerdictSlab() {
  const { liveResult, baseResult, excluded } = useVerification();
  if (!liveResult || !baseResult) return null;

  const pct = liveResult.canadian_content_percentage ?? 0;
  const desig = designationMeta(liveResult.designation);
  const qualifies = liveResult.designation !== "none";
  const anomalies = baseResult.anomalies || [];
  const valid = anomalies.length === 0;
  const flipped = excluded.size > 0 && liveResult.designation !== baseResult.designation;

  const DesigIcon = qualifies ? ShieldCheck : ShieldX;

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-popover/50 px-4 py-3 lg:flex-row lg:items-stretch lg:gap-8 lg:px-6 lg:py-4">
      {/* designation */}
      <div className="flex flex-col justify-center lg:min-w-[230px]">
        <div className="label-xs mb-2">Designation</div>
        <div
          className={`flex items-center gap-2 text-lg font-semibold tracking-tight ${
            qualifies ? "text-route" : "text-muted-foreground"
          }`}
        >
          <DesigIcon className="h-5 w-5" />
          {desig.label}
        </div>
        {flipped && (
          <div className="mt-2 inline-flex w-fit items-center gap-1 rounded border border-warn/30 bg-warn/10 px-1.5 py-0.5 text-[10px] font-medium text-warn">
            <ShieldAlert className="h-3 w-3" />
            CHANGED FROM {designationMeta(baseResult.designation).label.toUpperCase()}
          </div>
        )}
      </div>

      {/* canadian content % */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="label-xs mb-1">Canadian content</div>
        <div className="flex items-end gap-1">
          <motion.span
            key={pct}
            initial={{ opacity: 0.4, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="tabular font-mono text-5xl font-semibold leading-none text-route lg:text-[56px]"
          >
            {pct.toFixed(1)}
          </motion.span>
          <span className="mb-1.5 text-2xl font-medium text-muted-foreground">%</span>
        </div>
        {/* threshold ruler */}
        <div className="relative mt-2.5 h-2 w-full max-w-sm rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-800 to-route"
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: "51%" }} />
          <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: "98%" }} />
        </div>
        <div className="mt-1 flex max-w-sm justify-between text-[10px] text-muted-foreground tabular">
          <span>0</span>
          <span className="ml-auto mr-[46%]">51 · made in CA</span>
          <span>98 · product</span>
        </div>
      </div>

      {/* trust */}
      <div className="flex flex-col justify-center lg:min-w-[180px]">
        <div className="label-xs mb-2">Integrity</div>
        <div
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
            valid
              ? "border-verified/30 bg-verified/10 text-verified"
              : "border-anomaly/40 bg-anomaly/10 text-anomaly"
          }`}
        >
          {valid ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          {valid ? "CHAIN VERIFIED" : `${anomalies.length} INTEGRITY FAILURE${anomalies.length > 1 ? "S" : ""}`}
        </div>
      </div>
    </div>
  );
}
