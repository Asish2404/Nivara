import { useRef, useEffect } from "react";
import { useKWIStore } from "../../store/useKWIStore";
import { X, Send, ArrowRight, AlertTriangle, Activity, Waves, Map } from "lucide-react";

const QUICK_PROMPTS = [
  { text: "Which areas are most at risk right now?",        Icon: AlertTriangle, color: "#ef4444", lightBg: "#fff5f5", border: "#fecaca", label: "Risk" },
  { text: "What is the status of PS-07 pump station?",     Icon: Activity,      color: "#8b5cf6", lightBg: "#faf5ff", border: "#ddd6fe", label: "Pump" },
  { text: "How will the 15:00 tide affect Bagjola canal?", Icon: Waves,         color: "#0ea5e9", lightBg: "#f0f9ff", border: "#bae6fd", label: "Tidal" },
  { text: "Show critical incidents in Borough VII",         Icon: Map,           color: "#f59e0b", lightBg: "#fffbeb", border: "#fde68a", label: "Map"  },
];

const KEYFRAMES = `
  @keyframes akSlide { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
  @keyframes akUp    { from { opacity:0; transform:translateY(8px)  } to { opacity:1; transform:translateY(0) } }
  @keyframes akPing  { 0%,100% { transform:scale(1); opacity:.8 } 50% { transform:scale(1.15); opacity:1 } }
  .ak-panel { animation: akSlide .26s cubic-bezier(.22,1,.36,1) both }
  .ak-up    { animation: akUp   .2s  cubic-bezier(.22,1,.36,1) both }
  @media (prefers-reduced-motion:reduce) { .ak-panel,.ak-up { animation:none !important } }
`;

export function AskKolkataDrawer() {
  const {
    askKolkataOpen, setAskKolkataOpen,
    copilotQuery, setCopilotQuery,
    chatMessages, sendCopilotMessage, navigate,
  } = useKWIStore();

  const msgsEndRef = useRef(null);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  if (!askKolkataOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    sendCopilotMessage(copilotQuery);
  };

  const canSend = copilotQuery.trim().length > 0;
  const hasConversation = chatMessages.some((m) => m.sender === "user" || m.sender === "bot");

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Ask Kolkata Query Utility">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={() => setAskKolkataOpen(false)} aria-hidden="true" />

        {/* ── Panel — WHITE background ── */}
        <div
          className="ak-panel relative z-10 flex flex-col w-full max-w-[400px] h-full bg-white overflow-hidden font-sans"
          style={{ borderLeft: "1px solid #e2e8f0", boxShadow: "-20px 0 60px rgba(15,23,42,0.10)" }}
        >

          {/* ══ HEADER ══ */}
          <div className="shrink-0 flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
            {/* NIVARA brand logo */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-white"
              style={{ border: "1.5px solid #e2e8f0", boxShadow: "0 2px 10px rgba(37,99,235,0.10)" }}
            >
              <img src="/textures/NIVARA_LOGO.png" alt="NIVARA" className="w-7 h-7 object-contain" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-slate-900 leading-none tracking-tight">Ask Kolkata</h2>
                <span
                  className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[9px] font-bold tracking-widest font-mono"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
                >
                  <span className="w-[5px] h-[5px] rounded-full bg-emerald-500" style={{ animation: "akPing 1.5s ease-in-out infinite" }} />
                  LIVE
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-[3px] leading-none truncate">
                Municipal drainage &amp; water intelligence
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setAskKolkataOpen(false)}
              aria-label="Close Ask Kolkata"
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ══ SCROLLABLE AREA ══ */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">

            {/* Welcome state */}
            {!hasConversation && (
              <div className="px-5 pt-6 pb-4">

                {/* System banner */}
                {chatMessages[0]?.sender === "system" && (
                  <div className="mb-5 px-4 py-2.5 rounded-xl" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                    <p className="text-[10.5px] font-mono leading-relaxed text-sky-600">
                      <span className="text-blue-500 font-bold">◉ </span>{chatMessages[0].text}
                    </p>
                  </div>
                )}

                {/* Hero */}
                <div className="text-center mb-7 ak-up">
                  {/* NIVARA logo as hero */}
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-white overflow-hidden"
                    style={{ border: "2px solid #e2e8f0", boxShadow: "0 8px 32px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <img src="/textures/NIVARA_LOGO.png" alt="NIVARA" className="w-11 h-11 object-contain" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1.5 tracking-tight">
                    Kolkata Water Intelligence
                  </h3>
                  <p className="text-[12px] text-slate-400 leading-relaxed max-w-[230px] mx-auto">
                    Ask about flood risk, pump stations, drainage canals, or live incidents across Kolkata.
                  </p>
                </div>

                {/* Colorful 2×2 prompt grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {QUICK_PROMPTS.map(({ text, Icon, color, lightBg, border, label }, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendCopilotMessage(text)}
                      className="ak-up group flex flex-col gap-2.5 text-left p-3.5 rounded-2xl cursor-pointer focus-visible:outline-none transition-all duration-150"
                      style={{
                        animationDelay: `${i * 0.06}s`,
                        background: lightBg,
                        border: `1.5px solid ${border}`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${color}18`, border: `1.5px solid ${color}30` }}
                        >
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-0.5" style={{ color: `${color}bb` }}>
                          {label}
                        </span>
                      </div>
                      <span className="text-[11.5px] font-semibold leading-snug text-slate-700 group-hover:text-slate-900 transition-colors">
                        {text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {hasConversation && (
              <div className="px-4 py-4 space-y-4">
                {chatMessages.map((msg, idx) => {
                  if (msg.sender === "system") {
                    return (
                      <p key={idx} className="text-[10px] text-center text-slate-300 font-mono px-2">{msg.text}</p>
                    );
                  }
                  const isUser = msg.sender === "user";
                  return (
                    <div key={idx} className={`ak-up flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex flex-col gap-1 max-w-[84%] ${isUser ? "items-end" : "items-start"}`}>
                        {/* Meta */}
                        <div className={`flex items-center gap-1.5 px-0.5 ${isUser ? "flex-row-reverse" : ""}`}>
                          {!isUser && (
                            <div className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              <img src="/textures/NIVARA_LOGO.png" alt="N" className="w-3 h-3 object-contain" />
                            </div>
                          )}
                          <span className="text-[10px] font-semibold text-slate-400">
                            {isUser ? "You" : "Ask Kolkata"}
                          </span>
                          <span className="text-[9px] font-mono text-slate-300">{msg.timestamp}</span>
                        </div>

                        {/* User bubble */}
                        {isUser && (
                          <div
                            className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-[12.5px] leading-relaxed text-white break-words"
                            style={{ background: "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}
                          >
                            {msg.text}
                          </div>
                        )}

                        {/* AI bubble */}
                        {!isUser && (
                          <div
                            className="rounded-2xl rounded-tl-sm overflow-hidden text-[12.5px] leading-relaxed"
                            style={{ background: "#ffffff", border: "1.5px solid #e8edf3", boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}
                          >
                            {/* Colorful top stripe */}
                            <div style={{ height: "2.5px", background: "linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #8b5cf6 100%)" }} />
                            <div className="px-4 py-3 text-slate-700">
                              <p className="break-words whitespace-pre-wrap">{msg.text}</p>

                              {/* Sector V card */}
                              {msg.sender !== "user" && msg.text.includes("Sector V") && (
                                <div className="mt-3.5 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                                  <p className="text-[9.5px] font-bold uppercase tracking-widest font-mono mb-3 text-slate-400">
                                    Sector V · Incident Data
                                  </p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3">
                                    <div>
                                      <p className="text-[9.5px] text-slate-400 mb-0.5">Risk level</p>
                                      <p className="text-[13px] font-bold text-rose-500">82 / 100</p>
                                    </div>
                                    <div>
                                      <p className="text-[9.5px] text-slate-400 mb-0.5">Rainfall</p>
                                      <p className="text-[13px] font-bold text-sky-600">74 mm / 3 hr</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[9.5px] text-slate-400 mb-0.5">Primary constraint</p>
                                      <p className="text-[12.5px] text-slate-600">Drainage capacity</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[9.5px] text-slate-400 mb-0.5">Recommended action</p>
                                      <p className="text-[12.5px] font-semibold text-blue-600">Inspect PS-07 and clear main trunk</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setAskKolkataOpen(false); navigate("/live-city"); }}
                                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                  >
                                    <span>View Area on Map</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef} />
              </div>
            )}
          </div>

          {/* ══ CHIPS (active conversation) ══ */}
          {hasConversation && (
            <div className="shrink-0 px-4 pt-2.5 pb-2" style={{ borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest font-mono mb-2 text-slate-300">Quick queries</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map(({ text, Icon, color, lightBg, border }, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendCopilotMessage(text)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10.5px] cursor-pointer whitespace-nowrap focus-visible:outline-none transition-all"
                    style={{ background: lightBg, border: `1px solid ${border}`, color: color }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = `0 4px 12px ${color}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <Icon className="w-2.5 h-2.5 shrink-0" style={{ color }} />
                    <span className="font-medium">{text.length > 25 ? text.slice(0, 25) + "…" : text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══ COMPOSER ══ */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 px-4 pt-3 pb-5 bg-white"
            style={{ borderTop: "1px solid #e8edf3" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 transition-all"
              style={{ border: "1.5px solid #e2e8f0" }}
              onFocusCapture={e => { e.currentTarget.style.border = "1.5px solid #93c5fd"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
              onBlurCapture={e => { e.currentTarget.style.border = "1.5px solid #e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask about water conditions, pumps, canals..."
                className="flex-1 bg-transparent text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!canSend}
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                style={{
                  background: canSend ? "linear-gradient(135deg,#2563eb,#0891b2)" : "#f1f5f9",
                  boxShadow: canSend ? "0 4px 14px rgba(37,99,235,0.30)" : "none",
                  cursor: canSend ? "pointer" : "not-allowed",
                }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: canSend ? "#fff" : "#94a3b8" }} />
              </button>
            </div>
            <p className="mt-2 text-center text-[9.5px] font-mono tracking-wide text-slate-300">
              KMC · 84 Pumping Stations · Hooghly Tidal Grid
            </p>
          </form>

        </div>
      </div>
    </>
  );
}

export default AskKolkataDrawer;
