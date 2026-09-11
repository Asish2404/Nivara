import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Zap,
  Activity,
  Cpu,
  TrendingDown,
  Droplets,
  BarChart3,
  Grid3X3,
  AlertTriangle,
  Info,
  Waves,
  ArrowRight,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

/* ── Premium Custom Toggle with Cyan Glow ───────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 cursor-pointer ${checked
          ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.45)]"
          : "bg-slate-200"
        }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${checked ? "translate-x-5 bg-white" : "translate-x-0 bg-white"
          }`}
      />
    </button>
  );
}

/* ── Premium Simulation Workflow Stepper ────────────────────────── */
function TimelineStep({ num, label, sublabel, active, done, isSimulating }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border transition-all duration-300 shrink-0 ${done
            ? "bg-emerald-600 border-emerald-600 text-white font-medium shadow-xs"
            : active
              ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold ring-2 ring-blue-100 shadow-xs"
              : "bg-slate-50 border-slate-200 text-slate-500 font-medium"
          }`}
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
        ) : isSimulating && active ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        ) : (
          num
        )}
      </div>
      <div className="min-w-0">
        <div
          className={`text-[12.5px] truncate ${done
              ? "text-emerald-700 font-semibold"
              : active
                ? "text-blue-700 font-semibold"
                : "text-slate-700 font-medium"
            }`}
        >
          {label}
        </div>
        <div className="text-[11px] text-slate-500 font-normal truncate">
          {sublabel}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
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

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    /*
     * SimulateView content area:
     *   - Shows panoramic Kolkata Golden Sunset with Heritage Dome, Yellow Taxis & Vintage Tram edge-to-edge
     */
    <div
      className="relative w-full overflow-hidden -mt-[104px] bg-[#e8f1f8] dark:bg-[#070c14]"
      style={{
        minHeight: "calc(100vh - 40px)",
      }}
    >
      {/* ── 100% Full-Width Edge-to-Edge Panoramic Heritage Background Layer ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <img
          src="/images/kolkata_golden_sunset_trams.jpg"
          alt="Kolkata Heritage Building at Golden Sunset with Yellow Taxis and Vintage Tram"
          className="w-full h-full object-cover object-[center_35%] sm:object-[center_30%] filter contrast-[0.84] brightness-[0.98] saturate-[0.82] opacity-[0.82] transition-all duration-300"
        />

        {/* Subtle, soft atmospheric gradient (Reduced smokiness to let vibrant scenery shine) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#e8f1f8]/55 via-[#e8f1f8]/25 via-25% to-transparent to-55% dark:from-[#070c14]/65 dark:via-[#070c14]/30 dark:via-25% dark:to-transparent" />

        {/* Soft top blend into navbar */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#e8f1f8]/60 to-transparent dark:from-[#070c14]/65" />

        {/* Soft bottom edge transition to footer */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#e8f1f8]/60 to-transparent dark:from-[#070c14]/65" />
      </div>

      {/* Main Content Container */}
      <motion.div
        className="relative max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-[156px] pb-24 font-sans"
        style={{ zIndex: 2 }}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* ── 1. Hero Section with Blue Glow Effect ─────────────────── */}
        <motion.div variants={fadeUp} className="mb-6 relative">
          {/* Ambient Blue/Cyan Glow Sphere behind Header */}
          <div className="absolute -left-10 -top-8 w-80 h-44 bg-gradient-to-br from-blue-500/25 via-cyan-400/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/70 dark:border-slate-700/60 text-[12px] text-slate-700 dark:text-slate-200 mb-3 shadow-[0_4px_16px_rgba(15,23,42,0.05),0_0_12px_rgba(59,130,246,0.12)] backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="font-bold text-slate-900 dark:text-white">Hydraulic Intervention Modeling</span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-blue-600 dark:text-cyan-400 font-semibold">Scenario Simulator</span>
          </div>

          <h1 className="text-3xl sm:text-[35px] font-bold tracking-[-0.025em] text-[#0a325c] dark:text-white mb-2 leading-tight drop-shadow-[0_0_24px_rgba(59,130,246,0.45)] dark:drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]">
            Simulate Drainage Interventions
          </h1>
          <p className="text-[13.5px] text-[#1c4774] dark:text-cyan-100/90 max-w-2xl leading-relaxed font-medium drop-shadow-[0_0_12px_rgba(59,130,246,0.25)]">
            Test pumping station boosts, inlet desilting crews, and mobile
            submersible units to predict flood reduction before dispatching
            field teams.
          </p>
        </motion.div>

        {/* ── 2. Redesigned 3-Step Progress Stepper ──────────────────── */}
        <motion.div variants={fadeUp} className="mb-6 max-w-2xl">
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <TimelineStep
              num="1"
              label="Baseline"
              sublabel="Config & parameters"
              active={simState === "CURRENT"}
              done={simState === "SIMULATING" || simState === "RESULT"}
              isSimulating={false}
            />
            <div
              className={`h-[2px] w-8 sm:w-16 mx-2 rounded-full transition-all duration-500 ${simState === "SIMULATING" || simState === "RESULT"
                  ? "bg-blue-600"
                  : "bg-slate-200"
                }`}
            />
            <TimelineStep
              num="2"
              label="Solving PDE"
              sublabel="Hydraulic computation"
              active={simState === "SIMULATING"}
              done={simState === "RESULT"}
              isSimulating={simState === "SIMULATING"}
            />
            <div
              className={`h-[2px] w-8 sm:w-16 mx-2 rounded-full transition-all duration-500 ${simState === "RESULT"
                  ? "bg-emerald-600"
                  : "bg-slate-200"
                }`}
            />
            <TimelineStep
              num="3"
              label="Verified"
              sublabel="Relief confirmed"
              active={false}
              done={simState === "RESULT"}
              isSimulating={false}
            />
          </div>
        </motion.div>

        {/* ── 3. Three Dashboard Cards Grid ─────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        >
          {/* ── CARD 1: Intervention Parameters ────────────────────── */}
          <div className="rounded-2xl bg-white/92 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between gap-5 transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-900 tracking-[-0.01em]">
                    Intervention Parameters
                  </h2>
                  <p className="text-[12px] text-slate-500 font-normal">
                    Configure field interventions for simulation
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                Station PS-07
              </span>
            </div>

            {/* Turbine Load Section */}
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-[13px] font-medium text-slate-900 block">
                    Station PS-07 Turbine Load
                  </span>
                  <span className="text-[11.5px] text-slate-500 font-normal">
                    Discharge pump control
                  </span>
                </div>
                <span className="text-[26px] font-semibold tracking-tight text-blue-600 tabular-nums">
                  {pumpCapacity}%
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
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #0ea5e9 ${((pumpCapacity - 50) / 50) * 100
                    }%, #e2e8f0 ${((pumpCapacity - 50) / 50) * 100}%, #e2e8f0 100%)`,
                }}
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-normal">
                <span>50% (42 cusecs)</span>
                <span>100% (85 cusecs)</span>
              </div>
            </div>

            {/* Desilting Mobile Unit Row */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-medium text-slate-900 block">
                    Inlet Desilting Mobile Unit
                  </span>
                  <span className="text-[11.5px] text-slate-500 font-normal">
                    Deploy Rapid Action Unit 04
                  </span>
                </div>
              </div>
              <Toggle
                checked={crewDispatched}
                onChange={(v) => {
                  setCrewDispatched(v);
                  audioEngine.playUiChirp(v ? 1100 : 700);
                }}
              />
            </div>

            {/* Mobile Submersible Pump Row */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-medium text-slate-900 block">
                    Mobile Submersible Pump
                  </span>
                  <span className="text-[11.5px] text-slate-500 font-normal">
                    20 HP Godwin high-head unit
                  </span>
                </div>
              </div>
              <Toggle
                checked={extraPumpUnit}
                onChange={(v) => {
                  setExtraPumpUnit(v);
                  audioEngine.playUiChirp(v ? 1200 : 750);
                }}
              />
            </div>

            {/* Run Hydraulic Simulation Button (Functionality 100% preserved) */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simState === "SIMULATING"}
                className="w-full relative overflow-hidden py-3 px-5 rounded-xl font-medium text-[13.5px] text-white transition-all duration-200 active:translate-y-0 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group shadow-[0_4px_16px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.38)]"
                style={{
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)",
                }}
              >
                {simState === "SIMULATING" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Solving Hydraulic PDE Grid…</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Hydraulic Simulation</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {simState === "RESULT" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={handleReset}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-xs shrink-0"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* ── CARD 2: Baseline Risk (Visual Focal Point) ─────────── */}
          <div className="rounded-2xl bg-white/92 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between gap-4 transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] ring-1 ring-rose-500/10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-900 tracking-[-0.01em]">
                    Baseline Risk
                  </h2>
                  <p className="text-[12px] text-slate-500 font-normal">
                    Pre-intervention state
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                Critical
              </span>
            </div>

            {/* Main Risk Circular Gauge */}
            <div className="rounded-2xl bg-gradient-to-b from-rose-50/70 via-rose-50/30 to-white/40 border border-rose-100/80 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Circular Gauge Ring */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#ffe4e6"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#roseGradient)"
                    strokeWidth="6"
                    strokeDasharray="251.2"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[38px] font-semibold tracking-tight text-rose-600 leading-none tabular-nums">
                    18
                  </span>
                  <span className="text-[11.5px] font-medium text-rose-500 mt-0.5">
                    cm
                  </span>
                </div>
              </div>

              <div className="text-[13.5px] font-semibold text-slate-900 mt-2.5">
                Severe Street Inundation
              </div>
              <div className="text-[11.5px] text-slate-600 mt-0.5 flex items-center gap-1.5 font-normal">
                <span>2 arterial lanes blocked</span>
                <span className="text-slate-300">·</span>
                <span className="font-medium text-rose-700">College More</span>
              </div>
            </div>

            {/* Key Indicators (3 rows) */}
            <div className="space-y-3 pt-1">
              {/* Row 1: Drainage Load */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-normal flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-amber-500" />
                    Drainage Load
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    62%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 w-[62%] transition-all duration-700" />
                </div>
              </div>

              {/* Row 2: Risk Score */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-normal flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-rose-500" />
                    Risk Score
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    82 / 100
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 w-[82%] transition-all duration-700" />
                </div>
              </div>

              {/* Row 3: Affected Area */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-normal flex items-center gap-1.5">
                    <Grid3X3 className="w-3.5 h-3.5 text-rose-400" />
                    Affected Area
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    12,400 m²
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-400 w-[74%] transition-all duration-700" />
                </div>
              </div>
            </div>

            {/* Subtle Risk Warning Panel */}
            <div className="rounded-xl bg-amber-50/90 border border-amber-200/80 px-3.5 py-2 text-[11.5px] text-amber-900 flex items-center gap-2 font-normal">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>High risk of further inundation if no intervention is taken.</span>
            </div>
          </div>

          {/* ── CARD 3: Simulated Outcome ──────────────────────────── */}
          <div className="rounded-2xl bg-white/92 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between gap-4 transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-xs ${simState === "RESULT"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}
                >
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-900 tracking-[-0.01em]">
                    Simulated Outcome
                  </h2>
                  <p className="text-[12px] text-slate-500 font-normal">
                    {simState === "RESULT"
                      ? "Relief verified"
                      : "Awaiting simulation"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border transition-all duration-300 ${simState === "RESULT"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
              >
                {simState === "RESULT" ? "Verified" : "Pending"}
              </span>
            </div>

            {/* Empty / Simulating / Result State Center Area */}
            <div
              className={`rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 min-h-[175px] ${simState === "RESULT"
                  ? "bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white/40 border-emerald-200/80"
                  : "bg-slate-50/70 border-slate-100"
                }`}
            >
              <AnimatePresence mode="wait">
                {simState === "SIMULATING" ? (
                  <motion.div
                    key="solving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2.5 py-3"
                  >
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping opacity-30" />
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <div className="text-[13px] font-semibold text-blue-700">
                      Solving Hydraulic PDE Grid…
                    </div>
                    <div className="text-[11.5px] text-slate-500 font-normal">
                      Running transient flow solver
                    </div>
                  </motion.div>
                ) : simState === "RESULT" ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-22 h-22 rounded-full bg-white border-2 border-emerald-400 shadow-sm flex flex-col items-center justify-center">
                      <span className="text-[38px] font-semibold tracking-tight text-emerald-600 leading-none tabular-nums">
                        7
                      </span>
                      <span className="text-[11.5px] font-medium text-emerald-500 mt-0.5">
                        cm
                      </span>
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-slate-900 mt-1">
                        Safe Vehicular Clearance
                      </div>
                      <div className="text-[11.5px] text-emerald-700 font-medium mt-0.5">
                        61% water depth reduction achieved
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2 py-1.5"
                  >
                    {/* Clean analytics visual */}
                    <div className="relative w-14 h-14 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-xs">
                      <TrendingDown className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-[13px] font-medium text-slate-900 mt-1">
                      Trigger simulation to model relief
                    </div>
                    <div className="text-[11.5px] text-slate-500 max-w-[240px] leading-relaxed font-normal">
                      Run the hydraulic model to see projected reduction in water levels and affected area.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Projected Indicators (3 rows) */}
            <div className="space-y-3 pt-1">
              {/* Row 1: Projected Drainage Load */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-normal flex items-center gap-1.5">
                    <Droplets className={`w-3.5 h-3.5 ${simState === "RESULT" ? "text-blue-500" : "text-slate-300"}`} />
                    Drainage Load
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${simState === "RESULT" ? "text-blue-700" : "text-slate-400"
                      }`}
                  >
                    {simState === "RESULT" ? "87%" : "—"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: simState === "RESULT" ? "87%" : "0%" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Row 2: Projected Risk Score */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-normal flex items-center gap-1.5">
                    <BarChart3 className={`w-3.5 h-3.5 ${simState === "RESULT" ? "text-emerald-500" : "text-slate-300"}`} />
                    Risk Score
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${simState === "RESULT" ? "text-emerald-700" : "text-slate-400"
                      }`}
                  >
                    {simState === "RESULT" ? "54 / 100" : "—"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: simState === "RESULT" ? "54%" : "0%" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Row 3: Projected Affected Area */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-normal flex items-center gap-1.5">
                    <Grid3X3 className={`w-3.5 h-3.5 ${simState === "RESULT" ? "text-teal-500" : "text-slate-300"}`} />
                    Affected Area
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${simState === "RESULT" ? "text-teal-700" : "text-slate-400"
                      }`}
                  >
                    {simState === "RESULT" ? "4,100 m²" : "—"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: simState === "RESULT" ? "33%" : "0%" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Message Strip */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2 text-[11.5px] text-slate-500 flex items-center gap-1.5 font-normal">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Results will appear after simulation is completed.</span>
            </div>
          </div>
        </motion.div>

        {/* ── Post-Simulation Verified Work Order Banner ────────────── */}
        <AnimatePresence>
          {simState === "RESULT" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-200 shadow-[0_4px_24px_rgba(16,185,129,0.12)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">
                    Intervention Verified · Ready for Immediate KMC Dispatch
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 font-normal">
                    Staging Godwin pump + Unit 04 desilting restores traffic
                    clearance 3.6 hours ahead of flood crest.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/action-center")}
                className="relative overflow-hidden px-5 py-2.5 rounded-xl font-medium text-[13px] text-white shrink-0 cursor-pointer transition-all active:scale-[0.98] group shadow-[0_2px_12px_rgba(5,150,105,0.25)] hover:shadow-[0_4px_16px_rgba(5,150,105,0.35)]"
                style={{
                  background:
                    "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                Create Work Order →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default SimulateView;
