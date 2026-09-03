import { useState } from "react";
import { motion } from "framer-motion";
import { useKWIStore } from "../../store/useKWIStore";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { ACTIVE_INCIDENTS } from "../gis/kolkataCartographicData";

export function IncidentsView() {
  const { setSelectedIncident, navigate } = useKWIStore();
  const [selectedId, setSelectedId] = useState(ACTIVE_INCIDENTS[0].id);

  const activeIncident =
    ACTIVE_INCIDENTS.find((i) => i.id === selectedId) || ACTIVE_INCIDENTS[0];

  const handleViewOnMap = (inc) => {
    setSelectedIncident(inc);
    navigate("/live-city");
  };

  const handleCreateWorkOrder = () => {
    navigate("/action-center");
  };

  return (
    <div className="w-full font-sans text-slate-900 pb-16">
      {/* View Header */}
      <div className="max-w-2xl mb-10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 block mb-1">
          OPERATIONAL INTELLIGENCE · 11:24 AM IST
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Active Water Incidents
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          Monitor and investigate active water-related incidents across Kolkata.
        </p>
      </div>

      {/* Two-Column Layout: Left List / Right Selected Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-6 space-y-3">
          {ACTIVE_INCIDENTS.map((inc) => {
            const isSelected = inc.id === selectedId;
            const isCrit =
              inc.severity === "HIGH" || inc.severity === "CRITICAL";

            return (
              <div
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCrit ? "bg-rose-600" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">
                      {inc.location}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      isCrit
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="font-mono text-slate-500">{inc.id}</span>
                  <span>•</span>
                  <span>
                    Depth:{" "}
                    <strong className="text-slate-900">{inc.waterDepth}</strong>
                  </span>
                  <span>•</span>
                  <span>{inc.verifiedReports} verified reports</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Incident Detailed Card */}
        {activeIncident && (
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                  INCIDENT {activeIncident.id} · {activeIncident.subdivision}
                </span>
                <h2 className="text-xl font-bold text-slate-950 mt-1">
                  {activeIncident.location}
                </h2>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Reported: {activeIncident.timestamp} · Status:{" "}
                  {activeIncident.status}
                </span>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  activeIncident.severity === "HIGH" ||
                  activeIncident.severity === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {activeIncident.severity}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Risk Score
                </span>
                <span className="text-base font-bold text-slate-900">
                  {activeIncident.riskScore}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Water Depth
                </span>
                <span className="text-base font-bold text-rose-600">
                  {activeIncident.waterDepth}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Rainfall
                </span>
                <span className="text-base font-bold text-slate-900">
                  {activeIncident.rainfall}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Citizen Reports
                </span>
                <span className="text-base font-bold text-slate-900">
                  {activeIncident.verifiedReports}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Affected Area
                </span>
                <span className="text-base font-bold text-slate-900">
                  {activeIncident.affectedArea}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Nearest Pump
                </span>
                <span className="text-base font-bold text-slate-900">
                  {activeIncident.nearestPump}
                </span>
              </div>
            </div>

            {/* Drainage Context */}
            <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <div>
                <strong className="text-slate-900">Connected Drainage:</strong>{" "}
                {activeIncident.connectedDrainage}
              </div>
              <div>
                <strong className="text-slate-900">Probable Cause:</strong>{" "}
                {activeIncident.probableCause}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
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
