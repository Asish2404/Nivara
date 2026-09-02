import { useKWIStore } from '../../store/useKWIStore'
import { ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react'

export function AdminMenu() {
  const { adminMenuOpen, setAdminMenuOpen, activePumps, totalPumps, hooghlyTideLevel } = useKWIStore()

  if (!adminMenuOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setAdminMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Floating Dark Glass HUD Admin Dropdown */}
      <div
        className="fixed top-18 right-4 sm:right-8 z-50 w-72 bg-[#080d18]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,240,255,0.15)] p-4 space-y-3.5 text-white animate-in fade-in zoom-in-95 duration-150 font-sans"
        role="menu"
        aria-label="Admin Control Menu"
      >
        {/* Operator Profile */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            AS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-mono">ASISH SENGUPTA</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">
              OPERATOR ID: KMC-ADM-9428
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              ● Central Control Room, S.N. Banerjee Rd
            </span>
          </div>
        </div>

        {/* Real-time System Status */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 block">
            Operations & Hardware Telemetry
          </span>

          <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pumping Grid:</span>
              <span className="font-mono font-semibold text-cyan-300">
                {activePumps}/{totalPumps} Online (93%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Hooghly Sluice Gate:</span>
              <span className="font-mono font-semibold text-amber-400">Throttled (3.42m)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Telemetry Sync:</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Real-time
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              alert('KMC GIS Telemetry cache refreshed successfully.')
              setAdminMenuOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Force Telemetry Resync</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default AdminMenu
