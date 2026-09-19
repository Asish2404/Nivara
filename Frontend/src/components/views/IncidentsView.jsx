import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useKWIStore } from "../../store/useKWIStore";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { CardSpotlight } from "../ui/CardSpotlight";
import { BorderBeam } from "../ui/BorderBeam";
import {
  aggregateIncidentsFromReports,
  mapIncidentQueueToCards,
} from "../../utils/incidentAggregator";

export function IncidentsView() {
  const {
    selectedIncident,
    setSelectedIncident,
    navigate,
    allReports,
    myReports,
    incidentQueue,
    fetchAllReports,
    fetchIncidentQueue,
  } = useKWIStore();

  useEffect(() => {
    fetchAllReports?.().catch(() => {});
    fetchIncidentQueue?.().catch(() => {});
  }, [fetchAllReports, fetchIncidentQueue]);

  const combinedReports = useMemo(() => {
    return [
      ...(allReports || []),
      ...(myReports || []).filter(
        (mr) => !(allReports || []).some((ar) => ar.report_id === mr.report_id)
      ),
    ];
  }, [allReports, myReports]);

  const dynamicIncidents = useMemo(() => {
    if (Array.isArray(incidentQueue)) {
      return mapIncidentQueueToCards(incidentQueue);
    }
    return [];
  }, [incidentQueue]);


  const [selectedId, setSelectedId] = useState(
    selectedIncident?.id || dynamicIncidents[0]?.id || ""
  );

  useEffect(() => {
    if (selectedIncident?.id) {
      setSelectedId(selectedIncident.id);
    } else if (!selectedId && dynamicIncidents.length > 0) {
      setSelectedId(dynamicIncidents[0].id);
    }
  }, [selectedIncident, selectedId, dynamicIncidents]);

  const activeIncident =
    dynamicIncidents.find((i) => i.id === selectedId) || dynamicIncidents[0] || null;

  const handleViewOnMap = (inc) => {
    setSelectedIncident(inc);
    navigate("/live-city");
  };

  const handleCreateWorkOrder = () => {
    navigate("/action-center");
  };

  return (
    <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-16">
      {/* View Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/5 border border-cyan-500/20 text-xs text-cyan-800 font-mono mb-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-semibold tracking-wider">REAL-TIME HOTSPOT SURVEILLANCE</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-500 dark:text-slate-400">11:24 AM IST</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Active Water <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">Incidents & Hotspots</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          Continuous ground intelligence correlating citizen mobile geotags, computer vision depth estimation, and drainage canal backflow risks.
        </p>
      </div>

      {/* Two-Column Layout: Left List / Right Selected Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-6 space-y-3.5">
          {dynamicIncidents.map((inc) => {
            const isSelected = inc.id === selectedId;
            const isCrit =
              inc.severity === "HIGH" || inc.severity === "CRITICAL";
            const depthNum = parseFloat(inc.waterDepth) || 15;
            const depthPct = Math.min(Math.round((depthNum / 35) * 100), 100);

            return (
              <CardSpotlight
                key={inc.id}
                data-cursor="incident"
                onClick={() => setSelectedId(inc.id)}
                soundFreq={isSelected ? 1100 : 880}
                spotlightColor={isCrit ? "rgba(244, 63, 94, 0.12)" : "rgba(6, 182, 212, 0.12)"}
                borderColor={isCrit ? "rgba(244, 63, 94, 0.45)" : "rgba(6, 182, 212, 0.45)"}
                className={`p-5 cursor-pointer rounded-2xl ${
                  isSelected
                    ? "border-cyan-500 bg-gradient-to-r from-cyan-50/50 to-white dark:to-[#16213a] shadow-md ring-1 ring-cyan-400/40 -translate-y-0.5"
                    : "border-slate-200/90 bg-white dark:bg-[#16213a] dark:border-slate-700/90 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCrit ? "bg-rose-600 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-950 dark:text-white">
                      {inc.location}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
                      isCrit
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">
                  {inc.id} // {inc.subdivision}
                </div>

                {/* Depth Meter Bar */}
                <div className="space-y-1 mb-3 bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Inundation Depth:</span>
                    <span className="font-bold text-rose-600 font-mono">{inc.waterDepth}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 rounded-full"
                      style={{ width: `${depthPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>{inc.verifiedReports} verified reports</span>
                  <span className="text-cyan-700 font-semibold font-mono text-[11px] flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardSpotlight>
            );
          })}
        </div>

        {/* Right Column: Selected Incident Detailed Card with Border Beam */}
        {activeIncident && (
          <div className="lg:col-span-6 rounded-3xl border border-slate-200/90 bg-white dark:bg-[#16213a] dark:border-slate-700/90 p-6 shadow-xl space-y-6 relative overflow-hidden sticky top-24">
            <BorderBeam size={300} duration={12} colorFrom="#00f0ff" colorTo="#3b82f6" />
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase">
                  INCIDENT {activeIncident.id} · {activeIncident.subdivision}
                </span>
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white mt-1">
                  {activeIncident.location}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-mono">
                  Reported: {activeIncident.timestamp} · Status:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{activeIncident.status}</strong>
                </span>
              </div>

              <span
                className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${
                  activeIncident.severity === "HIGH" ||
                  activeIncident.severity === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                }`}
              >
                {activeIncident.severity}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block font-mono">
                  Risk Score
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {activeIncident.riskScore}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block font-mono">
                  Water Depth
                </span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {activeIncident.waterDepth}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block font-mono">
                  Rainfall
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {activeIncident.rainfall}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block font-mono">
                  Citizen Reports
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {activeIncident.verifiedReports} verified
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block font-mono">
                  Affected Area
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {activeIncident.affectedArea}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/30">
                <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block font-mono">
                  Nearest Pump
                </span>
                <span className="text-lg font-bold text-cyan-800 dark:text-cyan-400 font-mono">
                  {activeIncident.nearestPump}
                </span>
              </div>
            </div>

            {/* Drainage Context */}
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div>
                <strong className="text-slate-900 dark:text-white">Connected Drainage:</strong>{" "}
                {activeIncident.connectedDrainage}
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white">Probable Cause:</strong>{" "}
                {activeIncident.probableCause}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => handleViewOnMap(activeIncident)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>View on Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCreateWorkOrder}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Track Work Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IncidentsView;
