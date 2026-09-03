import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Waves } from "lucide-react";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import Footer from "../Footer";
import { useKWIStore } from "../../store/useKWIStore";
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

  return (
    <div className="relative min-h-screen bg-white text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-hidden">
      {/* 0. Ambient Top Radiant Glow & Micro-Grid (Bridges 3D space scene to city) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.16),rgba(59,130,246,0.08),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-0 inset-x-0 h-[480px] bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Global Navigation Bar */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* ======================================================== */}
      {/* HERO SECTION                                            */}
      {/* ======================================================== */}
      <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto text-center">
        {/* Eyebrow / Live Satellite Link Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/5 border border-slate-200/90 backdrop-blur-md shadow-xs mb-5 text-xs text-slate-700 hover:border-cyan-500/40 transition-colors"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-semibold text-slate-900 tracking-wide">
            Sentinel-5 AI Surveillance Linked
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            41 HOOGHLY GAUGES ONLINE
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

        {/* Hero Visual: 2.5D Cartographic Map with Shimmering Top Edge & Ambient Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[0_20px_50px_-12px_rgba(6,182,212,0.22)] hover:shadow-[0_24px_60px_-12px_rgba(6,182,212,0.32)] transition-all duration-500 overflow-hidden h-[480px] sm:h-[560px] relative group"
        >
          {/* Shimmering Top Edge Light */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          <KolkataGisMap />

          {/* Clean Floating Badge at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-10 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-4 py-2.5 shadow-md flex items-center justify-between sm:justify-start gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-900">
                  Kolkata Municipal Grid Active
                </span>
              </div>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <button
                type="button"
                onClick={() => navigate("/live-city")}
                className="text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open Fullscreen Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ======================================================== */}
      {/* SECTION: HOW IT WORKS                                   */}
      {/* ======================================================== */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto border-t border-slate-100">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-blue-600">
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

        {/* 7-Step Process Workflow */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-7 gap-3">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isHovered = activeWorkflowStep === idx;
            return (
              <div
                key={step.num}
                onMouseEnter={() => setActiveWorkflowStep(idx)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? "border-blue-500 bg-blue-50/40 shadow-xs -translate-y-0.5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-[11px] font-mono font-bold text-slate-400 mb-2">
                  {step.num}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            );
          })}
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
