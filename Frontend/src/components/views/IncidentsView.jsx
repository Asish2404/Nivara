import { useKWIStore } from '../../store/useKWIStore'
import { AlertCircle, CheckCircle2, Clock, MapPin, Gauge, Activity, ShieldAlert, ArrowUpRight } from 'lucide-react'

export function IncidentsView() {
  const { incidents, resolveIncident } = useKWIStore()

  return (
    <div className="w-full font-sans text-white">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
              TELEMETRY LOG
            </span>
            <span className="text-xs font-mono text-slate-400">// KMC DRAINAGE DISPATCH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1 font-mono">
            MUNICIPAL WATER INCIDENTS
          </h1>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            {incidents.filter((i) => i.severity === 'CRITICAL').length} CRITICAL ACTIVE
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            {incidents.filter((i) => i.severity === 'RESOLVED').length} RESOLVED TODAY
          </div>
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {incidents.map((incident) => {
          const isCritical = incident.severity === 'CRITICAL'
          const isResolved = incident.severity === 'RESOLVED'

          return (
            <div
              key={incident.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400'
                  : isResolved
                  ? 'bg-white/5 border-white/10 opacity-70'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-950 border border-rose-500/60 text-rose-300'
                        : isResolved
                        ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300'
                        : 'bg-amber-950 border border-amber-500/60 text-amber-300'
                    }`}
                  >
                    {incident.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-semibold">
                    {incident.id}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    • {incident.reportedAt}
                  </span>
                </div>

                {!isResolved && (
                  <button
                    type="button"
                    onClick={() => resolveIncident(incident.id)}
                    className="text-xs font-mono font-bold text-cyan-300 hover:text-white px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/40 hover:bg-cyan-900 transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-white mt-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{incident.location}</span>
              </h3>

              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="font-semibold text-cyan-200">{incident.ward}</span>
                <span>({incident.borough})</span>
                <span className="text-slate-400">• Outfall: {incident.drainageCanal}</span>
              </div>

              {/* Water Level & Pump Status Box */}
              <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Water Inundation Depth
                  </span>
                  <span
                    className={`font-mono text-base font-bold ${
                      isCritical ? 'text-rose-400' : 'text-cyan-300'
                    }`}
                  >
                    {incident.waterLevelCm} cm
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Station Status
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {incident.pumpsRunning}/{incident.pumpsCapacity} Pumps Active
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                <strong className="text-slate-300">Dispatch Log:</strong> {incident.notes}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IncidentsView
