import {
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";

export function PhoneVerificationPipeline() {
  const {
    reportVerificationStage,
    isReportVerified,
    isReportSubmitted,
    setSelectedIncident,
    navigate,
  } = useKWIStore();

  const STAGES = [
    {
      id: 1,
      name: "Location Analysis",
      tag: "Ward 31 (Bidhannagar)",
      detail:
        "GPS Lat: 22.5735° N, Long: 88.4331° E. Triangulated within municipal GIS catchment boundary.",
      metric: "±3m GPS Accuracy",
      status: "VERIFIED",
    },
    {
      id: 2,
      name: "Image Analysis",
      tag: "Vehicular Asphalt Inundation",
      detail:
        "Hydro-Vision model identified surface water accumulation across 2 lanes with vehicular wake.",
      metric: "96.2% Confidence",
      status: "DETECTED",
    },
    {
      id: 3,
      name: "Condition Assessment",
      tag: "Catchment Inlet Silt Obstruction",
      detail:
        "Surface inlet capacity constrained by stormwater silt. Correlated with Bagjola Canal branch.",
      metric: "Flow Throttled: 64%",
      status: "VERIFIED",
    },
    {
      id: 4,
      name: "Water Depth",
      tag: "28 cm ± 2.0 cm",
      detail:
        "Calculated using standard 15 cm concrete curb marker reference and taxi wheel submersion ratio.",
      metric: "Critical Depth >15cm",
      status: "COMPUTED",
    },
    {
      id: 5,
      name: "Duplicate Check",
      tag: "Aggregated to #SV-024",
      detail:
        "Matched with 17 citizen and officer signals within 200m radius into unified operational incident.",
      metric: "18 Linked Signals",
      status: "CORRELATED",
    },
  ];

  const handleOpenLiveCity = () => {
    setSelectedIncident({
      id: "#SV-024",
      name: "Sector V Incident #SV-024",
      subdivision: "SECTOR V // SALT LAKE",
      location: "College More & Ring Road, Salt Lake Sector V",
      x: 6.2,
      y: -2.0,
      timestamp: "10:42 AM",
      waterDepth: "28 cm",
      rainfall: "74 mm / 3 hr",
      verifiedReports: 18,
      affectedArea: "12,400 m²",
      riskScore: "82 / 100",
      connectedDrainage: "Sector V Main Trunk",
      nearestPump: "PS-07",
      probableCause: "Rainfall exceeding local drainage capacity.",
      severity: "HIGH",
      severityColor: "#d64545",
      status: "Needs Intervention",
      workOrderId: "WO-2026-0323-0041",
    });
    navigate("/live-city");
  };

  return (
    <div className="space-y-4 text-left">
      {/* Verification Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block font-mono">
            AI DRAINAGE PLATFORM
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-950">
            Five-Stage Validation Pipeline
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
              isReportVerified
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : isReportSubmitted
                  ? "text-blue-700 bg-blue-50 border-blue-200"
                  : "text-slate-600 bg-slate-50 border-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isReportVerified
                ? "94.8% Confidence · VERIFIED"
                : isReportSubmitted
                  ? "Validating Ground Truth…"
                  : "Ready for Signal"}
            </span>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Incoming citizen reports undergo automated coordinate cross-referencing,
        multi-scale convolutional depth estimation, and spatial clustering
        before municipal dispatch.
      </p>

      {/* 5-Stage Synchronized Cards */}
      <div className="space-y-2.5 pt-1">
        {STAGES.map((stage) => {
          const isDone =
            isReportSubmitted && reportVerificationStage >= stage.id;
          const isCurrent =
            isReportSubmitted &&
            reportVerificationStage === stage.id &&
            !isReportVerified;

          return (
            <div
              key={stage.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isDone
                  ? "bg-white border-slate-200 shadow-2xs"
                  : isCurrent
                    ? "bg-blue-50/40 border-blue-400 shadow-xs"
                    : "bg-slate-50/60 border-slate-200/80 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isDone
                        ? "bg-emerald-100 border border-emerald-200 text-emerald-700"
                        : isCurrent
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {stage.id}. {stage.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {stage.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {isDone || isCurrent
                        ? stage.detail
                        : "Awaiting automated check…"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
                      isDone
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isCurrent
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    {isDone
                      ? stage.status
                      : isCurrent
                        ? "IN PROGRESS"
                        : "PENDING"}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">
                    {stage.metric}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Action Banner */}
      <div className="mt-4 p-4 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            {isReportVerified
              ? "Signal Confirmed · Dispatched to Ward 31 Drainage Desk"
              : isReportSubmitted
                ? "Signal in Verification Pipeline…"
                : "Submit Report on Phone to Trigger AI Verification"}
          </span>
          <span className="text-xs text-slate-600 mt-0.5 block">
            Linked to Incident #SV-024 · Connected to Pump Station PS-07
          </span>
        </div>

        {isReportVerified && (
          <button
            type="button"
            onClick={handleOpenLiveCity}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all active:scale-[0.98] flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <span>View on Live Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default PhoneVerificationPipeline;
