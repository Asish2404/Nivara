import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Zap,
  Activity,
  ShieldAlert,
  Sparkles,
  Waves,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { CardSpotlight } from "../ui/CardSpotlight";
import { BorderBeam } from "../ui/BorderBeam";
import { audioEngine } from "../../utils/audioEngine";

export function SimulateView() {
  const { navigate } = useKWIStore();
  const [pumpCapacity, setPumpCapacity] = useState(100);
  const [crewDispatched, setCrewDispatched] = useState(true);
  const [extraPumpUnit, setExtraPumpUnit] = useState(true);

  // Simulation Timeline State: 'CURRENT' | 'SIMULATING' | 'RESULT'
  const [simState, setSimState] = useState("CURRENT");

  const handleRunSimulation = () => {
    audioEngine.playUiChirp(1200);
    setSimState("SIMULATING");
    setTimeout(() => {
      audioEngine.playUiChirp(1500);
      setSimState("RESULT");
    }, 850);
  };

  const handleReset = () => {
    audioEngine.playUiChirp(800);
    setSimState("CURRENT");
  };

  return (
    <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/5 border border-cyan-500/20 text-xs text-cyan-800 font-mono mb-2 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
          <span className="font-semibold tracking-wider">HYDRAULIC INTERVENTION MODELING</span>
          <span className="text-slate-300 dark:text-slate-500">|</span>
          <span className="text-slate-500 dark:text-slate-400">DIGITAL TWIN ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          Simulate <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">Drainage Interventions</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          Test pumping station boosts, inlet desilting crews, and mobile submersible units to predict flood reduction before dispatching field teams.
        </p>
      </div>

      {/* Simulation Progression Timeline */}
      <div className="mb-8 max-w-xl p-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white shadow-lg">
        <div className="flex items-center justify-between text-xs font-mono px-4 py-1.5">
          <span
            className={`flex items-center gap-1.5 ${
              simState === "CURRENT"
                ? "text-cyan-400 font-bold"
                : "text-slate-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            1. BASELINE
          </span>
          <span className="text-slate-600">──────</span>
          <span
            className={`flex items-center gap-1.5 ${
              simState === "SIMULATING"
                ? "text-cyan-400 font-bold animate-pulse"
                : "text-slate-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            2. SOLVING PDE
          </span>
          <span className="text-slate-600">──────</span>
          <span
            className={`flex items-center gap-1.5 ${
              simState === "RESULT"
                ? "text-emerald-400 font-bold"
                : "text-slate-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            3. VERIFIED RELIEF
          </span>
        </div>
      </div>

      {/* Two Column Layout: Left Controls / Right Before & After */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Intervention Controls */}
        <CardSpotlight
          soundFreq={920}
          spotlightColor="rgba(6, 182, 212, 0.12)"
          borderColor="rgba(6, 182, 212, 0.45)"
          className="lg:col-span-5 rounded-3xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#16213a] p-6 shadow-md space-y-6"
        >
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider font-mono">
                Intervention Parameters
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target: Sector V Ring Road Basin
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold">
              PS-07 NODE
            </span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Pump Station Capacity */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Station PS-07 Turbine Load
                </span>
                <span className="font-bold text-cyan-600 font-mono text-sm">
                  {pumpCapacity}% Load
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={pumpCapacity}
                onChange={(e) => {
                  setPumpCapacity(Number(e.target.value));
                  audioEngine.playUiChirp(800 + Number(e.target.value) * 4);
                }}
                className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>50% (42 cusecs)</span>
                <span>100% (85 cusecs max)</span>
              </div>
            </div>

            {/* Drainage Crew Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Inlet Desilting Mobile Unit
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deploy Rapid Action Unit 04 to unblock surface grates
                </span>
              </div>
              <input
                type="checkbox"
                checked={crewDispatched}
                onChange={(e) => {
                  setCrewDispatched(e.target.checked);
                  audioEngine.playUiChirp(e.target.checked ? 1100 : 700);
                }}
                className="w-5 h-5 accent-cyan-600 rounded cursor-pointer"
              />
            </div>

            {/* Additional Pump Unit Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Mobile Submersible Pump
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Stage 20 HP Godwin high-head dewatering pump
                </span>
              </div>
              <input
                type="checkbox"
                checked={extraPumpUnit}
                onChange={(e) => {
                  setExtraPumpUnit(e.target.checked);
                  audioEngine.playUiChirp(e.target.checked ? 1200 : 750);
                }}
                className="w-5 h-5 accent-cyan-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={simState === "SIMULATING"}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(6,182,212,0.35)] disabled:opacity-50"
            >
              {simState === "SIMULATING" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Solving Hydraulic PDE Grid…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Hydraulic Simulation →</span>
                </>
              )}
            </button>

            {simState === "RESULT" && (
              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardSpotlight>

        {/* Right Column: Before & After Visual Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BEFORE Card */}
            <CardSpotlight
              soundFreq={860}
              spotlightColor="rgba(244, 63, 94, 0.12)"
              borderColor="rgba(244, 63, 94, 0.45)"
              className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    BASELINE RISK
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Pre-Intervention
                  </span>
                </div>

                <div className="h-44 rounded-2xl bg-gradient-to-b from-rose-50/50 to-slate-50 border border-rose-100 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mb-2 shadow-xs">
                    <span className="text-xl font-bold font-mono text-rose-600">
                      18 cm
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Severe Street Inundation
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    2 arterial lanes blocked at College More
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Drainage Load:</span>
                  <strong className="text-slate-900">62%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Score:</span>
                  <strong className="text-rose-600">82 / 100</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Affected Area:</span>
                  <strong className="text-slate-900">12,400 m²</strong>
                </div>
              </div>
            </CardSpotlight>

            {/* AFTER Card */}
            <CardSpotlight
              soundFreq={1100}
              spotlightColor="rgba(16, 185, 129, 0.12)"
              borderColor="rgba(16, 185, 129, 0.45)"
              className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    SIMULATED OUTCOME
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {simState === "RESULT" ? "Relief Verified" : "Awaiting Run"}
                  </span>
                </div>

                <div className="h-44 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-slate-50 border border-emerald-100 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-xs transition-all ${
                      simState === "RESULT"
                        ? "bg-emerald-100 border border-emerald-300"
                        : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`text-xl font-bold font-mono ${
                        simState === "RESULT"
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {simState === "RESULT" ? "7 cm" : "—"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {simState === "RESULT"
                      ? "Safe Vehicular Clearance"
                      : "Trigger simulation to model relief"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    {simState === "RESULT"
                      ? "61% water depth reduction achieved"
                      : "Transient flow solver ready"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Drainage Load:</span>
                  <strong className="text-slate-900">
                    {simState === "RESULT" ? "87%" : "—"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Score:</span>
                  <strong className="text-emerald-700">
                    {simState === "RESULT" ? "54 / 100" : "—"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Affected Area:</span>
                  <strong className="text-slate-900">
                    {simState === "RESULT" ? "4,100 m²" : "—"}
                  </strong>
                </div>
              </div>
            </CardSpotlight>
          </div>

          {/* Outcome Summary & Direct Connection to Action Center with Border Beam */}
          {simState === "RESULT" && (
            <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <BorderBeam size={280} duration={10} colorFrom="#10b981" colorTo="#06b6d4" />
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-950 block">
                    Intervention Verified · Ready for Immediate KMC Dispatch
                  </span>
                  <span className="text-xs text-slate-600 mt-0.5 block">
                    Staging Godwin pump + Unit 04 desilting restores traffic clearance 3.6 hours ahead of flood crest.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/action-center")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all active:scale-[0.98] shrink-0 cursor-pointer shadow-md"
              >
                Create Work Order →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulateView;
