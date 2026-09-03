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
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingPage() {
  const {
    navigate,
    rainfallDisplay,
    incidents,
    activePumps,
    totalPumps,
  } = useKWIStore();
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
      {/* 1. ATMOSPHERIC DIGITAL-TWIN HERO AREA                    */}
      {/* ======================================================== */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-sky-50/20 pt-6 sm:pt-8 pb-5 text-center z-20">
        
        {/* Soft Center Radial Illumination behind "See the water." */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] sm:w-[780px] h-[320px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.16),rgba(14,165,233,0.05),transparent_70%)] pointer-events-none -z-10 blur-xl" />

        {/* Very subtle water ripple contour rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[880px] h-[400px] rounded-full border border-sky-400/[0.07] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1120px] h-[520px] rounded-full border border-cyan-400/[0.04] pointer-events-none -z-10" />

        {/* Faint Architectural Kolkata Blueprint Line-Art (Victoria Memorial & Howrah Bridge) */}
        <svg
          className="absolute top-2 right-4 sm:right-16 lg:right-28 w-64 sm:w-80 lg:w-[420px] h-32 sm:h-40 text-blue-800/[0.07] pointer-events-none select-none -z-10"
          viewBox="0 0 500 240"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {/* Howrah Bridge Silhouette */}
          <path d="M20 200 L120 70 L220 200" strokeWidth="1.6" />
          <path d="M120 70 L120 200" strokeWidth="1.2" />
          <path d="M50 160 L120 70 L190 160" strokeWidth="0.8" strokeDasharray="3 3" />
          <path d="M20 200 L220 200" strokeWidth="2" />
          <path d="M70 135 L170 135" strokeWidth="0.8" />
          <line x1="40" y1="200" x2="120" y2="70" strokeWidth="0.7" />
          <line x1="200" y1="200" x2="120" y2="70" strokeWidth="0.7" />

          {/* Victoria Memorial Dome Silhouette */}
          <path d="M300 200 L300 160 Q300 120 370 110 Q440 120 440 160 L440 200 Z" strokeWidth="1" />
          <path d="M340 110 Q370 60 370 50 Q370 60 400 110" strokeWidth="1.6" />
          <line x1="370" y1="35" x2="370" y2="50" strokeWidth="1.6" />
          <circle cx="370" cy="32" r="3" strokeWidth="1.2" />
          <line x1="280" y1="200" x2="460" y2="200" strokeWidth="2" />
          <path d="M320 160 L420 160" strokeWidth="0.8" />
          <path d="M330 140 Q370 125 410 140" strokeWidth="0.8" />
        </svg>

        <div className="relative max-w-4xl mx-auto px-4">
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
            <span className="text-cyan-950 uppercase font-black">● LIVE KOLKATA</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">Real Geographic Intelligence</span>
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
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed"
          >
            AI-powered water intelligence for a safer, smarter Kolkata.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => { audioEngine.playUiChirp(1100); navigate("/live-city"); }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore Live City</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { audioEngine.playUiChirp(950); const s = document.getElementById("how-it-works"); if (s) s.scrollIntoView({ behavior: "smooth" }); }}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-sm shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>See How It Works</span>
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-cyan-600">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. BORDERLESS MAP STAGE WITH SUBTLE ATMOSPHERIC BLEND   */}
      {/* ======================================================== */}
      <section className="relative w-full max-w-[1520px] mx-auto min-h-[620px] sm:min-h-[680px] lg:min-h-[740px]">
        {/* Seamless Smooth Atmospheric Blend (from white hero into crisp map) */}
        <div className="absolute top-0 inset-x-0 h-28 sm:h-32 bg-gradient-to-b from-white via-white/75 via-white/20 to-transparent pointer-events-none z-10" />

        {/* The Locked Real Kolkata Map: completely borderless, filling the canvas */}
        <div className="relative w-full h-[620px] sm:h-[680px] lg:h-[740px] overflow-hidden">
          <KolkataGisMap />
        </div>

        {/* CITY PULSE: Floating panel positioned cleanly below the top-left map telemetry badge */}
        <div className="absolute left-4 sm:left-6 lg:left-8 top-28 sm:top-32 z-20 w-52 sm:w-60 text-left pointer-events-auto">
          <div className="p-3.5 sm:p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.14)] space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono text-[11px] font-bold tracking-wider text-slate-800">CITY PULSE</span>
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
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">RAINFALL</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-slate-900 font-mono leading-none">
                      {rainfallDisplay ? rainfallDisplay.replace(/[^0-9]/g, "") : "42"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">mm</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono">Last 60 min</span>
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
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">ACTIVE INCIDENTS</span>
                  <span className="text-base font-bold text-slate-900 font-mono leading-none">
                    {incidents.length || 18}
                  </span>
                  <span className="text-[9px] text-rose-600 font-mono font-semibold block mt-0.5">
                    {incidents.filter((i) => i.severity === "CRITICAL").length || 7} Critical
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
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">WATERLOGGED AREA</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-slate-900 font-mono leading-none">12.4</span>
                    <span className="text-[10px] font-mono text-slate-500">km²</span>
                  </div>
                </div>
              </div>
              <Sparkline data={[4.2, 6.8, 8.5, 10.1, 11.5, 12.4]} color="#2563eb" />
            </div>

            {/* Pump Stations */}
            <div className="p-2 rounded-2xl bg-slate-50/85 border border-slate-100/90 flex items-center justify-between">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-lg bg-emerald-100/70 text-emerald-600 mt-0.5">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">PUMP STATIONS</span>
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
              <span className="text-emerald-700 font-medium">All systems operational</span>
            </div>
          </div>
        </div>

        {/* AI INTELLIGENCE: Floating panel positioned cleanly below the top-right map controls */}
        <div className="absolute right-4 sm:right-6 lg:right-8 top-28 sm:top-32 z-20 w-52 sm:w-60 text-left pointer-events-auto">
          <div className="p-3.5 sm:p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.14)] space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span className="font-mono text-[11px] font-bold tracking-wider text-slate-800">AI INTELLIGENCE</span>
            </div>

            {/* High Risk Zones */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">HIGH RISK ZONES</span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono leading-none mt-1">07</div>
                <span className="text-[10px] text-slate-500 font-mono">Areas</span>
              </div>
              {/* SVG Mini Donut Chart */}
              <svg viewBox="0 0 44 44" className="w-10 h-10">
                <circle cx="22" cy="22" r="15" fill="none" stroke="#e2e8f0" strokeWidth="5.5" />
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
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">TOP BOTTLENECKS</span>
              {[
                { name: "D-17 Outlet 04", impact: "High Impact", color: "text-rose-600" },
                { name: "D-24 Canal Gate", impact: "High Impact", color: "text-rose-600" },
                { name: "S-09 Sluice Gate", impact: "Medium Impact", color: "text-amber-600" },
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono py-0.5">
                  <span className="text-slate-700 font-medium">{b.name}</span>
                  <span className={`font-bold flex items-center gap-1 ${b.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {b.impact}
                  </span>
                </div>
              ))}
            </div>

            {/* Recommended Action */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block">RECOMMENDED ACTION</span>
              <div className="text-[10px] text-slate-500 font-mono">Activate Pump Station</div>
              <div className="text-xl font-extrabold text-slate-900 font-mono leading-tight">P-07</div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold text-xs">↓ 31%</span>
                <span className="text-[9px] text-slate-500 font-mono">Water Accumulation</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Est. Clearance: 24–32 min</div>
            </div>

            <button
              type="button"
              onClick={() => { audioEngine.playUiChirp(1050); navigate("/live-city"); }}
              className="w-full mt-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Simulate Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Workflow Strip: FROM REPORT TO RESPONSE - Placed cleanly below the map */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap">
            FROM REPORT TO RESPONSE
          </span>
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4 overflow-x-auto text-[11px] font-mono font-semibold text-slate-700">
            {[
              { num: "01", label: "Report", icon: "📱" },
              { num: "02", label: "AI Verify", icon: "🛡️" },
              { num: "03", label: "Cluster", icon: "👥" },
              { num: "04", label: "Diagnose", icon: "🔍" },
              { num: "05", label: "Predict", icon: "📈" },
              { num: "06", label: "Act", icon: "⚡" },
            ].map((step, idx, arr) => (
              <div key={step.num} className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <span className="text-xs">{step.icon}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{step.num}</span>
                  <span className="text-[11px] text-slate-800 font-bold">{step.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
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
                  className={`p-5 rounded-2xl cursor-pointer text-left relative overflow-hidden transition-all duration-300 ${isSelected
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
                      <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${isSelected ? "bg-cyan-600 text-white shadow-xs" : "bg-slate-100 text-slate-500"
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
                  {WORKFLOW_STEPS[activeWorkflowStep].title} â€” {
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
                  <span className="text-cyan-400">â¯</span>
                  <span>{
                    activeWorkflowStep === 0 ? "COORDINATES: 22.5726Â° N, 88.3639Â° E" :
                      activeWorkflowStep === 1 ? "ESTIMATED DEPTH: 38.5 CM (Curb Overflow)" :
                        activeWorkflowStep === 2 ? "SLUICE GATES LINKED: 4 (Hooghly Outfall)" :
                          activeWorkflowStep === 3 ? "CATCHMENT RISK: 84/100 (Critical Flag)" :
                            activeWorkflowStep === 4 ? "RADAR INTENSITY: 42 mm/hr Cloud Burst" :
                              activeWorkflowStep === 5 ? "REQUIRED PUMPS: 3 Units (500 mÂ³/h capacity)" :
                                "DISPATCH ORDER: #KMC-WRK-2026-9418"
                  }</span>
                </div>
                <div className="text-slate-300 flex items-center gap-2">
                  <span className="text-cyan-400">â¯</span>
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
