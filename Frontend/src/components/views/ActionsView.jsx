import { useState } from 'react'
import { Power } from 'lucide-react'

export function ActionsView() {
  const [actions, setActions] = useState([
    { id: 'ACT-01', target: 'Palmer Bridge Drainage Station - Pump Unit #5', type: 'PUMP_START', status: 'STANDBY', capacity: '35 cusecs' },
    { id: 'ACT-02', target: 'Circular Canal Chitpore Lock Sluice Gate', type: 'SLUICE_THROTTLE', status: 'THROTTLED', capacity: 'Gravity Lock' },
    { id: 'ACT-03', target: 'Behala Chowrasta Mobile Diesel High-Head Pump', type: 'MOBILE_DISPATCH', status: 'EN_ROUTE', capacity: '18 cusecs' },
    { id: 'ACT-04', target: 'Thanthania Booster Station Auxiliary Siphon', type: 'SIPHON_ENGAGE', status: 'STANDBY', capacity: '12 cusecs' },
  ])

  const toggleAction = (id) => {
    setActions((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              status: act.status === 'ACTIVE' || act.status === 'RUNNING' ? 'STANDBY' : 'RUNNING',
            }
          : act
      )
    )
  }

  return (
    <div className="w-full font-sans text-white">
      <div className="pb-6 border-b border-white/10">
        <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 font-bold">
          KMC ACTION CENTER // SCADA DISPATCH & REMOTE TELECONTROL
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1 font-mono">
          OPERATIONAL COMMAND & ACTUATION
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {actions.map((act) => {
          const isRunning = act.status === 'RUNNING' || act.status === 'ACTIVE'
          return (
            <div
              key={act.id}
              className={`p-6 rounded-2xl border transition-all ${
                isRunning
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-black/50 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-white">
                  {act.type}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isRunning
                      ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300'
                      : act.status === 'THROTTLED'
                      ? 'bg-amber-950 border border-amber-500/60 text-amber-300'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  ● {act.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-3">{act.target}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Rated Discharge Capacity: {act.capacity}
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">SCADA Token #942</span>
                <button
                  type="button"
                  onClick={() => toggleAction(act.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isRunning
                      ? 'bg-rose-950 border border-rose-500/60 text-rose-200 hover:bg-rose-900 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-cyan-950 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-900 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isRunning ? 'Stop Unit' : 'Engage Remote Actuation'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActionsView
