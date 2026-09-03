import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Plus, Minus, RotateCcw, Waves } from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
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
    clearSelections,
    navigate,
    highRiskZonesCount,
    criticalIncidentsCount,
    rainfallDisplay,
    pumpsAtCapacityCount,
  } = store;

  const [traceWaterFlow, setTraceWaterFlow] = useState(false);

  const LAYER_KEYS = [
    { key: "rain", label: "Rainfall" },
    { key: "risk", label: "Risk" },
    { key: "incidents", label: "Incidents" },
    { key: "drainage", label: "Drainage" },
    { key: "pumps", label: "Pumps" },
    { key: "forecast", label: "Forecast" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header Navigation */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* 3. Main Operational Workspace */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex flex-col gap-6">
        {/* Page Title & Operational Status Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-slate-200/80 gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-1 block">
              MUNICIPAL MONITORING · 11:24 AM IST
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Live Map
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Track rainfall, flood risk and drainage conditions across Kolkata
              in real-time.
            </p>
          </div>

          {/* Clean Typographic Status Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-semibold text-slate-900">
                {highRiskZonesCount}
              </span>
              <span>high-risk zones</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-slate-900">
                {criticalIncidentsCount}
              </span>
              <span>critical incidents</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-semibold text-slate-900">
                {rainfallDisplay}
              </span>
              <span>rainfall</span>
            </div>
            <span className="text-slate-300 hidden md:inline">|</span>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="font-semibold text-slate-900">
                {pumpsAtCapacityCount}
              </span>
              <span>pumps at capacity</span>
            </div>
          </div>
        </div>

        {/* Map Layer & Interactive Toolbars */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              LAYERS:
            </span>
            {LAYER_KEYS.map((layer) => {
              const active = activeLayers[layer.key];
              return (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => toggleLayer(layer.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {layer.label}
                </button>
              );
            })}

            {/* Signature "Trace Water Flow" Action Toggle */}
            <button
              type="button"
              onClick={() => setTraceWaterFlow(!traceWaterFlow)}
              className={`ml-2 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                traceWaterFlow
                  ? "bg-cyan-700 text-white shadow-2xs"
                  : "bg-white text-cyan-800 hover:bg-cyan-50 border border-cyan-300"
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Trace Water Flow</span>
            </button>
          </div>

          {/* Viewport Zoom & Reset Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={triggerZoomIn}
              className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={triggerZoomOut}
              className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={triggerResetCamera}
              className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Large Map Container */}
        <div className="relative w-full h-[640px] rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {/* Authentic 2.5D Cartographic Map with Water Flow Support */}
          <KolkataGisMap traceWaterFlow={traceWaterFlow} />

          {/* Quiet GIS Legend (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-3 text-[11px] shadow-xs space-y-2 pointer-events-auto">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Risk Severity
              </span>
              <div className="flex items-center gap-3 text-slate-700">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4f9160]" />
                  Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#d99b38]" />
                  Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#e07a38]" />
                  High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#d64545]" />
                  Critical
                </span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex items-center gap-3 text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#5c94b8]" />
                Rain
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#2e8b8f]" />
                Drainage
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#2e8b8f]" />
                Pump
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d64545]" />
                Incident
              </span>
            </div>
          </div>

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
      </main>
    </div>
  );
}

export default LiveCityPage;
