import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useVerification } from "../state/verification";
import { buildReport, respond } from "../lib/assistant";

const DELAY = 550; // demo thinking delay

function renderMd(text) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
      ) : (
        <span key={j}>{p}</span>
      ),
    );
    return <p key={i}>{parts}</p>;
  });
}

export default function AssistantPanel() {
  const { scenarios, scenario } = useVerification();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inited = useRef(false);
  const scrollRef = useRef(null);

  const chips = [
    scenario && `Explain "${scenario.title}"`,
    "Which products are flagged?",
    "What should I prioritise?",
  ].filter(Boolean);

  useEffect(() => {
    // No cleanup on purpose: the inited ref guard makes this run once, and clearing
    // the timer in StrictMode's double-invoke would strand it on "Analysing…".
    if (inited.current || !scenarios.length) return;
    inited.current = true;
    setBusy(true);
    setTimeout(() => {
      setMessages([{ role: "assistant", content: buildReport(scenarios) }]);
      setBusy(false);
    }, DELAY);
  }, [scenarios]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function ask(q) {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setBusy(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: respond(question, scenarios, scenario?.id) }]);
      setBusy(false);
    }, DELAY);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-route" />
        <span className="label-xs">Provenance Assistant</span>
        <span className="ml-auto text-[10px] text-muted-foreground">powered by Claude</span>
      </div>

      <div ref={scrollRef} className="scroll-region min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <div
              className={`max-w-[92%] space-y-1 rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === "user" ? "bg-route text-white" : "border border-border bg-card text-foreground/90"
              }`}
            >
              {m.role === "assistant" ? renderMd(m.content) : m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {messages.length ? "Thinking…" : "Analysing the latest submissions…"}
          </div>
        )}
      </div>

      <div className="border-t border-border p-2.5">
        {messages.length <= 1 && !busy && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {chips.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-route hover:text-route"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask about this batch…"
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-route"
          />
          <button
            onClick={() => ask()}
            disabled={busy || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-route text-white transition-opacity disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
