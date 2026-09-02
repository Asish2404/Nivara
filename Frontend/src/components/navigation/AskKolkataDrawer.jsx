import { useKWIStore } from '../../store/useKWIStore'
import { X, Send, Bot, User, Terminal, ArrowRight } from 'lucide-react'

const QUICK_PROMPTS = [
  'Show critical waterlogging in Borough VII',
  'Hooghly river tidal level & sluice status',
  'Palmer Bridge pump station capacity',
  'Monsoon rainfall forecast next 4 hours',
]

export function AskKolkataDrawer() {
  const {
    askKolkataOpen,
    setAskKolkataOpen,
    copilotQuery,
    setCopilotQuery,
    chatMessages,
    sendCopilotMessage,
  } = useKWIStore()

  if (!askKolkataOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!copilotQuery.trim()) return
    sendCopilotMessage(copilotQuery)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-label="Ask Kolkata Operational Copilot"
    >
      <div className="w-full max-w-lg bg-[#070d18]/95 backdrop-blur-2xl h-full shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.15)] border-l border-cyan-500/30 flex flex-col justify-between text-white font-sans">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  ASK KOLKATA
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  COPILOT
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                KMC Drainage & GIS Natural Language Query
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAskKolkataOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== 'user' && (
                <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-xl ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-400/40 text-white shadow-xs'
                    : 'bg-black/50 border border-white/10 text-slate-200 shadow-2xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span
                  className={`text-[9px] font-mono block mt-1.5 ${
                    msg.sender === 'user' ? 'text-cyan-300/80 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-md bg-white/10 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 block mb-2">
            Suggested Operational Queries
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendCopilotMessage(prompt)}
                className="text-[11px] font-sans px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:text-cyan-300 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 bg-black/60 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            placeholder="Type municipal query (e.g. ward 49 water level)..."
            className="flex-1 px-3.5 py-2.5 text-xs bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-black rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3 h-3 text-black" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default AskKolkataDrawer
