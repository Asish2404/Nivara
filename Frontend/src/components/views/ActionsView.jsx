import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";

export function ActionsView() {
  const { navigate, setSelectedIncident } = useKWIStore();
  const [currentStage, setCurrentStage] = useState(1); // 0: Recommended, 1: Dispatched, 2: In Progress, 3: Resolved

  const STAGES = ["Recommended", "Dispatched", "In Progress", "Resolved"];

  const handleAdvanceStage = () => {
    setCurrentStage((prev) => (prev < 3 ? prev + 1 : prev));
  };

  const handleViewIncidentOnMap = () => {
    navigate("/live-city");
  };

  return (
    <div className="w-full font-sans text-slate-900 pb-16">
      {/* Header */}
      <div className="max-w-2xl mb-10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 block mb-1">
          MUNICIPAL RESPONSE PIPELINE · 11:26 AM IST
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Kolkata Acts.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          Track the work from automated recommendation to physical resolution on
          the ground.
        </p>
      </div>

      {/* Clean Progression Indicator */}
      <div className="mb-10 max-w-2xl">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= currentStage;
            const isCurrent = idx === currentStage;
            return (
              <div
                key={stage}
                className="flex flex-col items-center relative z-10 bg-white px-2"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isCurrent
                      ? "text-blue-600 font-bold"
                      : isCompleted
                        ? "text-slate-900"
                        : "text-slate-400"
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Large Clean Work-Order Card */}
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block tracking-wider">
              WORK ORDER
            </span>
            <span className="text-sm font-bold text-slate-950 font-mono">
              WO-2026-0323-0041
            </span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all ${
              currentStage === 3
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {STAGES[currentStage]}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Sector V Drainage Inspection & Pump Reinforcement
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Salt Lake, Sector V — Ring Road near College More intersection
          </p>
        </div>

        {/* Operational Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Priority
            </span>
            <span className="font-bold text-rose-600">HIGH</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Risk Score
            </span>
            <span className="font-bold text-slate-900">82 / 100</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Expected Impact
            </span>
            <span className="font-bold text-emerald-600">-11 cm depth</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Asset
            </span>
            <span className="font-bold text-slate-900">PS-07 Station</span>
          </div>
        </div>

        {/* Real Operational Details */}
        <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
          <div>
            <strong className="text-slate-900">Assigned Team:</strong> Drainage
            Quick Response Unit 04
          </div>
          <div>
            <strong className="text-slate-900">Equipment:</strong> 20 HP Godwin
            dewatering pump + suction de-silting unit
          </div>
          <div>
            <strong className="text-slate-900">Created:</strong> 11:26 AM IST ·
            ETA: 24 minutes
          </div>
          <div>
            <strong className="text-slate-900">Reason:</strong> Station PS-07
            operating at 100% capacity while Sector V receives 74 mm/3 hr
            rainfall.
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {currentStage < 3 ? (
            <button
              type="button"
              onClick={handleAdvanceStage}
              className="w-full sm:flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Mark as {STAGES[currentStage + 1]} →</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-full sm:flex-1 py-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-xs text-center">
              ✓ Work Order Completed & Verified Resolved
            </div>
          )}

          <button
            type="button"
            onClick={handleViewIncidentOnMap}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            View on Live Map
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionsView;
