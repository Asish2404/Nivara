import { useKWIStore } from "../../store/useKWIStore";
import { X, Send, ArrowRight, BrainCircuit, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_PROMPTS = [
  "Which areas are most at risk right now?",
  "What is the status of PS-07 pump station?",
  "How will the 15:00 tide affect Bagjola canal?",
  "Show critical incidents in Borough VII",
];

export function AskKolkataDrawer() {
  const {
    askKolkataOpen,
    setAskKolkataOpen,
    copilotQuery,
    setCopilotQuery,
    chatMessages,
    sendCopilotMessage,
    navigate,
  } = useKWIStore();

  if (!askKolkataOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    sendCopilotMessage(copilotQuery);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Ask Kolkata AI Assistant"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[3px]"
        onClick={() => setAskKolkataOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="relative w-full max-w-[400px] h-full flex flex-col font-sans overflow-hidden z-10"
        style={{
          background:
            "linear-gradient(165deg, rgba(6,20,44,0.98) 0%, rgba(5,16,36,0.99) 50%, rgba(4,18,42,1) 100%)",
          borderLeft: "1px solid rgba(94,183,201,0.18)",
          boxShadow:
            "-20px 0 60px rgba(0,0,0,0.55), inset 1px 0 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Ambient top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,255,0.1) 0%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* ── Header ── */}
        <div
          className="relative flex items-center justify-between px-5 py-4 shrink-0 z-10"
          style={{ borderBottom: "1px solid rgba(94,183,201,0.14)" }}
        >
          {/* Brand identity */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,229,255,0.18) 0%, rgba(59,130,246,0.12) 100%)",
                border: "1px solid rgba(0,229,255,0.28)",
                boxShadow: "0 0 18px rgba(0,229,255,0.15)",
              }}
            >
              <BrainCircuit className="w-4.5 h-4.5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold tracking-tight text-[#e8f6ff]">
                  Ask Kolkata
                </h2>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
                  style={{
                    background: "rgba(0,229,255,0.12)",
                    border: "1px solid rgba(0,229,255,0.3)",
                    color: "#00E5FF",
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-[#6D949D] mt-0.5 font-mono tracking-wide">
                Municipal drainage &amp; water intelligence
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => setAskKolkataOpen(false)}
            aria-label="Close Ask Kolkata"
            className="p-1.5 rounded-lg text-[#4a7a88] hover:text-[#e8f6ff] hover:bg-white/8 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Conversation Area ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(59,130,246,0.1) 100%)",
                  border: "1px solid rgba(0,229,255,0.22)",
                  boxShadow: "0 0 24px rgba(0,229,255,0.1)",
                }}
              >
                <BrainCircuit className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#c8e6f0] mb-1">
                  How can I help?
                </div>
                <div className="text-[11px] text-[#4a7a88] max-w-[220px] leading-relaxed">
                  Ask about flood risk, pump stations, drainage canals, or
                  live incidents across Kolkata.
                </div>
              </div>
            </div>
          )}

          {chatMessages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Sender label */}
              <div
                className={`text-[9.5px] font-bold tracking-wider uppercase mb-1 font-mono ${
                  msg.sender === "user"
                    ? "text-blue-400/70 pr-1"
                    : "text-cyan-400/70 pl-1"
                }`}
              >
                {msg.sender === "user" ? "You" : "NIVARA AI"}
              </div>

              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-[12px] leading-relaxed ${
                  msg.sender === "user"
                    ? "rounded-tr-sm text-white"
                    : "rounded-tl-sm text-[#d4eef5]"
                }`}
                style={
                  msg.sender === "user"
                    ? {
                        background:
                          "linear-gradient(130deg, #1d4fd8 0%, #0ea5e9 100%)",
                        boxShadow:
                          "0 4px 16px rgba(0,112,243,0.30)",
                      }
                    : {
                        background: "rgba(10,35,60,0.85)",
                        border: "1px solid rgba(94,183,201,0.18)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.04)",
                      }
                }
              >
                <p>{msg.text}</p>

                {/* Structured product card */}
                {msg.sender !== "user" && msg.text.includes("Sector V") && (
                  <div
                    className="mt-3 pt-3 space-y-2"
                    style={{ borderTop: "1px solid rgba(94,183,201,0.2)" }}
                  >
                    <div className="font-bold text-[11px] text-[#e8f6ff] uppercase tracking-wider font-mono">
                      SECTOR V
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div>
                        <span className="text-[#4a7a88]">Risk:</span>{" "}
                        <strong className="text-rose-400">82 / 100</strong>
                      </div>
                      <div>
                        <span className="text-[#4a7a88]">Rainfall:</span>{" "}
                        <strong className="text-[#e8f6ff]">74 mm / 3 hr</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#4a7a88]">Primary constraint:</span>{" "}
                        <span className="text-[#d4eef5]">Drainage capacity</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#4a7a88]">Action:</span>{" "}
                        <span className="text-cyan-300">
                          Inspect PS-07 and clear main trunk
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAskKolkataOpen(false);
                        navigate("/live-city");
                      }}
                      className="mt-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View Area on Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-[#334e5c] font-mono mt-1 px-1">
                {msg.timestamp}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Quick Suggestion Chips ── */}
        <div
          className="px-4 py-3 shrink-0"
          style={{
            borderTop: "1px solid rgba(94,183,201,0.12)",
            background: "rgba(4,14,30,0.6)",
          }}
        >
          <span className="text-[9.5px] uppercase font-bold text-[#334e5c] tracking-widest block mb-2 font-mono">
            Suggested Queries
          </span>
          <div className="flex flex-col gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendCopilotMessage(prompt)}
                className="text-left text-[11px] py-1.5 px-3 rounded-lg text-[#7ab4c2] hover:text-[#c8e6f0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                style={{
                  background: "transparent",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,229,255,0.06)";
                  e.currentTarget.style.border = "1px solid rgba(94,183,201,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.border = "1px solid transparent";
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input Footer ── */}
        <form
          onSubmit={handleSubmit}
          className="px-4 pt-3 pb-4 shrink-0 flex items-center gap-2.5"
          style={{ borderTop: "1px solid rgba(94,183,201,0.14)" }}
        >
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            placeholder="Ask about water conditions, pumps, canals…"
            className="flex-1 px-4 py-2.5 rounded-xl text-[12px] text-[#d4eef5] placeholder:text-[#334e5c] focus:outline-none transition-all"
            style={{
              background: "rgba(8,28,52,0.8)",
              border: "1px solid rgba(94,183,201,0.18)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(0,229,255,0.45)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(0,229,255,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid rgba(94,183,201,0.18)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Send message"
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-shadow"
            style={{
              background: "linear-gradient(130deg, #00bcd4 0%, #0ea5e9 100%)",
              boxShadow: "0 4px 16px rgba(0,188,212,0.35)",
            }}
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default AskKolkataDrawer;
