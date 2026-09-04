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
  Eye,
  Layers,
  Radio,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { ACTIVE_INCIDENTS } from "../gis/kolkataCartographicData";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { BorderBeam } from "../ui/BorderBeam";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { CardSpotlight } from "../ui/CardSpotlight";
import { audioEngine } from "../../utils/audioEngine";
import { slideInRight } from "../../utils/motionVariants";

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
    { key: "rain", label: "Rainfall Radar", icon: "🌧️", color: "border-cyan-400/60 text-cyan-700 bg-cyan-50/70" },
    { key: "risk", label: "Flood Risk", icon: "⚠️", color: "border-amber-400/60 text-amber-700 bg-amber-50/70" },
    { key: "incidents", label: "Incidents", icon: "🚨", color: "border-rose-400/60 text-rose-700 bg-rose-50/70" },
    { key: "drainage", label: "Canal Conduits", icon: "🌊", color: "border-blue-400/60 text-blue-700 bg-blue-50/70" },
    { key: "pumps", label: "Sluice Pumps", icon: "⚡", color: "border-emerald-400/60 text-emerald-700 bg-emerald-50/70" },
    { key: "forecast", label: "60m Inundation", icon: "🔮", color: "border-purple-400/60 text-purple-700 bg-purple-50/70" },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50/60 text-slate-900 font-sans flex flex-col selection:bg-cyan-100 selection:text-cyan-900 overflow-hidden">
      {/* Ambient Top Radiant Glow & Micro-Grid for Live City Page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.18),rgba(59,130,246,0.08),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-0 inset-x-0 h-[480px] bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Header Navigation */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* 3. Main Operational Workspace */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex flex-col gap-6">
        {/* Page Title & Operational Eyebrow */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-2 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/5 border border-cyan-500/20 text-xs text-cyan-800 font-mono mb-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="font-semibold tracking-wider">LIVE MUNICIPAL TELEMETRY</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">41 HOOGHLY SLUICE GATES LINKED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Kolkata <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">Hydrological Command</span> Center
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              Real-time multi-spectral radar surveillance, runoff forecast isobars, and telemetry dispatch.
            </p>
          </div>

          {/* High-Tech System Heartbeat Badge */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs font-mono text-xs text-slate-600">
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

        {/* 4 Rich Holographic Operational Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSpotlight
            soundFreq={800}
            spotlightColor="rgba(244, 63, 94, 0.12)"
            borderColor="rgba(244, 63, 94, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-mono">
                HIGH-RISK CONTOURS
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
              <AnimatedNumber value={highRiskZonesCount} />
              <span className="text-xs font-normal text-slate-400 ml-1.5">ZONES</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>Sector V & Park Circus Basin</span>
            </div>
          </CardSpotlight>

          <CardSpotlight
            soundFreq={920}
            spotlightColor="rgba(245, 158, 11, 0.12)"
            borderColor="rgba(245, 158, 11, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                VERIFIED INCIDENTS
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
              <AnimatedNumber value={criticalIncidentsCount} />
              <span className="text-xs font-normal text-slate-400 ml-1.5">REPORTS</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Citizen Mobile Ingestion Live</span>
            </div>
          </CardSpotlight>

          <CardSpotlight
            soundFreq={1040}
            spotlightColor="rgba(6, 182, 212, 0.12)"
            borderColor="rgba(6, 182, 212, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 font-mono">
                RAINFALL INTENSITY
              </span>
              <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
              {rainfallDisplay}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>Alipore Doppler Reflectivity</span>
            </div>
          </CardSpotlight>

          <CardSpotlight
            soundFreq={1160}
            spotlightColor="rgba(16, 185, 129, 0.12)"
            borderColor="rgba(16, 185, 129, 0.45)"
            className="p-4 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                PUMP INFRASTRUCTURE
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
              <AnimatedNumber value={pumpsAtCapacityCount} />
              <span className="text-xs font-normal text-slate-400 ml-1.5">AT CAPACITY</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>85 Cusecs Outfall Discharge</span>
            </div>
          </CardSpotlight>
        </div>

        {/* Floating Layer Toolbar & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 text-white shadow-xl">
          {/* Layer Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-3 text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider mr-1">
              <Layers className="w-3.5 h-3.5" />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? `${layer.color} border shadow-[0_0_12px_rgba(6,182,212,0.3)] font-semibold`
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-transparent"
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
              className={`ml-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                traceWaterFlow
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  : "bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/40"
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
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
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
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
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
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Large Map Container with Border Beam Laser & Tactical HUD Framing */}
        <div id="gis-map-viewport" className="relative w-full h-[660px] rounded-3xl border border-slate-200/90 bg-slate-950 overflow-hidden shadow-2xl scroll-mt-24">
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
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/98 backdrop-blur-md border border-slate-200 rounded-xl p-5 shadow-lg space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      {selectedIncident.id} · {selectedIncident.subdivision}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedIncident.location}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Risk Score
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedIncident.riskScore}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Water Depth
                    </span>
                    <span className="font-bold text-rose-600">
                      {selectedIncident.waterDepth}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Rainfall
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedIncident.rainfall}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Citizen Reports
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedIncident.verifiedReports} verified
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <div>
                    <strong className="text-slate-800">Drainage:</strong>{" "}
                    {selectedIncident.connectedDrainage}
                  </div>
                  <div>
                    <strong className="text-slate-800">Cause:</strong>{" "}
                    {selectedIncident.probableCause}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/incidents")}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/98 backdrop-blur-md border border-slate-200 rounded-xl p-5 shadow-lg space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      PUMPING STATION · {selectedPumpStation.ward}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedPumpStation.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Operating Status
                    </span>
                    <span
                      className={`font-bold ${selectedPumpStation.isAtCapacity ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {selectedPumpStation.status}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Operating Load
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedPumpStation.capacity}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Pumps Running
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedPumpStation.pumpsRunning}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Discharge Rate
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedPumpStation.dischargeRate}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <strong className="text-slate-800">Connected Outfall:</strong>{" "}
                  {selectedPumpStation.connectedCanal}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/simulate")}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                className="absolute top-4 right-4 z-20 w-full max-w-sm bg-white/98 backdrop-blur-md border border-slate-200 rounded-xl p-5 shadow-lg space-y-3 pointer-events-auto"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      CATCHMENT RISK BASIN
                    </span>
                    <h3 className="text-sm font-bold text-slate-950 mt-0.5">
                      {selectedRiskZone.districtName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelections}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Affected Area
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedRiskZone.affectedArea}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Rainfall
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedRiskZone.rainfall}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      Drainage Load
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedRiskZone.drainageLoad}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/incidents")}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Incident Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Real-time Field Incident Stream Deck */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-mono font-bold text-cyan-600 uppercase tracking-wider block">
                FIELD SENSOR STREAM
              </span>
              <h2 className="text-xl font-bold text-slate-950">
                Active Ground Inundation Hotspots
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/incidents")}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore All Incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACTIVE_INCIDENTS.map((inc) => {
              const isCrit = inc.severity === "CRITICAL" || inc.severity === "HIGH";
              const depthNumber = parseFloat(inc.waterDepth) || 15;
              const depthPercent = Math.min(Math.round((depthNumber / 35) * 100), 100);

              return (
                <CardSpotlight
                  key={inc.id}
                  soundFreq={880}
                  spotlightColor={isCrit ? "rgba(244, 63, 94, 0.12)" : "rgba(6, 182, 212, 0.12)"}
                  borderColor={isCrit ? "rgba(244, 63, 94, 0.45)" : "rgba(6, 182, 212, 0.45)"}
                  onClick={() => {
                    audioEngine.playUiChirp(1040);
                    setSelectedIncident(inc);
                    const mapElem = document.getElementById("gis-map-viewport");
                    if (mapElem) {
                      mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className="p-5 cursor-pointer bg-white/95 border-slate-200/90 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {inc.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCrit
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-0.5 line-clamp-1">
                    {inc.location}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono mb-4">
                    {inc.subdivision}
                  </div>

                  {/* Water Depth Progress Indicator */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Water Depth:</span>
                      <span className="font-bold text-rose-600 font-mono">{inc.waterDepth}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${depthPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {inc.verifiedReports} verified reports
                    </span>
                    <span className="text-cyan-700 font-semibold flex items-center gap-1">
                      <span>Center on Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardSpotlight>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default LiveCityPage;
