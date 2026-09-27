import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Zap,
  Activity,
  Cpu,
  TrendingDown,
  Droplets,
  BarChart3,
  Grid3X3,
  AlertTriangle,
  Info,
  Waves,
  ArrowRight,
  MapPin,
  Gauge,
  ChevronDown,
  Check,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import {
  aggregateIncidentsFromReports,
  mapIncidentQueueToCards,
  parseWaterDepthCm,
  getSeverityRank,
} from "../../utils/incidentAggregator";
import { audioEngine } from "../../utils/audioEngine";
import { calculateHydraulicSimulation } from "../../utils/hydraulicEngine";
import { KWITelemetryLoader } from "../ui/KWITelemetryLoader";
import { TRANSITION_EASE, DURATION } from "../../utils/motionVariants";

const SEVERITY_BADGE_STYLE = {
  CRITICAL: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60",
  HIGH: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-800/60",
  MODERATE: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60",
  LOW: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60",
  MONITORING: "text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950/40 dark:border-cyan-800/60",
};

/* ── Premium Custom Toggle with Cyan Glow ───────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 cursor-pointer ${checked
        ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.45)]"
        : "bg-slate-200"
        }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${checked ? "translate-x-5 bg-white" : "translate-x-0 bg-white"
          }`}
      />
    </button>
  );
}

/* ── Premium Simulation Workflow Stepper ────────────────────────── */
function TimelineStep({ num, label, sublabel, active, done, isSimulating }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
      <div
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10.5px] sm:text-xs border transition-all duration-300 shrink-0 ${done
          ? "bg-emerald-600 border-emerald-600 text-white font-medium shadow-xs"
          : active
            ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold ring-2 ring-blue-100 shadow-xs"
            : "bg-slate-50 border-slate-200 text-slate-500 font-medium"
          }`}
      >
        {done ? (
          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
        ) : isSimulating && active ? (
          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-blue-600" />
        ) : (
          num
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`text-[11px] sm:text-[12.5px] leading-tight truncate ${done
            ? "text-emerald-700 font-semibold"
            : active
              ? "text-blue-700 font-semibold"
              : "text-slate-700 font-medium"
            }`}
        >
          {label}
        </div>
        <div className="hidden sm:block text-[11px] text-slate-500 font-normal truncate mt-0.5">
          {sublabel}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export function SimulateView() {
  const {
    navigate,
    incidents,
    incidentQueue,
    allReports,
    myReports,
    fetchAllReports,
    fetchIncidentQueue,
    pumpingStations,
    hooghlyTideLevel,
    hooghlyTideTrend,
    activeSimulationIncidentId,
    setActiveSimulationIncidentId,
    selectedIncident,
    setSelectedIncident,
    markIncidentSimulated,
    dispatchSimulationToWorkOrder,
    setLatestSimulationOutcome,
    dispatchedHotspotIds,
    createWorkOrder,
    resetDispatchedHotspots,
  } = useKWIStore();

  const [supervisorError, setSupervisorError] = useState("");
  const [isSubmittingWorkOrder, setIsSubmittingWorkOrder] = useState(false);

  // Load municipal reports and active incident queue on mount + poll periodically
  useEffect(() => {
    fetchAllReports?.().catch(() => { });
    fetchIncidentQueue?.().catch(() => { });
  }, [fetchAllReports, fetchIncidentQueue]);

  // Combine citizen reports from database & local preview
  const combinedReports = useMemo(() => {
    return [
      ...(allReports || []),
      ...(myReports || []).filter(
        (mr) => !(allReports || []).some((ar) => ar.report_id === mr.report_id)
      ),
    ];
  }, [allReports, myReports]);

  // Derive active incidents strictly from incident_queue table (matching Live City Map & Live Incident cards in same order)
  const sortedIncidents = useMemo(() => {
    if (Array.isArray(incidentQueue)) {
      return mapIncidentQueueToCards(incidentQueue);
    }
    if (Array.isArray(incidents)) {
      return incidents;
    }
    return [];
  }, [incidentQueue, incidents]);

  // Available incidents: filter out any that have been dispatched (popped)
  const availableIncidents = useMemo(() => {
    const dispatchedSet = new Set(
      (dispatchedHotspotIds || []).map((id) =>
        String(id).trim().replace(/^#/, "").toUpperCase()
      )
    );
    return (sortedIncidents || []).filter((inc) => {
      const cleanId = String(inc.id || "").trim().replace(/^#/, "").toUpperCase();
      const cleanConn = String(inc.connectedIncidentId || "").trim().replace(/^#/, "").toUpperCase();
      return !dispatchedSet.has(cleanId) && !dispatchedSet.has(cleanConn);
    });
  }, [sortedIncidents, dispatchedHotspotIds]);

  // Active Hotspot Selection (defaults to highest priority available hotspot)
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const hasUserManuallySelectedRef = useRef(false);

  // Clear supervisor error when selecting a different incident
  useEffect(() => {
    setSupervisorError("");
  }, [selectedIncidentId]);

  // Custom 5-item scrollable dropdown state & outside click handler
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isDropdownOpen]);

  // Isolate wheel scrolling to the dropdown so it never leaks to the parent page or triggers Lenis
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isDropdownOpen) return;

    const handleWheel = (e) => {
      e.stopPropagation();
      const { deltaY } = e;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll > 0) {
        // Prevent default page scroll leakage when scrolling inside the dropdown
        e.preventDefault();
        el.scrollTop += deltaY;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [isDropdownOpen]);

  // Auto-select highest priority available hotspot when Simulate page opens or availableIncidents updates
  useEffect(() => {
    if (availableIncidents.length > 0) {
      if (!hasUserManuallySelectedRef.current) {
        // Automatically default to highest priority (index 0)
        const topIncident = availableIncidents[0];
        setSelectedIncidentId(topIncident.id);
        setActiveSimulationIncidentId(topIncident.id);
      } else {
        // If user manually selected an incident in this session, check if it's still available (not popped)
        const exists = availableIncidents.some(
          (i) => i.id === selectedIncidentId || i.connectedIncidentId === selectedIncidentId
        );
        if (!exists) {
          const topIncident = availableIncidents[0];
          setSelectedIncidentId(topIncident.id);
          setActiveSimulationIncidentId(topIncident.id);
          hasUserManuallySelectedRef.current = false;
        }
      }
    }
  }, [availableIncidents, selectedIncidentId, setActiveSimulationIncidentId]);

  // Retrieve current active incident data from real reports table incidents
  const activeIncident = useMemo(() => {
    if (availableIncidents.length === 0) {
      return {
        id: "#ALL-CLEAR",
        connectedIncidentId: "CLEAR",
        ward: "Kolkata Drainage Area",
        location: "All Hotspots Dispatched · Rapid Response Units Active",
        waterLevel: "0 cm",
        waterLevelCm: 0,
        rainfall: "0 mm / 3 hr",
        affectedArea: "0 m²",
        riskScore: "10 / 100",
        nearestPump: "PS-07",
        probableCause: "All municipal hotspots have been dispatched to field crews.",
        severity: "MONITORING",
        isAllClear: true,
      };
    }

    return (
      availableIncidents.find(
        (i) =>
          i.id === selectedIncidentId ||
          i.aliasId === selectedIncidentId ||
          i.connectedIncidentId === selectedIncidentId ||
          (selectedIncidentId && (i.id.includes(selectedIncidentId) || selectedIncidentId.includes(i.id)))
      ) || availableIncidents[0]
    );
  }, [availableIncidents, selectedIncidentId]);

  // Retrieve nearest pumping station for the active incident with safe fallback
  const activeStation = useMemo(() => {
    const stationId = activeIncident?.nearestPump;
    const matched = (pumpingStations || []).find((p) => p.id === stationId);
    if (matched) return matched;
    return (
      (pumpingStations && pumpingStations[0]) || {
        id: "PS-07",
        name: "PS-07 Sector V Booster Station",
        dischargeRate: "85 cusecs",
        loadPct: 100,
        critical: true,
      }
    );
  }, [pumpingStations, activeIncident]);

  // Intervention Control States
  const [pumpCapacity, setPumpCapacity] = useState(100);
  const [crewDispatched, setCrewDispatched] = useState(true);
  const [extraPumpUnit, setExtraPumpUnit] = useState(true);

  // Simulation Timeline State: 'CURRENT' | 'SIMULATING' | 'RESULT'
  const [simState, setSimState] = useState("CURRENT");

  // Extracted Baseline Numeric Values with Complete Mathematical Safety (No NaN / Divide-by-Zero)
  const isQueueEmpty = availableIncidents.length === 0 || Boolean(activeIncident?.isAllClear);

  const baselineDepthCm = useMemo(() => {
    if (isQueueEmpty) return 0;
    const parsed = activeIncident?.waterLevelCm ?? parseWaterDepthCm(activeIncident?.waterDepth);
    return typeof parsed === "number" && !isNaN(parsed) && parsed > 0 ? parsed : 15.0;
  }, [activeIncident, isQueueEmpty]);

  const baselineRiskScore = useMemo(() => {
    if (isQueueEmpty) return 0;
    if (!activeIncident?.riskScore) return 65;
    const match = String(activeIncident.riskScore).match(/(\d+)/);
    const val = match ? parseInt(match[1], 10) : 65;
    return !isNaN(val) && val >= 10 && val <= 100 ? val : 65;
  }, [activeIncident, isQueueEmpty]);

  const baselineAreaM2 = useMemo(() => {
    if (isQueueEmpty) return 0;
    if (!activeIncident?.affectedArea) return 8500;
    const clean = String(activeIncident.affectedArea).replace(/[^0-9]/g, "");
    const val = clean ? parseInt(clean, 10) : 8500;
    return !isNaN(val) && val > 0 ? val : 8500;
  }, [activeIncident, isQueueEmpty]);

  const baselineDrainageLoad = useMemo(() => {
    if (isQueueEmpty) return 0;
    const load = activeStation?.loadPct;
    return typeof load === "number" && !isNaN(load) && load > 0 ? load : 80;
  }, [activeStation, isQueueEmpty]);

  const stationCapacityCusecs = useMemo(() => {
    if (!activeStation?.dischargeRate) return 85;
    const match = String(activeStation.dischargeRate).match(/(\d+)/);
    const val = match ? parseInt(match[1], 10) : 85;
    return !isNaN(val) && val > 0 ? val : 85;
  }, [activeStation]);

  // Dynamic Physical Hydraulic Simulation Result
  const simulationResult = useMemo(() => {
    return calculateHydraulicSimulation({
      baselineDepthCm,
      baselineAreaM2,
      baselineRiskScore,
      baselineDrainageLoad,
      stationMaxDischargeCusecs: stationCapacityCusecs,
      pumpCapacity,
      crewDispatched,
      extraPumpUnit,
      hooghlyTideLevel: hooghlyTideLevel || 3.42,
    });
  }, [
    baselineDepthCm,
    baselineAreaM2,
    baselineRiskScore,
    baselineDrainageLoad,
    stationCapacityCusecs,
    pumpCapacity,
    crewDispatched,
    extraPumpUnit,
    hooghlyTideLevel,
  ]);

  // Handle hotspot selection change
  const handleSelectIncident = (newId) => {
    audioEngine.playUiChirp(1000);
    hasUserManuallySelectedRef.current = true;
    setSelectedIncidentId(newId);
    setActiveSimulationIncidentId(newId);
    setSimState("CURRENT"); // reset timeline to re-evaluate new baseline
    setIsDropdownOpen(false);
  };

  // Run Simulation Handler
  const handleRunSimulation = () => {
    if (isQueueEmpty) return;
    audioEngine.playUiChirp(1200);
    setSimState("SIMULATING");
    setTimeout(() => {
      audioEngine.playUiChirp(1500);
      setSimState("RESULT");
      setLatestSimulationOutcome({
        ticketId: `WO-2026-${(selectedIncidentId || "001").replace(/[^a-zA-Z0-9]/g, "")}`,
        incidentId: selectedIncidentId,
        location: activeIncident.location,
        ...simulationResult,
      });
    }, 850);
  };

  const handleReset = () => {
    audioEngine.playUiChirp(800);
    setSimState("CURRENT");
  };

  const handleCreateWorkOrder = async () => {
    if (isQueueEmpty || isSubmittingWorkOrder) return;
    setSupervisorError("");
    setIsSubmittingWorkOrder(true);
    audioEngine.playUiChirp(1300);
    hasUserManuallySelectedRef.current = false;

    // 1. Determine index of current incident in available list before popping
    const currentIndex = availableIncidents.findIndex(
      (inc) =>
        inc.id === activeIncident.id ||
        inc.connectedIncidentId === activeIncident.connectedIncidentId ||
        inc.id === selectedIncidentId
    );

    // 2. Prepare remaining hotspots after this location is popped
    const remaining = availableIncidents.filter(
      (inc) =>
        inc.id !== activeIncident.id &&
        inc.connectedIncidentId !== activeIncident.connectedIncidentId &&
        inc.id !== selectedIncidentId
    );

    // 3. Determine next location to display in Target Hotspot section
    let nextIncident = null;
    if (remaining.length > 0) {
      const nextIndex = currentIndex >= 0 && currentIndex < remaining.length ? currentIndex : 0;
      nextIncident = remaining[nextIndex];
    }

    // 4. Construct high-fidelity Work Order payload with exact incident_id and WO-incident_id format
    const rawConnectedId = String(activeIncident.id || activeIncident.connectedIncidentId || "IN-101").replace(/^#/, "").trim();
    const cleanIncId = rawConnectedId;
    const ticketKey = `WO-${cleanIncId}`;
    const workOrderId = `WO-${cleanIncId}`;

    const assignedEquipmentList = [
      extraPumpUnit ? "20 HP Godwin High-Head Unit" : "25 HP Godwin High-Head Unit",
      crewDispatched ? "Unit 04 Inlet Desilting Unit" : "High-Volume Suction Desilter",
    ];

    const locClean = activeIncident.location ? activeIncident.location.split("(")[0].trim() : "Municipal Ward";
    const locShort = locClean.split(",")[0].trim();

    // 4. Construct selected intervention type from simulated parameters
    const interventionParts = [];
    if (pumpCapacity) {
      interventionParts.push(`Pump Load ${pumpCapacity}% (${Math.round((stationCapacityCusecs * pumpCapacity) / 100)} Cusecs)`);
    }
    if (extraPumpUnit) {
      interventionParts.push("25 HP Godwin High-Head Unit");
    }
    if (crewDispatched) {
      interventionParts.push("Inlet Desilting Taskforce");
    }
    const interventionType = interventionParts.length > 0
      ? interventionParts.join(" + ")
      : "Standard Hydraulic Drainage Response";

    const orderPayload = {
      id: workOrderId,
      ticketKey,
      incidentRef: `#${cleanIncId}`,
      incidentId: cleanIncId,
      location: locClean,
      lat: activeIncident.latitude ? `${Number(activeIncident.latitude).toFixed(4)}° N` : "22.5802° N",
      lng: activeIncident.longitude ? `${Number(activeIncident.longitude).toFixed(4)}° E` : "88.3685° E",
      borough: activeIncident.subdivision || activeIncident.ward || "KMC Borough V",
      priority: activeIncident.severity || "CRITICAL",
      status: "Dispatched",
      intervention_type: interventionType,
      interventionType: interventionType,
      stage: 1, // Step 2: Dispatched (matching exact reference screenshot)
      riskScore: `${activeIncident.riskScore ? String(activeIncident.riskScore).replace(/[^\d/]/g, '').trim() : `${baselineRiskScore} / 100`}`,
      expectedImpact: `-${simulationResult.depthReductionCm ?? 14} cm depth`,
      assignedNode: `${activeStation.id} ${activeStation.name ? activeStation.name.split(" ").slice(0, 3).join(" ") : "Booster Station"}`,
      assignedCrew: "Central Rapid Sluice Taskforce 01",
      chief: "Er. K. Bhattacharya",
      radio: "CH-01-TAC",
      equipment: assignedEquipmentList,
      eta: "12 minutes",
      trigger: simulationResult.dispatchSummary
        ? `Severe ${baselineDepthCm} cm street inundation at ${locShort}; ${simulationResult.dispatchSummary}`
        : `Severe ${baselineDepthCm} cm street inundation at ${locShort}; silt throttling circular gravity outfall.`,
      targetLabel: locShort,
    };

    const drainMins = simulationResult.clearanceHours
      ? Math.max(15, Math.round(simulationResult.clearanceHours * 22))
      : 22;

    const outcomeData = {
      baselineDepthCm: `${Math.round(baselineDepthCm)} cm (Critical)`,
      simulatedDepthCm: `${Math.round(simulationResult.simulatedDepthCm)} cm (-${simulationResult.depthReductionPct}% reduction)`,
      baselineAreaM2: `${baselineAreaM2.toLocaleString()} m² (Expanded)`,
      simulatedAreaM2: `${Math.round(simulationResult.simulatedAreaM2).toLocaleString()} m² (Contained)`,
      baselineDrainTime: "Over 4 hours",
      simulatedDrainTime: `${drainMins} mins`,
    };

    // 5. Attempt work order creation with backend supervisor validation
    try {
      await createWorkOrder(
        {
          ...orderPayload,
          simulationOutcome: outcomeData,
        },
        { redirectTo: "/respond" }
      );

      // 6. Keep active incident selected in store and mark as simulated on success
      if (activeIncident) {
        setSelectedIncident?.(activeIncident);
        if (activeIncident.id) {
          setActiveSimulationIncidentId?.(activeIncident.id);
          markIncidentSimulated?.(activeIncident.id, outcomeData);
        }
      }
    } catch (err) {
      if (audioEngine?.playUiChirp) audioEngine.playUiChirp(400);
      const errMsg = err?.message || "No supervisor is currently available.";
      setSupervisorError(errMsg);
    } finally {
      setIsSubmittingWorkOrder(false);
    }
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Baseline Gauge SVG Dash Offset
  const baselineDashOffset = 251.2 * (1 - Math.min(1, Math.max(0.12, baselineDepthCm / 36)));

  // Simulated Outcome Gauge SVG Dash Offset
  const simulatedDashOffset =
    251.2 * (1 - Math.min(1, Math.max(0.06, simulationResult.simulatedDepthCm / 36)));

  return (
    /*
     * SimulateView content area:
     *   - Shows panoramic Kolkata Golden Sunset with Heritage Dome, Yellow Taxis & Vintage Tram edge-to-edge
     */
    <div className="w-full min-h-screen bg-[#f3f7fb] dark:bg-[#0A1E3B] text-slate-900 dark:text-[#F0F9FA] transition-colors duration-300 pb-16 font-sans relative overflow-x-clip">
      {/* Floating Supervisor Unavailable Alert Toast */}
      <AnimatePresence>
        {supervisorError && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-rose-300 dark:border-rose-800 shadow-[0_12px_36px_rgba(225,29,72,0.25)] text-rose-800 dark:text-rose-300 text-sm font-semibold"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1 pr-2">
              <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Supervisor Assignment Blocked</div>
              <div className="text-[13px] font-semibold text-rose-900 dark:text-rose-200 mt-0.5">{supervisorError}</div>
            </div>
            <button
              type="button"
              onClick={() => setSupervisorError("")}
              className="w-7 h-7 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 flex items-center justify-center text-rose-500 text-sm transition-colors cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute -top-28 sm:-top-32 lg:-top-36 inset-x-0 bottom-0 z-0 overflow-hidden pointer-events-none">
        {/* Light Theme Golden Sunset Tram Photography */}
        <img
          src="/images/sky3.png"
          alt="Kolkata Heritage Building at Golden Sunset with Yellow Taxis and Vintage Tram"
          className="w-full h-full object-cover object-[center_36%] sm:object-[center_32%] filter contrast-[1.04] brightness-[1.01] saturate-[1.02] dark:hidden transition-all duration-300"
          onError={(e) => {
            e.currentTarget.src = "/images/kolkata_heritage_street_extreme_wide.jpg";
          }}
        />

        {/* Dark Theme Night Tram & Illuminated Heritage Photography */}
        <img
          src="/images/Simulate_Page_Dark_bg1.png"
          alt="Kolkata Heritage Golden Sunset Dark"
          className="w-full h-full object-cover object-[center_36%] sm:object-[center_32%] filter contrast-[1.06] brightness-[1.0] saturate-[1.06] hidden dark:block transition-all duration-300"
          onError={(e) => {
            e.currentTarget.src = "/images/Simulate_Page_Dark_bg.png";
          }}
        />

        {/* LIGHT ATMOSPHERIC LAYER */}
        <div className="absolute inset-0 bg-white/10 dark:hidden" />

        {/* Subtle dark atmospheric layer — restricted strictly to dark mode */}
        <div className="absolute inset-0 bg-[#06152B]/45 hidden dark:block" />

        {/* LIGHT FOOTER BLEND — Long, soft atmospheric transition into Footer */}
        <div
          className="absolute inset-x-0 bottom-0 h-[380px] sm:h-[480px] pointer-events-none dark:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.12) 45%, rgba(255, 255, 255, 0.30) 65%, rgba(255, 255, 255, 0.60) 82%, rgba(255, 255, 255, 0.88) 94%, #ffffff 100%)",
          }}
        />

        {/* Smooth Dark blend into fixed footer — restricted strictly to dark mode */}
        <div className="absolute inset-x-0 bottom-0 h-[280px] bg-gradient-to-t from-[#0A1E3B] via-[#0A1E3B]/75 to-transparent hidden dark:block" />
      </div>

      {/* Light Theme Subpixel Seam Bridge across SimulateView / Footer boundary */}
      <div
        className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none bg-white dark:hidden z-10"
        aria-hidden="true"
      />

      {/* ── 1. Hero Section with Header Content & Target Selector ── */}
      <div className={`relative ${isDropdownOpen ? "z-40" : "z-20"} max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-12 sm:pt-10 sm:pb-16 font-sans`}>
        {/* Ambient Blue/Cyan Glow Sphere behind Header */}
        <div className="absolute -left-10 -top-8 w-80 h-44 bg-gradient-to-br from-blue-500/20 via-cyan-400/15 to-transparent dark:from-[#00E5FF]/20 dark:via-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-white/80 dark:border-slate-700/60 text-[11px] sm:text-[12px] text-slate-700 dark:text-slate-200 mb-3 shadow-[0_4px_16px_rgba(15,23,42,0.05),0_0_12px_rgba(59,130,246,0.12)] backdrop-blur-xl max-w-full">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="font-bold text-slate-900 dark:text-white">Hydraulic Intervention Modeling</span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="text-blue-600 dark:text-cyan-400 font-semibold">Scenario Simulator</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-[35px] font-extrabold tracking-tight text-white dark:text-[#F2FBFD] mb-2 leading-tight">
              Simulate Drainage Interventions
            </h1>
            <p className="text-xs sm:text-[13.5px] text-white/90 dark:text-[#B2D2D9] max-w-2xl leading-relaxed font-normal">
              Test pumping station boosts, inlet desilting crews, and mobile
              submersible units to predict flood reduction before dispatching
              field teams.
            </p>
          </div>

          {/* Target Hotspot & Incident Selector with scrollable dropdown */}
          <div ref={dropdownRef} className="relative shrink-0 z-50 w-full sm:w-auto">
            <button
              type="button"
              id="hotspot-dropdown-trigger"
              onClick={() => {
                audioEngine.playUiChirp(isDropdownOpen ? 700 : 950);
                setIsDropdownOpen((prev) => !prev);
              }}
              className="flex items-center gap-2.5 sm:gap-3 p-2.5 px-3 sm:px-3.5 rounded-2xl bg-white/95 dark:bg-[#131d31]/95 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left backdrop-blur-md cursor-pointer group w-full sm:w-auto max-w-full sm:max-w-[440px]"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-tight">
                  TARGET HOTSPOT
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 mt-0.5">
                  <span className={`font-mono font-bold shrink-0 ${isQueueEmpty ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                    {isQueueEmpty ? "#ALL-CLEAR" : (activeIncident?.id || "#--")}
                  </span>
                  <span className="truncate">
                    {isQueueEmpty
                      ? "No Active Order · All Hotspots Dispatched"
                      : (activeIncident?.location ? activeIncident.location.split("(")[0].trim() : "Select Hotspot")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5 font-normal">
                  <span>
                    {isQueueEmpty
                      ? "0 active incidents"
                      : (activeIncident?.waterLevel ||
                        (activeIncident?.waterDepth && !String(activeIncident.waterDepth).includes("Pending")
                          ? activeIncident.waterDepth
                          : "Telemetry Pending"))}
                  </span>
                  <span>•</span>
                  <span>
                    {isQueueEmpty
                      ? "0 reports"
                      : `${activeIncident?.verifiedReports ?? 0} ${(activeIncident?.verifiedReports ?? 0) === 1 ? "report" : "reports"}`}
                  </span>
                  <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded border ${isQueueEmpty
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                    : (SEVERITY_BADGE_STYLE[activeIncident?.severity] || SEVERITY_BADGE_STYLE.MONITORING)
                    }`}>
                    {isQueueEmpty ? "NO ACTIVE ORDER" : (activeIncident?.severity || "MONITORING")}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ml-1 ${isDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
              />
            </button>

            {/* Dropdown Menu Panel: exactly 5 results visible, rest accessed using scrollbar */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] max-w-[460px] bg-white dark:bg-[#131d31] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden backdrop-blur-xl"
                >
                  {/* Header with count & scroll indicator */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
                      HOTSPOTS ({availableIncidents.length})
                    </span>
                    <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-sans font-medium">
                      {availableIncidents.length > 5 ? "5 visible • Scroll for more" : `${availableIncidents.length} available`}
                    </span>
                  </div>

                  {/* Scrollable list calibrated to dynamically wrap 1-5 items, scrolling if >5 items */}
                  <div
                    ref={scrollContainerRef}
                    data-lenis-prevent="true"
                    data-lenis-prevent-wheel="true"
                    className="kwi-dropdown-scroll divide-y divide-slate-100 dark:divide-slate-800/70 overflow-y-auto"
                    style={{
                      maxHeight: "340px",
                    }}
                  >
                    {availableIncidents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 space-y-3">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          All municipal hotspots have been dispatched!
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Work orders are currently active on the Respond desk.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            resetDispatchedHotspots();
                            setIsDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-cyan-400 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Reset Dispatched Hotspots
                        </button>
                      </div>
                    ) : (
                      availableIncidents.map((inc) => {
                        const isSelected = inc.id === (activeIncident?.id || selectedIncidentId);
                        const depthDisplay =
                          inc.waterLevel ||
                          (inc.waterDepth && !String(inc.waterDepth).includes("Pending")
                            ? inc.waterDepth
                            : "Telemetry Pending");
                        const reports = inc.verifiedReports ?? 0;
                        const cleanLoc = inc.location ? inc.location.split("(")[0].trim() : "Incident Hotspot";
                        const badgeClass = SEVERITY_BADGE_STYLE[inc.severity] || SEVERITY_BADGE_STYLE.MONITORING;

                        return (
                          <button
                            key={inc.id}
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectIncident(inc.id);
                            }}
                            className={`w-full text-left px-3.5 py-2 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none ${isSelected
                              ? "bg-blue-500/15 dark:bg-blue-600/20 text-blue-900 dark:text-blue-100"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                              }`}
                            style={{ minHeight: "68px", height: "68px" }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                                  {inc.id}
                                </span>
                                <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                                  {inc.severity || "MONITORING"}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {depthDisplay}
                                </span>
                              </div>
                              <div className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {cleanLoc}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {reports} verified {reports === 1 ? "report" : "reports"}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>


      {/* ── Main Interactive Simulation Content ── */}
      <motion.div
        className="relative z-10 max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-16 sm:pb-24 font-sans"
        variants={stagger}
        initial="hidden"
        animate="show"
      >

        {/* ── 2. Redesigned 3-Step Progress Stepper ──────────────────── */}
        <motion.div variants={fadeUp} className="mb-5 sm:mb-6 max-w-2xl">
          <div className="flex items-center justify-between p-2 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#0c1a2e]/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <TimelineStep
              num="1"
              label="Baseline"
              sublabel="Config & parameters"
              active={simState === "CURRENT"}
              done={simState === "SIMULATING" || simState === "RESULT"}
              isSimulating={false}
            />
            <div
              className={`h-[2px] w-3 sm:w-16 mx-1 sm:mx-2 rounded-full transition-all duration-500 shrink-0 ${simState === "SIMULATING" || simState === "RESULT"
                ? "bg-blue-600"
                : "bg-slate-200 dark:bg-slate-700"
                }`}
            />
            <TimelineStep
              num="2"
              label={
                <>
                  <span className="sm:hidden">Solving</span>
                  <span className="hidden sm:inline">Solving PDE</span>
                </>
              }
              sublabel="Hydraulic computation"
              active={simState === "SIMULATING"}
              done={simState === "RESULT"}
              isSimulating={simState === "SIMULATING"}
            />
            <div
              className={`h-[2px] w-3 sm:w-16 mx-1 sm:mx-2 rounded-full transition-all duration-500 shrink-0 ${simState === "RESULT"
                ? "bg-emerald-600"
                : "bg-slate-200 dark:bg-slate-700"
                }`}
            />
            <TimelineStep
              num="3"
              label="Verified"
              sublabel="Relief confirmed"
              active={false}
              done={simState === "RESULT"}
              isSimulating={false}
            />
          </div>
        </motion.div>

        {/* ── 3. Three Dashboard Cards Grid ─────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        >
          {/* ── CARD 1: Intervention Parameters ────────────────────── */}
          <div className="rounded-2xl bg-white/92 dark:bg-[#131d31]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-5 transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-[-0.01em] truncate">
                    Intervention Parameters
                  </h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-normal truncate">
                    Configure field interventions for simulation
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200/80 dark:border-blue-800/60 shrink-0">
                Station {activeStation.id}
              </span>
            </div>

            {/* Turbine Load Section */}
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-3.5 sm:p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="min-w-0">
                  <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100 block truncate">
                    Station {activeStation.id} Turbine Load
                  </span>
                  <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal block truncate">
                    Discharge pump control ({simulationResult.pumpDischargeCusecs} cusecs)
                  </span>
                </div>
                <span className="text-[24px] sm:text-[26px] font-semibold tracking-tight text-blue-600 dark:text-cyan-400 tabular-nums shrink-0 ml-2">
                  {pumpCapacity}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={pumpCapacity}
                onChange={(e) => {
                  setPumpCapacity(Number(e.target.value));
                  audioEngine.playUiChirp(800 + Number(e.target.value) * 4);
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #0ea5e9 ${((pumpCapacity - 50) / 50) * 100
                    }%, #e2e8f0 ${((pumpCapacity - 50) / 50) * 100}%, #e2e8f0 100%)`,
                }}
              />
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                <span>50% ({Math.round(stationCapacityCusecs * 0.5)} cusecs)</span>
                <span>100% ({stationCapacityCusecs} cusecs)</span>
              </div>
            </div>

            {/* Desilting Mobile Unit Row */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-3 sm:p-3.5 gap-2.5">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Waves className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[12.5px] sm:text-[13px] font-medium text-slate-900 dark:text-slate-100 block truncate">
                    Inlet Desilting Mobile Unit
                  </span>
                  <span className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-normal block truncate">
                    Deploy Rapid Action Unit 04 (+22% culvert draw)
                  </span>
                </div>
              </div>
              <Toggle
                checked={crewDispatched}
                onChange={(v) => {
                  setCrewDispatched(v);
                  audioEngine.playUiChirp(v ? 1100 : 700);
                }}
              />
            </div>

            {/* Mobile Submersible Pump Row */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-3 sm:p-3.5 gap-2.5">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-100 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[12.5px] sm:text-[13px] font-medium text-slate-900 dark:text-slate-100 block truncate">
                    Mobile Submersible Pump
                  </span>
                  <span className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-normal block truncate">
                    20 HP Godwin high-head unit (+19% relief)
                  </span>
                </div>
              </div>
              <Toggle
                checked={extraPumpUnit}
                onChange={(v) => {
                  setExtraPumpUnit(v);
                  audioEngine.playUiChirp(v ? 1200 : 750);
                }}
              />
            </div>

            {/* Hooghly River Tide Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Hooghly Tide:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {hooghlyTideLevel || 3.42}m ({hooghlyTideTrend || "RISING"})
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {hooghlyTideLevel > 3.2 ? "Sluice Throttled" : "Sluice Open"}
              </span>
            </div>

            {/* Run Hydraulic Simulation Button */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simState === "SIMULATING" || isQueueEmpty}
                className={`w-full relative overflow-hidden py-3 px-5 rounded-xl font-medium text-[13.5px] transition-all duration-200 flex items-center justify-center gap-2 group ${isQueueEmpty
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none"
                  : "text-white active:translate-y-0 hover:-translate-y-0.5 cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.38)]"
                  }`}
                style={
                  isQueueEmpty
                    ? {}
                    : {
                      background:
                        "linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)",
                    }
                }
              >
                {simState === "SIMULATING" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Solving Hydraulic PDE Grid…</span>
                  </>
                ) : isQueueEmpty ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>No Active Order to Simulate</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Hydraulic Simulation</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {simState === "RESULT" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={handleReset}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-xs shrink-0"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* ── CARD 2: Baseline Risk (Visual Focal Point) ─────────── */}
          <div className="rounded-2xl bg-white/92 dark:bg-[#131d31]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-6 flex flex-col justify-between gap-3.5 sm:gap-4 transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] ring-1 ring-rose-500/10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-[-0.01em] truncate">
                    Baseline Risk
                  </h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-normal truncate">
                    Pre-intervention state
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border shrink-0 ${isQueueEmpty
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60"
                }`}>
                {isQueueEmpty ? "No Active Order" : (activeIncident.severity || "Critical")}
              </span>
            </div>

            {/* Main Risk Circular Gauge */}
            <div className={`rounded-2xl border p-3.5 sm:p-5 flex flex-col items-center justify-center text-center relative overflow-hidden ${isQueueEmpty
              ? "bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white/40 dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent border-emerald-100/80 dark:border-emerald-800/60"
              : "bg-gradient-to-b from-rose-50/70 via-rose-50/30 to-white/40 dark:from-rose-950/30 dark:via-rose-950/10 dark:to-transparent border-rose-100/80 dark:border-rose-800/60"
              }`}>
              {/* Circular Gauge Ring */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={isQueueEmpty ? "#d1fae5" : "#ffe4e6"}
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={isQueueEmpty ? "#10b981" : "url(#roseGradient)"}
                    strokeWidth="6"
                    strokeDasharray="251.2"
                    strokeDashoffset={isQueueEmpty ? 0 : baselineDashOffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={`text-[34px] font-semibold tracking-tight leading-none tabular-nums ${isQueueEmpty ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                    {baselineDepthCm}
                  </span>
                  <span className={`text-[11px] font-medium mt-0.5 ${isQueueEmpty ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                    }`}>
                    cm
                  </span>
                </div>
              </div>

              <div className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 mt-2.5">
                {isQueueEmpty
                  ? "No Active Inundation"
                  : baselineDepthCm >= 20
                    ? "Severe Street Inundation"
                    : baselineDepthCm >= 12
                      ? "Moderate Waterlogging"
                      : "Surface Water Accumulation"}
              </div>
              <div className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-normal">
                <span>{isQueueEmpty ? "All Hotspots Dispatched" : (activeIncident?.ward || activeIncident?.subdivision?.split("//")[0]?.trim() || "Kolkata Grid")}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className={`font-medium truncate max-w-[200px] ${isQueueEmpty ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                  }`}>
                  {isQueueEmpty ? "Queue All-Clear" : (activeIncident?.location ? activeIncident.location.split("(")[0].trim() : "Hotspot")}
                </span>
              </div>
            </div>

            {/* Key Indicators (3 rows) */}
            <div className="space-y-3 pt-1">
              {/* Row 1: Drainage Load */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-normal flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-amber-500" />
                    Drainage Load
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {baselineDrainageLoad}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${baselineDrainageLoad}%` }}
                  />
                </div>
              </div>

              {/* Row 2: Risk Score */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-normal flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-rose-500" />
                    Risk Score
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {baselineRiskScore} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-700"
                    style={{ width: `${baselineRiskScore}%` }}
                  />
                </div>
              </div>

              {/* Row 3: Affected Area */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-normal flex items-center gap-1.5">
                    <Grid3X3 className="w-3.5 h-3.5 text-rose-400" />
                    Affected Area
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {baselineAreaM2.toLocaleString()} m²
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((baselineAreaM2 / 16000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Subtle Risk Warning Panel */}
            <div className={`rounded-xl px-3 sm:px-3.5 py-2 text-[11.5px] flex items-center gap-2 font-normal ${isQueueEmpty
              ? "bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300"
              : "bg-amber-50/90 border border-amber-200/80 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300"
              }`}>
              {isQueueEmpty ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="line-clamp-2 leading-tight">
                {isQueueEmpty
                  ? "All municipal hotspots have been dispatched. No active orders pending simulation."
                  : (activeIncident.probableCause || "High risk of further inundation if no intervention is taken.")}
              </span>
            </div>
          </div>

          {/* ── CARD 3: Simulated Outcome ──────────────────────────── */}
          <div className="rounded-2xl bg-white/92 dark:bg-[#131d31]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-6 flex flex-col justify-between gap-3.5 sm:gap-4 transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-xs shrink-0 ${simState === "RESULT"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-400"
                    : "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800/60 dark:text-blue-400"
                    }`}
                >
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-[-0.01em] truncate">
                    Simulated Outcome
                  </h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-normal truncate">
                    {simState === "RESULT"
                      ? "Relief verified"
                      : "Awaiting simulation"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border transition-all duration-300 shrink-0 ${simState === "RESULT"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
                  : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60"
                  }`}
              >
                {simState === "RESULT" ? "Verified" : "Pending"}
              </span>
            </div>

            {/* Center Visual Area */}
            <div
              className={`rounded-2xl border p-3.5 sm:p-5 flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 min-h-[160px] sm:min-h-[175px] ${simState === "RESULT"
                ? "bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white/40 dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent border-emerald-200/80 dark:border-emerald-800/60"
                : "bg-slate-50/70 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/60"
                }`}
            >
              <AnimatePresence mode="wait">
                {simState === "SIMULATING" ? (
                  <motion.div
                    key="solving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full py-2"
                  >
                    <KWITelemetryLoader
                      inline={true}
                      badge="KWI-PDE-SOLVER"
                      title="SOLVING HYDRAULIC PDE GRID"
                      subtitle={`Transient flow solver running for ${activeIncident?.id || "hotspot"}`}
                      showTelemetry={false}
                    />
                  </motion.div>
                ) : simState === "RESULT" ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    {/* Simulated Depth Circular Indicator */}
                    <div className="relative w-22 h-22 flex items-center justify-center">
                      <svg className="w-22 h-22 -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#d1fae5"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeDasharray="251.2"
                          strokeDashoffset={simulatedDashOffset}
                          strokeLinecap="round"
                          fill="none"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[34px] font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
                          {simulationResult.simulatedDepthCm}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400 mt-0.5">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {simulationResult.clearanceStatus}
                      </div>
                      <div className="text-[11.5px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                        {simulationResult.depthReductionPct}% water depth reduction ({simulationResult.depthReductionCm} cm relief)
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2 py-1.5"
                  >
                    {/* Clean analytics visual */}
                    <div className={`relative w-14 h-14 rounded-full border flex items-center justify-center shadow-xs ${isQueueEmpty ? "border-emerald-200 bg-emerald-50/60 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                      {isQueueEmpty ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {isQueueEmpty ? "No Active Order to Simulate" : "Trigger simulation to model relief"}
                    </div>
                    <div className="text-[11.5px] text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed font-normal">
                      {isQueueEmpty
                        ? "All municipal hotspots are either dispatched into active field units or resolved."
                        : "Run the hydraulic model to see projected reduction in water levels and affected area."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Projected Indicators (3 rows) */}
            <div className="space-y-3 pt-1">
              {/* Row 1: Projected Drainage Load */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-normal flex items-center gap-1.5">
                    <Droplets className={`w-3.5 h-3.5 ${simState === "RESULT" ? "text-blue-500 dark:text-cyan-400" : "text-slate-300 dark:text-slate-600"}`} />
                    Drainage Load
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${simState === "RESULT" ? "text-blue-700 dark:text-cyan-300" : "text-slate-400"
                      }`}
                  >
                    {simState === "RESULT" ? `${simulationResult.simulatedDrainageLoad}%` : "—"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-blue-600 dark:bg-cyan-400"
                    initial={{ width: 0 }}
                    animate={{
                      width: simState === "RESULT" ? `${simulationResult.simulatedDrainageLoad}%` : "0%",
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Row 2: Projected Risk Score */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-normal flex items-center gap-1.5">
                    <BarChart3 className={`w-3.5 h-3.5 ${simState === "RESULT" ? "text-emerald-500 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"}`} />
                    Risk Score
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${simState === "RESULT" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"
                      }`}
                  >
                    {simState === "RESULT" ? `${simulationResult.simulatedRiskScore} / 100` : "—"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                    initial={{ width: 0 }}
                    animate={{
                      width: simState === "RESULT" ? `${simulationResult.simulatedRiskScore}%` : "0%",
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Row 3: Projected Affected Area */}
              <div className="text-[12px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-normal flex items-center gap-1.5">
                    <Grid3X3 className={`w-3.5 h-3.5 ${simState === "RESULT" ? "text-teal-500 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"}`} />
                    Affected Area
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${simState === "RESULT" ? "text-teal-700 dark:text-teal-300" : "text-slate-400"
                      }`}
                  >
                    {simState === "RESULT" ? `${simulationResult.simulatedAreaM2.toLocaleString()} m²` : "—"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-teal-500"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        simState === "RESULT"
                          ? `${Math.min(100, Math.round((simulationResult.simulatedAreaM2 / 16000) * 100))}%`
                          : "0%",
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Message Strip */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 px-3 sm:px-3.5 py-2 text-[11.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-normal">
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span className="line-clamp-2 leading-tight">
                {simState === "RESULT"
                  ? `Evacuation completes ~${simulationResult.clearanceHours} hrs ahead of flood crest.`
                  : "Results will appear after simulation is completed."}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Post-Simulation Verified Work Order Banner ────────────── */}
        <AnimatePresence>
          {simState === "RESULT" && !isQueueEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-200 shadow-[0_4px_24px_rgba(16,185,129,0.12)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">
                    Intervention Verified · Ready for Immediate KMC Dispatch
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 font-normal">
                    {simulationResult.dispatchSummary}
                  </div>
                  {supervisorError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{supervisorError}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmittingWorkOrder}
                onClick={handleCreateWorkOrder}
                className="relative overflow-hidden px-5 py-2.5 rounded-xl font-medium text-[13px] text-white shrink-0 cursor-pointer transition-all active:scale-[0.98] group shadow-[0_2px_12px_rgba(5,150,105,0.25)] hover:shadow-[0_4px_16px_rgba(5,150,105,0.35)] disabled:opacity-75 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                {isSubmittingWorkOrder ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Supervisor...
                  </span>
                ) : (
                  "Create Work Order →"
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div >
  );
}

export default SimulateView;
