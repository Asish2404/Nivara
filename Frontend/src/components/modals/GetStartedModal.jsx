import { useState } from 'react'
import { X, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Terminal } from 'lucide-react'

export function GetStartedModal({ isOpen, onClose }) {
  const [tier, setTier] = useState('developer')
  const [copied, setCopied] = useState(false)
  const apiKey = 'aiu_live_948271a4f89d0023c7b'

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-[#090e1f] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,240,255,0.2)] relative text-white font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            PROVISION AI CLUSTER
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Get Started with AI-Unleashed
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          Initialize your planetary intelligence endpoint in under 30 seconds.
        </p>

        {/* Plan Selector */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <button
            type="button"
            onClick={() => setTier('developer')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              tier === 'developer'
                ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Developer Tier
              </span>
              <span className="text-xs font-mono font-bold text-white">Free</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">100k API inferences/mo, edge routing</p>
          </button>

          <button
            type="button"
            onClick={() => setTier('enterprise')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              tier === 'enterprise'
                ? 'bg-violet-950/40 border-violet-400/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Enterprise VPC
              </span>
              <span className="text-xs font-mono font-bold text-white">Dedicated</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Custom GPU clusters, zero-retention SLA</p>
          </button>
        </div>

        {/* Quick API Key Box */}
        <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block">DEMO API KEY</span>
            <span className="text-cyan-300">{apiKey}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white font-sans transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy Key'}
          </button>
        </div>

        {/* Launch Button */}
        <button
          type="button"
          onClick={() => {
            alert('Welcome to AI-Unleashed! Cluster initialized successfully.')
            onClose()
          }}
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.7)] transition-all cursor-pointer"
        >
          <span>Launch AI Cluster</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default GetStartedModal
