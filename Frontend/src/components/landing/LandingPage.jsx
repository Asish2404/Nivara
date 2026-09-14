import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Waves,
  ShieldCheck,
  Droplets,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Info,
  Radio,
  Gauge,
} from "lucide-react";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { BorderBeam } from "../ui/BorderBeam";
import { CardSpotlight } from "../ui/CardSpotlight";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import Footer from "../Footer";
import { useKWIStore, isUserAdmin } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { CitizenReportingSection } from "./CitizenReportingSection";
import { KolkataDecorativeLayer } from "./KolkataDecorativeLayer";
import {
  RobotPipelineStepping,
  KWI_PIPELINE_STAGES,
} from "./RobotPipelineStepping";
import { ACTIVE_INCIDENTS } from "../gis/kolkataCartographicData";
import AccordionGallery from "../views/AccordionGallery";
import SplitText from "../views/SplitText";
import MoltenMetal from "../views/MoltenMetal";
import HydrologicalWaveCanvas from "./HydrologicalWaveCanvas";

// Hotspot locality photographs corresponding to real Kolkata intersections
const HOTSPOT_PHOTOS = [
  "/images/kolkata_waterlog_sector_v.jpg", // #SV-024: College More & Ring Road, Salt Lake Sector V
  "/images/hotspot_behala.jpg", // #BH-019: Behala Chowrasta / Diamond Harbour Rd
  "/images/hotspot_park_street.jpg", // #PS-032: Park Street & Chowringhee Intersection
  "/images/hotspot_thanthania.jpg", // #TK-089: Thanthania Kalibari
  "/images/hotspot_hastings.jpg", // #HS-001: Hastings
  "/images/hotspot_kalighat.jpg", // #KG-001: Kalighat
];

// 4 Operational Telemetry Scenarios for Interactive Testing
export const TELEMETRY_SCENARIOS = {
  live: {
    id: "live",
    name: "Monsoon Live",
    badge: "REAL-TIME SENSOR MESH",
    description:
      "Baseline municipal telemetry across 144 wards and Hooghly tidal basin.",
    stats: {
      "stat-rain": {
        numericValue: 743,
        unit: "mm",
        label: "Total Rainfall (Last 24h)",
        badge: "32 SENSORS",
        diagnostic:
          "32 Automated KMC Rain Gauges reporting. Peak localized surge at Thanthania & College Street (44 mm/h).",
        highlight: "Normal Monsoon Gradient",
        status: "Active Monitoring",
        subMetrics: [
          {
            label: "Thanthania Sensor #TK089",
            value: "44 mm/h",
            state: "Active",
          },
          { label: "Park St / Chowringhee", value: "28 mm/h", state: "Normal" },
          {
            label: "Kalighat / Chetla Gauge",
            value: "19 mm/h",
            state: "Nominal",
          },
        ],
      },
      "stat-discharge": {
        numericValue: 85,
        unit: "Cusecs",
        label: "Live Outfall Discharge",
        badge: "FLOW OPTIMAL",
        diagnostic:
          "Palmer Bridge #1 discharging 48 Cusecs, Chetla Lock #2 discharging 37 Cusecs into Hooghly basin.",
        highlight: "Optimal Hydraulic Head",
        status: "Unrestricted Clearance",
        subMetrics: [
          {
            label: "Palmer Bridge Outfall",
            value: "48 Cusecs",
            state: "Optimal",
          },
          {
            label: "Chetla Lock Station",
            value: "37 Cusecs",
            state: "Gravity Open",
          },
          { label: "Ballygunge Conduit", value: "22 Cusecs", state: "Flowing" },
        ],
      },
      "stat-gates": {
        numericValue: 100,
        unit: "%",
        label: "Critical Gates Monitored",
        badge: "41 / 41 ONLINE",
        diagnostic:
          "All 41 riverfront sluice gates synchronized with Kolkata Port Trust tidal curve in real-time.",
        highlight: "Full Gate Synchronization",
        status: "100% Operational",
        subMetrics: [
          {
            label: "Hooghly Riverfront Sluices",
            value: "24 / 24",
            state: "Synced",
          },
          { label: "Canal Interceptors", value: "12 / 12", state: "Clear" },
          { label: "Auxiliary Lock Chambers", value: "5 / 5", state: "Armed" },
        ],
      },
      "stat-people": {
        numericValue: 4.2,
        decimals: 1,
        unit: "M",
        label: "Citizens Protected",
        badge: "16 BOROUGHS",
        diagnostic:
          "Early warning envelope active across 16 boroughs with proactive municipal SMS flood advisories.",
        highlight: "High Density Shield",
        status: "Protection Active",
        subMetrics: [
          {
            label: "Boroughs I - VII (North)",
            value: "1.8M Safe",
            state: "Guarded",
          },
          {
            label: "Boroughs VIII - X (South)",
            value: "1.5M Safe",
            state: "Guarded",
          },
          {
            label: "Boroughs XI - XVI (East)",
            value: "0.9M Safe",
            state: "Guarded",
          },
        ],
      },
    },
  },
  surge: {
    id: "surge",
    name: "High-Tide Lock",
    badge: "TIDAL SURGE DEFENSE",
    description:
      "Hooghly river stage at +3.8M high tide. Riverfront gravity sluices locked shut to prevent tidal backflow.",
    stats: {
      "stat-rain": {
        numericValue: 892,
        unit: "mm",
        label: "Total Rainfall (Last 24h)",
        badge: "CLOUD BURST",
        diagnostic:
          "Severe precipitation across Northern catchment; auxiliary pumping units active at circular canal.",
        highlight: "+20% Influx Over Baseline",
        status: "High Intensity Alert",
        subMetrics: [
          {
            label: "Thanthania Sensor #TK089",
            value: "62 mm/h",
            state: "Critical",
          },
          {
            label: "College More Salt Lake",
            value: "48 mm/h",
            state: "Elevated",
          },
          {
            label: "Hastings Outfall Corridor",
            value: "39 mm/h",
            state: "Alert",
          },
        ],
      },
      "stat-discharge": {
        numericValue: 148,
        unit: "Cusecs",
        label: "Pump-Assisted Discharge",
        badge: "AUX BOOST ACTIVE",
        diagnostic:
          "Auxiliary high-head diesel pumps active at Ballygunge and Dhapa to counter river tidal resistance.",
        highlight: "Forced Mechanical Lift",
        status: "6 Auxiliary Pumps Running",
        subMetrics: [
          {
            label: "Palmer Bridge Booster",
            value: "72 Cusecs",
            state: "Aux Power",
          },
          {
            label: "Dhapa Lift Pumps #3-5",
            value: "54 Cusecs",
            state: "Forced Flow",
          },
          {
            label: "Ballygunge Drainage Station",
            value: "22 Cusecs",
            state: "Maximum",
          },
        ],
      },
      "stat-gates": {
        numericValue: 92,
        unit: "%",
        label: "Critical Gates Monitored",
        badge: "38 / 41 LOCKED",
        diagnostic:
          "38 sluice gates locked shut against Hooghly tidal ingress. Backflow prevention 100% effective.",
        highlight: "Tidal Ingress Seal Active",
        status: "Backflow Prevented",
        subMetrics: [
          {
            label: "Hooghly Tidal Gates",
            value: "21 / 24 Locked",
            state: "Sealed",
          },
          {
            label: "Siphon Backflow Baffles",
            value: "12 / 12 Active",
            state: "Holding",
          },
          {
            label: "Emergency Spillway Gates",
            value: "5 / 5 Armed",
            state: "Standby",
          },
        ],
      },
      "stat-people": {
        numericValue: 3.9,
        decimals: 1,
        unit: "M",
        label: "Citizens Protected",
        badge: "SURGE MITIGATED",
        diagnostic:
          "Emergency storm barriers deployed in low-lying riverside corridors (Hastings, Kalighat & Strand Rd).",
        highlight: "Vulnerable Corridors Isolated",
        status: "Defense Shield Engaged",
        subMetrics: [
          {
            label: "Riverside Evacuation Zone",
            value: "240k Safeguarded",
            state: "Secured",
          },
          {
            label: "Metro Subway Barriers",
            value: "18 Stations",
            state: "Defended",
          },
          {
            label: "Rapid Crew Dispatches",
            value: "14 Units",
            state: "En Route",
          },
        ],
      },
    },
  },
  gravity: {
    id: "gravity",
    name: "Gravity Flush",
    badge: "LOW-TIDE MAX OUTFLOW",
    description:
      "Low-tide clearance window open. Sluices operating in full gravity mode for maximum city basin de-watering.",
    stats: {
      "stat-rain": {
        numericValue: 410,
        unit: "mm",
        label: "Total Rainfall (Last 24h)",
        badge: "RECEDING",
        diagnostic:
          "Precipitation subsided; storm run-off clearing rapidly via Circular Canal and Bagjola Canal.",
        highlight: "Run-off Dissipation -45%",
        status: "Water Levels Dropping",
        subMetrics: [
          {
            label: "Thanthania Sensor #TK089",
            value: "8 mm/h",
            state: "Receded",
          },
          {
            label: "Central Arterial Corridors",
            value: "4 mm/h",
            state: "Clear",
          },
          {
            label: "Southern Catchment Basin",
            value: "2 mm/h",
            state: "Normal",
          },
        ],
      },
      "stat-discharge": {
        numericValue: 235,
        unit: "Cusecs",
        label: "Peak Gravity Outflow",
        badge: "MAX CLEARANCE",
        diagnostic:
          "Maximum outfall velocity attained. Basin clearance tracking 4.2x faster than normal baseline.",
        highlight: "Gravity Gradient 3.1x",
        status: "Maximum Flushing Velocity",
        subMetrics: [
          {
            label: "Palmer Bridge Gravity Sluice",
            value: "112 Cusecs",
            state: "Full Open",
          },
          {
            label: "Chetla Tidal Lock Flap",
            value: "78 Cusecs",
            state: "Full Open",
          },
          {
            label: "Circular Canal Siphon",
            value: "45 Cusecs",
            state: "Full Open",
          },
        ],
      },
      "stat-gates": {
        numericValue: 100,
        unit: "%",
        label: "Critical Gates Monitored",
        badge: "41 / 41 FULL OPEN",
        diagnostic:
          "All 41 gates fully opened. Gravity gradient drawing pooled water out of city conduits rapidly.",
        highlight: "100% Gravity Discharge",
        status: "Unimpeded Gravity Run",
        subMetrics: [
          {
            label: "Riverfront Sluice Array",
            value: "24 / 24 Open",
            state: "100% Flow",
          },
          {
            label: "Canal Gravity Flaps",
            value: "12 / 12 Open",
            state: "Flushing",
          },
          {
            label: "Terminal Lock Chambers",
            value: "5 / 5 Open",
            state: "Maximum",
          },
        ],
      },
      "stat-people": {
        numericValue: 4.6,
        decimals: 1,
        unit: "M",
        label: "Citizens Protected",
        badge: "FULL RESTORATION",
        diagnostic:
          "Rapid transit routes clear; tramway, road corridors, and metro underpasses returned to normal.",
        highlight: "Full Urban Resiliency",
        status: "All Corridors Clear",
        subMetrics: [
          {
            label: "Kolkata Tramway Corridors",
            value: "100% Resumed",
            state: "Clear",
          },
          {
            label: "Underpass Pump Wells",
            value: "Dry / Normal",
            state: "Clear",
          },
          {
            label: "Hospital Ambulance Routes",
            value: "Unrestricted",
            state: "Clear",
          },
        ],
      },
    },
  },
};

// Visual chart representations for the 4 metrics with reactive scenario dynamics
const IMPACT_METRICS = [
  {
    id: "stat-rain",
    icon: <Droplets className="w-4 h-4 text-cyan-500 dark:text-[#00E5FF]" />,
    pulseColor: "bg-cyan-400",
    renderChart: (scenarioId) => {
      const activeThreshold =
        scenarioId === "surge" ? 10 : scenarioId === "live" ? 8 : 4;
      const heights = [25, 40, 30, 55, 70, 48, 82, 65, 95, 100];
      return (
        <div className="flex items-end gap-1 h-8 mt-3">
          {heights.map((h, i) => {
            const isLit = i < activeThreshold;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1.5 rounded-t-sm transition-all duration-500 ${
                  isLit
                    ? "bg-cyan-500 dark:bg-[#00E5FF] dark:shadow-[0_0_8px_rgba(0,229,255,0.7)]"
                    : "bg-cyan-200/80 dark:bg-[#10313E]"
                }`}
              />
            );
          })}
        </div>
      );
    },
  },
  {
    id: "stat-discharge",
    icon: <Waves className="w-4 h-4 text-blue-500 dark:text-[#38BDF8]" />,
    pulseColor: "bg-blue-400",
    renderChart: (scenarioId) => {
      const isSurge = scenarioId === "surge";
      const isGravity = scenarioId === "gravity";
      return (
        <div className="h-8 mt-3 flex items-center overflow-hidden">
          <svg className="w-full h-6" viewBox="0 0 160 24" fill="none">
            <path
              d={
                isGravity
                  ? "M0 12 Q20 0 40 12 T80 12 T120 12 T160 12"
                  : isSurge
                    ? "M0 12 Q20 5 40 12 T80 12 T120 12 T160 12"
                    : "M0 12 Q20 2 40 12 T80 12 T120 12 T160 12"
              }
              className="stroke-blue-500 dark:stroke-[#00E5FF] transition-all duration-500"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 16 Q20 8 40 16 T80 16 T120 16 T160 16"
              className="stroke-blue-300 dark:stroke-[#38BDF8]"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 3"
            />
          </svg>
        </div>
      );
    },
  },
  {
    id: "stat-gates",
    icon: (
      <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
    ),
    pulseColor: "bg-emerald-400",
    renderChart: (scenarioId, statData) => {
      const pct = statData?.numericValue || 100;
      return (
        <div className="mt-4 space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#030F14] border border-transparent dark:border-[rgba(94,183,201,0.16)] overflow-hidden">
            <div
              style={{ width: `${pct}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 dark:from-[#00E5FF] dark:to-emerald-400 rounded-full transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-[#6D949D]">
            <span>{statData?.badge || "41 / 41 Synced"}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {statData?.status || "Tidal Match"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "stat-people",
    icon: <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />,
    pulseColor: "bg-indigo-400",
    renderChart: (scenarioId, statData) => {
      const displayVal = statData?.numericValue
        ? `+${statData.numericValue}M`
        : "+4.2M";
      return (
        <div className="flex items-center gap-2 mt-3 pt-1">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#030F14] bg-slate-200 dark:bg-[#10313E] text-[9px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-xs">
              AK
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#030F14] bg-cyan-100 dark:bg-cyan-900/60 text-[9px] font-bold flex items-center justify-center text-cyan-700 dark:text-cyan-300 shadow-xs">
              SM
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#030F14] bg-blue-100 dark:bg-blue-900/60 text-[9px] font-bold flex items-center justify-center text-blue-700 dark:text-blue-300 shadow-xs">
              DB
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#030F14] bg-amber-100 dark:bg-amber-900/60 text-[9px] font-bold flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-xs">
              RC
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-[#F2FBFD] bg-slate-100 dark:bg-[#10313E] border border-transparent dark:border-[rgba(94,183,201,0.16)] px-2 py-0.5 rounded-full shadow-2xs">
            {displayVal}
          </span>
        </div>
      );
    },
  },
];

const PIPELINE_PROGRESS_PERCENT = [14, 29, 43, 57, 71, 86, 100];

const STEP_TELEMETRY = [
  {
    header: "CITIZEN SIGNAL INGESTION",
    badge: "GEO-LOCATED",
    activeProcess: "Report → Mobile Ingest & Geotag",
    line1: "COORDINATES: 22.5726° N, 88.3639° E",
    line2: "SOURCE: Citizen Mobile App + Photo Geotag",
    systemImpact: "+1 Incident Logged for Review",
  },
  {
    header: "AI VERIFICATION",
    badge: "99.4% CONFIDENCE",
    activeProcess: "Verify → Spatial Validation",
    line1: "ESTIMATED DEPTH: 38.5 CM (Curb Overflow)",
    line2: "DEBRIS FACTOR: High Obstruction Detected",
    systemImpact: "Depth Validated in 3.2 Seconds",
  },
  {
    header: "INFRASTRUCTURE CORRELATION",
    badge: "41 GATES SYNCED",
    activeProcess: "Connect → Infrastructure Correlation",
    line1: "SLUICE GATES LINKED: 4 (Hooghly Outfall)",
    line2: "TRUNK CONDUIT: Circular Canal 72% Saturated",
    systemImpact: "Drainage Graph Calibrated",
  },
  {
    header: "RISK INTELLIGENCE",
    badge: "RISK: 84/100",
    activeProcess: "Understand → Risk Intelligence",
    line1: "CATCHMENT RISK: 84/100 (Critical Flag)",
    line2: "BOTTLENECK: Palmer Bridge Conduit Silt",
    systemImpact: "Surge Trajectory Modeled",
  },
  {
    header: "PREDICTION ENGINE",
    badge: "+18CM AT T+25M",
    activeProcess: "Predict → 60-Minute Prediction",
    line1: "RADAR INTENSITY: 42 mm/hr Cloud Burst",
    line2: "HOOGHLY STAGE: High Tide +3.8M Resistance",
    systemImpact: "Early Warning Broadcasted",
  },
  {
    header: "INTERVENTION SIMULATION",
    badge: "3 PUMPS STAGED",
    activeProcess: "Simulate → Intervention Simulation",
    line1: "REQUIRED PUMPS: 3 Units (500 m³/h capacity)",
    line2: "GRAVITY OUTFALL: Gate #14 Scheduled at Low Tide",
    systemImpact: "-24 CM Depth Reduction Modeled",
  },
  {
    header: "FIELD DISPATCH",
    badge: "ORDER #KMC-WRK-9418",
    activeProcess: "Act → Field Dispatch",
    line1: "DISPATCH ORDER: #KMC-WRK-2026-9418",
    line2: "ASSIGNED CREW: Borough VII Field Rapid Response",
    systemImpact: "Crew En Route (ETA 11 Minutes)",
  },
];

export function LandingPage() {
  const { navigate, currentUser, setSelectedIncident, theme } = useKWIStore();
  const isDark = theme === "dark";
  const isAdmin = isUserAdmin(currentUser);
  const isCitizenUser = Boolean(currentUser && !isAdmin);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("live");
  const [selectedStatId, setSelectedStatId] = useState("stat-discharge");
  const howItWorksRef = useRef(null);

  // Hotspot Accordion Gallery Items preserving exact incident data & functionality
  const hotspotGalleryItems = ACTIVE_INCIDENTS.map((inc, index) => ({
    id: inc.id,
    name: inc.name,
    label: inc.location,
    location: inc.location,
    subdivision: inc.subdivision,
    severity: inc.severity,
    waterDepth: inc.waterDepth,
    rainfall: inc.rainfall,
    verifiedReports: inc.verifiedReports,
    timestamp: inc.timestamp,
    image: inc.image || HOTSPOT_PHOTOS[index] || HOTSPOT_PHOTOS[0],
    incident: inc,
    onViewOnMap: () => {
      audioEngine.playUiChirp(1040);
      setSelectedIncident(inc);
      navigate("/live-city");
      setTimeout(() => {
        const mapElem = document.getElementById("gis-map-viewport");
        if (mapElem) {
          mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    },
  }));

  // IntersectionObserver to start animation only when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { threshold: 0.2 },
    );

    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Dynamic Theme Palette Switcher (Ciao Energy Style)
  const [threatLevel, setThreatLevel] = useState("normal"); // 'normal' | 'advisory' | 'surge'

  const ambientGlowClass =
    threatLevel === "surge"
      ? "bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.18),rgba(239,68,68,0.08),transparent_70%)]"
      : threatLevel === "advisory"
        ? "bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),rgba(217,119,6,0.08),transparent_70%)]"
        : "bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.16),rgba(59,130,246,0.08),transparent_70%)]";

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0A1E3B] text-slate-900 dark:text-[#F2FBFD] font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      {/* Seamless night sky backdrop behind navbar & hero in dark mode */}
      <div className="absolute top-0 inset-x-0 h-[680px] sm:h-[760px] lg:h-[840px] bg-gradient-to-b from-[#0A1E3B] via-[#0A1E3B] via-60% to-transparent pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700 -z-10" />

      {/* 0. Ambient Top Radiant Glow & Micro-Grid (Dynamically morphs with threatLevel) */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] ${ambientGlowClass} transition-all duration-700 pointer-events-none -z-10`}
      />
      <div className="absolute top-0 inset-x-0 h-[480px] bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(94,183,201,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(94,183,201,0.04)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Global Navigation Bar */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* ======================================================== */}
      {/* 1. ATMOSPHERIC DIGITAL-TWIN HERO AREA                    */}
      {/* ======================================================== */}
      <section className="relative w-full overflow-hidden bg-white dark:bg-[#0A1E3B] pt-8 sm:pt-12 pb-6 sm:pb-10 text-center z-20 transition-colors duration-700">
        {/* Authentic Kolkata Atmospheric Landscape (Howrah Bridge, Victoria Memorial, Writers' Building & Moving Clouds) */}
        <KolkataDecorativeLayer />

        <div className="relative max-w-4xl mx-auto px-4 z-10">
          {/* ● LIVE KOLKATA Location Pill */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#061820]/90 backdrop-blur-md border border-sky-200/90 dark:border-cyan-500/30 shadow-[0_2px_12px_rgba(6,182,212,0.12)] mb-3.5 text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600 dark:bg-cyan-400" />
            </span>
            <span className="text-cyan-950 dark:text-cyan-300 uppercase font-black">
              ● LIVE KOLKATA
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Real Geographic Intelligence
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Monitoring Active
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.08]"
          >
            <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 dark:from-cyan-400 dark:via-teal-300 dark:to-blue-400 bg-clip-text text-transparent">
              See the water.
            </span>
            <br />
            <span className="text-slate-900 dark:text-white drop-shadow-2xs">
              Predict what happens next.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-200 max-w-xl mx-auto font-medium leading-relaxed drop-shadow-xs"
          >
            AI-powered water intelligence for a safer, smarter Kolkata.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.14,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-4 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(1100);
                if (isCitizenUser) {
                  navigate("/reports");
                } else {
                  navigate("/live-city");
                }
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(6,182,212,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>
                {isCitizenUser
                  ? "File a Field Report"
                  : "Launch Intelligence Platform"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(950);
                setSimActive(true);
                navigate("/simulate");
              }}
              className="px-6 py-2.5 rounded-full bg-white dark:bg-[#10313E] hover:bg-slate-50 dark:hover:bg-[#163F4E] text-slate-800 dark:text-[#F2FBFD] border border-slate-200/90 dark:border-[rgba(94,183,201,0.16)] font-semibold text-sm shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#0B2430] flex items-center justify-center text-cyan-600 dark:text-[#00E5FF]">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </span>
              <span>Run Scenario Simulation</span>
            </button>
          </motion.div>
        </div>

        {/* The Locked Real Kolkata Map: seamlessly flowing directly beneath the buttons as one unified stage */}
        <div className="relative w-full min-h-[620px] sm:min-h-[680px] lg:min-h-[740px] z-10">
          <div className="relative w-full h-[620px] sm:h-[680px] lg:h-[740px] overflow-hidden">
            <KolkataGisMap />

            {/* Subtle Outer Edge Dissolves (Bottom & Sides only - NO top white stripe) */}
            <div className="absolute bottom-0 inset-x-0 h-8 sm:h-10 bg-gradient-to-t from-white/50 via-white/20 to-transparent pointer-events-none z-15" />
            <div className="absolute inset-y-0 left-0 w-4 sm:w-6 bg-gradient-to-r from-white/40 to-transparent pointer-events-none z-15" />
            <div className="absolute inset-y-0 right-0 w-4 sm:w-6 bg-gradient-to-l from-white/40 to-transparent pointer-events-none z-15" />

            {/* Gentle atmospheric drift over map */}
            <div className="absolute top-1/4 left-1/3 w-64 sm:w-96 h-28 sm:h-36 rounded-full bg-white/10 blur-2xl pointer-events-none z-10 animate-pulse duration-[8000ms]" />
            <div className="absolute top-1/2 right-1/4 w-56 sm:w-80 h-24 sm:h-32 rounded-full bg-white/8 blur-2xl pointer-events-none z-10" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION: HOW IT WORKS                                   */}
      {/* ======================================================== */}
      <section
        ref={howItWorksRef}
        id="how-it-works"
        className="py-16 sm:py-24 px-3 sm:px-6 lg:px-8 max-w-[1480px] mx-auto border-t border-slate-100 scroll-mt-24"
      >
        <RobotPipelineStepping
          isSectionVisible={isSectionVisible}
          onNavigateCity={() => navigate("/live-city")}
        />
      </section>

      {/* ======================================================== */}
      {/* SECTION: CITIZEN REPORTING + AI VERIFICATION (Citizen/Guest only) */}
      {/* ======================================================== */}
      {!isAdmin && <CitizenReportingSection />}

      {/* ========================================================================= */}
      {/* SECTION: FIELD SENSOR STREAM & CENTERED HOTSPOT HEADING                    */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto border-t border-slate-100 dark:border-[rgba(94,183,201,0.16)] flex flex-col gap-10">
        <div>
          {/* Centered Hotspot Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block text-[11px] font-mono font-bold text-cyan-700 dark:text-[#00E5FF] tracking-[0.2em] uppercase mb-2">
              FIELD SENSOR STREAM
            </span>
            <div className="flex justify-center">
              <SplitText
                text="Active Ground Inundation Hotspots"
                className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F2FBFD] tracking-tight text-center"
                delay={50}
                duration={1.25}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
                tag="h2"
                onLetterAnimationComplete={() => {}}
                showCallback
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-[#B2D2D9] mt-2 leading-relaxed">
              Live field data, citizen reports and sensor streams to identify
              and respond faster.
            </p>
            <div className="mt-3.5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigate("/live-city")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800 dark:text-[#00E5FF] dark:hover:text-[#38BDF8] transition-colors cursor-pointer group"
              >
                <span>Explore Live City Surveillance</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Hotspot Cards -> Accordion Gallery */}
          <AccordionGallery
            items={hotspotGalleryItems}
            defaultIndex={2}
            expandRatio={0.52}
            trigger="hover"
            accentColor="#ffffff"
            overlayColor="#060010"
            textColor="#ffffff"
            grayscale
            showLabels
            duration={0.6}
            ease="power3.out"
            parallax={0.5}
            tilt={8}
            stagger={0.06}
            height={460}
            gap={10}
            radius={15}
            orientation="horizontal"
          />
        </div>

        {/* ========================================================================= */}
        {/* SECTION: CITYWIDE CAPACITY & IMPACT                                       */}
        {/* ========================================================================= */}
        <div className="pt-4">
          <div className="text-center max-w-2xl mx-auto pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-[#10313E] border border-cyan-500/20 text-[11px] font-mono font-bold text-cyan-800 dark:text-[#00E5FF] tracking-[0.2em] uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
              CITYWIDE CAPACITY & IMPACT
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2FBFD] tracking-tight">
              Hydrological Telemetry & Outfall Impact
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B2D2D9] mt-1">
              Live automated sensor mesh measuring rainfall intake, pump
              displacement, and river gate synchronization.
            </p>

            {/* Interactive Telemetry Scenario Selector with Icons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-[#061820]/90 border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] max-w-md mx-auto shadow-sm">
              {Object.values(TELEMETRY_SCENARIOS).map((scen) => {
                const isActive = selectedScenario === scen.id;
                const IconComp =
                  scen.id === "live"
                    ? Droplets
                    : scen.id === "surge"
                      ? Waves
                      : ShieldCheck;

                return (
                  <button
                    key={scen.id}
                    onClick={() => {
                      audioEngine.playUiChirp(920);
                      setSelectedScenario(scen.id);
                    }}
                    className={`flex-1 min-w-[110px] px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-white dark:bg-[#163F4E] text-cyan-900 dark:text-[#00E5FF] shadow-sm border border-slate-200/90 dark:border-[rgba(0,229,255,0.4)]"
                        : "text-slate-500 dark:text-[#6D949D] hover:text-slate-900 dark:hover:text-[#F2FBFD] hover:bg-white/50 dark:hover:bg-[#10313E]"
                    }`}
                  >
                    <IconComp
                      className={`w-3.5 h-3.5 ${isActive ? "text-cyan-600 dark:text-[#00E5FF]" : "text-slate-400 dark:text-slate-500"}`}
                    />
                    <span>{scen.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Four Final Impact Statistics Container */}
          <div className="relative rounded-[26px] overflow-hidden p-5 sm:p-7 border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] dark:bg-[#030F14] shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,229,255,0.08)]">
            <BorderBeam
              size={360}
              duration={14}
              colorFrom="#00E5FF"
              colorTo="#38BDF8"
              borderWidth={1.5}
            />

            {/* Background Layer: MoltenMetal in Light Mode, Interactive Bioluminescent HydrologicalWaveCanvas in Dark Mode */}
            {isDark ? (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
                {/* 1. Deep Oceanic Gradient Matrix Canvas */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#030F14] via-[#061820] to-[#0B2430]" />

                {/* 2. Precision Hydrological Telemetry Dot Grid */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(0, 229, 255, 0.25) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />

                {/* 3. Ambient Atmospheric Water Aurora Radiance */}
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[580px] h-[240px] bg-cyan-500/15 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-20 w-[420px] h-[240px] bg-sky-500/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -right-20 w-[420px] h-[240px] bg-teal-500/10 blur-3xl rounded-full" />

                {/* 4. Interactive HTML5 Hydrological Wave & Bioluminescent Particle Simulation */}
                <HydrologicalWaveCanvas speed={0.85} interactive={true} />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <MoltenMetal
                  color1="#071ee0"
                  color2="#a9a0a9"
                  color3="#e6e2eb"
                  backgroundColor="#000000"
                  speed={1.15}
                  scale={4.4}
                  detail={4}
                  glow={1.8}
                  coreSize={0.12}
                  swirl={1.05}
                  fold={-0.21}
                  blackPoint={0.04}
                  brightness={1.5}
                  colorMode="molten"
                  grain
                  grainIntensity={0.03}
                  mouseInteraction
                  mouseStrength={0.25}
                  opacity={0.6}
                />
              </div>
            )}

            {/* Operational Telemetry Header Strip */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-5 border-b border-slate-200/70 dark:border-[rgba(94,183,201,0.16)] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
                </span>
                <span className="font-semibold tracking-wider text-slate-700 dark:text-[#B2D2D9]">
                  DRAINAGE & OUTFALL SENSOR TELEMETRY
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-[#00E5FF] border border-cyan-500/20">
                  {TELEMETRY_SCENARIOS[selectedScenario]?.badge}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-slate-500 dark:text-[#6D949D] text-[11px]">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#00E5FF]" /> 30s TELEMETRY
                  CYCLE
                </span>
                <span className="text-cyan-600 dark:text-[#00E5FF] font-bold">
                  HOOGHLY ESTUARY LINKED
                </span>
              </div>
            </div>

            {/* Impact Content Layer: 4 Interactive Dynamic Metric Cards */}
            <div className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative">
                {IMPACT_METRICS.map((metric, idx) => {
                  const currentStat =
                    TELEMETRY_SCENARIOS[selectedScenario]?.stats[metric.id];
                  const isSelected = selectedStatId === metric.id;

                  return (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, y: 30, scale: 0.97 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                        delay: idx * 0.1,
                      }}
                      onClick={() => {
                        audioEngine.playUiChirp(1040);
                        setSelectedStatId(metric.id);
                      }}
                      className={`group relative p-6 rounded-[22px] cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        isSelected
                          ? "bg-white dark:bg-[#10313E]/90 border-cyan-500/60 dark:border-[#00E5FF] shadow-[0_12px_40px_rgba(32,197,216,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(0,229,255,0.22)] -translate-y-1"
                          : "bg-white/85 dark:bg-[#061820]/80 backdrop-blur-2xl border-white/70 dark:border-[rgba(94,183,201,0.16)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-white dark:hover:border-[rgba(0,229,255,0.4)] dark:hover:bg-[#10313E]/85 hover:-translate-y-0.5"
                      } border`}
                    >
                      {/* Top glass glow line for dark mode */}
                      <div
                        className={`absolute inset-x-0 top-0 h-[1px] ${isSelected ? "bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent" : "bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent"} dark:block hidden rounded-t-[22px]`}
                      />

                      {/* Header with Icon & Live Pulse Beacon */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#163F4E] border border-slate-100 dark:border-[rgba(0,229,255,0.3)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                            {metric.icon}
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#030F14] border border-slate-200/60 dark:border-[rgba(94,183,201,0.16)]">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${metric.pulseColor || "bg-cyan-400"} animate-pulse`}
                            />
                            <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-[#B2D2D9]">
                              {currentStat?.badge}
                            </span>
                          </div>
                        </div>

                        {/* Animated Dynamic Value */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-950 dark:text-[#F2FBFD] font-mono tracking-tight">
                            <AnimatedNumber
                              value={currentStat?.numericValue || 0}
                              decimals={currentStat?.decimals || 0}
                              duration={800}
                            />
                          </span>
                          {currentStat?.unit && (
                            <span className="text-sm font-semibold text-slate-500 dark:text-[#B2D2D9] font-mono">
                              {currentStat.unit}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-[#B2D2D9] font-medium mt-1">
                          {currentStat?.label}
                        </div>
                      </div>

                      {/* Dynamic Reactive Chart Graphic */}
                      <div>
                        {metric.renderChart(selectedScenario, currentStat)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Real-Time Outfall Diagnostic Console (Expanded on selection) */}
              <AnimatePresence mode="wait">
                {selectedStatId && (
                  <motion.div
                    key={`${selectedScenario}-${selectedStatId}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#061820]/90 backdrop-blur-xl border border-slate-200/90 dark:border-[rgba(94,183,201,0.16)] shadow-lg flex flex-col gap-4"
                  >
                    {/* Top Row: Diagnostic Header and Launch Button */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-[#163F4E] border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-[#00E5FF]">
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-800 dark:text-[#00E5FF]">
                            <span>
                              DIAGNOSTIC FEED:{" "}
                              {TELEMETRY_SCENARIOS[selectedScenario]?.stats[
                                selectedStatId
                              ]?.label.toUpperCase()}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                              •
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {
                                TELEMETRY_SCENARIOS[selectedScenario]?.stats[
                                  selectedStatId
                                ]?.status
                              }
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-[#F2FBFD] mt-0.5 font-medium">
                            {
                              TELEMETRY_SCENARIOS[selectedScenario]?.stats[
                                selectedStatId
                              ]?.diagnostic
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        <button
                          onClick={() => {
                            audioEngine.playUiChirp(1040);
                            navigate("/live-city");
                            setTimeout(() => {
                              const mapElem =
                                document.getElementById("gis-map-viewport");
                              if (mapElem) {
                                mapElem.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }
                            }, 100);
                          }}
                          className="w-full md:w-auto px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00E5FF] dark:hover:bg-[#2BEBFF] text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <span>LAUNCH GIS TELEMETRY</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: 3-Node Real-Time Micro-Telemetry Cluster */}
                    {TELEMETRY_SCENARIOS[selectedScenario]?.stats[
                      selectedStatId
                    ]?.subMetrics && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full pt-3 border-t border-slate-200/60 dark:border-[rgba(94,183,201,0.16)]">
                        {TELEMETRY_SCENARIOS[selectedScenario].stats[
                          selectedStatId
                        ].subMetrics.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-[#030F14]/80 border border-slate-200/60 dark:border-[rgba(94,183,201,0.16)] text-xs font-mono"
                          >
                            <span className="text-slate-500 dark:text-[#B2D2D9] text-[11px] truncate">
                              {sub.label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="font-bold text-slate-900 dark:text-[#F2FBFD]">
                                {sub.value}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Existing Footer Preserved */}
      <Footer />
    </div>
  );
}

export default LandingPage;
