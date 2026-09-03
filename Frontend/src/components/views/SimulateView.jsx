import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";

export function SimulateView() {
  const { navigate } = useKWIStore();
  const [pumpCapacity, setPumpCapacity] = useState(100);
  const [crewDispatched, setCrewDispatched] = useState(true);
  const [extraPumpUnit, setExtraPumpUnit] = useState(true);

  // Simulation Timeline State: 'CURRENT' | 'SIMULATING' | 'RESULT'
  const [simState, setSimState] = useState("CURRENT");

  const handleRunSimulation = () => {
    setSimState("SIMULATING");
    setTimeout(() => {
      setSimState("RESULT");
    }, 850);
  };

  const handleReset = () => {
    setSimState("CURRENT");
  };

  return (
    <div className="w-full font-sans text-slate-900 pb-16">
      {/* Header */}
      <div className="max-w-2xl mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 block mb-1">
          SCENARIO MODELING
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Simulate an Intervention
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          Test how activating station PS-07, staging mobile dewatering pumps,
          and inlet desilting relieve street inundation before deploying
          physical crews.
        </p>
      </div>

      {/* Simulation Progression Timeline */}
      <div className="mb-8 max-w-xl">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span
            className={
              simState === "CURRENT"
                ? "text-blue-600 font-bold"
                : "text-slate-400"
            }
          >
            1. CURRENT STATE
          </span>
          <span className="text-slate-300">────────</span>
          <span
            className={
              simState === "SIMULATING"
                ? "text-blue-600 font-bold"
                : "text-slate-400"
            }
          >
            2. SIMULATING
          </span>
          <span className="text-slate-300">────────</span>
          <span
            className={
              simState === "RESULT"
                ? "text-emerald-600 font-bold"
                : "text-slate-400"
            }
          >
            3. RELIEF RESULT
          </span>
        </div>
      </div>

      {/* Two Column Layout: Left Controls / Right Before & After */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Intervention Controls */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Intervention Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target: Sector V College More Basin
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Pump Station Capacity */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-semibold text-slate-700">
                  Station PS-07 Load
                </span>
                <span className="font-bold text-blue-600">
                  {pumpCapacity}% Capacity
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={pumpCapacity}
                onChange={(e) => setPumpCapacity(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">
                85 cusecs axial discharge into Bagjola Canal
              </span>
            </div>

            {/* Drainage Crew Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-900 block">
                  Inlet Desilting Crew
                </span>
                <span className="text-[11px] text-slate-500">
                  Deploy Unit 04 to clear surface grates
                </span>
              </div>
              <input
                type="checkbox"
                checked={crewDispatched}
                onChange={(e) => setCrewDispatched(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Additional Pump Unit Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-900 block">
                  Mobile Submersible Pump
                </span>
                <span className="text-[11px] text-slate-500">
                  Stage 20 HP Godwin dewatering pump
                </span>
              </div>
              <input
                type="checkbox"
                checked={extraPumpUnit}
                onChange={(e) => setExtraPumpUnit(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={simState === "SIMULATING"}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {simState === "SIMULATING" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Hydraulics…</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Simulation →</span>
                </>
              )}
            </button>

            {simState === "RESULT" && (
              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Before & After Visual Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BEFORE Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    BEFORE INTERVENTION
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Current State
                  </span>
                </div>

                <div className="h-44 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mb-2 shadow-2xs">
                    <span className="text-xl font-bold text-rose-600">
                      18 cm
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    Severe Inundation
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    2 lanes blocked at College More
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>
                  Drainage capacity:{" "}
                  <strong className="text-slate-900">62%</strong>
                </div>
                <div>
                  Risk score:{" "}
                  <strong className="text-rose-600">82 / 100</strong>
                </div>
                <div>
                  Affected area:{" "}
                  <strong className="text-slate-900">12,400 m²</strong>
                </div>
              </div>
            </div>

            {/* AFTER Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    AFTER INTERVENTION
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {simState === "RESULT" ? "Simulated Relief" : "Pending Run"}
                  </span>
                </div>

                <div className="h-44 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-2xs transition-all ${
                      simState === "RESULT"
                        ? "bg-emerald-100 border border-emerald-200"
                        : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`text-xl font-bold ${
                        simState === "RESULT"
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {simState === "RESULT" ? "7 cm" : "—"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {simState === "RESULT"
                      ? "Safe Traffic Clearance"
                      : "Run simulation to model relief"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    {simState === "RESULT"
                      ? "61% reduction in water depth"
                      : "Impact computed in seconds"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>
                  Drainage capacity:{" "}
                  <strong className="text-slate-900">
                    {simState === "RESULT" ? "87%" : "—"}
                  </strong>
                </div>
                <div>
                  Risk score:{" "}
                  <strong className="text-emerald-700">
                    {simState === "RESULT" ? "54 / 100" : "—"}
                  </strong>
                </div>
                <div>
                  Affected area:{" "}
                  <strong className="text-slate-900">
                    {simState === "RESULT" ? "4,100 m²" : "—"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Outcome Summary & Direct Connection to Action Center */}
          {simState === "RESULT" && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Intervention Model Verified · Ready for Municipal Dispatch
                  </span>
                  <span className="text-xs text-slate-600">
                    Staging 1 Godwin unit + Unit 04 desilting restores traffic
                    flow 3.6 hours faster.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/action-center")}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
              >
                Create Work Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulateView;
