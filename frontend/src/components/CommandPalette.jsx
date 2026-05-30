import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Box, Zap, FileSignature, Globe2, Network, AlertTriangle } from "lucide-react";
import { useVerification } from "../state/verification";

export default function CommandPalette() {
  const { scenarios, selectScenario, setSurface, setView } = useVerification();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmdk", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-cmdk", onOpen); };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else setQ("");
  }, [open]);

  const items = useMemo(() => {
    const scen = scenarios.map((s, i) => ({
      group: "Products", icon: Box, label: s.title, hint: s.subtitle,
      run: () => { selectScenario(i); setSurface("verifier"); },
    }));
    const acts = [
      { group: "Actions", icon: Globe2, label: "View map", run: () => { setSurface("verifier"); setView("map"); } },
      { group: "Actions", icon: Network, label: "View chain graph", run: () => { setSurface("verifier"); setView("chain"); } },
      { group: "Actions", icon: AlertTriangle, label: "View findings", run: () => { setSurface("verifier"); setView("findings"); } },
      { group: "Actions", icon: FileSignature, label: "Issue an attestation", run: () => setSurface("supplier") },
      { group: "Actions", icon: Zap, label: "Run scale test (10k nodes)", run: () => window.dispatchEvent(new Event("run-scale")) },
    ];
    const all = [...scen, ...acts];
    if (!q) return all;
    const ql = q.toLowerCase();
    return all.filter((it) => `${it.label} ${it.hint || ""}`.toLowerCase().includes(ql));
  }, [scenarios, q, selectScenario, setSurface, setView]);

  if (!open) return null;
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="w-[560px] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products & actions…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <div className="scroll-region max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</div>}
          {groups.map((g) => (
            <div key={g} className="mb-1">
              <div className="label-xs px-2 py-1">{g}</div>
              {items.filter((i) => i.group === g).map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => { it.run(); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary"
                >
                  <it.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="shrink-0">{it.label}</span>
                  {it.hint && <span className="ml-auto truncate text-xs text-muted-foreground">{it.hint}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
