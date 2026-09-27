import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapPin,
  Navigation,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Crosshair,
  Droplets,
  CloudRain,
  Radio,
  ExternalLink,
  X,
} from "lucide-react";
import { useKWIStore, isUserSupervisor } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

// Canonical Kolkata Landmark Coordinates on SVG viewBox 0 0 800 500
const LANDMARK_LOCATIONS = {
  howrah: {
    id: "howrah",
    name: "Howrah",
    label: "Howrah",
    x: 250,
    y: 205,
    defaultRisk: "MEDIUM",
  },
  north_kolkata: {
    id: "north_kolkata",
    name: "North Kolkata",
    label: "North Kolkata",
    x: 410,
    y: 165,
    defaultRisk: "HIGH",
  },
  lake_town: {
    id: "lake_town",
    name: "Lake Town",
    label: "Lake Town",
    x: 545,
    y: 165,
    defaultRisk: "MEDIUM",
  },
  kolkata_center: {
    id: "kolkata_center",
    name: "Kolkata",
    label: "Kolkata",
    x: 430,
    y: 205,
    isMajorLabel: true,
  },
  central: {
    id: "central",
    name: "Central",
    label: "Central",
    x: 470,
    y: 235,
    defaultRisk: "CRITICAL",
  },
  salt_lake: {
    id: "salt_lake",
    name: "Salt Lake",
    label: "Salt Lake",
    sublabel: "Bidhannagar",
    x: 560,
    y: 215,
    defaultRisk: "CRITICAL",
  },
  tangra: {
    id: "tangra",
    name: "Tangra",
    label: "Tangra",
    x: 525,
    y: 280,
    defaultRisk: "MEDIUM",
  },
  park_street: {
    id: "park_street",
    name: "Park Street",
    label: "Park Street",
    x: 410,
    y: 280,
    defaultRisk: "CRITICAL",
  },
  new_alipore: {
    id: "new_alipore",
    name: "New Alipore",
    label: "New Alipore",
    x: 325,
    y: 330,
    defaultRisk: "MEDIUM",
  },
  behala: {
    id: "behala",
    name: "Behala",
    label: "Behala",
    sublabel: "Ward 128",
    x: 275,
    y: 350,
    defaultRisk: "LOW",
  },
  tollygunge: {
    id: "tollygunge",
    name: "Tollygunge",
    label: "Tollygunge",
    x: 390,
    y: 360,
    defaultRisk: "LOW",
  },
  jadavpur: {
    id: "jadavpur",
    name: "Jadavpur",
    label: "Jadavpur",
    x: 490,
    y: 375,
    defaultRisk: "LOW",
  },
};

// Color definitions matching the screenshot
const RISK_COLORS = {
  CRITICAL: {
    name: "Critical",
    dot: "#f43f5e",
    ring: "#f43f5e",
    halo: "rgba(244, 63, 94, 0.28)",
    bg: "bg-[#f43f5e]",
    border: "border-rose-400",
  },
  HIGH: {
    name: "High",
    dot: "#f97316",
    ring: "#f97316",
    halo: "rgba(249, 115, 22, 0.28)",
    bg: "bg-[#f97316]",
    border: "border-orange-400",
  },
  MEDIUM: {
    name: "Medium",
    dot: "#eab308",
    ring: "#eab308",
    halo: "rgba(234, 179, 8, 0.28)",
    bg: "bg-[#eab308]",
    border: "border-amber-400",
  },
  LOW: {
    name: "Low",
    dot: "#10b981",
    ring: "#10b981",
    halo: "rgba(16, 185, 129, 0.28)",
    bg: "bg-[#10b981]",
    border: "border-emerald-400",
  },
};

// Helper to map reported work order location string to SVG landmark coordinates
const findLandmarkForWorkOrder = (wo) => {
  if (!wo) return LANDMARK_LOCATIONS.behala;
  const raw = `${wo.location || ""} ${wo.borough || ""} ${wo.ward || ""} ${wo.assigned_ulb_name || ""}`.toLowerCase();

  if (raw.includes("salt lake") || raw.includes("bidhannagar") || raw.includes("milan nagar") || raw.includes("sector v") || raw.includes("saltlake")) {
    return LANDMARK_LOCATIONS.salt_lake;
  }
  if (raw.includes("behala") || raw.includes("chowrasta") || raw.includes("ward 128") || raw.includes("borough xiv")) {
    return LANDMARK_LOCATIONS.behala;
  }
  if (raw.includes("park street") || raw.includes("camac") || raw.includes("mullick")) {
    return LANDMARK_LOCATIONS.park_street;
  }
  if (raw.includes("new alipore") || raw.includes("alipore") || raw.includes("chetla")) {
    return LANDMARK_LOCATIONS.new_alipore;
  }
  if (raw.includes("howrah") || raw.includes("shibpur") || raw.includes("salkia")) {
    return LANDMARK_LOCATIONS.howrah;
  }
  if (raw.includes("tangra") || raw.includes("topsia") || raw.includes("dhapa")) {
    return LANDMARK_LOCATIONS.tangra;
  }
  if (raw.includes("lake town") || raw.includes("laketown") || raw.includes("dum dum") || raw.includes("bangur") || raw.includes("vip road")) {
    return LANDMARK_LOCATIONS.lake_town;
  }
  if (raw.includes("north") || raw.includes("shyambazar") || raw.includes("hatibagan") || raw.includes("sovabazar")) {
    return LANDMARK_LOCATIONS.north_kolkata;
  }
  if (raw.includes("tollygunge") || raw.includes("kudghat") || raw.includes("ranikuthi") || raw.includes("golf green")) {
    return LANDMARK_LOCATIONS.tollygunge;
  }
  if (raw.includes("jadavpur") || raw.includes("santoshpur") || raw.includes("garia")) {
    return LANDMARK_LOCATIONS.jadavpur;
  }
  if (raw.includes("central") || raw.includes("esplanade") || raw.includes("chandni") || raw.includes("sealdah") || raw.includes("college street")) {
    return LANDMARK_LOCATIONS.central;
  }

  for (const loc of Object.values(LANDMARK_LOCATIONS)) {
    if (raw.includes(loc.name.toLowerCase()) || (loc.sublabel && raw.includes(loc.sublabel.toLowerCase()))) {
      return loc;
    }
  }

  return LANDMARK_LOCATIONS.behala;
};

export function SupervisorRiskAreaMap() {
  const {
    currentUser,
    workOrders,
    historicalPlaces,
    allReports,
    fetchWorkOrders,
    fetchAllReports,
    navigate,
    setActiveWorkOrderTicketId,
  } = useKWIStore();

  useEffect(() => {
    fetchWorkOrders?.().catch(() => {});
    fetchAllReports?.().catch(() => {});
  }, [fetchWorkOrders, fetchAllReports]);

  // Zoom & Pan interactive state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Find the active work order stored in the work_orders table assigned ONLY to this occupied supervisor
  const activeWorkOrder = useMemo(() => {
    // Only show to supervisors
    if (!isUserSupervisor(currentUser)) return null;

    const all = Object.values(workOrders || {});
    if (all.length === 0) return null;

    // Filter only active (non-resolved, non-closed) work orders from work_orders table
    const activeOrders = all.filter((wo) => {
      const st = String(wo.status || "").toLowerCase().trim();
      return st !== "resolved" && st !== "closed" && st !== "completed";
    });

    if (activeOrders.length === 0) return null;

    const supName = (currentUser?.name || currentUser?.fullName || currentUser?.username || "").trim().toLowerCase();
    const supEmail = (currentUser?.email || "").trim().toLowerCase();

    // Match only the occupied supervisor assigned to this work order
    const myOrder = activeOrders.find((wo) => {
      const woTeamHead = (wo.team_head_name || "").trim().toLowerCase();
      const woCrew = (wo.assignedCrew || "").trim().toLowerCase();
      const woChief = (wo.chief || "").trim().toLowerCase();

      // Check if supervisor's name matches team_head_name, chief, or assignedCrew
      if (supName) {
        if (woTeamHead && (woTeamHead.includes(supName) || supName.includes(woTeamHead))) return true;
        if (woChief && (woChief.includes(supName) || supName.includes(woChief))) return true;
        if (woCrew && woCrew.includes(supName)) return true;
      }

      // Default demo supervisor fallback only if no supervisor name is attached to the ticket
      if (!woTeamHead && (supEmail === "supervisor@kolkata-water.gov.in" || supName === "supervisor")) {
        return true;
      }

      return false;

      return false;
    });

    return myOrder || null;
  }, [workOrders, currentUser]);

  const hasActiveIncident = Boolean(activeWorkOrder);

  // Determine assigned landmark location from the reported work order
  const assignedArea = useMemo(() => {
    if (!activeWorkOrder) return LANDMARK_LOCATIONS.behala;
    return findLandmarkForWorkOrder(activeWorkOrder);
  }, [activeWorkOrder]);

  const assignedAreaKey = assignedArea.id;

  // Clear selected incident if it gets resolved
  useEffect(() => {
    if (selectedIncident && !hasActiveIncident) {
      setSelectedIncident(null);
    }
  }, [hasActiveIncident, selectedIncident]);

  // Risk level for the assigned area dot:
  const assignedRiskLevel = useMemo(() => {
    if (activeWorkOrder) {
      const p = String(activeWorkOrder.priority || activeWorkOrder.risk_level || "").toUpperCase();
      if (p.includes("CRIT")) return "CRITICAL";
      if (p.includes("HIGH")) return "HIGH";
      if (p.includes("MED") || p.includes("MOD")) return "MEDIUM";
      if (p.includes("LOW")) return "LOW";
    }
    return assignedArea.defaultRisk || "LOW";
  }, [activeWorkOrder, assignedArea]);

  // Radius of the dotted circle in SVG units
  const CIRCLE_RADIUS = 76;

  // Incident object for the assigned central place dot (null if no active incident)
  const assignedCenterIncident = useMemo(() => {
    if (!hasActiveIncident || !activeWorkOrder) return null;

    // Directly use database fields from work_orders table
    const dbLocation = activeWorkOrder.location || `${assignedArea.name}, Kolkata`;
    const dbWard = activeWorkOrder.ward || activeWorkOrder.borough || (assignedArea.sublabel ? `Ward / ${assignedArea.sublabel}` : "Operational Zone");
    const dbStatus = activeWorkOrder.status || "Dispatched";

    // Accurate water level directly from work_orders table
    let dbWaterDepth = "0 cm depth";
    if (activeWorkOrder.water_depth !== undefined && activeWorkOrder.water_depth !== null) {
      dbWaterDepth = `${activeWorkOrder.water_depth} cm depth`;
    } else if (activeWorkOrder.waterDepth) {
      dbWaterDepth = activeWorkOrder.waterDepth;
    }

    // Accurate intervention details directly from work_orders table
    const dbDetails =
      activeWorkOrder.intervention_type ||
      activeWorkOrder.reason ||
      activeWorkOrder.trigger ||
      `Active work order dispatched for ${dbLocation}.`;

    return {
      id: activeWorkOrder.id || activeWorkOrder.work_id || "WO-ACTIVE",
      incidentRef: activeWorkOrder.incidentRef || `#${activeWorkOrder.incident_id || activeWorkOrder.id || ""}`,
      name: dbLocation,
      ward: dbWard,
      location: dbLocation,
      areaKey: assignedAreaKey,
      x: assignedArea.x,
      y: assignedArea.y,
      riskLevel: assignedRiskLevel,
      status: dbStatus,
      waterDepth: dbWaterDepth,
      details: dbDetails,
      isAssignedCenter: true,
      ticketKey: activeWorkOrder.ticketKey || activeWorkOrder.id || activeWorkOrder.work_id,
    };
  }, [assignedArea, assignedAreaKey, activeWorkOrder, hasActiveIncident, assignedRiskLevel]);

  // Filter reports:
  // 1. Only other distinct real reports for DIFFERENT places inside the circle (distance <= CIRCLE_RADIUS)
  // 2. The supervisor's assigned location is already shown by the central dot (no duplicate)
  // 3. Resolved or closed reports are excluded
  // 4. Reports outside the circle are STRICTLY EXCLUDED
  const visibleReports = useMemo(() => {
    // If no active work order is assigned to the supervisor, keep map clear
    if (!hasActiveIncident) return [];

    const cx = assignedArea.x;
    const cy = assignedArea.y;

    if (!Array.isArray(allReports)) return [];

    const norm = (str) =>
      (str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const assignedLocNorm = norm(activeWorkOrder?.location || assignedArea.name);
    const assignedAreaName = assignedArea.name.toLowerCase();
    const assignedSublabel = (assignedArea.sublabel || "").toLowerCase();
    const assignedTicketRef = (activeWorkOrder?.incidentRef || "").replace(/^#/, "").toLowerCase();
    const assignedWorkId = (activeWorkOrder?.work_id || activeWorkOrder?.id || "").toLowerCase();

    return allReports
      .filter((r) => {
        // Exclude resolved, closed, or completed reports
        const rStatus = String(r.status || "").toLowerCase();
        if (rStatus === "resolved" || rStatus === "closed" || rStatus === "completed") {
          return false;
        }

        const rLocNorm = norm(r.location);

        // 1. Skip if this report is for the same location as the supervisor's assigned center
        if (
          rLocNorm &&
          assignedLocNorm &&
          (rLocNorm === assignedLocNorm ||
            rLocNorm.includes(assignedLocNorm) ||
            assignedLocNorm.includes(rLocNorm))
        ) {
          return false;
        }

        // 2. Skip if reference or IDs match
        const rRef = (r.report_id || "").toLowerCase();
        if (assignedTicketRef && (rRef === assignedTicketRef || rRef.includes(assignedTicketRef))) {
          return false;
        }
        if (assignedWorkId && (assignedWorkId.includes(rRef) || rRef.includes(assignedWorkId))) {
          return false;
        }

        // 3. Only match if this is another distinct place within the supervisor's assigned sector / ward
        const loc = (r.location || r.ward || "").toLowerCase();
        return (
          loc.includes(assignedAreaName) ||
          (assignedSublabel && loc.includes(assignedSublabel))
        );
      })
      .map((r, idx) => {
        const angle = (idx + 1) * 1.8;
        const radiusOffset = 30 + ((idx * 15) % 35);
        const rx = Math.round(cx + Math.cos(angle) * radiusOffset);
        const ry = Math.round(cy + Math.sin(angle) * radiusOffset);

        if (Math.hypot(rx - cx, ry - cy) > CIRCLE_RADIUS) return null;

        const depth = Number(r.water_depth || 0);
        const riskLevel =
          depth > 30
            ? "CRITICAL"
            : depth > 20
            ? "HIGH"
            : depth > 10
            ? "MEDIUM"
            : "LOW";

        return {
          id: `db-rep-${r.id || r.report_id}`,
          incidentRef: r.report_id ? `#${r.report_id}` : `#REP-${r.id}`,
          name: r.location || `${assignedArea.name} Citizen Report`,
          ward: r.ward ? `Ward ${r.ward}` : assignedArea.sublabel || "Field Sector",
          location: r.location || `${assignedArea.name}, Kolkata`,
          areaKey: assignedAreaKey,
          x: rx,
          y: ry,
          riskLevel,
          status: r.status || "Under Review",
          waterDepth: r.water_depth ? `${r.water_depth} cm depth` : "15 cm depth",
          rainfall: "50 mm / 3 hr",
          details: r.description || "Live citizen ground report registered in municipal database.",
          ticketKey: `WO-${r.report_id || r.id}`,
        };
      })
      .filter(Boolean);
  }, [assignedArea, assignedAreaKey, allReports, activeWorkOrder, hasActiveIncident, CIRCLE_RADIUS]);

  // Handler for dot clicks
  const handleSelectIncident = (incident) => {
    audioEngine?.playUiChirp(1200);
    setSelectedIncident((prev) => (prev?.id === incident.id ? null : incident));
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedIncident(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Outer Card Container */}
      <div className="w-full bg-white dark:bg-[#071324] rounded-3xl border border-slate-200/90 dark:border-[#142d54] shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8 transition-colors">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-[#102444]">
          {/* Left: Map Pin Icon + Title + Subtitle */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-5 h-5 text-[#007dfc]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Risk Area Map
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Visualize risk zones and incident density across Kolkata
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Sector Banner Indicator */}
        <div className="mt-4 mb-2 flex items-center justify-between flex-wrap gap-2 text-xs">
          {hasActiveIncident ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300">
                <span className="w-2 h-2 rounded-full bg-[#007dfc] animate-pulse" />
                <span className="font-semibold">
                  Assigned Field Sector:{" "}
                  <strong className="font-bold underline decoration-blue-400">
                    {activeWorkOrder?.location || assignedArea.name} ({activeWorkOrder?.ward || assignedArea.sublabel || "Operational Zone"})
                  </strong>
                </span>
                <span className="text-blue-500/70">|</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Sector Perimeter: <strong>{CIRCLE_RADIUS * 25}m Radius</strong>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Click any dot inside the circle to inspect incident details in a box
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold">
                  No active work order assigned to supervisor
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Field Operations Standby
                </span>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Live Kolkata Base Map • All Sectors Clear
              </div>
            </>
          )}
        </div>

        {/* Main Map Canvas Container */}
        <div
          onClick={() => setSelectedIncident(null)}
          className="relative w-full aspect-16/10 min-h-[460px] max-h-[640px] bg-[#f0f6fa] dark:bg-[#050d1a] rounded-2xl border border-slate-200/80 dark:border-[#102444] overflow-hidden select-none mt-3"
        >
          {/* Zoom/Pan Scaled Layer */}
          <div
            className="w-full h-full transition-transform duration-300 ease-out relative"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: "center center",
            }}
          >
            <svg
              viewBox="0 0 800 500"
              className="w-full h-full"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Radial Glow Filters for Risk Levels */}
                <radialGradient id="glowCritical" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="glowHigh" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="glowMedium" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#eab308" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="glowLow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>

                {/* Supervisor Area Soft Blue Glow */}
                <radialGradient id="assignedAreaFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#007dfc" stopOpacity="0.10" />
                  <stop offset="85%" stopColor="#007dfc" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#007dfc" stopOpacity="0.01" />
                </radialGradient>
              </defs>

              {/* 1. Base Subtle Street Network & Cartographic Grid Lines */}
              <g
                stroke="#dce7f0"
                strokeWidth="1.6"
                strokeLinecap="round"
                className="dark:stroke-[#10233b] pointer-events-none"
              >
                {/* North-South Primary Meridian */}
                <line x1="380" y1="60" x2="380" y2="450" />
                {/* Secondary North-South Corridor (EM Bypass line) */}
                <line x1="520" y1="100" x2="520" y2="440" />
                {/* East-West Equator (Central Axis) */}
                <line x1="170" y1="235" x2="630" y2="235" />
                {/* Northern Diagonal: Howrah towards Salt Lake / Lake Town */}
                <line x1="260" y1="160" x2="620" y2="195" />
                {/* Southern Diagonal: Central towards Behala / New Alipore */}
                <line x1="470" y1="235" x2="210" y2="380" />
                {/* Southern Diagonal: Central towards Jadavpur */}
                <line x1="470" y1="235" x2="640" y2="390" />
              </g>

              {/* 2. Hooghly River Flow on the West (Left) */}
              <g className="pointer-events-none">
                {/* Outer Riverbed */}
                <path
                  d="M 180 -10 C 175 70, 235 130, 210 200 C 185 270, 220 350, 160 510 L 125 510 C 185 350, 150 270, 175 200 C 200 130, 140 70, 145 -10 Z"
                  fill="#d4e9fc"
                  className="dark:fill-[#0c2a4d]"
                />
                {/* River Flow Line */}
                <path
                  d="M 163 -10 C 158 70, 218 130, 193 200 C 168 270, 203 350, 143 510"
                  fill="none"
                  stroke="#bdddfc"
                  strokeWidth="2.5"
                  className="dark:stroke-[#164070]"
                />
              </g>

              {/* 3. East Kolkata Wetlands on the East (Right) */}
              <path
                d="M 640 180 C 730 220, 770 300, 720 380 C 670 430, 620 390, 610 320 C 600 250, 610 200, 640 180 Z"
                fill="#e1effc"
                className="dark:fill-[#09223e] pointer-events-none"
              />

              {/* 4. Geographic Landmark Labels (Subdued Cartography Context) */}
              <g className="text-slate-400 dark:text-slate-500 font-bold select-none pointer-events-none">
                <text
                  x={LANDMARK_LOCATIONS.howrah.x}
                  y={LANDMARK_LOCATIONS.howrah.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Howrah
                </text>

                <text
                  x={LANDMARK_LOCATIONS.north_kolkata.x}
                  y={LANDMARK_LOCATIONS.north_kolkata.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  North Kolkata
                </text>

                <text
                  x={LANDMARK_LOCATIONS.lake_town.x}
                  y={LANDMARK_LOCATIONS.lake_town.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Lake Town
                </text>

                <text
                  x={LANDMARK_LOCATIONS.kolkata_center.x}
                  y={LANDMARK_LOCATIONS.kolkata_center.y}
                  textAnchor="middle"
                  className="text-[18px] fill-slate-500 dark:fill-slate-300 font-extrabold tracking-tight"
                >
                  Kolkata
                </text>

                <text
                  x={LANDMARK_LOCATIONS.central.x}
                  y={LANDMARK_LOCATIONS.central.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Central
                </text>

                <text
                  x={LANDMARK_LOCATIONS.salt_lake.x}
                  y={LANDMARK_LOCATIONS.salt_lake.y - 16}
                  textAnchor="middle"
                  className="text-[14px] fill-slate-500 dark:fill-slate-400 font-bold"
                >
                  Salt Lake
                </text>
                <text
                  x={LANDMARK_LOCATIONS.salt_lake.x}
                  y={LANDMARK_LOCATIONS.salt_lake.y - 4}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-400 dark:fill-slate-600 font-medium"
                >
                  Bidhannagar
                </text>

                <text
                  x={LANDMARK_LOCATIONS.tangra.x}
                  y={LANDMARK_LOCATIONS.tangra.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Tangra
                </text>

                <text
                  x={LANDMARK_LOCATIONS.park_street.x}
                  y={LANDMARK_LOCATIONS.park_street.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Park Street
                </text>

                <text
                  x={LANDMARK_LOCATIONS.new_alipore.x}
                  y={LANDMARK_LOCATIONS.new_alipore.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  New Alipore
                </text>

                <text
                  x={LANDMARK_LOCATIONS.behala.x}
                  y={LANDMARK_LOCATIONS.behala.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-500 dark:fill-slate-300 font-bold"
                >
                  Behala
                </text>

                <text
                  x={LANDMARK_LOCATIONS.tollygunge.x}
                  y={LANDMARK_LOCATIONS.tollygunge.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Tollygunge
                </text>

                <text
                  x={LANDMARK_LOCATIONS.jadavpur.x}
                  y={LANDMARK_LOCATIONS.jadavpur.y - 12}
                  textAnchor="middle"
                  className="text-[13px] fill-slate-400 dark:fill-slate-500 font-semibold"
                >
                  Jadavpur
                </text>
              </g>

              {/* ========================================================= */}
              {/* 5. SUPERVISOR ASSIGNED AREA: DOTTED CIRCLE (Only when active work order exists) */}
              {hasActiveIncident && (
                <g className="pointer-events-none">
                  {/* Soft ambient tint within assigned radius */}
                  <circle
                    cx={assignedArea.x}
                    cy={assignedArea.y}
                    r={CIRCLE_RADIUS}
                    fill="url(#assignedAreaFill)"
                  />

                  {/* Subtle animated outer radar pulse */}
                  <circle
                    cx={assignedArea.x}
                    cy={assignedArea.y}
                    r={CIRCLE_RADIUS}
                    fill="none"
                    stroke="#007dfc"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    className="animate-ping"
                    style={{ transformOrigin: `${assignedArea.x}px ${assignedArea.y}px` }}
                  />

                  {/* The Primary Dotted Boundary Circle */}
                  <circle
                    cx={assignedArea.x}
                    cy={assignedArea.y}
                    r={CIRCLE_RADIUS}
                    fill="none"
                    stroke="#007dfc"
                    strokeWidth="2.2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    className="transition-colors duration-300"
                  />

                  {/* Small Sector Badge on the circle top */}
                  <rect
                    x={assignedArea.x - 48}
                    y={assignedArea.y - CIRCLE_RADIUS - 12}
                    width="96"
                    height="18"
                    rx="9"
                    fill="#007dfc"
                    className="shadow-sm transition-colors duration-300"
                  />
                  <text
                    x={assignedArea.x}
                    y={assignedArea.y - CIRCLE_RADIUS}
                    textAnchor="middle"
                    className="text-[9.5px] fill-white font-extrabold tracking-wide uppercase"
                  >
                    Assigned Zone
                  </text>
                </g>
              )}

              {/* ========================================================= */}
              {/* 6. INCIDENT RISK DOTS (STRICTLY INSIDE THE DOTTED CIRCLE)  */}
              {/* Places outside the circle are NEVER shown to supervisor  */}
              {/* ========================================================= */}

              {/* (A) Supervisor Assigned Central Location Dot (Only when incident is active) */}
              {hasActiveIncident && assignedCenterIncident && (() => {
                const isSelected = selectedIncident?.id === assignedCenterIncident.id;
                return (
                  <g
                    key="assigned-center-dot"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectIncident(assignedCenterIncident);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Generous Invisible Hit Target for Effortless Clicking */}
                    <circle
                      cx={assignedArea.x}
                      cy={assignedArea.y}
                      r="32"
                      fill="transparent"
                      style={{ pointerEvents: "all", cursor: "pointer" }}
                    />

                    {/* Outer Radiant Glow Halo */}
                    <circle
                      cx={assignedArea.x}
                      cy={assignedArea.y}
                      r="24"
                      fill={
                        assignedRiskLevel === "CRITICAL"
                          ? "url(#glowCritical)"
                          : assignedRiskLevel === "HIGH"
                          ? "url(#glowHigh)"
                          : assignedRiskLevel === "MEDIUM"
                          ? "url(#glowMedium)"
                          : "url(#glowLow)"
                      }
                      className="transition-transform group-hover:scale-125"
                      style={{ pointerEvents: "none" }}
                    />

                    {/* Active Selection Ring */}
                    {isSelected && (
                      <circle
                        cx={assignedArea.x}
                        cy={assignedArea.y}
                        r="14"
                        fill="none"
                        stroke="#007dfc"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        className="animate-spin"
                        style={{
                          transformOrigin: `${assignedArea.x}px ${assignedArea.y}px`,
                          pointerEvents: "none",
                        }}
                      />
                    )}

                    {/* Middle Ring */}
                    <circle
                      cx={assignedArea.x}
                      cy={assignedArea.y}
                      r="7.5"
                      fill="none"
                      stroke={RISK_COLORS[assignedRiskLevel].dot}
                      strokeWidth="2"
                      className="transition-transform group-hover:scale-115"
                      style={{ pointerEvents: "none" }}
                    />

                    {/* Inner Solid Center Dot */}
                    <circle
                      cx={assignedArea.x}
                      cy={assignedArea.y}
                      r="3.4"
                      fill={RISK_COLORS[assignedRiskLevel].dot}
                      style={{ pointerEvents: "none" }}
                    />
                  </g>
                );
              })()}

              {/* (B) Any other verified reports located INSIDE the dotted circle */}
              {visibleReports
                .filter(
                  (rep) =>
                    // Skip the assigned center duplicate to avoid double dot
                    Math.hypot(rep.x - assignedArea.x, rep.y - assignedArea.y) > 8
                )
                .map((rep) => {
                  const colors = RISK_COLORS[rep.riskLevel] || RISK_COLORS.LOW;
                  const isSelected = selectedIncident?.id === rep.id;
                  return (
                    <g
                      key={rep.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectIncident(rep);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Generous Invisible Hit Target */}
                      <circle
                        cx={rep.x}
                        cy={rep.y}
                        r="30"
                        fill="transparent"
                        style={{ pointerEvents: "all", cursor: "pointer" }}
                      />

                      {/* Outer Radiant Glow Halo */}
                      <circle
                        cx={rep.x}
                        cy={rep.y}
                        r="20"
                        fill={
                          rep.riskLevel === "CRITICAL"
                            ? "url(#glowCritical)"
                            : rep.riskLevel === "HIGH"
                            ? "url(#glowHigh)"
                            : rep.riskLevel === "MEDIUM"
                            ? "url(#glowMedium)"
                            : "url(#glowLow)"
                        }
                        className="transition-transform group-hover:scale-125"
                        style={{ pointerEvents: "none" }}
                      />

                      {/* Active Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={rep.x}
                          cy={rep.y}
                          r="13"
                          fill="none"
                          stroke="#007dfc"
                          strokeWidth="2.5"
                          strokeDasharray="4 3"
                          className="animate-spin"
                          style={{
                            transformOrigin: `${rep.x}px ${rep.y}px`,
                            pointerEvents: "none",
                          }}
                        />
                      )}

                      {/* Middle Ring */}
                      <circle
                        cx={rep.x}
                        cy={rep.y}
                        r="6.5"
                        fill="none"
                        stroke={colors.dot}
                        strokeWidth="1.8"
                        className="transition-transform group-hover:scale-115"
                        style={{ pointerEvents: "none" }}
                      />

                      {/* Inner Solid Center Dot */}
                      <circle
                        cx={rep.x}
                        cy={rep.y}
                        r="3"
                        fill={colors.dot}
                        style={{ pointerEvents: "none" }}
                      />
                    </g>
                  );
                })}
            </svg>

            {/* ========================================================= */}
            {/* 7. ANCHORED INCIDENT DETAILS BOX (Appears on dot click)   */}
            {/* ========================================================= */}
            {selectedIncident && (
              <div
                style={{
                  left: `${(selectedIncident.x / 800) * 100}%`,
                  top: `${(selectedIncident.y / 500) * 100}%`,
                  transform:
                    selectedIncident.y > 200
                      ? "translate(-50%, -100%) translateY(-26px)"
                      : "translate(-50%, 0%) translateY(26px)",
                }}
                onClick={(e) => e.stopPropagation()}
                className="absolute z-40 w-72 sm:w-84 max-w-[90vw] bg-white/98 dark:bg-[#071324]/98 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-[#1e3a66] shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-4 animate-in fade-in zoom-in-95 pointer-events-auto transition-all"
              >
                {/* Pointer Arrow pointing directly to the dot */}
                {selectedIncident.y > 200 ? (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#071324] rotate-45 border-r border-b border-slate-200/90 dark:border-[#1e3a66]" />
                ) : (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#071324] rotate-45 border-l border-t border-slate-200/90 dark:border-[#1e3a66]" />
                )}

                {/* Box Header: Risk Level Badge + Incident ID + Close Button */}
                <div className="flex items-center justify-between gap-2 relative z-10 pb-2.5 border-b border-slate-100 dark:border-[#102444]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold text-white uppercase shadow-2xs ${
                        RISK_COLORS[selectedIncident.riskLevel]?.bg || "bg-emerald-600"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>{selectedIncident.riskLevel} Risk</span>
                    </span>
                    <span className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      {selectedIncident.incidentRef || selectedIncident.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      audioEngine?.playUiChirp(850);
                      setSelectedIncident(null);
                    }}
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Incident Title & Ward */}
                <div className="mt-2.5 relative z-10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedIncident.name}
                  </h4>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#007dfc] shrink-0" />
                    <span>{selectedIncident.ward || selectedIncident.location}</span>
                  </p>
                </div>

                {/* Key Metrics: Water Depth & Status */}
                <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
                  <div className="bg-[#f0f7ff] dark:bg-[#0a1c36] border border-[#d2e7ff] dark:border-[#163660] rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[#007dfc] dark:text-blue-400">
                      <Droplets className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        Water Level
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      {selectedIncident.waterDepth}
                    </span>
                  </div>

                  <div className="bg-[#f0f7ff] dark:bg-[#0a1c36] border border-[#d2e7ff] dark:border-[#163660] rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[#007dfc] dark:text-blue-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        Status
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-0.5 truncate">
                      {selectedIncident.status || "Dispatched"}
                    </span>
                  </div>
                </div>

                {/* Narrative Telemetry Note */}
                {selectedIncident.details && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 pt-2 border-t border-slate-100 dark:border-[#102444] leading-relaxed relative z-10">
                    {selectedIncident.details}
                  </p>
                )}

                {/* Action Button: Open Work Order in Respond Center */}
                <button
                  type="button"
                  onClick={() => {
                    audioEngine?.playUiChirp(1300);
                    if (setActiveWorkOrderTicketId && selectedIncident.ticketKey) {
                      setActiveWorkOrderTicketId(selectedIncident.ticketKey);
                    }
                    navigate("/action-center");
                  }}
                  className="w-full mt-3 py-2.5 px-3 rounded-xl bg-[#007dfc] hover:bg-[#006ee0] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,125,252,0.3)] transition-all active:scale-[0.99] relative z-10"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Work Order In Respond</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom-Left Floating "Risk Level" Legend (Matching Screenshot) */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-[#071324]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-[#142d54] p-3.5 shadow-md">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2">
              Risk Level
            </h4>
            <div className="space-y-1.5">
              {Object.entries(RISK_COLORS).map(([key, item]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.dot }}
                  />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom-Right Floating Map Controls (Matching Screenshot) */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            {/* Locate / Compass Reset */}
            <button
              type="button"
              onClick={handleResetView}
              title="Reset View"
              className="w-8 h-8 rounded-full bg-white/95 dark:bg-[#071324]/95 hover:bg-slate-100 dark:hover:bg-[#0a1c38] border border-slate-200/90 dark:border-[#142d54] text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-slate-700 dark:fill-slate-200 text-slate-700 dark:text-slate-200 -rotate-45" />
            </button>

            {/* Zoom In & Out (Circular Geometry) */}
            <div className="flex flex-col rounded-full bg-white/95 dark:bg-[#071324]/95 border border-slate-200/90 dark:border-[#142d54] shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0a1c38] transition-colors border-b border-slate-100 dark:border-[#102444] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0a1c38] transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupervisorRiskAreaMap;
