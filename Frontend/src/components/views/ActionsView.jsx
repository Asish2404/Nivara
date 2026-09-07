import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Radio,
  Zap,
  Sparkles,
  Truck,
  Users,
  Activity,
  AlertTriangle,
  Flame,
  Volume2,
  CornerDownRight,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { CardSpotlight } from "../ui/CardSpotlight";
import { BorderBeam } from "../ui/BorderBeam";
import { audioEngine } from "../../utils/audioEngine";

export function ActionsView() {
  const { navigate, setSelectedIncident } = useKWIStore();
  const [currentStage, setCurrentStage] = useState(1); // 0: Recommended, 1: Dispatched, 2: In Progress, 3: Resolved
  const [selectedTicketId, setSelectedTicketId] = useState("WO-0041");

  const STAGES = ["Recommended", "Dispatched", "In Progress", "Resolved"];

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
      chief: "Er. S. Chatterjee // Radio: CH-08-TAC",
      equipment: "20 HP Godwin High-Head Pump + Suction De-silter",
      eta: "18 minutes",
      trigger: "Station PS-07 operating at 100% capacity while Sector V receives 74 mm/3 hr rainfall.",
      lat: 22.5735,
      lng: 88.4331,
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
      chief: "Er. A. Mukherjee // Radio: CH-02-TAC",
      equipment: "High-Capacity Silt Dredger + 15 HP Dewatering Rig",
      eta: "24 minutes",
      trigger: "Inlet silt throttling gravity draw into Circular Canal.",
      lat: 22.5448,
      lng: 88.3697,
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
      chief: "Er. R. Mondal // Radio: CH-09-TAC",
      equipment: "Mobile Trailer Diesel Pump + Culvert Jetter",
      eta: "32 minutes",
      trigger: "Heavy surface backflow along Diamond Harbour artery.",
      lat: 22.4988,
      lng: 88.3182,
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
    { time: "11:28 AM", sender: "EOC DISPATCH", msg: "Unit 04: Confirmed deployment toward College More." },
    { time: "11:25 AM", sender: "UNIT-04 (CH-08)", msg: "Transit past Nicco Park. Godwin pump primed and fueled." },
    { time: "11:21 AM", sender: "STATION PS-07", msg: "Main axial turbine spinning at 100% capacity (85 cusecs)." },
    { time: "11:15 AM", sender: "RADAR DESK", msg: "Heavy precipitation cell over Salt Lake. 74 mm/3hr verified." },
  ];

  return (
    <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-20">
      {/* 1. Header & Live Operational Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-6 gap-4 border-b border-slate-200/90 dark:border-slate-800 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-medium text-xs mb-2.5 border border-slate-200/70 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-semibold">Kolkata Municipal Corporation</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">Central Flood Response & Outfall Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Emergency Response & Incident Dispatch
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
            Coordinating municipal quick-response drainage units, submersible dewatering pumps, and sluice outfall gate operations across Kolkata catchments.
          </p>
        </div>

        {/* Live System Readiness Badge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>8 of 9 Field Crews Active</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
            <span>11:28 AM IST</span>
          </div>
        </div>
      </div>

      {/* 2. Full-Width 12-Column EOC Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT 7 COLUMNS: Primary Active Work Order Terminal                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Clean Segmented Milestone Stepper (Linear / Apple style) */}
          <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="grid grid-cols-4 gap-1.5">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx <= currentStage;
                const isCurrent = idx === currentStage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => {
                      audioEngine.playUiChirp(800 + idx * 100);
                      setCurrentStage(idx);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-white dark:bg-[#16213a] text-blue-900 dark:text-cyan-300 shadow-xs border border-blue-200/70 dark:border-blue-500/40"
                        : isCompleted
                        ? "bg-slate-200/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isCompleted
                          ? "bg-slate-400 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="hidden sm:inline">{stage}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Dispatch Ticket Console */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#16213a] p-6 sm:p-7 shadow-sm space-y-6">
            {/* Top Ticket Identifier & Status Pill */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                  MUNICIPAL WORK ORDER · REF {activeTicket.incidentRef}
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                  {activeTicket.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    activeTicket.priority === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
                      : "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                  }`}
                >
                  {activeTicket.priority} Priority
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    currentStage === 3
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                      : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-cyan-400 dark:border-blue-500/30"
                  }`}
                >
                  {STAGES[currentStage]}
                </span>
              </div>
            </div>

            {/* Location Title & Geo Subtitle */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {activeTicket.location}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Coordinates: {activeTicket.lat}° N, {activeTicket.lng}° E · KMC Borough V</span>
              </div>
            </div>

            {/* 4 Clean Engineering Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                  Severity Level
                </span>
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400">{activeTicket.priority}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                  Runoff Risk Score
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{activeTicket.riskScore}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                  Projected Relief
                </span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{activeTicket.expectedImpact}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                  Assigned Sluice
                </span>
                <span className="text-sm font-bold text-blue-900 dark:text-cyan-400">{activeTicket.assignedNode}</span>
              </div>
            </div>

            {/* Crew Allocation & Equipment Telemetry Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>{activeTicket.assignedCrew}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold text-[10px]">
                  En Route to Site
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">Field In-Charge:</strong>
                  <span>{activeTicket.chief}</span>
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">Estimated Arrival:</strong>
                  <span className="text-blue-700 dark:text-cyan-400 font-bold text-sm">{activeTicket.eta}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">Assigned Equipment:</strong>
                <span>{activeTicket.equipment}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-900 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-200 text-[11px] leading-relaxed">
                <strong>Dispatch Rationale:</strong> {activeTicket.trigger}
              </div>
            </div>

            {/* Interactive Action Controller */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {currentStage < 3 ? (
                <button
                  type="button"
                  onClick={handleAdvanceStage}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Advance Status: Mark as {STAGES[currentStage + 1]} →</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 font-semibold text-xs text-center shadow-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Work Order Completed & Surface Relief Confirmed</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleViewIncidentOnMap}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                Inspect on GIS Map
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 5 COLUMNS: Municipal Fleet & Live Dispatch Queue                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Emergency Fleet Readiness Matrix */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16213a] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Municipal Fleet
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                88% Mobilized
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-600 dark:text-slate-400">14 Mobile Pumps Deployed</span>
                <span className="text-slate-900 dark:text-white font-semibold">14 of 16 Boroughs</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[88%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Discharge</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">340 Cusecs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Active Sluice Gates</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">41 Stations</span>
              </div>
            </div>
          </div>

          {/* Card 2: Priority Queued Tickets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Work Order Queue ({Object.keys(WORK_ORDERS).length})
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Select to review</span>
            </div>

            {Object.entries(WORK_ORDERS).map(([ticketKey, order]) => {
              const isSelected = selectedTicketId === ticketKey;
              return (
                <div
                  key={ticketKey}
                  onClick={() => handleSelectTicket(ticketKey)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs ring-1 ring-blue-600/30"
                      : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#16213a] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {order.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        order.priority === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
                          : "bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                      }`}
                    >
                      {order.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                    {order.location}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>{order.assignedCrew}</span>
                    <span className="text-blue-700 dark:text-cyan-400 font-semibold">{order.eta} ETA</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card 3: Field Response Comms Log */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16213a] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                  Field Communications Log
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Channel 08</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {RADIO_LOGS.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 text-[11px] font-mono shrink-0 mt-0.5">{log.time}</span>
                  <div>
                    <span className="text-slate-900 dark:text-white font-semibold mr-1.5">{log.sender}:</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">{log.msg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionsView;
