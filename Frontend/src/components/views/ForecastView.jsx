import { CloudRain, Compass, Thermometer, Wind, Waves, TrendingUp } from 'lucide-react'

export function ForecastView() {
  const HOURLY_FORECAST = [
    { time: '13:00', rainMm: 42.8, tideM: 3.42, risk: 'CRITICAL' },
    { time: '14:00', rainMm: 55.4, tideM: 3.65, risk: 'CRITICAL' },
    { time: '15:00', rainMm: 48.0, tideM: 3.82, risk: 'HIGH' },
    { time: '16:00', rainMm: 31.2, tideM: 3.40, risk: 'ELEVATED' },
    { time: '17:00', rainMm: 18.5, tideM: 2.95, risk: 'MODERATE' },
    { time: '18:00', rainMm: 8.2, tideM: 2.50, risk: 'LOW' },
  ]

  return (
    <div className="w-full font-sans text-white">
      <div className="pb-6 border-b border-white/10">
        <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
          HYDROMETEOROLOGY // IMD & KMC DOPPLER RADAR
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1 font-mono">
          PRECIPITATION & TIDAL FORECAST
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Radar Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-black/50 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              24-Hour Precipitation Curve
            </h3>
            <span className="text-xs font-mono text-slate-400">Alipore Doppler Synoptic Feed</span>
          </div>

          <div className="space-y-3 pt-2">
            {HOURLY_FORECAST.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 text-xs font-mono">
                <span className="w-12 font-bold text-slate-300">{item.time}</span>
                <div className="flex-1 bg-white/5 h-6 rounded-lg overflow-hidden flex items-center px-2 relative border border-white/5">
                  <div
                    style={{ width: `${(item.rainMm / 60) * 100}%` }}
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-600 to-blue-500 rounded-lg transition-all"
                  />
                  <span className="relative z-10 text-white font-bold text-[11px]">
                    {item.rainMm} mm/hr
                  </span>
                </div>
                <span className="w-24 text-right text-slate-300">Tide: {item.tideM}m</span>
                <span
                  className={`w-20 text-right font-bold text-[10px] px-1.5 py-0.5 rounded ${
                    item.risk === 'CRITICAL'
                      ? 'bg-rose-950 border border-rose-500/50 text-rose-300'
                      : item.risk === 'HIGH'
                      ? 'bg-amber-950 border border-amber-500/50 text-amber-300'
                      : 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {item.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tide & Hydraulic Pressure Card */}
        <div className="p-6 rounded-2xl bg-black/50 border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Waves className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                Hooghly Tidal Model
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Bore tide expected at 15:15 IST reaching a peak of 3.82m. Sluice lock protocol 4-B engaged across Circular and Bagjola Canals.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Current River Level:</span>
              <span className="font-mono font-bold text-cyan-300">3.42 m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Peak High Tide:</span>
              <span className="font-mono font-bold text-rose-400">3.82 m @ 15:15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sluice Gravity Drain:</span>
              <span className="font-mono font-bold text-amber-400">Restricted (Lock closed)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForecastView
