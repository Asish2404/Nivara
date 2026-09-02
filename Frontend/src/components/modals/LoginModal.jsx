import { useState } from 'react'
import { X, Lock, Key, ArrowRight, ShieldCheck } from 'lucide-react'

export function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Magic authentication link sent to: ${email || 'demo@ai-unleashed.io'}`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-[#090e1f] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,240,255,0.2)] relative text-white font-sans">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">
            SECURE ACCESS
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign In to AI-Unleashed
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Access your neural clusters and distributed telemetry console.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@enterprise.ai"
              className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all cursor-pointer"
          >
            <span>Continue with Magic Link</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
