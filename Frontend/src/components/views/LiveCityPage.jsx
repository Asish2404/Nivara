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
  ShieldCheck,
  MapPin,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { ACTIVE_INCIDENTS } from "../gis/kolkataCartographicData";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { BorderBeam } from "../ui/BorderBeam";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { audioEngine } from "../../utils/audioEngine";
import { slideInRight } from "../../utils/motionVariants";
import Footer from "../Footer";
import MoltenMetal from "./MoltenMetal";
import AccordionGallery from './AccordionGallery';
import SplitText from "./SplitText";

// Hotspot locality photographs corresponding to real Kolkata intersections
const HOTSPOT_PHOTOS = [
  "/images/kolkata_waterlog_sector_v.jpg", // #SV-024: College More & Ring Road, Salt Lake Sector V
  "/images/hotspot_behala.jpg",            // #BH-019: Behala Chowrasta / Diamond Harbour Rd
  "/images/hotspot_park_street.jpg",       // #PS-032: Park Street & Chowringhee Intersection
  "/images/hotspot_thanthania.jpg",        // #TK-089: Thanthania Kalibari
  "/images/hotspot_hastings.jpg",          // #HS-001: Hastings
  "/images/hotspot_kalighat.jpg",          // #KG-001: Kalighat
];

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
    setSelectedIncident,
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
    { key: "drainage", label: "Canal Conduits", icon: "🌊", color: "border-blue-400/60 text-blue-700 bg-blue-50/80" },
    { key: "pumps", label: "Sluice Pumps", icon: "⚡", color: "border-emerald-400/60 text-emerald-700 bg-emerald-50/80" },
    { key: "forecast", label: "60m Inundation", icon: "🔮", color: "border-purple-400/60 text-purple-700 bg-purple-50/80" },
  ];

  // 4 Final Impact Statistics (System Impact)
  const IMPACT_STATS = [
    {
      id: "stat-rain",
      value: "743",
      unit: "mm",
      label: "Total Rainfall (Last 24h)",
      icon: <Droplets className="w-4 h-4 text-cyan-500" />,
      color: "cyan",
      chart: (
        <div className="flex items-end gap-1 h-8 mt-3">
          {[25, 40, 30, 55, 70, 48, 82, 65, 95, 100].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`w-1.5 rounded-t-sm transition-all duration-500 ${i >= 8 ? "bg-cyan-500" : "bg-cyan-200/80"
                }`}
            />
          ))}
        </div>
      ),
    },
    {
      id: "stat-discharge",
      value: "85",
      unit: "",
      label: "Cusecs Outfall Discharge",
      icon: <Waves className="w-4 h-4 text-blue-500" />,
      color: "blue",
      chart: (
        <div className="h-8 mt-3 flex items-center overflow-hidden">
          <svg className="w-full h-6" viewBox="0 0 160 24" fill="none">
            <path
              d="M0 12 Q20 2 40 12 T80 12 T120 12 T160 12"
              stroke="#3b82f6"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 16 Q20 8 40 16 T80 16 T120 16 T160 16"
              stroke="#93c5fd"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 3"
            />
          </svg>
        </div>
      ),
    },
    {
      id: "stat-gates",
      value: "100%",
      unit: "",
      label: "Critical Gates Monitored",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      color: "emerald",
      chart: (
        <div className="mt-4 space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full w-full" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>41 / 41 Active</span>
            <span className="text-emerald-600 font-semibold">Optimal Flow</span>
          </div>
        </div>
      ),
    },
    {
      id: "stat-people",
      value: "4.2M",
      unit: "",
      label: "People Protected",
      icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
      color: "indigo",
      chart: (
        <div className="flex items-center gap-2 mt-3 pt-1">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-[9px] font-bold flex items-center justify-center text-slate-600">
              AK
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-cyan-100 text-[9px] font-bold flex items-center justify-center text-cyan-700">
              SM
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 text-[9px] font-bold flex items-center justify-center text-blue-700">
              DB
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-100 text-[9px] font-bold flex items-center justify-center text-amber-700">
              RC
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            +4.2M
          </span>
        </div>
      ),
    },
  ];

  // Hotspot Accordion Gallery Items preserving exact incident data & functionality
  const hotspotGalleryItems = ACTIVE_INCIDENTS.map((inc, index) => ({
    id: inc.id,
    name: inc.name,
    label: inc.location,
    location: inc.location,
    subdivision: inc.subdivision,
    severity: inc.severity,
    waterDepth: inc.waterDepth,
    rainfall: inc.rainfall,
    verifiedReports: inc.verifiedReports,
    timestamp: inc.timestamp,
    image: inc.image || HOTSPOT_PHOTOS[index] || HOTSPOT_PHOTOS[0],
    incident: inc,
    onViewOnMap: () => {
      audioEngine.playUiChirp(1040);
      setSelectedIncident(inc);
      const mapElem = document.getElementById("gis-map-viewport");
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
  }));

  return (
    <div className="relative min-h-screen bg-[#fafaf8] text-slate-900 font-sans flex flex-col selection:bg-cyan-100 selection:text-cyan-900 overflow-x-hidden">
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
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* SECTION 1: COMPACT LIVE MAP HEADER                                        */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-1">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 text-xs text-slate-700 font-mono mb-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="font-semibold tracking-wider">LIVE MUNICIPAL TELEMETRY</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">41 HOOGHLY SLUICE GATES LINKED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Kolkata{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Hydrological Command
              </span>{" "}
              Center
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Real-time multi-spectral radar surveillance, runoff forecast isobars, and telemetry dispatch.
            </p>
          </div>

          {/* High-Tech System Heartbeat Badge */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] font-mono text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span className="font-bold text-slate-900">RADAR 2.8 GHz</span>
            </div>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-blue-600" />
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
            className="group relative p-5 rounded-[22px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-mono">
                HIGH-RISK CONTOURS
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
                <AnimatedNumber value={highRiskZonesCount} duration={1400} />
              </span>
              <span className="text-xs font-semibold text-slate-400 tracking-wider font-mono">ZONES</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
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
            className="group relative p-5 rounded-[22px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                VERIFIED INCIDENTS
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
                <AnimatedNumber value={criticalIncidentsCount} duration={1400} />
              </span>
              <span className="text-xs font-semibold text-slate-400 tracking-wider font-mono">REPORTS</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
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
            className="group relative p-5 rounded-[22px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 font-mono">
                RAINFALL INTENSITY
              </span>
              <div className="w-7 h-7 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
                <Droplets className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight mt-1">
              {rainfallDisplay}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
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
            className="group relative p-5 rounded-[22px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                PUMP INFRASTRUCTURE
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
                <AnimatedNumber value={pumpsAtCapacityCount} duration={1400} />
              </span>
              <span className="text-xs font-semibold text-slate-400 tracking-wider font-mono">AT CAPACITY</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 text-slate-700 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          {/* Layer Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-3 text-[11px] font-mono text-cyan-800 font-bold uppercase tracking-wider mr-1">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
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
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${active
                    ? `${layer.color} border shadow-xs font-semibold`
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-transparent"
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
                : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-300/80"
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
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-colors"
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
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-colors"
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
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-colors"
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
          className="relative w-full h-[640px] sm:h-[680px] rounded-[26px] border border-slate-200/90 bg-slate-950 overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] scroll-mt-24"
        >
          <BorderBeam size={400} duration={14} colorFrom="#00f0ff" colorTo="#3b82f6" />

          {/* Cybernetic HUD Corner Brackets */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-400 z-[400] pointer-events-none" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400 z-[400] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400 z-[400] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400 z-[400] pointer-events-none" />

          {/* Top-Left Geographic Coordinates Readout Chip */}
          <div className="absolute top-4 left-4 z-[400] flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 text-white font-mono text-[10px] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-300 font-bold">GRID: 22.5726° N, 88.3639° E</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">WGS84 // EPSG:4326</span>
          </div>

          {/* Bottom-Right Hooghly River Telemetry Pill */}
          <div className="absolute bottom-4 right-4 z-[400] hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/25 text-white font-mono text-[10px] shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-bold text-slate-200">Hooghly River (Live)</span>
            </div>
            <span className="text-slate-600">|</span>
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
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono">
                      {selectedIncident.id} · {selectedIncident.subdivision}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedIncident.location}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Risk Score</span>
                    <span className="font-bold text-slate-900">{selectedIncident.riskScore}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Water Depth</span>
                    <span className="font-bold text-rose-600 font-mono">{selectedIncident.waterDepth}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Rainfall</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedIncident.rainfall}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Citizen Reports</span>
                    <span className="font-bold text-slate-900">{selectedIncident.verifiedReports} verified</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <div>
                    <strong className="text-slate-800">Drainage:</strong> {selectedIncident.connectedDrainage}
                  </div>
                  <div>
                    <strong className="text-slate-800">Cause:</strong> {selectedIncident.probableCause}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/incidents")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View on Incidents Page</span>
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
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      PUMPING STATION · {selectedPumpStation.ward}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedPumpStation.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Operating Status</span>
                    <span
                      className={`font-bold ${selectedPumpStation.isAtCapacity ? "text-rose-600" : "text-emerald-600"
                        }`}
                    >
                      {selectedPumpStation.status}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Operating Load</span>
                    <span className="font-bold text-slate-900">{selectedPumpStation.capacity}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Pumps Running</span>
                    <span className="font-bold text-slate-900">{selectedPumpStation.pumpsRunning}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Discharge Rate</span>
                    <span className="font-bold text-slate-900">{selectedPumpStation.dischargeRate}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <strong className="text-slate-800">Connected Outfall:</strong>{" "}
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
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      CATCHMENT RISK BASIN
                    </span>
                    <h3 className="text-sm font-bold text-slate-950 mt-0.5">
                      {selectedRiskZone.districtName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Affected Area</span>
                    <span className="font-bold text-slate-900">{selectedRiskZone.affectedArea}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Rainfall</span>
                    <span className="font-bold text-slate-900">{selectedRiskZone.rainfall}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Drainage Load</span>
                    <span className="font-bold text-slate-900">{selectedRiskZone.drainageLoad}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/incidents")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Incident Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: FIELD SENSOR STREAM & CENTERED HOTSPOT HEADING                  */}
        {/* ========================================================================= */}
        <div className="pt-8 sm:pt-12">
          {/* Centered Hotspot Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block text-[11px] font-mono font-bold text-cyan-700 tracking-[0.2em] uppercase mb-2">
              FIELD SENSOR STREAM
            </span>
            <div className="flex justify-center">
              <SplitText
                text="Active Ground Inundation Hotspots"
                className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight text-center"
                delay={50}
                duration={1.25}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
                tag="h2"
                onLetterAnimationComplete={() => { }}
                showCallback
              />
            </div>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Live field data, citizen reports and sensor streams to identify and respond faster.
            </p>
            <div className="mt-3.5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigate("/incidents")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800 transition-colors cursor-pointer group"
              >
                <span>Explore All Incidents</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 6: HOTSPOT CARDS -> ACCORDION GALLERY                           */}
          {/* ======================================================================= */}
          <AccordionGallery
            items={hotspotGalleryItems}
            defaultIndex={2}
            expandRatio={0.52}
            trigger="hover"
            accentColor="#ffffff"
            overlayColor="#060010"
            textColor="#ffffff"
            grayscale
            showLabels
            duration={0.6}
            ease="power3.out"
            parallax={0.5}
            tilt={8}
            stagger={0.06}
            height={460}
            gap={10}
            radius={15}
            orientation="horizontal"
          />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7: SHORT SUBHEADING                                               */}
        {/* ========================================================================= */}
        <div className="text-center max-w-xl mx-auto pt-6 pb-2">
          <span className="inline-block text-[11px] font-mono font-bold text-cyan-800 tracking-[0.2em] uppercase mb-1">
            CITYWIDE CAPACITY & IMPACT
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Hydrological Telemetry & Outfall Impact
          </h3>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 8: FOUR FINAL IMPACT STATISTICS (MoltenMetal Background)          */}
        {/* ========================================================================= */}
        <section className="relative rounded-[26px] overflow-hidden p-5 sm:p-7 border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
          {/* MoltenMetal Animated Background Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <MoltenMetal
              color1="#061bc4"
              color2="#d0c5cf"
              color3="#FFFFFF"
              speed={0.35}
              scale={4}
              detail={3}
              glow={1.6}
              coreSize={0.1}
              swirl={1}
              fold={-0.2}
              blackPoint={0.05}
              brightness={1.3}
              colorMode="molten"
              grain
              grainIntensity={0.05}
              mouseInteraction
              mouseStrength={0.3}
              opacity={1}
            />
          </div>

          {/* Impact Content Layer */}
          <div className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative">
              {IMPACT_STATS.map((stat, idx) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: idx * 0.25,
                  }}
                  className="group relative p-6 rounded-[22px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-white transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Header with Icon */}
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                      {stat.icon}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-950 font-mono tracking-tight">
                        {stat.value}
                      </span>
                      {stat.unit && (
                        <span className="text-sm font-semibold text-slate-500 font-mono">
                          {stat.unit}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      {stat.label}
                    </div>
                  </div>

                  {/* Individual Impact Chart Graphic */}
                  <div>{stat.chart}</div>

                  {/* Sequential Data Signal Connector (Visible on Large Screens between items) */}
                  {idx < IMPACT_STATS.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="w-6 h-[2px] bg-cyan-200/80 relative overflow-hidden rounded-full">
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "linear",
                            delay: idx * 0.4,
                          }}
                          className="w-3 h-full bg-cyan-600 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* SECTION 9: FOOTER                                                         */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}

export default LiveCityPage;
