import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Waves,
  Activity,
  ShieldCheck,
  Cpu,
  Database,
} from "lucide-react";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { BorderBeam } from "../ui/BorderBeam";
import { CardSpotlight } from "../ui/CardSpotlight";
import Footer from "../Footer";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { CitizenReportingSection } from "./CitizenReportingSection";
import { KolkataDecorativeLayer } from "./KolkataDecorativeLayer";
import { RobotPipelineStepping, KWI_PIPELINE_STAGES } from "./RobotPipelineStepping";

function Sparkline({ data = [20, 24, 30, 28, 35, 42], color = "#0284c7" }) {
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 44;
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;
      const y = 16 - ((val - min) / range) * 12;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="w-11 h-4 overflow-visible" viewBox="0 0 44 18" fill="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PIPELINE_PROGRESS_PERCENT = [14, 29, 43, 57, 71, 86, 100];

const STEP_TELEMETRY = [
  {
    header: "CITIZEN SIGNAL INGESTION",
    badge: "GEO-LOCATED",
    activeProcess: "Report → Mobile Ingest & Geotag",
    line1: "COORDINATES: 22.5726° N, 88.3639° E",
    line2: "SOURCE: Citizen Mobile App + Photo Geotag",
    systemImpact: "+1 Incident Logged for Review",
  },
  {
    header: "AI VERIFICATION",
    badge: "99.4% CONFIDENCE",
    activeProcess: "Verify → Spatial Validation",
    line1: "ESTIMATED DEPTH: 38.5 CM (Curb Overflow)",
    line2: "DEBRIS FACTOR: High Obstruction Detected",
    systemImpact: "Depth Validated in 3.2 Seconds",
  },
  {
    header: "INFRASTRUCTURE CORRELATION",
    badge: "41 GATES SYNCED",
    activeProcess: "Connect → Infrastructure Correlation",
    line1: "SLUICE GATES LINKED: 4 (Hooghly Outfall)",
    line2: "TRUNK CONDUIT: Circular Canal 72% Saturated",
    systemImpact: "Drainage Graph Calibrated",
  },
  {
    header: "RISK INTELLIGENCE",
    badge: "RISK: 84/100",
    activeProcess: "Understand → Risk Intelligence",
    line1: "CATCHMENT RISK: 84/100 (Critical Flag)",
    line2: "BOTTLENECK: Palmer Bridge Conduit Silt",
    systemImpact: "Surge Trajectory Modeled",
  },
  {
    header: "PREDICTION ENGINE",
    badge: "+18CM AT T+25M",
    activeProcess: "Predict → 60-Minute Prediction",
    line1: "RADAR INTENSITY: 42 mm/hr Cloud Burst",
    line2: "HOOGHLY STAGE: High Tide +3.8M Resistance",
    systemImpact: "Early Warning Broadcasted",
  },
  {
    header: "INTERVENTION SIMULATION",
    badge: "3 PUMPS STAGED",
    activeProcess: "Simulate → Intervention Simulation",
    line1: "REQUIRED PUMPS: 3 Units (500 m³/h capacity)",
    line2: "GRAVITY OUTFALL: Gate #14 Scheduled at Low Tide",
    systemImpact: "-24 CM Depth Reduction Modeled",
  },
  {
    header: "FIELD DISPATCH",
    badge: "ORDER #KMC-WRK-9418",
    activeProcess: "Act → Field Dispatch",
    line1: "DISPATCH ORDER: #KMC-WRK-2026-9418",
    line2: "ASSIGNED CREW: Borough VII Field Rapid Response",
    systemImpact: "Crew En Route (ETA 11 Minutes)",
  },
];

export function LandingPage() {
  const { navigate, rainfallDisplay, incidents, activePumps, totalPumps } =
    useKWIStore();
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const howItWorksRef = useRef(null);

  // IntersectionObserver to start animation only when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { threshold: 0.2 },
    );

    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] ${ambientGlowClass} transition-all duration-700 pointer-events-none -z-10`}
      />
      <div className="absolute top-0 inset-x-0 h-[480px] bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Global Navigation Bar */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* ======================================================== */}
      {/* 1. ATMOSPHERIC DIGITAL-TWIN HERO AREA                    */}
      {/* ======================================================== */}
      <section className="relative w-full overflow-hidden bg-white pt-8 sm:pt-12 pb-6 sm:pb-10 text-center z-20">
        {/* Authentic Kolkata Atmospheric Landscape (Howrah Bridge, Victoria Memorial, Writers' Building & Moving Clouds) */}
        <KolkataDecorativeLayer />

        <div className="relative max-w-4xl mx-auto px-4 z-10">
          {/* ● LIVE KOLKATA Location Pill */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-sky-200/90 shadow-[0_2px_12px_rgba(6,182,212,0.12)] mb-3.5 text-xs font-mono font-bold tracking-wider text-slate-800"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600" />
            </span>
            <span className="text-cyan-950 uppercase font-black">
              ● LIVE KOLKATA
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">
              Real Geographic Intelligence
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Monitoring Active
            </span>
          </motion.div>

          {/* Main Headline with Editorial Geometric Hierarchy */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.07]"
          >
            <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
              See the water.
            </span>
            <br />
            <span className="text-slate-900 drop-shadow-2xs">
              Predict what happens next.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed"
          >
            AI-powered water intelligence for a safer, smarter Kolkata.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.14,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-4 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(1100);
                navigate("/live-city");
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore Live City</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(950);
                const s = document.getElementById("how-it-works");
                if (s) s.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-sm shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>See How It Works</span>
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-cyan-600">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </span>
            </button>
          </motion.div>
        </div>

        {/* The Locked Real Kolkata Map: seamlessly flowing directly beneath the buttons as one unified stage */}
        <div className="relative w-full min-h-[620px] sm:min-h-[680px] lg:min-h-[740px] z-10">
          <div className="relative w-full h-[620px] sm:h-[680px] lg:h-[740px] overflow-hidden">
            <KolkataGisMap />

            {/* Subtle Outer Edge Dissolves (Bottom & Sides only - NO top white stripe) */}
            <div className="absolute bottom-0 inset-x-0 h-8 sm:h-10 bg-gradient-to-t from-white/50 via-white/20 to-transparent pointer-events-none z-15" />
            <div className="absolute inset-y-0 left-0 w-4 sm:w-6 bg-gradient-to-r from-white/40 to-transparent pointer-events-none z-15" />
            <div className="absolute inset-y-0 right-0 w-4 sm:w-6 bg-gradient-to-l from-white/40 to-transparent pointer-events-none z-15" />

            {/* Gentle atmospheric drift over map */}
            <div className="absolute top-1/4 left-1/3 w-64 sm:w-96 h-28 sm:h-36 rounded-full bg-white/10 blur-2xl pointer-events-none z-10 animate-pulse duration-[8000ms]" />
            <div className="absolute top-1/2 right-1/4 w-56 sm:w-80 h-24 sm:h-32 rounded-full bg-white/8 blur-2xl pointer-events-none z-10" />
          </div>

          {/* CITY PULSE: Floating panel positioned cleanly below the top-left map telemetry badge */}
          <div className="absolute left-4 sm:left-6 lg:left-8 top-28 sm:top-32 z-20 w-52 sm:w-60 text-left pointer-events-auto">
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.14)] space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono text-[11px] font-bold tracking-wider text-slate-800">
                    CITY PULSE
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono text-[9px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              {/* Rainfall */}
              <div className="p-2 rounded-2xl bg-slate-50/85 border border-slate-100/90 flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-sky-100/70 text-sky-600 mt-0.5">
                    <Waves className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                      RAINFALL
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-slate-900 font-mono leading-none">
                        {rainfallDisplay
                          ? rainfallDisplay.replace(/[^0-9]/g, "")
                          : "42"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        mm
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono">
                      Last 60 min
                    </span>
                  </div>
                </div>
                <Sparkline data={[18, 22, 29, 35, 38, 42]} color="#0284c7" />
              </div>

              {/* Active Incidents */}
              <div className="p-2 rounded-2xl bg-slate-50/85 border border-slate-100/90 flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-rose-100/70 text-rose-600 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                      ACTIVE INCIDENTS
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono leading-none">
                      {incidents.length || 18}
                    </span>
                    <span className="text-[9px] text-rose-600 font-mono font-semibold block mt-0.5">
                      {incidents.filter((i) => i.severity === "CRITICAL")
                        .length || 7}{" "}
                      Critical
                    </span>
                  </div>
                </div>
                <Sparkline data={[6, 9, 14, 12, 16, 18]} color="#e11d48" />
              </div>

              {/* Waterlogged Area */}
              <div className="p-2 rounded-2xl bg-slate-50/85 border border-slate-100/90 flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-blue-100/70 text-blue-600 mt-0.5">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                      WATERLOGGED AREA
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-slate-900 font-mono leading-none">
                        12.4
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        km²
                      </span>
                    </div>
                  </div>
                </div>
                <Sparkline
                  data={[4.2, 6.8, 8.5, 10.1, 11.5, 12.4]}
                  color="#2563eb"
                />
              </div>

              {/* Pump Stations */}
              <div className="p-2 rounded-2xl bg-slate-50/85 border border-slate-100/90 flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-emerald-100/70 text-emerald-600 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                      PUMP STATIONS
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono leading-none">
                      {String(activePumps || 7).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-mono font-semibold block mt-0.5">
                      {activePumps || 3} Active
                    </span>
                  </div>
                </div>
                <Sparkline data={[2, 3, 5, 6, 7, 7]} color="#059669" />
              </div>

              {/* Status */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-700">STATUS:</span>
                <span className="text-emerald-700 font-medium">
                  All systems operational
                </span>
              </div>
            </div>
          </div>

          {/* AI INTELLIGENCE: Floating panel positioned cleanly below the top-right map controls */}
          <div className="absolute right-4 sm:right-6 lg:right-8 top-28 sm:top-32 z-20 w-52 sm:w-60 text-left pointer-events-auto">
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.14)] space-y-2.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-[11px] font-bold tracking-wider text-slate-800">
                  AI INTELLIGENCE
                </span>
              </div>

              {/* High Risk Zones */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                    HIGH RISK ZONES
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono leading-none mt-1">
                    07
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Areas
                  </span>
                </div>
                {/* SVG Mini Donut Chart */}
                <svg viewBox="0 0 44 44" className="w-10 h-10">
                  <circle
                    cx="22"
                    cy="22"
                    r="15"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="5.5"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="15"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="5.5"
                    strokeDasharray="62 32"
                    strokeDashoffset="15"
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                  />
                </svg>
              </div>

              {/* Top Bottlenecks */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                  TOP BOTTLENECKS
                </span>
                {[
                  {
                    name: "D-17 Outlet 04",
                    impact: "High Impact",
                    color: "text-rose-600",
                  },
                  {
                    name: "D-24 Canal Gate",
                    impact: "High Impact",
                    color: "text-rose-600",
                  },
                  {
                    name: "S-09 Sluice Gate",
                    impact: "Medium Impact",
                    color: "text-amber-600",
                  },
                ].map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px] font-mono py-0.5"
                  >
                    <span className="text-slate-700 font-medium">{b.name}</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${b.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {b.impact}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommended Action */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                  RECOMMENDED ACTION
                </span>
                <div className="text-[10px] text-slate-500 font-mono">
                  Activate Pump Station
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono leading-tight">
                  P-07
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold text-xs">
                    ↓ 31%
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Water Accumulation
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  Est. Clearance: 24–32 min
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(1050);
                  navigate("/simulate");
                }}
                className="w-full mt-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Simulate Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION: HOW IT WORKS                                   */}
      {/* ======================================================== */}
      <section
        ref={howItWorksRef}
        id="how-it-works"
        className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto border-t border-slate-100 scroll-mt-24"
      >
        <RobotPipelineStepping
          isSectionVisible={isSectionVisible}
          onNavigateCity={() => navigate("/live-city")}
        />
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
                    {simActive ? "7 cm" : "â€”"}
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
