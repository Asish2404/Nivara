import { useKWIStore } from "../../store/useKWIStore";
import { X, Send, ArrowRight } from "lucide-react";

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
      className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-label="Ask Kolkata Query Utility"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between text-slate-900 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-950">
              Ask Kolkata
            </h2>
            <p className="text-xs text-slate-500">
              Municipal drainage & operational water queries
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAskKolkataOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-3.5 leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-800 border border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px]">
                  <span
                    className={`font-semibold ${msg.sender === "user" ? "text-blue-100" : "text-slate-500"}`}
                  >
                    {msg.sender === "user"
                      ? "You"
                      : "Kolkata Water Intelligence"}
                  </span>
                  <span className="opacity-60 font-mono">{msg.timestamp}</span>
                </div>
                <p>{msg.text}</p>

                {/* Example Structured Product Card in response */}
                {msg.sender !== "user" && msg.text.includes("Sector V") && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="font-bold text-slate-950 text-xs">
                      SECTOR V
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div>
                        <span className="text-slate-500">Risk:</span>{" "}
                        <strong className="text-rose-600">82 / 100</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Rainfall:</span>{" "}
                        <strong>74 mm / 3 hr</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">
                          Primary constraint:
                        </span>{" "}
                        Drainage capacity
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Action:</span> Inspect
                        PS-07 and clear main trunk
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAskKolkataOpen(false);
                        navigate("/live-city");
                      }}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Area on Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
            Suggested Queries
          </span>
          <div className="flex flex-col gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendCopilotMessage(prompt)}
                className="text-left text-xs py-1 px-2 rounded hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-200 flex gap-2"
        >
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            placeholder="Ask about water conditions, pumps, canals..."
            className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AskKolkataDrawer;
