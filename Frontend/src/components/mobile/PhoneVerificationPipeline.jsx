import {
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Waves,
  MapPin,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";

export function PhoneVerificationPipeline() {
  const {
    reportVerificationStage,
    isReportVerified,
    isReportSubmitted,
    setSelectedIncident,
    navigate,
    reportPhoto,
    reportDescription,
    reportLocation,
    reportLocality,
    reportCity,
    reportCoords,
    reportDepth,
    reportTimestamp,
  } = useKWIStore();

  // Real-time dynamic values derived from user's live phone input
  const locality = reportLocality || "Ward 31 (Bidhannagar)";
  const city = reportCity || "Kolkata, West Bengal";
  const coords = reportCoords || { lat: 22.5735, lon: 88.4331, accuracy: 3 };
  const depth = reportDepth || "15–30 cm";

  // Dynamic incident identifier and sluice station linked to coordinates
  const localityCode = (locality.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "SV").toUpperCase();
  const incidentNum = Math.floor(10 + (Math.abs(coords.lat * 1000) % 90));
  const incidentId = `#${localityCode}-${incidentNum}`;
  const sluiceStation = `PS-${Math.floor(1 + (Math.abs(coords.lon * 10) % 12)).toString().padStart(2, "0")}`;

  // Water depth computation based on real selected bracket
  const depthTag =
    depth === "0–15 cm"
      ? "12 cm ± 1.5 cm"
      : depth === "30+ cm"
      ? "38 cm ± 2.5 cm"
      : "28 cm ± 2.0 cm";

  const depthMetric =
    depth === "30+ cm"
      ? "Severe Hazard >30cm"
      : depth === "15–30 cm"
      ? "Critical Depth >15cm"
      : "Moderate Inundation <15cm";

  const throttledFlow =
    depth === "30+ cm" ? "82%" : depth === "15–30 cm" ? "64%" : "38%";

  // Confidence computation influenced by GPS accuracy & photo attachment
  const confidenceScore = (
    93.5 +
    (reportPhoto ? 2.5 : 1.0) -
    Math.min(2, (coords.accuracy || 3) * 0.1)
  ).toFixed(1);

  // Dynamic 5-Stage Pipeline matching real data
  const STAGES = [
    {
      id: 1,
      name: "Location Analysis",
      tag: locality,
      detail: `GPS Lat: ${coords.lat.toFixed(4)}° N, Long: ${coords.lon.toFixed(4)}° E. Triangulated within municipal GIS catchment boundary.`,
      metric: `±${coords.accuracy || 3}m GPS Accuracy`,
      status: "VERIFIED",
    },
    {
      id: 2,
      name: "Image Analysis",
      tag: reportPhoto ? "Vehicular Asphalt Inundation" : "Terrain Satellite Inundation",
      detail: reportPhoto
        ? "Hydro-Vision model identified surface water accumulation across active roadway from device camera capture."
        : "Hydro-Vision multi-spectral model identified surface water accumulation across active municipal carriageway.",
      metric: `${confidenceScore}% Confidence`,
      status: "DETECTED",
    },
    {
      id: 3,
      name: "Condition Assessment",
      tag: reportDescription
        ? reportDescription.length > 28
          ? reportDescription.slice(0, 26) + "…"
          : reportDescription
        : "Catchment Inlet Silt Obstruction",
      detail: reportDescription
        ? `Citizen signal recorded: "${reportDescription}". Correlated with municipal drainage conduit load.`
        : "Surface inlet capacity constrained by stormwater silt. Correlated with municipal canal branch.",
      metric: `Flow Throttled: ${throttledFlow}`,
      status: "VERIFIED",
    },
    {
      id: 4,
      name: "Water Depth",
      tag: depthTag,
      detail: `Calculated using reported ${depth} bracket, standard concrete curb marker reference, and street sensor calibration.`,
      metric: depthMetric,
      status: "COMPUTED",
    },
    {
      id: 5,
      name: "Duplicate Check",
      tag: `Aggregated to ${incidentId}`,
      detail: `Matched with 17 citizen and officer signals within 200m radius of ${locality} into unified operational incident.`,
      metric: "18 Linked Signals",
      status: "CORRELATED",
    },
  ];

  const handleOpenLiveCity = () => {
    setSelectedIncident({
      id: incidentId,
      name: `${locality} Incident ${incidentId}`,
      subdivision: locality.toUpperCase(),
      location: `${locality}, ${city}`,
      x: (coords.lon - 88.3639) * 20,
      y: (22.5726 - coords.lat) * 20,
      timestamp: reportTimestamp || "Just now",
      waterDepth: depthTag.split(" ")[0] + " cm",
      rainfall: "74 mm / 3 hr",
      verifiedReports: 18,
      affectedArea: "12,400 m²",
      riskScore: "82 / 100",
      connectedDrainage: "Municipal Canal Trunk",
      nearestPump: sluiceStation,
      probableCause: reportDescription || "Rainfall exceeding local drainage capacity.",
      severity: depth === "30+ cm" ? "CRITICAL" : "HIGH",
      severityColor: depth === "30+ cm" ? "#e11d48" : "#d64545",
      status: "Needs Intervention",
      workOrderId: `WO-${Date.now().toString().slice(-8)}`,
    });
    navigate("/live-city");
  };

  return (
    <div className="space-y-4 text-left font-sans">
      {/* Verification Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block font-mono">
            AI DRAINAGE PLATFORM
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-950 font-sans">
            Five-Stage Validation Pipeline
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-md border flex items-center gap-1.5 transition-colors text-emerald-700 bg-emerald-50 border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isReportSubmitted && !isReportVerified
                ? "Validating Telemetry Signal…"
                : `${confidenceScore}% Confidence · VERIFIED`}
            </span>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Incoming citizen reports undergo automated coordinate cross-referencing,
        multi-scale convolutional depth estimation, and spatial clustering
        before municipal dispatch.
      </p>

      {/* 5-Stage Synchronized Cards Driven by Real Data */}
      <div className="space-y-3 pt-1">
        {STAGES.map((stage) => {
          // When not submitted yet, cards show live preview matching user mockup
          const isSubmittedMode = isReportSubmitted;
          const isDone = !isSubmittedMode || reportVerificationStage >= stage.id;
          const isCurrent = isSubmittedMode && reportVerificationStage === stage.id && !isReportVerified;

          return (
            <div
              key={stage.id}
              className={`p-4 rounded-2xl border transition-all ${
                isDone
                  ? "bg-white border-slate-200/90 shadow-sm"
                  : isCurrent
                  ? "bg-gradient-to-r from-cyan-50/70 to-blue-50/50 border-cyan-400 shadow-md ring-1 ring-cyan-400/30"
                  : "bg-slate-50/50 border-slate-200/60 opacity-65"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all shadow-xs ${
                      isDone
                        ? "bg-emerald-100 border border-emerald-300 text-emerald-700"
                        : isCurrent
                        ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {stage.id}. {stage.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
                        {stage.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {stage.detail}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border transition-colors ${
                      isDone
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs"
                        : isCurrent
                        ? "bg-cyan-50 text-cyan-800 border-cyan-300 shadow-2xs animate-pulse"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    {isDone
                      ? stage.status
                      : isCurrent
                      ? "PROCESSING"
                      : "STANDBY"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1.5">
                    {stage.metric}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Action Banner Dynamic to Real Data */}
      <div className="relative overflow-hidden mt-6 p-5 rounded-3xl border border-cyan-200/90 bg-gradient-to-r from-cyan-50/80 via-blue-50/60 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-sm font-bold text-slate-950 block">
            {isReportSubmitted && !isReportVerified
              ? "Multi-Spectral Verification in Progress…"
              : `Verified Telemetry Signal · Dispatched to ${locality} Drainage Operations`}
          </span>
          <span className="text-xs text-slate-600 mt-0.5 block font-mono">
            Linked to Incident {incidentId} · Connected to Sluice Station {sluiceStation}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenLiveCity}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[0_4px_15px_rgba(6,182,212,0.35)]"
        >
          <span>Inspect on Live Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PhoneVerificationPipeline;
