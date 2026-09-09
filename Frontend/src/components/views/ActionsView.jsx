import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Radio,
  Zap,
  Truck,
  Activity,
  AlertTriangle,
  Flame,
  Volume2,
  TrendingDown,
  Layers,
  Compass,
  Cpu,
  Droplets,
  ExternalLink,
  ShieldAlert,
  Gauge,
  ChevronRight,
  ShieldCheck,
  RadioTower,
  FileText,
  MoreHorizontal,
  Info,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

export function ActionsView() {
  const { navigate, setSelectedIncident } = useKWIStore();

  // Workflow stages (Dispatched is active by default as shown in exact reference pic)
  const [currentStage, setCurrentStage] = useState(1); // 0: Recommended, 1: Dispatched, 2: In Progress, 3: Resolved
  const [selectedTicketId, setSelectedTicketId] = useState("WO-0041");

  const STAGES = [
    { num: 1, name: "Recommended", desc: "Assessment & Hydraulic Triage" },
    { num: 2, name: "Dispatched", desc: "Field Crews En Route" },
    { num: 3, name: "In Progress", desc: "Active On-Site Intervention" },
    { num: 4, name: "Resolved", desc: "Incident Closure & Verification" },
  ];

  const WORK_ORDERS = {
    "WO-0041": {
      id: "WO-2026-0323-0041",
      location: "Salt Lake Sector V — Ring Road near College More",
      incidentRef: "#SV-024",
      priority: "CRITICAL",
      riskScore: "82 / 100",
      expectedImpact: "-11 cm depth",
      assignedNode: "PS-07 Sluice Station",
      assignedCrew: "Drainage Quick Response Unit 04",
      chief: "Er. S. Chatterjee",
      radio: "CH-08-TAC",
      equipment: [
        "20 HP Godwin High-Head Pump",
        "Suction Desilter",
      ],
      eta: "18 minutes",
      trigger:
        "Station PS-07 operating at 100% capacity while Sector V receives 74 mm/hr rainfall.",
      lat: "22.5735° N",
      lng: "88.4331° E",
      borough: "KMC Borough V",
      targetLabel: "Sector V College More",
    },
    "WO-0042": {
      id: "WO-2026-0323-0042",
      location: "Park Circus 7-Point Basin & Flyover Ramp",
      incidentRef: "#PC-012",
      priority: "HIGH",
      riskScore: "76 / 100",
      expectedImpact: "-8 cm depth",
      assignedNode: "PS-02 Palmer Bridge",
      assignedCrew: "Central Borough Rapid Squad 02",
      chief: "Er. A. Mukherjee",
      radio: "CH-02-TAC",
      equipment: [
        "High-Capacity Silt Dredger",
        "15 HP Dewatering Rig",
      ],
      eta: "24 minutes",
      trigger:
        "Inlet silt throttling gravity draw into Circular Canal.",
      lat: "22.5448° N",
      lng: "88.3697° E",
      borough: "KMC Borough VII",
      targetLabel: "Park Circus 7-Point",
    },
    "WO-0043": {
      id: "WO-2026-0323-0043",
      location: "Behala Chowrasta Corridor & Diamond Harbour Rd",
      incidentRef: "#BH-019",
      priority: "HIGH",
      riskScore: "78 / 100",
      expectedImpact: "-9 cm depth",
      assignedNode: "PS-09 Keorapukur Station",
      assignedCrew: "South Suburban Mobile Force 07",
      chief: "Er. R. Mondal",
      radio: "CH-09-TAC",
      equipment: [
        "Mobile Trailer Diesel Pump",
        "Culvert Jetter",
      ],
      eta: "32 minutes",
      trigger:
        "Heavy surface backflow along Diamond Harbour artery.",
      lat: "22.4988° N",
      lng: "88.3182° E",
      borough: "KMC Borough XIV",
      targetLabel: "Behala Chowrasta",
    },
  };

  const activeTicket = WORK_ORDERS[selectedTicketId] || WORK_ORDERS["WO-0041"];

  const handleAdvanceStage = () => {
    audioEngine.playUiChirp(950 + currentStage * 120);
    setCurrentStage((prev) => (prev < 3 ? prev + 1 : prev));
  };

  const handleViewIncidentOnMap = () => {
    audioEngine.playUiChirp(1040);
    navigate("/live-city");
  };

  const handleSelectTicket = (id) => {
    audioEngine.playUiChirp(1100);
    setSelectedTicketId(id);
  };

  const RADIO_LOGS = [
    {
      time: "11:28 AM",
      sender: "ECO DISPATCH",
      senderColor: "bg-rose-50 text-rose-700 border-rose-200",
      msg: "Unit 04 confirmed deployment toward College More.",
    },
    {
      time: "11:25 AM",
      sender: "UNIT-04 (CH-08)",
      senderColor: "bg-blue-50 text-blue-700 border-blue-200",
      msg: "Transit past Nicco Park. Godwin pump primed and fueled.",
    },
    {
      time: "11:21 AM",
      sender: "STATION PS-07",
      senderColor: "bg-slate-100 text-slate-700 border-slate-200",
      msg: "Main axial turbine spinning at 100% capacity (85 cusecs).",
    },
    {
      time: "11:15 AM",
      sender: "RADAR DESK",
      senderColor: "bg-rose-50 text-rose-700 border-rose-200",
      msg: "Heavy precipitation cell over Salt Lake. 74 mm/3hr verified.",
    },
  ];

  return (
    <div className="relative w-full font-sans text-slate-900 dark:text-slate-100 pb-20 space-y-6">
      {/* ── Exact Atmospheric Background Scene: Blueprint Left + Victoria Memorial Right ── */}
      <div
        aria-hidden="true"
        className="absolute -top-16 left-0 right-0 h-[850px] pointer-events-none bg-top bg-no-repeat -z-10 [background-size:100%_auto]"
        style={{
          backgroundImage: "url('/assets/respond-bg.jpg')",
          backgroundPosition: "top center",
          opacity: 0.95,
        }}
      />

      {/* ========================================================================= */}
      {/* 1. TOP SECTION: BREADCRUMB, HEADER, AND LIVE STATUS CARDS                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-1">
        {/* Left Header Hierarchy */}
        <div>
          {/* Top subtle blue dot badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-cyan-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Kolkata Municipal Corporation</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-600 dark:text-slate-400 font-normal">
              Central Flood Response & Outfall Desk
            </span>
          </div>

          {/* RESPOND capsule pill */}
          <div className="inline-block px-3 py-1 rounded-full bg-sky-100/90 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 font-bold text-[11px] tracking-wider uppercase mb-2 shadow-2xs">
            RESPOND
          </div>

          {/* Heading with Electric Cyan Split */}
          <h1 className="text-3xl sm:text-[38px] font-extrabold tracking-tight text-[#0a1a36] dark:text-white leading-tight">
            Emergency Response & <span className="text-[#0088ff]">Incident Dispatch</span>
          </h1>

          {/* Subtitle description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed font-normal">
            Coordinating municipal quick-response drainage units, submersible dewatering pumps, and sluice outfall gate operations across Kolkata catchments.
          </p>
        </div>

        {/* Right Corner: Telemetry text + 2 Floating White Cards */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          {/* Top-Right Mission Philosophy Text */}
          <div className="hidden xl:flex flex-col items-end text-[9px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 leading-tight select-none">
            <div className="text-right">A SAFER · CLEANER · KOLKATA</div>
            <div className="text-right text-[8.5px] text-slate-400 mt-0.5">
              PEOPLE · INFRASTRUCTURE · INTELLIGENCE · RESILIENT KOLKATA
            </div>
          </div>

          {/* Top-Right Status Card */}
          <div className="flex items-center gap-3">
            {/* Current Time Card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] min-w-[175px]">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 border border-blue-200 shrink-0 text-blue-600 dark:text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block leading-none mb-1">
                  CURRENT TIME
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none block">
                  11:28 AM IST
                </span>
                <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">
                  Tue, 09 Sep 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL 4-STEP WORKFLOW STEPPER (Matching exact pic)                */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;
            const isPending = idx > currentStage;

            return (
              <div key={stage.name} className="flex items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiChirp(800 + idx * 100);
                    setCurrentStage(idx);
                  }}
                  className="flex items-center gap-3 text-left transition-all cursor-pointer group flex-1 min-w-0"
                >
                  {/* Step Number Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                      isCompleted || isCurrent
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-400 text-white"
                    }`}
                  >
                    {stage.num}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-sm font-bold tracking-tight truncate ${
                        isCurrent
                          ? "text-blue-900 dark:text-cyan-300"
                          : isCompleted
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {stage.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                      {stage.desc}
                    </div>
                  </div>
                </button>

                {/* Connecting Arrow between steps (hidden on last step) */}
                {idx < STAGES.length - 1 && (
                  <div className="hidden md:flex items-center px-3 text-slate-300 shrink-0">
                    <div
                      className={`h-[2px] w-10 lg:w-16 rounded-full transition-colors ${
                        idx < currentStage ? "bg-cyan-400" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                    <ChevronRight
                      className={`w-4 h-4 -ml-1 ${
                        idx < currentStage
                          ? "text-cyan-400"
                          : "text-slate-300 dark:text-slate-600"
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
      {/* 3. MAIN WORKSPACE: LEFT WORK ORDER CARD + RIGHT FLEET & QUEUE             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT: MAIN WORK ORDER CARD (8 Cols)                                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-5">
            {/* Top Row: Document Icon + ID + Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block leading-tight">
                    MUNICIPAL WORK ORDER | REF {activeTicket.incidentRef}
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {activeTicket.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-center uppercase tracking-wide">
                  CRITICAL PRIORITY
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  Dispatched
                </span>
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prominent Incident Location Heading */}
            <div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 fill-blue-600 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
                      {activeTicket.location}
                    </h2>

                    <button
                      type="button"
                      onClick={handleViewIncidentOnMap}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer shrink-0"
                    >
                      <span>View on GIS</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {activeTicket.lat}, {activeTicket.lng} | {activeTicket.borough}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Intelligence Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {/* Metric 1: Severity Level */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block leading-none mb-1">
                    Severity Level
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-rose-600 tracking-tight leading-none">
                    CRITICAL
                  </span>
                </div>
              </div>

              {/* Metric 2: Runoff Risk Score */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block leading-none mb-1">
                    Runoff Risk Score
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {activeTicket.riskScore}
                  </span>
                </div>
              </div>

              {/* Metric 3: Projected Relief */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block leading-none mb-1">
                    Projected Relief
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-teal-700 tracking-tight leading-none">
                    {activeTicket.expectedImpact}
                  </span>
                </div>
              </div>

              {/* Metric 4: Assigned Sluice */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 font-medium block leading-none mb-1">
                    Assigned Sluice
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-sky-900 dark:text-sky-300 tracking-tight leading-none truncate block">
                    {activeTicket.assignedNode}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggested Response / Drainage Unit Details */}
            <div className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>{activeTicket.assignedCrew}</span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  En Route to Site &gt;&gt;
                </span>
              </div>

              {/* 3 Horizontal sub-columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Field In-Charge */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                    <span className="text-xs">👤</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                      FIELD IN-CHARGE
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs mt-0.5">
                      {activeTicket.chief}
                    </span>
                    <span className="text-[10.5px] text-slate-500 font-mono">
                      Radio: {activeTicket.radio}
                    </span>
                  </div>
                </div>

                {/* Estimated Arrival */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                      ESTIMATED ARRIVAL
                    </span>
                    <span className="font-bold text-blue-600 dark:text-cyan-400 block text-base leading-tight mt-0.5">
                      {activeTicket.eta}
                    </span>
                  </div>
                </div>

                {/* Assigned Equipment */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight mb-1">
                    ASSIGNED EQUIPMENT
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTicket.equipment.map((eq, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                      >
                        <span className="text-blue-600 text-[10px]">⚙</span>
                        <span className="truncate">{eq}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatch Rationale Strip */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Info className="w-3 h-3" />
              </div>
              <span>
                <strong className="font-semibold text-blue-900 dark:text-blue-300">
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
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(0,125,252,0.3)] hover:shadow-[0_6px_22px_rgba(0,125,252,0.4)]"
                  style={{
                    backgroundColor: "#007dfc",
                  }}
                >
                  <span>Advance Status: Mark as {STAGES[currentStage + 1].name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-sm text-center shadow-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Work Order Completed & Surface Relief Confirmed</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleViewIncidentOnMap}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer shadow-2xs flex items-center justify-center gap-2 shrink-0"
              >
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Inspect on GIS Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT: ACTIVE MUNICIPAL FLEET & WORK ORDER QUEUE (4 Cols)               */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: ACTIVE MUNICIPAL FLEET */}
          <div className="rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Municipal Fleet
              </h3>
              <button
                type="button"
                onClick={() => navigate("/live-city")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-cyan-400 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Fleet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Circular Gauge + 3 Metric Rows */}
            <div className="flex items-center gap-5">
              {/* Circular Gauge (Exact 88% Ring) */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    fill="none"
                    className="dark:stroke-slate-800"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#00d0f5"
                    strokeWidth="10"
                    strokeDasharray="314.15"
                    strokeDashoffset="37.7" // 88%
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                    88%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    Mobilized
                  </span>
                </div>
              </div>

              {/* 3 Metrics on Right */}
              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                      14 <span className="font-normal text-slate-500">Mobile Pumps Deployed</span>
                    </div>
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                      14 of 16 Boroughs
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm leading-none block">
                      340
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Total Discharge Cusecs
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm leading-none block">
                      41
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Active Sluice Gates Stations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: WORK ORDER QUEUE (3) */}
          <div className="rounded-2xl bg-white/95 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Work Order Queue (3)
              </h3>
              <button
                type="button"
                onClick={() => navigate("/my-reports")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-cyan-400 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Select to review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(WORK_ORDERS).map(([ticketKey, order]) => {
                const isSelected = selectedTicketId === ticketKey;
                const isCritical = order.priority === "CRITICAL";

                return (
                  <div
                    key={ticketKey}
                    onClick={() => handleSelectTicket(ticketKey)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/40"
                        : "border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCritical ? "bg-rose-600" : "bg-amber-500"
                          }`}
                        />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {order.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                            CURRENTLY VIEWING
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCritical
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800"
                              : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                          }`}
                        >
                          {order.priority}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 pl-4.5">
                      {order.location}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pl-4.5">
                      <span className="truncate">{order.assignedCrew}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">
                        {order.eta} ETA
                      </span>
                    </div>
                  </div>
                );
              })}
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
              Integrated communications across field units, pumping stations, and control room.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionsView;
