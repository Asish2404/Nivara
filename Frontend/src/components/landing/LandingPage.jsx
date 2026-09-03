import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Waves, Activity, ShieldCheck, Cpu, Database } from "lucide-react";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { BorderBeam } from "../ui/BorderBeam";
import { CardSpotlight } from "../ui/CardSpotlight";
import Footer from "../Footer";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { CitizenReportingSection } from "./CitizenReportingSection";

export function LandingPage() {
  const { navigate } = useKWIStore();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [simActive, setSimActive] = useState(false);

  const WORKFLOW_STEPS = [
    {
      num: "01",
      title: "Report",
      desc: "Citizen reports waterlogging via mobile app with geotagged photo.",
    },
    {
      num: "02",
      title: "Verify",
      desc: "Automated spatial models validate depth, debris, and drainage condition in seconds.",
    },
    {
      num: "03",
      title: "Connect",
      desc: "Correlates signal with nearby pumping stations, sluice gates, and trunk drains.",
    },
    {
      num: "04",
      title: "Understand",
      desc: "Calculates catchment risk score and drainage bottleneck in real-time.",
    },
    {
      num: "05",
      title: "Predict",
      desc: "Simulates 60-minute storm runoff based on radar rain and Hooghly tidal heights.",
    },
    {
      num: "06",
      title: "Simulate",
      desc: "Tests mobile pump dispatch scenarios and gravity outfall relief impacts.",
    },
    {
      num: "07",
      title: "Act",
      desc: "Dispatches targeted KMC drainage work orders directly to field units.",
    },
  ];

  // Dynamic Theme Palette Switcher (Ciao Energy Style)
  const [threatLevel, setThreatLevel] = useState("normal"); // 'normal' | 'advisory' | 'surge'

  const ambientGlowClass =
    threatLevel === "surge"
      ? "bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.18),rgba(239,68,68,0.08),transparent_70%)]"
      : threatLevel === "advisory"
      ? "bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),rgba(217,119,6,0.08),transparent_70%)]"
      : "bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.16),rgba(59,130,246,0.08),transparent_70%)]";

  return (
    <div className="relative min-h-screen bg-white text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-hidden">
      {/* 0. Ambient Top Radiant Glow & Micro-Grid (Dynamically morphs with threatLevel) */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] ${ambientGlowClass} transition-all duration-700 pointer-events-none -z-10`} />
      <div className="absolute top-0 inset-x-0 h-[480px] bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Global Navigation Bar */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* ======================================================== */}
      {/* HERO SECTION                                            */}
      {/* ======================================================== */}
      <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto text-center">
        {/* Dynamic Threat-Level Mode Switcher (Ciao Energy Style) */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100/90 backdrop-blur-md rounded-xl border border-slate-200/90 w-fit mx-auto mb-5 shadow-2xs">
          {[
            { id: "normal", label: "Basin Normal", color: "text-cyan-800 bg-white shadow-2xs border-cyan-300" },
            { id: "advisory", label: "Monsoon Advisory", color: "text-amber-800 bg-white shadow-2xs border-amber-300" },
            { id: "surge", label: "Flood Surge Alert", color: "text-rose-800 bg-white shadow-2xs border-rose-300" },
          ].map((lvl) => {
            const isSelected = threatLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  setThreatLevel(lvl.id);
                  audioEngine.playUiChirp(lvl.id === 'normal' ? 880 : lvl.id === 'advisory' ? 1040 : 1320);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? `${lvl.color} font-semibold border`
                    : "text-slate-500 hover:text-slate-900 border border-transparent"
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>

        {/* Eyebrow / Live Satellite Link Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/5 border border-slate-200/90 backdrop-blur-md shadow-xs mb-5 text-xs text-slate-700 hover:border-cyan-500/40 transition-colors"
        >
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${threatLevel === 'surge' ? 'bg-rose-400' : threatLevel === 'advisory' ? 'bg-amber-400' : 'bg-cyan-400'} opacity-80`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${threatLevel === 'surge' ? 'bg-rose-500' : threatLevel === 'advisory' ? 'bg-amber-500' : 'bg-cyan-500'}`}></span>
          </span>
          <span className="font-semibold text-slate-900 tracking-wide">
            {threatLevel === 'surge' ? 'CRITICAL SURGE PROTOCOL ACTIVE' : threatLevel === 'advisory' ? 'MONSOON ADVISORY LEVEL 2' : 'Sentinel-5 AI Surveillance Linked'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {threatLevel === 'surge' ? 'LOCK GATES CLOSED' : threatLevel === 'advisory' ? 'HIGH TIDE +3.8M EXPECTED' : '41 HOOGHLY GAUGES ONLINE'}
          </span>
        </motion.div>

        {/* Large Headline with Vibrant Fluid Gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 leading-[1.08] max-w-4xl mx-auto"
        >
          <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
            Know the water.
          </span>
          <br />
          <span className="text-slate-900">Know the city.</span>
        </motion.h1>

        {/* Supporting Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Turn rainfall, citizen signals and drainage intelligence into faster
          municipal decisions across the Kolkata Metropolitan Area.
        </motion.p>

        {/* Action Buttons with High-Tech Glow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <button
            type="button"
            onClick={() => navigate("/live-city")}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_25px_rgba(6,182,212,0.45)] cursor-pointer"
          >
            Enter Live City
          </button>
          <button
            type="button"
            onClick={() => navigate("/incidents")}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/90 hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 font-medium text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-xs cursor-pointer"
          >
            View Active Incidents
          </button>
        </motion.div>

        {/* Hero Visual: 2.5D Cartographic Map with Shimmering Border Beam & Ambient Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 rounded-3xl border border-slate-200/90 bg-white p-2 shadow-[0_24px_60px_-12px_rgba(6,182,212,0.25)] hover:shadow-[0_28px_70px_-12px_rgba(6,182,212,0.35)] transition-all duration-500 overflow-hidden h-[540px] sm:h-[640px] lg:h-[700px] relative group"
        >
          {/* Shimmering Border Beam Laser */}
          <BorderBeam size={360} duration={10} colorFrom="#00f0ff" colorTo="#3b82f6" />

          {/* Shimmering Top Edge Light */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 z-10" />

          <KolkataGisMap />
        </motion.div>

        {/* City Telemetry Metrics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-left"
        >
          <CardSpotlight
            soundFreq={880}
            spotlightColor="rgba(6, 182, 212, 0.12)"
            borderColor="rgba(6, 182, 212, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center gap-2 text-cyan-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">SLUICE GATES</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">41 / 41</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Hooghly tidal telemetry synced</div>
          </CardSpotlight>

          <CardSpotlight
            soundFreq={980}
            spotlightColor="rgba(59, 130, 246, 0.12)"
            borderColor="rgba(59, 130, 246, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">DRAINAGE BASINS</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">16 Catchments</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Automated runoff models active</div>
          </CardSpotlight>

          <CardSpotlight
            soundFreq={1080}
            spotlightColor="rgba(99, 102, 241, 0.12)"
            borderColor="rgba(99, 102, 241, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">RADAR ARRAYS</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">1,480 Nodes</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Dual-pol Doppler live array</div>
          </CardSpotlight>

          <CardSpotlight
            soundFreq={1180}
            spotlightColor="rgba(16, 185, 129, 0.12)"
            borderColor="rgba(16, 185, 129, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">PREDICTION MODEL</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">99.8% Accuracy</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">60-min storm surge nowcasting</div>
          </CardSpotlight>
        </motion.div>
      </section>

      {/* ======================================================== */}
      {/* SECTION: HOW IT WORKS                                   */}
      {/* ======================================================== */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto border-t border-slate-100">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-cyan-600 font-mono">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 mt-2">
            One report becomes city intelligence.
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            From the moment a citizen or field officer notes water accumulation,
            the platform verifies, correlates, and predicts impact across
            municipal catchment basins.
          </p>
        </div>

        {/* Ciao Energy-style Sticky Pinned Split-Screen Showcase */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 7 Interactive Workflow Narrative Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isSelected = activeWorkflowStep === idx;
              return (
                <CardSpotlight
                  key={step.num}
                  soundFreq={750 + idx * 60}
                  spotlightColor="rgba(6, 182, 212, 0.12)"
                  borderColor="rgba(6, 182, 212, 0.45)"
                  onClick={() => {
                    setActiveWorkflowStep(idx);
                    audioEngine.playUiChirp(700 + idx * 70);
                  }}
                  onMouseEnter={() => {
                    setActiveWorkflowStep(idx);
                    audioEngine.playUiChirp(750 + idx * 50);
                  }}
                  className={`p-5 rounded-2xl cursor-pointer text-left relative overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "border-cyan-500 bg-gradient-to-r from-cyan-50/70 to-white shadow-md ring-1 ring-cyan-400/40 -translate-y-0.5"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {/* Active Accent Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600" />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        isSelected ? "bg-cyan-600 text-white shadow-xs" : "bg-slate-100 text-slate-500"
                      }`}>
                        {step.num}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {step.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase hidden sm:inline">
                      STEP {idx + 1} OF 7
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal pl-9">
                    {step.desc}
                  </p>
                </CardSpotlight>
              );
            })}
          </div>

          {/* Right: Sticky Pinned High-Tech Visual Holographic Card (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="rounded-3xl border border-slate-200/90 bg-slate-950 text-white p-6 shadow-2xl relative overflow-hidden text-left font-mono">
              <BorderBeam size={280} duration={12} colorFrom="#00f0ff" colorTo="#3b82f6" />
              {/* Subtle Cyan Grid in Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Top Telemetry Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[11px] font-bold text-cyan-300 tracking-wider">
                    STEP {WORKFLOW_STEPS[activeWorkflowStep].num} // {
                      activeWorkflowStep === 0 ? "CITIZEN SIGNAL INGESTION" :
                      activeWorkflowStep === 1 ? "SPATIAL COMPUTER VISION" :
                      activeWorkflowStep === 2 ? "HYDRAULIC GRAPH LINK" :
                      activeWorkflowStep === 3 ? "CATCHMENT DYNAMICS" :
                      activeWorkflowStep === 4 ? "60-MIN RUNOFF AI" :
                      activeWorkflowStep === 5 ? "PUMP RELIEF SIMULATION" :
                      "MUNICIPAL ACTION DISPATCH"
                    }
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  {activeWorkflowStep === 0 ? "GEO-LOCATED" :
                   activeWorkflowStep === 1 ? "99.4% CONFIDENCE" :
                   activeWorkflowStep === 2 ? "41 GATES SYNCED" :
                   activeWorkflowStep === 3 ? "RISK: 84/100" :
                   activeWorkflowStep === 4 ? "+18CM AT T+25M" :
                   activeWorkflowStep === 5 ? "3 PUMPS STAGED" :
                   "ORDER #KMC-WRK-9418"}
                </span>
              </div>

              {/* Main Feature Title */}
              <div className="relative z-10 mb-4">
                <div className="text-xs text-slate-400 mb-0.5">ACTIVE PROCESS</div>
                <div className="text-lg font-bold text-white tracking-wide">
                  {WORKFLOW_STEPS[activeWorkflowStep].title} — {
                    activeWorkflowStep === 0 ? "Mobile Ingest & Geotag" :
                    activeWorkflowStep === 1 ? "Automated Depth AI" :
                    activeWorkflowStep === 2 ? "Network Correlation" :
                    activeWorkflowStep === 3 ? "Catchment Risk Quantification" :
                    activeWorkflowStep === 4 ? "Storm Surge Forecast" :
                    activeWorkflowStep === 5 ? "Dispatch Feasibility" :
                    "Field Work-Order Issuance"
                  }
                </div>
              </div>

              {/* Live Data Lines */}
              <div className="relative z-10 space-y-2 bg-black/60 rounded-xl p-3.5 border border-cyan-500/20 text-xs mb-5">
                <div className="text-cyan-200/90 flex items-center gap-2">
                  <span className="text-cyan-400">❯</span>
                  <span>{
                    activeWorkflowStep === 0 ? "COORDINATES: 22.5726° N, 88.3639° E" :
                    activeWorkflowStep === 1 ? "ESTIMATED DEPTH: 38.5 CM (Curb Overflow)" :
                    activeWorkflowStep === 2 ? "SLUICE GATES LINKED: 4 (Hooghly Outfall)" :
                    activeWorkflowStep === 3 ? "CATCHMENT RISK: 84/100 (Critical Flag)" :
                    activeWorkflowStep === 4 ? "RADAR INTENSITY: 42 mm/hr Cloud Burst" :
                    activeWorkflowStep === 5 ? "REQUIRED PUMPS: 3 Units (500 m³/h capacity)" :
                    "DISPATCH ORDER: #KMC-WRK-2026-9418"
                  }</span>
                </div>
                <div className="text-slate-300 flex items-center gap-2">
                  <span className="text-cyan-400">❯</span>
                  <span>{
                    activeWorkflowStep === 0 ? "SOURCE: Citizen Mobile App + Photo Geotag" :
                    activeWorkflowStep === 1 ? "DEBRIS FACTOR: High Obstruction Detected" :
                    activeWorkflowStep === 2 ? "TRUNK CONDUIT: Circular Canal 72% Saturated" :
                    activeWorkflowStep === 3 ? "BOTTLENECK: Palmer Bridge Conduit Silt" :
                    activeWorkflowStep === 4 ? "HOOGHLY STAGE: High Tide +3.8M Resistance" :
                    activeWorkflowStep === 5 ? "GRAVITY OUTFALL: Gate #14 Scheduled at Low Tide" :
                    "ASSIGNED CREW: Borough VII Field Rapid Response"
                  }</span>
                </div>
              </div>

              {/* System Impact Outcome */}
              <div className="relative z-10 flex items-center justify-between text-xs mb-4 pt-1">
                <span className="text-slate-400">SYSTEM IMPACT:</span>
                <span className="text-emerald-400 font-bold tracking-wide">
                  {activeWorkflowStep === 0 ? "+1 Incident Logged for Review" :
                   activeWorkflowStep === 1 ? "Depth Validated in 3.2 Seconds" :
                   activeWorkflowStep === 2 ? "Drainage Graph Calibrated" :
                   activeWorkflowStep === 3 ? "Surge Trajectory Modeled" :
                   activeWorkflowStep === 4 ? "Early Warning Broadcasted" :
                   activeWorkflowStep === 5 ? "-24 CM Depth Reduction Modeled" :
                   "Crew En Route (ETA 11 Minutes)"}
                </span>
              </div>

              {/* Pipeline Progress Bar */}
              <div className="relative z-10">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                  <span>PIPELINE COMPLETION</span>
                  <span className="text-cyan-300 font-bold">
                    {Math.round(((activeWorkflowStep + 1) / 7) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.round(((activeWorkflowStep + 1) / 7) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Bottom CTA */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(1000);
                  navigate("/live-city");
                }}
                className="relative z-10 mt-6 w-full py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 hover:text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)]"
              >
                <span>OPEN IN LIVE CITY SYSTEM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION: CITIZEN REPORTING + AI VERIFICATION            */}
      {/* ======================================================== */}
      <CitizenReportingSection />

      {/* ======================================================== */}
      {/* SECTION: SIMULATION & ACTION PREVIEW                    */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto border-t border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Simulation Before & After */}
          <div>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-blue-600">
              HYDRAULIC INTERVENTION SIMULATION
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 mt-2">
              What happens if we act?
            </h2>
            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              Before deploying equipment, municipal engineers model pump
              relocations, sluice adjustments, and dredging interventions to
              quantify relief before trucks leave the depot.
            </p>

            <div className="mt-8 p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Simulate Mobile Pump Unit Deployment
                </span>
                <button
                  type="button"
                  onClick={() => setSimActive(!simActive)}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>
                    {simActive ? "Reset Simulation" : "Run Simulation"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Before Intervention
                  </span>
                  <span className="text-2xl font-bold text-rose-600">
                    18 cm
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Water depth at curb
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    After Intervention
                  </span>
                  <span className="text-2xl font-bold text-emerald-600 transition-all">
                    {simActive ? "7 cm" : "—"}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    {simActive ? "61% reduction in 45m" : "Run to compute"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Municipal Work Order */}
          <div>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-blue-600">
              ACTION & WORK ORDER
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 mt-2">
              From insight to dispatch.
            </h2>
            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              Municipal response workflows track progress from automated
              recommendation through crew dispatch, staging, and drainage
              restoration.
            </p>

            <div className="mt-8 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    WORK ORDER
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    WO-2026-0323-0041
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  DISPATCHED
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pump Deployment / Inlet Desilting
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Salt Lake Sector V, Ring Road near College More.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">
                    Priority
                  </span>
                  <span className="font-semibold text-rose-600">High</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">
                    Risk Score
                  </span>
                  <span className="font-semibold text-slate-900">82 / 100</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">
                    Impact
                  </span>
                  <span className="font-semibold text-emerald-600">
                    -65% Area
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/action-center")}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Track Work Order
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Existing Footer Preserved */}
      <Footer />
    </div>
  );
}

export default LandingPage;
