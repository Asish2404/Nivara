import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  X,
  Plus,
  Minus,
  RotateCcw,
  Waves,
  ShieldAlert,
  Activity,
  Droplets,
  Zap,
  Layers,
  Radio,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { BorderBeam } from "../ui/BorderBeam";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { audioEngine } from "../../utils/audioEngine";
import { slideInRight } from "../../utils/motionVariants";
import { LiveIncidentIntelligenceSection } from "../landing/LiveIncidentIntelligenceSection";
import Footer from "../Footer";

export function LiveCityPage() {
  const store = useKWIStore();
  const {
    activeLayers,
    toggleLayer,
    triggerZoomIn,
    triggerZoomOut,
    triggerResetCamera,
    selectedIncident,
    selectedRiskZone,
    selectedPumpStation,
    clearSelections,
    navigate,
    highRiskZonesCount,
    criticalIncidentsCount,
    rainfallDisplay,
    pumpsAtCapacityCount,
  } = store;

  const [traceWaterFlow, setTraceWaterFlow] = useState(false);

  const LAYER_KEYS = [
    { key: "rain", label: "Rainfall Radar", icon: "🌧️", color: "border-cyan-400/60 text-cyan-700 bg-cyan-50/80" },
    { key: "risk", label: "Flood Risk", icon: "⚠️", color: "border-amber-400/60 text-amber-700 bg-amber-50/80" },
    { key: "incidents", label: "Incidents", icon: "🚨", color: "border-rose-400/60 text-rose-700 bg-rose-50/80" },
    { key: "drainage", label: "Drainage Network", icon: "🌊", color: "border-blue-400/60 text-blue-700 bg-blue-50/80" },
    { key: "pumps", label: "Sluice Pumps", icon: "⚡", color: "border-emerald-400/60 text-emerald-700 bg-emerald-50/80" },
    { key: "forecast", label: "60m Inundation", icon: "🔮", color: "border-purple-400/60 text-purple-700 bg-purple-50/80" },
  ];

  return (
    <div className="relative min-h-screen bg-[#fafaf8] dark:bg-[#0A1E3B] text-slate-900 dark:text-[#F2FBFD] font-sans flex flex-col selection:bg-cyan-100 selection:text-cyan-900 overflow-x-hidden">
      {/* 0. Subtle Organic Ambient Warmth & Waterlines */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[520px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% -10%, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.03) 50%, transparent 85%)",
        }}
      />
      <div
        className="absolute top-0 inset-x-0 h-[400px] pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* 1. Header Navigation */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* 3. Main Operational Workspace */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 flex flex-col gap-6 sm:gap-8">
        {/* ========================================================================= */}
        {/* SECTION 1: COMPACT LIVE MAP HEADER                                        */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-1">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 dark:bg-[#10313E]/60 border border-slate-900/10 dark:border-[rgba(94,183,201,0.16)] text-xs text-slate-700 dark:text-[#B2D2D9] font-mono mb-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="font-semibold tracking-wider">LIVE MUNICIPAL TELEMETRY</span>
              <span className="text-slate-300 dark:text-[#6D949D]">|</span>
              <span className="text-slate-500 dark:text-[#6D949D]">41 HOOGHLY SLUICE GATES LINKED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-[#F2FBFD]">
              Kolkata{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-500 dark:from-[#00E5FF] dark:via-[#38BDF8] dark:to-teal-400 bg-clip-text text-transparent">
                Hydrological Command
              </span>{" "}
              Center
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#B2D2D9] mt-1 max-w-2xl leading-relaxed">
              Real-time multi-spectral radar surveillance, runoff forecast isobars, and telemetry dispatch.
            </p>
          </div>

          {/* High-Tech System Heartbeat Badge */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#10313E]/80 backdrop-blur-xl border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_4px_20px_rgba(15,23,42,0.03)] font-mono text-xs text-slate-600 dark:text-[#B2D2D9]">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00E5FF] animate-pulse" />
              <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">RADAR 2.8 GHz</span>
            </div>
            <span className="text-slate-200 dark:text-[#163F4E]">|</span>
            <div className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-blue-600 dark:text-[#38BDF8]" />
              <span>TIDE +3.42M HIGH</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: 4 OPERATIONAL METRIC CARDS (With Count-Up Animation)           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: HIGH-RISK CONTOURS */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0 }}
            onMouseEnter={() => audioEngine.playUiChirp(800)}
            className="group relative p-5 rounded-[22px] bg-white/80 dark:bg-[#10313E]/80 backdrop-blur-xl border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 dark:hover:border-[rgba(0,229,255,0.4)] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                HIGH-RISK CONTOURS
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-[#F2FBFD] font-mono tracking-tight">
                <AnimatedNumber value={highRiskZonesCount} duration={1400} />
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-[#6D949D] tracking-wider font-mono">ZONES</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#6D949D] mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="line-clamp-1">Sector V & Park Circus Basin</span>
              </div>
              {/* Mini sparkline curve */}
              <svg className="w-12 h-4 text-rose-500 shrink-0" viewBox="0 0 48 16" fill="none">
                <path d="M0 14 L12 11 L24 13 L36 6 L48 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.div>

          {/* Card 2: VERIFIED INCIDENTS */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
            onMouseEnter={() => audioEngine.playUiChirp(920)}
            className="group relative p-5 rounded-[22px] bg-white/80 dark:bg-[#10313E]/80 backdrop-blur-xl border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 dark:hover:border-[rgba(0,229,255,0.4)] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                VERIFIED INCIDENTS
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-[#F2FBFD] font-mono tracking-tight">
                <AnimatedNumber value={criticalIncidentsCount} duration={1400} />
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-[#6D949D] tracking-wider font-mono">REPORTS</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#6D949D] mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Citizen Mobile Ingestion Live</span>
              </div>
              {/* Mini sparkline curve */}
              <svg className="w-12 h-4 text-amber-500 shrink-0" viewBox="0 0 48 16" fill="none">
                <path d="M0 13 L14 10 L26 12 L38 5 L48 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.div>

          {/* Card 3: RAINFALL INTENSITY */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
            onMouseEnter={() => audioEngine.playUiChirp(1040)}
            className="group relative p-5 rounded-[22px] bg-white/80 dark:bg-[#10313E]/80 backdrop-blur-xl border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 dark:hover:border-[rgba(0,229,255,0.4)] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-[#00E5FF] font-mono">
                RAINFALL INTENSITY
              </span>
              <div className="w-7 h-7 rounded-xl bg-cyan-50 dark:bg-[#163F4E] border border-cyan-100 dark:border-[rgba(0,229,255,0.3)] flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-105 transition-transform">
                <Droplets className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-[#F2FBFD] font-mono tracking-tight mt-1">
              {rainfallDisplay}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#6D949D] mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span>Alipore Doppler Reflectivity</span>
              </div>
              {/* Mini rainfall bars */}
              <div className="flex items-end gap-0.5 h-3 shrink-0">
                <div className="w-1 h-1.5 bg-cyan-300 rounded-xs" />
                <div className="w-1 h-2.5 bg-cyan-400 rounded-xs" />
                <div className="w-1 h-3 bg-cyan-500 rounded-xs" />
                <div className="w-1 h-2 bg-cyan-400 rounded-xs" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: PUMP INFRASTRUCTURE */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.36 }}
            onMouseEnter={() => audioEngine.playUiChirp(1160)}
            className="group relative p-5 rounded-[22px] bg-white/80 dark:bg-[#10313E]/80 backdrop-blur-xl border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 dark:hover:border-[rgba(0,229,255,0.4)] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                PUMP INFRASTRUCTURE
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-[#F2FBFD] font-mono tracking-tight">
                <AnimatedNumber value={pumpsAtCapacityCount} duration={1400} />
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-[#6D949D] tracking-wider font-mono">AT CAPACITY</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#6D949D] mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>85 Cusecs Outfall Discharge</span>
              </div>
              {/* Mini pump wave */}
              <svg className="w-12 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 48 14" fill="none">
                <path d="M0 7 Q12 1 24 7 T48 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: REFINED MAP LAYER & CONTROL BAR                                */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-[#10313E]/90 backdrop-blur-xl border border-slate-200/90 dark:border-[rgba(94,183,201,0.16)] text-slate-700 dark:text-[#B2D2D9] shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          {/* Layer Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-3 text-[11px] font-mono text-cyan-800 dark:text-[#00E5FF] font-bold uppercase tracking-wider mr-1">
              <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00E5FF]" />
              <span>LAYERS:</span>
            </div>
            {LAYER_KEYS.map((layer) => {
              const active = activeLayers[layer.key];
              return (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => {
                    audioEngine.playUiChirp(active ? 780 : 1080);
                    toggleLayer(layer.key);
                    if (layer.key === "drainage" && !active && typeof window !== "undefined" && window.__kolkataMapInstance) {
                      window.__kolkataMapInstance.flyTo({
                        center: [88.34255, 22.5450],
                        zoom: 14.5,
                        pitch: 36,
                        bearing: -5,
                        duration: 1400,
                      });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${active
                    ? `${layer.color} border shadow-xs font-semibold`
                    : "bg-slate-100 dark:bg-[#0B2430]/80 text-slate-600 dark:text-[#6D949D] hover:bg-slate-200/70 hover:text-slate-900 dark:hover:text-[#F2FBFD] dark:hover:bg-[#163F4E] border border-transparent"
                    }`}
                >
                  <span className="text-xs">{layer.icon}</span>
                  <span>{layer.label}</span>
                </button>
              );
            })}

            {/* Signature "Trace Water Flow" Action Toggle */}
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(traceWaterFlow ? 720 : 1240);
                setTraceWaterFlow(!traceWaterFlow);
              }}
              className={`ml-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${traceWaterFlow
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_2px_12px_rgba(6,182,212,0.35)]"
                : "bg-cyan-50 dark:bg-[#163F4E] text-cyan-700 dark:text-[#00E5FF] hover:bg-cyan-100 dark:hover:bg-[#163F4E]/80 border border-cyan-300/80 dark:border-[rgba(0,229,255,0.3)]"
                }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Trace Hydraulic Flow</span>
            </button>
          </div>

          {/* Viewport Zoom & Reset Controls */}
          <div className="flex items-center gap-1 pl-2">
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(1100);
                triggerZoomIn();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#10313E] hover:bg-slate-200 dark:hover:bg-[#163F4E] border border-slate-200 dark:border-[rgba(94,183,201,0.16)] text-slate-700 dark:text-[#F2FBFD] flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-colors"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(820);
                triggerZoomOut();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#10313E] hover:bg-slate-200 dark:hover:bg-[#163F4E] border border-slate-200 dark:border-[rgba(94,183,201,0.16)] text-slate-700 dark:text-[#F2FBFD] flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(900);
                triggerResetCamera();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#10313E] hover:bg-slate-200 dark:hover:bg-[#163F4E] border border-slate-200 dark:border-[rgba(94,183,201,0.16)] text-slate-700 dark:text-[#F2FBFD] flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: LARGE LIVE MAP (Centerpiece Viewport)                           */}
        {/* ========================================================================= */}
        <div
          id="gis-map-viewport"
          className="relative w-full h-[640px] sm:h-[680px] rounded-[26px] border border-slate-200/90 dark:border-[rgba(94,183,201,0.16)] bg-slate-950 overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] scroll-mt-24"
        >
          <BorderBeam size={400} duration={14} colorFrom="#00f0ff" colorTo="#3b82f6" />

          {/* Cybernetic HUD Corner Brackets */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-cyan-400 z-[400] pointer-events-none" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400 z-[400] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400 z-[400] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400 z-[400] pointer-events-none" />

          {/* Top-Left Geographic Coordinates Readout Chip */}
          <div className="absolute top-4 left-4 z-[400] flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 text-white font-mono text-[10px] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-300 font-bold">GRID: 22.5726° N, 88.3639° E</span>
            <span className="text-slate-500 dark:text-[#6D949D]">|</span>
            <span className="text-slate-300">WGS84 // EPSG:4326</span>
          </div>

          {/* Bottom-Right Hooghly River Telemetry Pill */}
          <div className="absolute bottom-4 right-4 z-[400] hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/25 text-white font-mono text-[10px] shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-bold text-slate-200">Hooghly River (Live)</span>
            </div>
            <span className="text-slate-600 dark:text-[#6D949D]">|</span>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Waves className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Tide +3.42 m (High)</span>
            </div>
          </div>

          {/* Authentic Realistic Satellite & Street Map */}
          <KolkataGisMap traceWaterFlow={traceWaterFlow} />

          {/* Docked Context Card: Selected Incident (Smooth Slide-In) */}
          <AnimatePresence>
            {selectedIncident && (
              <motion.div
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/95 dark:bg-[#061820]/95 backdrop-blur-xl border border-slate-200 dark:border-[rgba(94,183,201,0.16)] rounded-2xl p-5 shadow-2xl space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
                      {selectedIncident.id} · {selectedIncident.subdivision}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2FBFD] mt-0.5">
                      {selectedIncident.location}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 dark:text-[#6D949D] hover:text-slate-800 dark:hover:text-[#F2FBFD] rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Risk Score</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedIncident.riskScore}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Water Depth</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{selectedIncident.waterDepth}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Rainfall</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD] font-mono">{selectedIncident.rainfall}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Citizen Reports</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedIncident.verifiedReports} verified</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-[#B2D2D9] space-y-1 pt-1 border-t border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                  <div>
                    <strong className="text-slate-800 dark:text-[#F2FBFD]">Drainage:</strong> {selectedIncident.connectedDrainage}
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-[#F2FBFD]">Cause:</strong> {selectedIncident.probableCause}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/action-center")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Dispatch Action Team</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Docked Context Card: Selected Pump Station */}
            {selectedPumpStation && !selectedIncident && (
              <motion.div
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/95 dark:bg-[#061820]/95 backdrop-blur-xl border border-slate-200 dark:border-[rgba(94,183,201,0.16)] rounded-2xl p-5 shadow-2xl space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-[#6D949D] uppercase tracking-wider font-mono">
                      PUMPING STATION · {selectedPumpStation.ward}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2FBFD] mt-0.5">
                      {selectedPumpStation.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 dark:text-[#6D949D] hover:text-slate-800 dark:hover:text-[#F2FBFD] rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Operating Status</span>
                    <span
                      className={`font-bold ${selectedPumpStation.isAtCapacity ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                    >
                      {selectedPumpStation.status}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Operating Load</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedPumpStation.capacity}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Pumps Running</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedPumpStation.pumpsRunning}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Discharge Rate</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedPumpStation.dischargeRate}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-[#B2D2D9] pt-1 border-t border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                  <strong className="text-slate-800 dark:text-[#F2FBFD]">Connected Outfall:</strong>{" "}
                  {selectedPumpStation.connectedCanal}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/simulate")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Simulate Response</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Docked Context Card: Selected Risk Zone */}
            {selectedRiskZone && !selectedIncident && !selectedPumpStation && (
              <motion.div
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/95 dark:bg-[#061820]/95 backdrop-blur-xl border border-slate-200 dark:border-[rgba(94,183,201,0.16)] rounded-2xl p-5 shadow-2xl space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-[#6D949D] uppercase tracking-wider font-mono">
                      CATCHMENT RISK BASIN
                    </span>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-[#F2FBFD] mt-0.5">
                      {selectedRiskZone.districtName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 dark:text-[#6D949D] hover:text-slate-800 dark:hover:text-[#F2FBFD] rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Affected Area</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedRiskZone.affectedArea}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Rainfall</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedRiskZone.rainfall}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                    <span className="text-[10px] text-slate-500 dark:text-[#6D949D] block">Drainage Load</span>
                    <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">{selectedRiskZone.drainageLoad}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/action-center")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Review Action Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* ATMOSPHERIC WATER CONNECTOR TRANSITION (Map Data -> Incident Intel)       */}
        {/* ========================================================================= */}
        <div className="relative w-full -mt-2 -mb-2 pointer-events-none flex flex-col items-center">
          <div className="w-full h-8 bg-gradient-to-b from-transparent via-cyan-500/[0.04] dark:via-cyan-400/[0.05] to-transparent" />
          <div className="w-80 sm:w-[480px] h-6 rounded-full bg-cyan-500/[0.06] dark:bg-cyan-400/[0.08] blur-xl -mt-5" />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: LIVE INCIDENT INTELLIGENCE (Compact Real-time Incident Feed)    */}
        {/* ========================================================================= */}
        <LiveIncidentIntelligenceSection />
      </main>

      {/* ========================================================================= */}
      {/* SECTION: FOOTER                                                           */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}

export default LiveCityPage;
