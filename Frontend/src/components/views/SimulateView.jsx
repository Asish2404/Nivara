import { useState } from 'react'
import { Play, Sliders, Cpu } from 'lucide-react'

export function SimulateView() {
  const [rainfallInput, setRainfallInput] = useState(65)
  const [tideInput, setTideInput] = useState(3.6)
  const [pumpCapacity, setPumpCapacity] = useState(90)
  const [simRunning, setSimRunning] = useState(false)
  const [simResult, setSimResult] = useState(null)

  const handleRunSim = () => {
    setSimRunning(true)
    setTimeout(() => {
      setSimRunning(false)
      const waterloggedWards = Math.round(rainfallInput * 0.4 + tideInput * 3.5 - pumpCapacity * 0.2)
      const timeToDrainHours = ((rainfallInput * 0.08) / (pumpCapacity * 0.01)).toFixed(1)
      setSimResult({
        impactedWards: Math.max(2, waterloggedWards),
        timeToDrainHours: Math.max(0.5, timeToDrainHours),
        peakDepthCm: (rainfallInput * 0.45 * (tideInput / 3.0)).toFixed(1),
        criticalZone:
          rainfallInput > 60
            ? 'Borough VII (Park Circus) & Borough V (Thanthania)'
            : 'Borough XIII (Behala)',
      })
    }, 800)
  }

  return (
    <div className="w-full font-sans text-white">
      <div className="pb-6 border-b border-white/10">
        <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
          SCENARIO SIMULATION ENGINE // HYDRO-MODEL v2.8
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1 font-mono">
          URBAN DRAINAGE STRESS SIMULATION
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Controls Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-black/50 border border-white/10 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2 font-mono">
            <Sliders className="w-4 h-4" />
            <span>Simulation Parameters</span>
          </h3>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Rainfall Intensity:</span>
                <span className="font-mono text-cyan-300">{rainfallInput} mm/hr</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={rainfallInput}
                onChange={(e) => setRainfallInput(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Hooghly High Tide Level:</span>
                <span className="font-mono text-cyan-300">{tideInput} meters</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.8"
                step="0.1"
                value={tideInput}
                onChange={(e) => setTideInput(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Pumping Grid Deployment:</span>
                <span className="font-mono text-cyan-300">{pumpCapacity}% Capacity</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={pumpCapacity}
                onChange={(e) => setPumpCapacity(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunSim}
            disabled={simRunning}
            className="w-full py-3 bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
          >
            {simRunning ? (
              <span>Computing Hydraulic Grid...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                <span>Execute Scenario Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Computed Impact Assessment</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">STATUS: READY</span>
            </div>

            {simResult ? (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs">
                  <span className="text-[10px] font-mono uppercase text-rose-300 font-semibold block">
                    Severe Waterlogging Wards
                  </span>
                  <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
                    {simResult.impactedWards} Wards
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs">
                  <span className="text-[10px] font-mono uppercase text-cyan-300 font-semibold block">
                    Peak Inundation Depth
                  </span>
                  <span className="text-2xl font-bold font-mono text-cyan-300 mt-1 block">
                    {simResult.peakDepthCm} cm
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs col-span-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                    Total Estimated Drainage Clearance Time
                  </span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    ~{simResult.timeToDrainHours} Hours under continuous pumping
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500 font-mono">
                Adjust parameters on the left and click "Execute Scenario Simulation" to compute flood risks.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimulateView
