import { useRef, useEffect, useState } from "react";
import { useKWIStore, isUserAdmin, isUserSupervisor } from "../../store/useKWIStore";
import { X, Send, ArrowRight, AlertTriangle, Activity, Waves, Map, FileText, MapPin, Droplets, CloudRain, CheckCircle2 } from "lucide-react";

function cleanMessage(text) {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^[•\-\*]\s+/gm, "")
    .replace(/\n[•\-\*]\s+/g, "\n")
    .trim();
}

function parsePctNum(str) {
  if (!str) return 0;
  const num = parseInt(str.toString().replace("%", ""), 10);
  return isNaN(num) ? 0 : num;
}

const BASE_PROMPTS = [
  {
    id: "probability",
    title: "Waterlogging Probability",
    shortText: "Waterlogging Probability",
    subtext: "Check risk percentage for any area",
    Icon: AlertTriangle,
    color: "#ef4444",
    lightBg: "#fff5f5",
    border: "#fecaca",
    label: "Risk",
  },
  {
    id: "condition",
    title: "Waterlogging Condition",
    shortText: "Waterlogging Condition",
    subtext: "Live overview & rain telemetry",
    Icon: Waves,
    color: "#0ea5e9",
    lightBg: "#f0f9ff",
    border: "#bae6fd",
    label: "Area",
  },
  {
    id: "reports",
    title: "No. of Reports",
    shortText: "No. of Reports",
    subtext: "Search citizen complaint records",
    Icon: Activity,
    color: "#8b5cf6",
    lightBg: "#faf5ff",
    border: "#ddd6fe",
    label: "Reports",
  },
  {
    id: "route",
    title: "Know in your Route",
    shortText: "Know in your Route",
    subtext: "Inspect waterlogging along your path",
    Icon: Map,
    color: "#f59e0b",
    lightBg: "#fffbeb",
    border: "#fde68a",
    label: "Route",
  },
];

const CITIZEN_REPORT_PROMPT = {
  id: "submit_report",
  title: "Submit Report",
  shortText: "Submit Report",
  subtext: "Lodge a new waterlogging report",
  Icon: FileText,
  color: "#10b981",
  lightBg: "#ecfdf5",
  border: "#a7f3d0",
  label: "Citizen Action",
};

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
    chatMessages, sendCopilotMessage, addChatMessage, navigate,
    setChatbotActiveArea, setChatbotActiveRoute,
    currentUser,
  } = useKWIStore();

  const [promptFlow, setPromptFlow] = useState(null);
  const inputRef = useRef(null);
  const chatScrollRef = useRef(null);

  const handleWheel = (e) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop += e.deltaY;
    }
  };

  const isSupervisor = isUserSupervisor(currentUser);
  const isAdmin = !isSupervisor && isUserAdmin(currentUser);
  const isCitizen = !isAdmin && !isSupervisor;

  const activePrompts = isCitizen
    ? [...BASE_PROMPTS, CITIZEN_REPORT_PROMPT]
    : BASE_PROMPTS;

  const msgsEndRef = useRef(null);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  if (!askKolkataOpen) return null;

  const handlePromptClick = (prompt) => {
    if (prompt.id === "route") {
      addChatMessage({ sender: "user", text: "Know in your Route" });
      addChatMessage({ sender: "bot", text: "Tell me the source location:" });
      setPromptFlow({ type: "route_source" });
      setCopilotQuery("");
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (prompt.id === "probability") {
      addChatMessage({ sender: "user", text: "Waterlogging Probability" });
      addChatMessage({ sender: "bot", text: "Tell me the location to check waterlogging probability:" });
      setPromptFlow({ type: "probability_loc" });
      setCopilotQuery("");
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (prompt.id === "condition") {
      addChatMessage({ sender: "user", text: "Waterlogging Condition" });
      addChatMessage({ sender: "bot", text: "Tell me the location to inspect waterlogging condition:" });
      setPromptFlow({ type: "condition_loc" });
      setCopilotQuery("");
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (prompt.id === "reports") {
      addChatMessage({ sender: "user", text: "No. of Reports" });
      addChatMessage({ sender: "bot", text: "Tell me the location to check citizen complaints:" });
      setPromptFlow({ type: "reports_loc" });
      setCopilotQuery("");
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (prompt.id === "submit_report") {
      setPromptFlow(null);
      sendCopilotMessage("How do I submit a waterlogging report?");
    } else {
      setPromptFlow(null);
      sendCopilotMessage(prompt.title || prompt.shortText);
    }
  };

  const getPlaceholder = () => {
    if (promptFlow?.type === "route_source") {
      return "Tell me the source location (e.g. Ultadanga, Garia)...";
    }
    if (promptFlow?.type === "route_destination") {
      return `Tell me destination from "${promptFlow.origin}"...`;
    }
    if (promptFlow?.type === "probability_loc") {
      return "Enter area to check probability (e.g. Behala, Sector V)...";
    }
    if (promptFlow?.type === "condition_loc") {
      return "Enter location to inspect condition (e.g. Salt Lake, Park Street)...";
    }
    if (promptFlow?.type === "reports_loc") {
      return "Enter area to check complaints (e.g. Sector V, Ballygunge)...";
    }
    return "Ask about water conditions, pumps, canals...";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputVal = copilotQuery.trim();
    if (!inputVal) return;

    if (promptFlow?.type === "route_source") {
      addChatMessage({ sender: "user", text: inputVal });
      addChatMessage({ sender: "bot", text: "Tell me the destination location:" });
      setPromptFlow({ type: "route_destination", origin: inputVal });
      setCopilotQuery("");
      setTimeout(() => inputRef.current?.focus(), 60);
      return;
    }

    if (promptFlow?.type === "route_destination") {
      const origin = promptFlow.origin;
      const dest = inputVal;
      addChatMessage({ sender: "user", text: dest });
      setPromptFlow(null);
      setCopilotQuery("");
      sendCopilotMessage(`I'm travelling from ${origin} to ${dest}. What waterlogging will I face?`, { skipUserBubble: true });
      return;
    }

    if (promptFlow?.type === "probability_loc") {
      addChatMessage({ sender: "user", text: inputVal });
      setPromptFlow(null);
      setCopilotQuery("");
      sendCopilotMessage(`What is the waterlogging probability in ${inputVal}?`, { skipUserBubble: true });
      return;
    }

    if (promptFlow?.type === "condition_loc") {
      addChatMessage({ sender: "user", text: inputVal });
      setPromptFlow(null);
      setCopilotQuery("");
      sendCopilotMessage(`Show me the waterlogging condition in ${inputVal}.`, { skipUserBubble: true });
      return;
    }

    if (promptFlow?.type === "reports_loc") {
      addChatMessage({ sender: "user", text: inputVal });
      setPromptFlow(null);
      setCopilotQuery("");
      sendCopilotMessage(`How many complaints are there in ${inputVal}?`, { skipUserBubble: true });
      return;
    }

    // Direct typed query
    setPromptFlow(null);
    sendCopilotMessage(inputVal);
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
          onWheel={handleWheel}
          className="ak-panel relative z-10 flex flex-col w-full max-w-[400px] h-full bg-white overflow-hidden font-sans pointer-events-auto"
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
          <div
            ref={chatScrollRef}
            className="flex-1 min-h-0 overflow-y-auto bg-white select-text"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent",
              WebkitOverflowScrolling: "touch",
            }}
          >

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

                {/* Prompt grid (4 cards for Admin/Supervisor, 5 cards including Submit Report for Citizen) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {activePrompts.map((prompt, i) => {
                    const { title, subtext, Icon, color, lightBg, border, label } = prompt;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePromptClick(prompt)}
                        className={`ak-up group flex flex-col gap-2.5 text-left p-3.5 rounded-2xl cursor-pointer focus-visible:outline-none transition-all duration-150 ${
                          activePrompts.length === 5 && i === 4 ? "col-span-2" : ""
                        }`}
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
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold leading-tight text-slate-800 group-hover:text-slate-900 transition-colors">
                            {title}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 leading-snug">
                            {subtext}
                          </span>
                        </div>
                      </button>
                    );
                  })}
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
                            <div className="px-4 py-3.5 text-slate-700">
                              <p className="text-[12.5px] leading-relaxed text-slate-800 font-medium break-words">
                                {cleanMessage(msg.text)}
                              </p>

                              {/* Dynamic HIGHLIGHT_AREA card with highlighted badges */}
                              {msg.sender !== "user" && msg.action?.type === "HIGHLIGHT_AREA" && (
                                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50/40 border border-slate-200/80 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="text-[12px] font-bold text-slate-800 truncate">
                                        {msg.locality || msg.action.payload.locality}
                                      </span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wide bg-blue-50 border border-blue-200 text-blue-700 shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                      LIVE SENSOR
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    {/* 1. Risk Level */}
                                    {(() => {
                                      const risk = (msg.action.payload.risk_level || "LOW").toUpperCase();
                                      const isHigh = risk === "HIGH";
                                      const isMed = risk === "MEDIUM";
                                      const bg = isHigh ? "bg-rose-50 border-rose-200 text-rose-800" : isMed ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800";
                                      const dotColor = isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500";
                                      const labelText = isHigh ? "High Risk" : isMed ? "Medium Risk" : "Low Risk";
                                      return (
                                        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${bg}`}>
                                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">Risk Level</span>
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${dotColor} ${isHigh ? "animate-ping" : ""}`} />
                                            <span className="text-[12.5px] font-extrabold tracking-tight">{labelText}</span>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* 2. Waterlogging Probability */}
                                    {(() => {
                                      const probStr = msg.action.payload.probability || msg.data?.waterlogging_probability_pct || "0%";
                                      const probNum = parsePctNum(probStr);
                                      return (
                                        <div className="p-2.5 rounded-xl border bg-sky-50/80 border-sky-200 text-sky-900 flex flex-col justify-between">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600">Probability</span>
                                            <Droplets className="w-3 h-3 text-sky-500" />
                                          </div>
                                          <div className="mt-1">
                                            <span className="text-[13px] font-black text-sky-800">{probStr}</span>
                                            <div className="w-full h-1 bg-sky-200/80 rounded-full mt-1 overflow-hidden">
                                              <div
                                                className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(8, Math.min(100, probNum))}%` }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* 3. Expected Rainfall */}
                                    <div className="p-2.5 rounded-xl border bg-blue-50/70 border-blue-200/70 text-blue-900 flex flex-col justify-between">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Rainfall (24h)</span>
                                        <CloudRain className="w-3 h-3 text-blue-500" />
                                      </div>
                                      <div className="mt-1">
                                        <span className="text-[13px] font-bold text-blue-800">
                                          {typeof msg.action.payload.forecast_rain_24h_mm === "number"
                                            ? `${msg.action.payload.forecast_rain_24h_mm.toFixed(1)} mm`
                                            : typeof msg.data?.forecast_rain_24h_mm === "number"
                                            ? `${msg.data.forecast_rain_24h_mm.toFixed(1)} mm`
                                            : "0.0 mm"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 4. Citizen Complaints */}
                                    {(() => {
                                      const active = msg.action.payload.active_reports ?? msg.data?.active_reports ?? msg.data?.active_reports_count ?? 0;
                                      const resolved = msg.action.payload.resolved_reports ?? msg.data?.resolved_reports ?? 0;
                                      return (
                                        <div className="p-2.5 rounded-xl border bg-indigo-50/70 border-indigo-200/70 text-indigo-900 flex flex-col justify-between">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">Citizen Reports</span>
                                            <FileText className="w-3 h-3 text-indigo-500" />
                                          </div>
                                          <div className="mt-1">
                                            <span className="text-[13px] font-bold text-indigo-800">{active} Active</span>
                                            <p className="text-[9px] text-indigo-500 font-medium">({resolved} resolved)</p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAskKolkataOpen(false);
                                      if (msg.action?.payload) setChatbotActiveArea(msg.action.payload);
                                      navigate("/live-city");
                                    }}
                                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-semibold transition-all shadow-sm shadow-blue-500/20 cursor-pointer group"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition-transform" />
                                      Center Area on Live GIS Map
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                </div>
                              )}

                              {/* Dynamic HIGHLIGHT_LOCATIONS card */}
                              {msg.sender !== "user" && msg.action?.type === "HIGHLIGHT_LOCATIONS" && (
                                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-purple-50/30 border border-slate-200/80 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                      <span className="text-[12px] font-bold text-slate-800 truncate">
                                        {msg.locality || msg.action.payload.locality}
                                      </span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wide bg-purple-50 border border-purple-200 text-purple-700 shrink-0">
                                      MUNICIPAL LOGS
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-800 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Logged</span>
                                      <span className="text-[14px] font-black text-slate-800 mt-1">
                                        {msg.action.payload.total_reports ?? msg.data?.total_reports ?? 0}
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-900 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Active / Open</span>
                                      <span className="text-[14px] font-black text-amber-700 mt-1">
                                        {msg.action.payload.active_reports ?? msg.data?.active_reports ?? 0} Active
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Resolved</span>
                                      <span className="text-[14px] font-black text-emerald-700 mt-1">
                                        {msg.action.payload.resolved_reports ?? msg.data?.resolved_reports ?? 0}
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl border bg-sky-50/80 border-sky-200 text-sky-900 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600">Max Depth</span>
                                      <span className="text-[13px] font-bold text-sky-700 mt-1">
                                        {msg.action.payload.max_depth_cm > 0 ? `${msg.action.payload.max_depth_cm} cm` : "Normal Flow"}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAskKolkataOpen(false);
                                      if (msg.action?.payload) setChatbotActiveArea(msg.action.payload);
                                      navigate("/live-city");
                                    }}
                                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11.5px] font-semibold transition-all shadow-sm shadow-purple-500/20 cursor-pointer group"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Activity className="w-3.5 h-3.5 text-purple-200 group-hover:scale-110 transition-transform" />
                                      Inspect Complaints on Live Map
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                </div>
                              )}

                              {/* Dynamic HIGHLIGHT_ROUTE card */}
                              {msg.sender !== "user" && msg.action?.type === "HIGHLIGHT_ROUTE" && (
                                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border border-slate-200/80 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Map className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span className="text-[12px] font-bold text-slate-800 truncate">
                                        {msg.action.payload.origin?.name} → {msg.action.payload.destination?.name}
                                      </span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wide bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                                      CORRIDOR
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 rounded-xl border bg-blue-50/80 border-blue-200 text-blue-900 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Total Distance</span>
                                      <span className="text-[14px] font-black text-blue-800 mt-1">
                                        {msg.action.payload.total_distance_km} km
                                      </span>
                                    </div>

                                    {(() => {
                                      const risk = (msg.action.payload.max_risk_level || "LOW").toUpperCase();
                                      const isHigh = risk === "HIGH";
                                      const isMed = risk === "MEDIUM";
                                      const bg = isHigh ? "bg-rose-50 border-rose-200 text-rose-800" : isMed ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800";
                                      const dotColor = isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500";
                                      const labelText = isHigh ? "High Peak" : isMed ? "Medium Peak" : "Low Risk";
                                      return (
                                        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${bg}`}>
                                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">Corridor Risk</span>
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                            <span className="text-[12.5px] font-extrabold tracking-tight">{labelText}</span>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    <div className="p-2.5 rounded-xl border bg-sky-50/80 border-sky-200 text-sky-900 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600">Monitored Sectors</span>
                                      <span className="text-[13px] font-bold text-sky-800 mt-1">
                                        {msg.action.payload.affected_locations?.length || 0} along route
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex flex-col justify-between">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Average Prob</span>
                                      <span className="text-[13px] font-bold text-emerald-800 mt-1">
                                        {msg.action.payload.average_probability_pct || "N/A"}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAskKolkataOpen(false);
                                      if (msg.action?.payload) setChatbotActiveRoute(msg.action.payload);
                                      navigate("/live-city");
                                    }}
                                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11.5px] font-semibold transition-all shadow-sm shadow-amber-500/20 cursor-pointer group"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Map className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform" />
                                      Inspect Corridor on Live Map
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-amber-200 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                </div>
                              )}

                              {/* Dynamic NAVIGATE action card */}
                              {msg.sender !== "user" && msg.action?.type === "NAVIGATE" && (
                                <div className="mt-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => { setAskKolkataOpen(false); navigate(msg.action.payload.path); }}
                                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-[11.5px] font-semibold transition-colors cursor-pointer group"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span>Go to {msg.action.payload.title || "Page"}</span>
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
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
                {activePrompts.map((prompt, i) => {
                  const { shortText, Icon, color, lightBg, border } = prompt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10.5px] cursor-pointer whitespace-nowrap focus-visible:outline-none transition-all font-medium"
                      style={{ background: lightBg, border: `1px solid ${border}`, color: color }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = `0 4px 12px ${color}20`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <Icon className="w-2.5 h-2.5 shrink-0" style={{ color }} />
                      <span>{shortText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ COMPOSER ══ */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 px-4 pt-2.5 pb-5 bg-white"
            style={{ borderTop: "1px solid #e8edf3" }}
          >
            {/* Active multi-step prompt indicator */}
            {promptFlow && (
              <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[11px] text-blue-700 ak-up">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  {promptFlow.type === "route_source" && "Waiting for source location"}
                  {promptFlow.type === "route_destination" && `Destination from "${promptFlow.origin}"`}
                  {promptFlow.type === "probability_loc" && "Waiting for location name"}
                  {promptFlow.type === "condition_loc" && "Waiting for location name"}
                  {promptFlow.type === "reports_loc" && "Waiting for location name"}
                </span>
                <button
                  type="button"
                  onClick={() => setPromptFlow(null)}
                  className="text-blue-500 hover:text-blue-800 font-semibold cursor-pointer underline text-[10px] shrink-0 ml-2"
                >
                  Cancel
                </button>
              </div>
            )}

            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 transition-all"
              style={{ border: "1.5px solid #e2e8f0" }}
              onFocusCapture={e => { e.currentTarget.style.border = "1.5px solid #93c5fd"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
              onBlurCapture={e => { e.currentTarget.style.border = "1.5px solid #e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <input
                ref={inputRef}
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder={getPlaceholder()}
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
