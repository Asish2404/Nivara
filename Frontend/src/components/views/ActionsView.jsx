import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Truck,
  Activity,
  AlertTriangle,
  Layers,
  Cpu,
  Droplets,
  ExternalLink,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Info,
  Volume2,
  Radio,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

const RADIO_LOGS = [
  {
    time: "11:28 AM",
    sender: "ECO DISPATCH",
    senderColor: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    msg: "Unit 04 confirmed deployment toward College More.",
  },
  {
    time: "11:25 AM",
    sender: "UNIT-04 (CH-08)",
    senderColor: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    msg: "Transit past Nicco Park. Godwin pump primed and fueled.",
  },
  {
    time: "11:21 AM",
    sender: "STATION PS-07",
    senderColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    msg: "Main axial turbine spinning at 100% capacity (85 cusecs).",
  },
  {
    time: "11:15 AM",
    sender: "RADAR DESK",
    senderColor: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    msg: "Heavy precipitation cell over Salt Lake. 74 mm/3hr verified.",
  },
];

export function ActionsView() {
  const {
    navigate,
    workOrders,
    activeWorkOrderTicketId,
    setActiveWorkOrderTicketId,
    advanceWorkOrderStatus,
    latestSimulationOutcome,
  } = useKWIStore();

  const allWorkOrders = useMemo(() => {
    return {
      ...(latestSimulationOutcome && latestSimulationOutcome.ticketKey
        ? { [latestSimulationOutcome.ticketKey]: latestSimulationOutcome }
        : {}),
      ...(workOrders || {}),
    };
  }, [workOrders, latestSimulationOutcome]);

  const [selectedTicketId, setSelectedTicketId] = useState(() => {
    return activeWorkOrderTicketId || Object.keys(allWorkOrders)[0] || null;
  });

  const activeTicket =
    (selectedTicketId && allWorkOrders[selectedTicketId]) ||
    Object.values(allWorkOrders)[0] ||
    null;

  const getTicketStage = (ticket) => {
    if (!ticket) return 1;
    if (typeof ticket.stage === "number") return ticket.stage;
    if (ticket.status === "Resolved") return 3;
    if (ticket.status === "In Progress") return 2;
    if (ticket.status === "Dispatched") return 1;
    return 0;
  };

  // Workflow stages (Dispatched is active by default as shown in exact reference pic)
  const [currentStage, setCurrentStage] = useState(() => {
    return getTicketStage(activeTicket);
  });

  // Synchronize when activeTicket stage/status changes or ticket is switched
  useEffect(() => {
    if (activeTicket) {
      setCurrentStage(getTicketStage(activeTicket));
    }
  }, [selectedTicketId, activeTicket?.stage, activeTicket?.status]);

  // Synchronize when store activeWorkOrderTicketId updates or tickets are resolved/removed
  useEffect(() => {
    if (activeWorkOrderTicketId && allWorkOrders[activeWorkOrderTicketId]) {
      setSelectedTicketId(activeWorkOrderTicketId);
    } else if (selectedTicketId && !allWorkOrders[selectedTicketId]) {
      setSelectedTicketId(Object.keys(allWorkOrders)[0] || null);
    } else if (!selectedTicketId && Object.keys(allWorkOrders).length > 0) {
      setSelectedTicketId(Object.keys(allWorkOrders)[0]);
    }
  }, [activeWorkOrderTicketId, allWorkOrders, selectedTicketId]);

  const STAGES = [
    { num: 1, name: "Recommended", desc: "Assessment & Hydraulic Triage" },
    { num: 2, name: "Dispatched", desc: "Field Crews En Route" },
    { num: 3, name: "In Progress", desc: "Active On-Site Intervention" },
    { num: 4, name: "Resolved", desc: "Incident Closure & Verification" },
  ];

  const handleAdvanceStage = () => {
    if (!activeTicket) return;
    const targetKey = selectedTicketId || activeTicket.ticketKey || activeTicket.id;
    const next = currentStage < 3 ? currentStage + 1 : currentStage;
    audioEngine.playUiChirp(950 + next * 120);
    setCurrentStage(next);
    if (advanceWorkOrderStatus && targetKey) {
      advanceWorkOrderStatus(targetKey);
    }
  };

  const handleViewIncidentOnMap = () => {
    audioEngine.playUiChirp(1040);
    navigate("/live-city");
  };

  const handleSelectTicket = (id) => {
    audioEngine.playUiChirp(1100);
    setSelectedTicketId(id);
    if (setActiveWorkOrderTicketId) {
      setActiveWorkOrderTicketId(id);
    }
  };

  return (
    <div className="relative w-full font-sans text-slate-100 pb-20 space-y-5">
      {/* ========================================================================= */}
      {/* 1. HORIZONTAL 4-STEP WORKFLOW STEPPER (Matching exact reference image)    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#0b1322] border border-[#162338] p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;

            return (
              <div key={stage.name} className="flex items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiChirp(800 + idx * 100);
                    setCurrentStage(idx);
                  }}
                  className="flex items-center gap-3.5 text-left transition-all cursor-pointer group flex-1 min-w-0"
                >
                  {/* Step Number Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${isCompleted || isCurrent
                      ? "bg-[#007dfc] text-white shadow-[0_0_12px_rgba(0,125,252,0.45)]"
                      : "bg-[#1c2a3f] text-slate-400"
                      }`}
                  >
                    {stage.num}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-sm font-bold tracking-tight truncate ${isCurrent
                        ? "text-[#00d0f5]"
                        : isCompleted
                          ? "text-white"
                          : "text-slate-400"
                        }`}
                    >
                      {stage.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal truncate">
                      {stage.desc}
                    </div>
                  </div>
                </button>

                {/* Connecting Arrow between steps */}
                {idx < STAGES.length - 1 && (
                  <div className="hidden md:flex items-center px-2 lg:px-3 shrink-0">
                    <div
                      className={`h-[2px] w-8 sm:w-12 lg:w-16 rounded-full transition-all duration-300 ${idx < currentStage
                        ? "bg-[#00d0f5] shadow-[0_0_8px_rgba(0,208,245,0.7)]"
                        : "bg-[#162338]"
                        }`}
                    />
                    <ChevronRight
                      className={`w-4 h-4 -ml-1 transition-all duration-300 ${idx < currentStage
                        ? "text-[#00d0f5] drop-shadow-[0_0_6px_rgba(0,208,245,0.8)]"
                        : "text-[#162338]"
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: LEFT WORK ORDER CARD + RIGHT FLEET & QUEUE             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================================= */}
        {/* LEFT: MAIN WORK ORDER CARD (8 Cols)                                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {activeTicket ? (
            <div className="rounded-2xl bg-[#0b1322] border border-[#162338] shadow-2xl p-6 sm:p-7 space-y-5">
              {/* Top Row: Document Icon + ID + Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#162338]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#142236] border border-[#1d2f47] flex items-center justify-center text-slate-300 shrink-0">
                    <FileText className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block leading-tight">
                      MUNICIPAL WORK ORDER | REF {activeTicket.incidentRef}
                    </span>
                    <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wide">
                      {activeTicket.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold px-3 py-0.5 rounded-full bg-[#2a131e] text-[#f43f5e] border border-[#50182c] uppercase tracking-wide">
                    {activeTicket.priority || "CRITICAL"} PRIORITY
                  </span>
                  <span className="text-[10.5px] font-semibold px-3 py-0.5 rounded-full bg-[#0e213b] text-[#38bdf8] border border-[#1d4ed8]">
                    {activeTicket.status || "Dispatched"}
                  </span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-md border border-[#1d2f47] bg-[#142236] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prominent Incident Location Heading */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#007dfc] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-[0_0_12px_rgba(0,125,252,0.4)]">
                    <MapPin className="w-4 h-4 fill-white text-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                        {activeTicket.location}
                      </h2>

                      <button
                        type="button"
                        onClick={handleViewIncidentOnMap}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold text-[#38bdf8] bg-[#0e2340] hover:bg-[#132d52] border border-[#1d4ed8] transition-colors cursor-pointer shrink-0"
                      >
                        <span>View on GIS</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-xs font-mono text-slate-400 mt-1">
                      {activeTicket.lat}, {activeTicket.lng} | {activeTicket.borough}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Intelligence Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Metric 1: Severity Level */}
                <div className="p-3.5 rounded-xl bg-[#22121e] border border-[#3e1b2b] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#331422] flex items-center justify-center text-[#f43f5e] shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                      Severity Level
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#f43f5e] tracking-tight leading-none">
                      {activeTicket.priority || "CRITICAL"}
                    </span>
                  </div>
                </div>

                {/* Metric 2: Runoff Risk Score */}
                <div className="p-3.5 rounded-xl bg-[#0d1c2f] border border-[#182f4e] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#122642] flex items-center justify-center text-[#38bdf8] shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                      Runoff Risk Score
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-none">
                      {activeTicket.riskScore}
                    </span>
                  </div>
                </div>

                {/* Metric 3: Projected Relief */}
                <div className="p-3.5 rounded-xl bg-[#0d2226] border border-[#15383d] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#133033] flex items-center justify-center text-[#2dd4bf] shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                      Projected Relief
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#2dd4bf] tracking-tight leading-none">
                      {activeTicket.expectedImpact}
                    </span>
                  </div>
                </div>

                {/* Metric 4: Assigned Sluice */}
                <div className="p-3.5 rounded-xl bg-[#0d1f2e] border border-[#16334a] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#122b3e] flex items-center justify-center text-[#38bdf8] shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                      Assigned Sluice
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-[#38bdf8] tracking-tight leading-none truncate block">
                      {activeTicket.assignedNode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested Response / Drainage Unit Details */}
              <div className="rounded-xl bg-[#0e192a] border border-[#1a2b42] p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#18283e]">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Truck className="w-4 h-4 text-[#38bdf8]" />
                    <span>{activeTicket.assignedCrew}</span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2d24] text-[#34d399] border border-[#165b45] text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
                    En Route to Site &gt;&gt;
                  </span>
                </div>

                {/* 3 Horizontal sub-columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Field In-Charge */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#152438] border border-[#22354f] flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                      <span className="text-xs">👤</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                        FIELD IN-CHARGE
                      </span>
                      <span className="font-bold text-white block text-xs mt-0.5">
                        {activeTicket.chief}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        Radio: {activeTicket.radio}
                      </span>
                    </div>
                  </div>

                  {/* Estimated Arrival */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#152438] border border-[#22354f] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                        ESTIMATED ARRIVAL
                      </span>
                      <span className="font-bold text-[#00d0f5] block text-base leading-tight mt-0.5">
                        {activeTicket.eta}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Equipment */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                      ASSIGNED EQUIPMENT
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeTicket.equipment || [
                        "25 HP Godwin High-Head Unit",
                        "High-Volume Suction Desilter",
                      ]).map((eq, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#162338] border border-[#22354f] text-[11px] font-medium text-slate-200"
                        >
                          <span className="text-[#38bdf8] text-[10px]">⚙</span>
                          <span className="truncate">{eq}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Rationale Strip */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-[#0a1930] border border-[#142d54] text-xs text-blue-200 leading-relaxed">
                <div className="w-5 h-5 rounded-full bg-[#007dfc] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Info className="w-3 h-3" />
                </div>
                <span>
                  <strong className="font-semibold text-white">
                    Dispatch Rationale:
                  </strong>{" "}
                  {activeTicket.trigger}
                </span>
              </div>

              {/* Bottom Full-Width Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                {currentStage < 3 ? (
                  <button
                    type="button"
                    onClick={handleAdvanceStage}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(0,125,252,0.4)] hover:shadow-[0_0_32px_rgba(0,125,252,0.55)] bg-[#007dfc] hover:bg-[#006ee0]"
                  >
                    <span>
                      Advance Status: Mark as {STAGES[currentStage + 1].name}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#0f2d24] text-[#34d399] border border-[#165b45] font-semibold text-sm text-center shadow-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                    <span>Work Order Completed & Surface Relief Confirmed</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleViewIncidentOnMap}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#162338] hover:bg-[#1c2c47] text-slate-200 border border-[#22354f] font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer shadow-xs flex items-center justify-center gap-2 shrink-0"
                >
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Inspect on GIS Map</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0b1322] border border-[#162338] shadow-2xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#142236] border border-[#1d2f47] flex items-center justify-center mx-auto text-[#00d0f5]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                No Active Work Orders Dispatched
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Work orders are generated when field interventions are dispatched from the Simulate workspace. Run a hydraulic simulation to issue a work order.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/simulate")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#007dfc] hover:bg-blue-600 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,125,252,0.35)]"
                >
                  <span>Go to Simulate Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT: ACTIVE MUNICIPAL FLEET & WORK ORDER QUEUE (4 Cols) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: ACTIVE MUNICIPAL FLEET (Commented out)
          <div className="rounded-2xl bg-[#0b1322] border border-[#162338] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
              <h3 className="text-sm font-bold text-white">
                Active Municipal Fleet
              </h3>
              <button
                type="button"
                onClick={() => navigate("/live-city")}
                className="text-xs font-semibold text-[#00d0f5] hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Fleet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#162338"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#00d0f5"
                    strokeWidth="10"
                    strokeDasharray="314.15"
                    strokeDashoffset="37.7"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-white leading-none tracking-tight">
                    88%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    Mobilized
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#12243b] border border-[#1d3554] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs leading-tight">
                      14{" "}
                      <span className="font-normal text-slate-400">
                        Mobile Pumps Deployed
                      </span>
                    </div>
                    <div className="font-bold text-[#00d0f5] text-xs">
                      14 of 16 Boroughs
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#12243b] border border-[#1d3554] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm leading-none block">
                      340
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Total Discharge Cusecs
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#12243b] border border-[#1d3554] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm leading-none block">
                      41
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Active Sluice Gates Stations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          */}

          {/* Card 2: WORK ORDER QUEUE */}
          <div className="rounded-2xl bg-[#0b1322] border border-[#162338] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
              <h3 className="text-sm font-bold text-white">
                Work Order Queue ({Object.keys(allWorkOrders).length})
              </h3>
              <button
                type="button"
                onClick={() => navigate("/my-reports")}
                className="text-xs font-semibold text-[#00d0f5] hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Select to review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(allWorkOrders).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-400">Queue is empty</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Dispatched work orders from simulations will queue here.
                  </p>
                </div>
              ) : (
                Object.entries(allWorkOrders).map(([ticketKey, order]) => {
                  const isSelected = selectedTicketId === ticketKey;
                  const isCritical = (order.priority || "").toUpperCase() === "CRITICAL";

                  return (
                    <div
                      key={ticketKey}
                      onClick={() => handleSelectTicket(ticketKey)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${isSelected
                        ? "border-[#007dfc] bg-[#0e213b] shadow-[0_0_16px_rgba(0,125,252,0.25)] ring-1 ring-[#007dfc]/50"
                        : "border-[#162338] bg-[#0e192a] hover:border-[#223552]"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${isCritical ? "bg-rose-500" : "bg-amber-500"
                              }`}
                          />
                          <span className="font-mono text-xs font-bold text-white">
                            {order.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#007dfc] text-white">
                              CURRENTLY VIEWING
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${isCritical
                              ? "bg-[#2d1421] text-[#f43f5e] border border-[#52182d]"
                              : "bg-[#2d2212] text-amber-400 border border-[#523e18]"
                              }`}
                          >
                            {order.priority} &gt;
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-1 pl-4.5">
                        {order.location}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4.5">
                        <span className="truncate">{order.assignedCrew}</span>
                        <span className="font-medium text-slate-300 shrink-0">
                          {order.eta} ETA
                        </span>
                      </div>
                    </div>
                  );
                }))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: COMMS LOG + REAL-TIME UPDATES                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card 1 (Left 8 Cols): Field Communications Log */}
        <div className="lg:col-span-8 rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Field Communications Log
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Channel 08 — Tactical
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/action-center")}
                  className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {RADIO_LOGS.map((log, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 text-xs"
                >
                  <span className="font-mono text-slate-400 shrink-0 w-16 text-[11px]">
                    {log.time}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${log.senderColor}`}
                  >
                    {log.sender}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2 (Right 4 Cols): Real-time field updates badge card */}
        <div className="lg:col-span-4 rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Radio className="w-5 h-5" />
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              Real-time field updates keep Kolkata moving.
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
              Integrated communications across field units, pumping stations,
              and control room.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionsView;
