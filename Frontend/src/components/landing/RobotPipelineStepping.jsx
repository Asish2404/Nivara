import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Droplets,
  Layers,
  Users,
  Brain,
  Shield,
  MapPin,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Waves,
  Zap,
  Activity,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { audioEngine } from "../../utils/audioEngine";

/**
 * 7 Pipeline Stages: Detect → Verify → Correlate → Simulate → Predict → Alert → Act
 */
export const KWI_PIPELINE_STAGES = [
  {
    num: "01",
    id: "detect",
    name: "DETECT",
    microLabel: "ACOUSTIC & CITIZEN SENSING",
    speechTitle: "Let's begin!",
    speechSub: "Turn citizen reports into real action.",
    cardTitle: "Citizen Field Observation Ingested",
    cardSubtitle: "Acoustic IoT sensor and citizen mobile photo registered at Ward 86",
    accent: "#08B8F5",
    icon: Radio,
  },
  {
    num: "02",
    id: "verify",
    name: "VERIFY",
    microLabel: "SPATIAL COMPUTER VISION",
    speechTitle: "Validating Depth!",
    speechSub: "CV model confirms 38.5cm curb immersion.",
    cardTitle: "Spatial Computer Vision Validation",
    cardSubtitle: "Edge model calibrated against physical curb datum landmarks",
    accent: "#00C2FF",
    icon: ShieldCheck,
  },
  {
    num: "03",
    id: "correlate",
    name: "CORRELATE",
    microLabel: "HYDRAULIC GRAPH TOPOLOGY",
    speechTitle: "Syncing Network!",
    speechSub: "41 conduit nodes and sluice gates linked.",
    cardTitle: "Hydraulic Conduit Graph Network",
    cardSubtitle: "Conduit saturation correlated with Palmer Bridge siphon capacity",
    accent: "#38BDF8",
    icon: Activity,
  },
  {
    num: "04",
    id: "simulate",
    name: "SIMULATE",
    microLabel: "CATCHMENT VULNERABILITY",
    speechTitle: "Catchment Matrix!",
    speechSub: "Evaluating Palmer Bridge bottleneck sill.",
    cardTitle: "Catchment Risk Scoring & Matrix",
    cardSubtitle: "Real-time risk scoring across Borough VII drainage basin",
    accent: "#10B981",
    icon: Zap,
  },
  {
    num: "05",
    id: "predict",
    name: "PREDICT",
    microLabel: "STORM SURGE FORECAST",
    speechTitle: "Surge Forecast!",
    speechSub: "Storm surge peaks at T+25m (+18cm rise).",
    cardTitle: "60-Minute Radar Runoff Projection",
    cardSubtitle: "Doppler storm runoff curve constrained by Hooghly tidal lockout",
    accent: "#6366F1",
    icon: Waves,
  },
  {
    num: "06",
    id: "alert",
    name: "ALERT",
    microLabel: "DIGITAL TWIN INTERVENTION",
    speechTitle: "Simulating Relief!",
    speechSub: "3 mobile pumps model -24cm reduction.",
    cardTitle: "Digital Twin Mobile Pump Modeling",
    cardSubtitle: "Simulates high-capacity mobile pump dispatch at EM Bypass",
    accent: "#F43F5E",
    icon: AlertTriangle,
  },
  {
    num: "07",
    id: "act",
    name: "ACT",
    microLabel: "MUNICIPAL DISPATCH EXECUTION",
    speechTitle: "Action Dispatched!",
    speechSub: "Work Order #9418 en route to Sector V.",
    cardTitle: "Municipal Work Order Generation",
    cardSubtitle: "Direct field crew dispatch with live 11-min ETA tracking",
    accent: "#08B8F5",
    icon: CheckCircle2,
  },
];

/**
 * Exact 7 Floating Architectural Stair Platform Coordinates
 * Calibrated on a 1024x560 coordinate space.
 * Each platform has guaranteed collision-free safe portal placement!
 */
const STAIR_PLATFORMS = [
  { x: 155, y: 460, label: "DETECT", portalX: 340, portalY: 280, anchorX: 205, anchorY: 465 },
  { x: 310, y: 405, label: "VERIFY", portalX: 470, portalY: 235, anchorX: 360, anchorY: 410 },
  { x: 395, y: 345, label: "CORRELATE", portalX: 550, portalY: 175, anchorX: 445, anchorY: 350 },
  { x: 485, y: 285, label: "SIMULATE", portalX: 640, portalY: 120, anchorX: 535, anchorY: 290 },
  { x: 570, y: 225, label: "PREDICT", portalX: 685, portalY: 195, anchorX: 620, anchorY: 230, openDown: true },
  { x: 655, y: 165, label: "ALERT", portalX: 700, portalY: 235, anchorX: 705, anchorY: 170, openDown: true },
  // Step 7 Summit: Opens into the wide-open LEFT space with ZERO robot overlap!
  { x: 740, y: 105, label: "ACT", portalX: 230, portalY: 95, anchorX: 740, anchorY: 110, openLeft: true },
];

/* ========================================================================= */
/* 1. SOPHISTICATED ARCHITECTURAL ISOMETRIC CITY LAYER (PURE VECTOR SVG)     */
/* Features layered building extrusions, Hooghly river flow, bridge & Victoria */
/* ========================================================================= */
const ArchitecturalCityscape = ({ activeStep, mouseOffset }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out"
      style={{
        transform: `translate3d(${mouseOffset.x * 3}px, ${mouseOffset.y * 3}px, 0)`,
      }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1024 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle River Gradient */}
          <linearGradient id="hooghlyWaterFlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.45" />
          </linearGradient>

          {/* Micro Isometric Topography Pattern */}
          <pattern id="isoGridMap" width="32" height="18.47" patternUnits="userSpaceOnUse">
            <path d="M 0,9.23 L 16,0 L 32,9.23 L 16,18.47 Z" fill="none" stroke="#e2e8f0" strokeWidth="0.45" strokeOpacity="0.5" />
          </pattern>
        </defs>

        {/* Ambient Topography Grid */}
        <rect width="1024" height="560" fill="url(#isoGridMap)" opacity="0.65" />

        {/* ================================================================ */}
        {/* HOOGHLY RIVER CHANNEL MEANDERING THROUGH KOLKATA                 */}
        {/* ================================================================ */}
        <g opacity="0.9">
          <path
            d="M 580,0 Q 640,120 720,180 T 840,260 T 730,410 T 510,560 L 650,560 Q 820,430 940,290 T 840,160 T 710,0 Z"
            fill="url(#hooghlyWaterFlow)"
          />
          {/* Riverbank Shoreline Traces */}
          <path
            d="M 580,0 Q 640,120 720,180 T 840,260 T 730,410 T 510,560"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.2"
            strokeOpacity="0.65"
          />
          <path
            d="M 710,0 Q 840,160 940,290 T 650,560"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.2"
            strokeOpacity="0.65"
          />

          {/* Flow Lines inside the River */}
          <path
            d="M 640,0 Q 700,130 770,185 T 870,265 T 780,410 T 570,560"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.9"
            strokeDasharray="8 12"
            strokeOpacity="0.6"
            className="animate-pulse"
          />

          {/* "K O L K A T A" Geographic Watermark Label */}
          <text
            x="675"
            y="355"
            fill="#2563eb"
            fillOpacity="0.3"
            fontSize="14"
            fontFamily="sans-serif"
            fontWeight="bold"
            letterSpacing="0.45em"
            transform="rotate(-28, 675, 355)"
          >
            K O L K A T A
          </text>
        </g>

        {/* ================================================================ */}
        {/* ICONIC HOWRAH BRIDGE OVER THE HOOGHLY RIVER                      */}
        {/* ================================================================ */}
        <g opacity="0.82">
          {/* Bridge Roadway Deck */}
          <line x1="770" y1="210" x2="990" y2="155" stroke="#94a3b8" strokeWidth="4" />
          <line x1="770" y1="209" x2="990" y2="154" stroke="#ffffff" strokeWidth="1.2" />
          
          {/* West Tower (Howrah) */}
          <path d="M 820,210 L 828,138 L 836,210 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
          <line x1="828" y1="138" x2="828" y2="210" stroke="#64748b" strokeWidth="1" />
          <line x1="820" y1="174" x2="836" y2="174" stroke="#64748b" strokeWidth="1" />

          {/* East Tower (Kolkata) */}
          <path d="M 940,180 L 948,108 L 956,180 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
          <line x1="948" y1="108" x2="948" y2="180" stroke="#64748b" strokeWidth="1" />
          <line x1="940" y1="144" x2="956" y2="144" stroke="#64748b" strokeWidth="1" />

          {/* Cantilever Truss Structure */}
          <path d="M 770,210 L 828,138 L 888,178 L 948,108 L 990,155" fill="none" stroke="#64748b" strokeWidth="1.2" />
          <line x1="828" y1="138" x2="948" y2="108" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
        </g>

        {/* ================================================================ */}
        {/* VICTORIA MEMORIAL ISOMETRIC ARCHITECTURAL MONUMENT               */}
        {/* ================================================================ */}
        <g transform="translate(810, 240)" opacity="0.88">
          {/* Symmetrical Base Plinth */}
          <polygon points="40,25 76,42 40,60 4,42" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          {/* Main Classical Dome Drum */}
          <polygon points="40,12 60,22 40,32 20,22" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
          <ellipse cx="40" cy="12" rx="14" ry="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
          <ellipse cx="40" cy="8" rx="8" ry="12" fill="#ffffff" stroke="#64748b" strokeWidth="0.8" />
          <line x1="40" y1="0" x2="40" y2="5" stroke="#08B8F5" strokeWidth="1.5" />
          {/* Flanking Corner Pavilions */}
          <ellipse cx="18" cy="30" rx="5" ry="7" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
          <ellipse cx="62" cy="30" rx="5" ry="7" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
        </g>

        {/* ================================================================ */}
        {/* ISOMETRIC CITY BLOCKS & EXTRUDED ARCHITECTURAL BUILDINGS          */}
        {/* ================================================================ */}
        <g opacity="0.55">
          {/* Cluster 1: Salt Lake & Sector V IT Hub (Left/Center) */}
          <g>
            <polygon points="320,230 335,222 350,230 335,238" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="320,230 335,238 335,280 320,272" fill="#edf2f7" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="335,238 350,230 350,272 335,280" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />

            <polygon points="345,190 360,182 375,190 360,198" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="345,190 360,198 360,260 345,252" fill="#edf2f7" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="360,198 375,190 375,252 360,260" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />

            <polygon points="410,380 425,372 440,380 425,388" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="410,380 425,388 425,430 410,422" fill="#edf2f7" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="425,388 440,380 440,422 425,430" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />

            <polygon points="440,340 455,332 470,340 455,348" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="440,340 455,348 455,420 440,412" fill="#edf2f7" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="455,348 470,340 470,412 455,420" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />
          </g>

          {/* Cluster 2: New Town & Rajarhat Blocks (Upper Right) */}
          <g>
            <polygon points="840,80 852,73 864,80 852,87" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="840,80 852,87 852,130 840,123" fill="#edf2f7" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="852,87 864,80 864,123 852,130" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />

            <polygon points="870,100 885,92 900,100 885,108" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="870,100 885,108 885,160 870,152" fill="#edf2f7" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="885,108 900,100 900,152 885,160" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6" />
          </g>

          {/* Subtle Connecting Infrastructure Arteries */}
          <path d="M 280,480 L 460,380 L 640,330 L 800,230" stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.4" />
        </g>
      </svg>
    </div>
  );
};

/* ========================================================================= */
/* 2. TRANSLUCENT ARCHITECTURAL GLASS STAIR PLATFORM COMPONENT               */
/* Crisp 3D isometric slab with internal refraction, cyan edge & depth       */
/* ========================================================================= */
const ArchitecturalGlassPlatform = ({
  stage,
  index,
  isActive,
  isLandingDeflect,
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      animate={{
        y: isLandingDeflect ? 2.5 : 0, // Physical impact deflection
      }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={`relative cursor-pointer select-none transition-all duration-300 ${
        isActive
          ? "scale-[1.05] filter drop-shadow-[0_12px_24px_rgba(8,184,245,0.4)]"
          : "hover:scale-[1.02] filter drop-shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
      }`}
    >
      <svg
        width="114"
        height="58"
        viewBox="0 0 114 58"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Realistic Contact Shadow */}
        <ellipse
          cx="57"
          cy="50"
          rx="47"
          ry="6.5"
          fill="rgba(15, 23, 42, 0.08)"
          className="blur-[2px]"
        />

        {/* 1. Left Vertical Face (Shaded Translucent Underside Depth) */}
        <polygon
          points="8,25 57,44 57,52 8,33"
          fill={isActive ? "#dbeafe" : "#edf2f7"}
          stroke={isActive ? "#38bdf8" : "#cbd5e1"}
          strokeWidth="0.8"
        />

        {/* 2. Right Vertical Face (Front Glass Face with Stage Number) */}
        <polygon
          points="57,44 106,25 106,33 57,52"
          fill={isActive ? "#e0f2fe" : "#f8fafc"}
          stroke={isActive ? "#38bdf8" : "#e2e8f0"}
          strokeWidth="0.8"
        />

        {/* 3. Top Surface Diamond (Transparent Glass Top with Refraction) */}
        <polygon
          points="57,7 106,25 57,44 8,25"
          fill={isActive ? "#ffffff" : "#ffffff"}
          stroke={isActive ? "#08B8F5" : "#cbd5e1"}
          strokeWidth={isActive ? "2" : "1"}
        />

        {/* Top Active Cyan Gradient Refraction Highlight */}
        {isActive && (
          <polygon
            points="57,9 102,25 57,42 12,25"
            fill="url(#activeStairRefract)"
            opacity="0.5"
          />
        )}

        <defs>
          <linearGradient id="activeStairRefract" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#08B8F5" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Stage Number on Front Glass Face */}
      <span
        className={`absolute top-[29px] left-[57px] transform -translate-x-1/2 -translate-y-1/2 text-[11px] font-mono font-bold tracking-tight pointer-events-none transition-colors ${
          isActive ? "text-[#08B8F5]" : "text-slate-800"
        }`}
      >
        {stage.num}
      </span>

      {/* Slanted Stage Label Underneath Front Face */}
      <span
        className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[8px] font-mono font-bold tracking-wider uppercase pointer-events-none transition-colors ${
          isActive ? "text-[#08B8F5]" : "text-slate-500"
        }`}
      >
        {stage.name}
      </span>

      {/* Corner Technical Node Pin */}
      <div
        className={`absolute top-[23px] right-2 w-1.5 h-1.5 rounded-full pointer-events-none transition-all ${
          isActive ? "bg-[#08B8F5] shadow-[0_0_8px_#08B8F5]" : "bg-slate-300"
        }`}
      />
    </motion.div>
  );
};

/* ========================================================================= */
/* 3. PHYSICAL ROBOT PROTAGONIST WITH BELIEVABLE KINEMATICS                  */
/* ========================================================================= */
const ProtagonistRobot = ({ isAnticipating, isJumping, isLanding }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative flex flex-col items-center select-none pointer-events-none z-40"
      style={{ width: "64px" }}
      animate={
        shouldReduceMotion
          ? {}
          : isAnticipating
          ? {
              y: 4, // Anticipation compression
              scaleY: 0.92,
              rotate: 2, // Slight forward pitch
            }
          : isJumping
          ? {
              y: [4, -38, 0], // Smooth parabolic height arc
              scaleY: [0.92, 1.07, 0.98, 1],
              rotate: [2, 4, 1, 0],
            }
          : isLanding
          ? {
              y: [0, 3.5, 0], // Controlled landing compression
              scaleY: [1, 0.88, 1],
              rotate: 0,
            }
          : {
              y: [0, -3.5, 0], // Gentle idle floating/breathing
              scaleY: 1,
              rotate: 0,
            }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.01 }
          : isAnticipating
          ? { duration: 0.18, ease: "easeIn" }
          : isJumping
          ? { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
          : isLanding
          ? { duration: 0.2, ease: "easeOut" }
          : { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
      }
    >
      {/* Soft Ambient Reflected Cyan Glow */}
      <div className="absolute top-1.5 inset-x-1.5 h-8 rounded-full bg-[#08B8F5]/25 blur-md -z-10" />

      {/* Glossy 3D Robot Character */}
      <img
        src="/assets/ai-bot.png"
        alt="KWI AI Timeline Robot"
        className="w-full h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(8,184,245,0.38)] drop-shadow-[0_12px_22px_rgba(15,23,42,0.16)]"
        draggable="false"
      />

      {/* Contact Shadow on Stair Surface */}
      <motion.div
        className="w-11 h-2 bg-slate-900/35 rounded-full blur-[2px] -mt-1"
        animate={
          isAnticipating
            ? { scale: 1.15, opacity: 0.45 }
            : isJumping
            ? { scale: [1.1, 0.35, 1], opacity: [0.45, 0.08, 0.4] }
            : isLanding
            ? { scale: [1, 1.35, 1], opacity: [0.4, 0.6, 0.4] }
            : { scale: [1, 0.94, 1], opacity: [0.4, 0.26, 0.4] }
        }
        transition={
          isAnticipating
            ? { duration: 0.18 }
            : isJumping
            ? { duration: 0.65, ease: "easeInOut" }
            : isLanding
            ? { duration: 0.2, ease: "easeOut" }
            : { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
        }
      />
    </motion.div>
  );
};

/* ========================================================================= */
/* 4. SEVEN FOCUSED ANALYTICAL CHAPTER VISUALIZATIONS                        */
/* Built as miniature pieces of data art, not cluttered dashboards           */
/* ========================================================================= */

// Stage 01: DETECT (Citizen Field Observation)
const DetectArtVisual = () => {
  const [gauge, setGauge] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setGauge(25), 220);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-2.5 text-left font-mono">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative rounded-lg overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
          <img
            src="/images/kolkata_waterlog_sector_v.jpg"
            alt="Ingested Citizen Report"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 bg-slate-950/80 backdrop-blur-xs text-[#08B8F5] text-[7px] px-1 py-0.5 rounded flex items-center gap-0.5 border border-white/10">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEO-INGESTED</span>
          </div>
        </div>

        <div className="rounded-lg bg-sky-50/70 border border-sky-100 p-2 flex flex-col justify-between text-[8px]">
          <div className="text-slate-400">GPS ACCURACY: ±1.2m</div>
          <div className="flex items-center justify-center my-1">
            <div className="w-5 h-5 rounded-full bg-[#0070F3] text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-3 h-3" />
            </div>
          </div>
          <div className="text-center font-bold text-slate-800">22.5726° N, 88.3639° E</div>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-100 pt-1.5 text-[9px]">
        <div>
          <span className="text-slate-400 block text-[7px] uppercase">MEASURED DEPTH</span>
          <span className="font-extrabold text-[#08B8F5] text-xs">{gauge}.0 cm</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[7px] uppercase">STATUS</span>
          <span className="font-semibold text-emerald-600">Acoustic Signal Verified</span>
        </div>
      </div>
    </div>
  );
};

// Stage 02: VERIFY (Spatial Computer Vision)
const VerifyArtVisual = () => {
  const [conf, setConf] = useState("0%");

  useEffect(() => {
    const t = setTimeout(() => setConf("99.4%"), 220);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-2 text-left font-mono">
      <div className="relative rounded-lg overflow-hidden aspect-[16/8] bg-slate-950 border border-slate-800 p-2.5 flex flex-col justify-between shadow-inner">
        {/* Horizontal Scanner Sweep */}
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: ["0%", "100%", "45%"] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute top-0 bottom-0 w-[2px] bg-[#00C2FF] shadow-[0_0_8px_#00C2FF] z-10 pointer-events-none"
        />

        <div className="flex items-center justify-between text-[8px] text-[#00C2FF] z-10">
          <span>SPATIAL CV SCANNER</span>
          <span className="bg-cyan-950 border border-cyan-500/40 px-1.5 py-0.5 rounded text-cyan-300 font-bold">
            CONFIDENCE: {conf}
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-[8px] text-slate-300 z-10">
          <div>CURB DATUM: <span className="text-white font-bold">15.0 cm</span></div>
          <div>WATER LEVEL: <span className="text-emerald-400 font-bold">38.5 cm</span></div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[9px] border-t border-slate-100 pt-1.5">
        <span className="text-slate-500">EDGE INFERENCE TIME</span>
        <span className="font-bold text-[#08B8F5]">3.2s Validated</span>
      </div>
    </div>
  );
};

// Stage 03: CORRELATE (Hydraulic Graph Network)
const CorrelateArtVisual = () => (
  <div className="space-y-2 text-left font-mono">
    <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
      <div className="flex justify-between text-[7px] text-sky-400 mb-1">
        <span>CONDUIT TOPOLOGY GRAPH</span>
        <span>41 NODES LINKED</span>
      </div>
      <svg className="w-full h-10" viewBox="0 0 200 40" fill="none">
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          d="M 10,20 L 60,12 L 110,28 L 160,15 L 190,20"
          stroke="#08B8F5"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
        <circle cx="10" cy="20" r="5" fill="#0070F3" />
        <circle cx="60" cy="12" r="6" fill="#0f172a" stroke="#08B8F5" strokeWidth="1.5" />
        <circle cx="110" cy="28" r="7" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="160" cy="15" r="6" fill="#0f172a" stroke="#08B8F5" strokeWidth="1.5" />
        <circle cx="190" cy="20" r="5" fill="#0070F3" />
      </svg>
    </div>

    <div className="flex justify-between text-[9px] border-t border-slate-100 pt-1.5">
      <span className="text-slate-500">TRUNK SATURATION</span>
      <span className="font-bold text-[#08B8F5]">72% Capacity (Flow: 2.1 m/s)</span>
    </div>
  </div>
);

// Stage 04: SIMULATE (Catchment Risk Matrix)
const CatchmentArtVisual = () => {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setScore(84), 220);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-2 text-left font-mono">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-rose-50 border border-rose-200/70 p-2 flex flex-col justify-between">
          <span className="text-[7px] text-rose-700 font-bold uppercase">CATCHMENT RISK</span>
          <div className="text-xl font-black text-rose-600 my-0.5">
            {score}<span className="text-xs text-rose-400 font-bold">/100</span>
          </div>
          <span className="text-[7px] text-slate-500">Borough VII Basin</span>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2 flex flex-col justify-center space-y-1">
          <div className="space-y-0.5">
            <div className="flex justify-between text-[7px] text-slate-600">
              <span>Soil Saturation</span>
              <span className="text-rose-600 font-bold">91%</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: "91%" }} />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[7px] text-slate-600">
              <span>Runoff Index</span>
              <span className="text-amber-600 font-bold">88%</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "88%" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-[8px] text-slate-600 border-t border-slate-100 pt-1.5">
        <span className="font-bold text-amber-700">BOTTLENECK:</span> Palmer Bridge conduit sill (-62% throughput).
      </div>
    </div>
  );
};

// Stage 05: PREDICT (60-Min Radar Runoff Forecast)
const PredictArtVisual = () => (
  <div className="space-y-2 text-left font-mono">
    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
      <div className="flex justify-between text-[7px] text-indigo-300 mb-1">
        <span>60-MIN RUNOFF PROJECTION</span>
        <span className="text-rose-400 font-bold">HOOGHLY LOCK: +3.8M</span>
      </div>
      <svg className="w-full h-10" viewBox="0 0 200 40" fill="none">
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          d="M 10,32 Q 50,28 90,12 T 150,8 T 190,18"
          stroke="#818cf8"
          strokeWidth="2"
        />
        <circle cx="100" cy="10" r="2.5" fill="#f43f5e" />
        <text x="100" y="6" fill="#f87171" fontSize="6" fontWeight="bold" textAnchor="middle">
          PEAK +18cm @ T+25m
        </text>
      </svg>
    </div>

    <div className="flex justify-between text-[9px] border-t border-slate-100 pt-1.5">
      <span className="text-slate-500">TIDAL CREST LOCKOUT</span>
      <span className="font-bold text-rose-500">Gravity Gates Constrained</span>
    </div>
  </div>
);

// Stage 06: ALERT (Digital Twin Pump Simulation)
const SimulateArtVisual = () => {
  const [relief, setRelief] = useState("0 cm");

  useEffect(() => {
    const t = setTimeout(() => setRelief("-24 cm"), 220);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-2 text-left font-mono">
      <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
        <div className="flex justify-between text-[7px] text-emerald-400 mb-1">
          <span>DIGITAL TWIN INTERVENTION</span>
          <span>3 MOBILE PUMPS</span>
        </div>
        <svg className="w-full h-10" viewBox="0 0 200 40" fill="none">
          <path d="M 10,25 Q 60,18 100,8 T 190,6" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            d="M 10,25 Q 60,18 100,18 T 190,32"
            stroke="#10b981"
            strokeWidth="2"
          />
          <text x="130" y="16" fill="#08B8F5" fontSize="7" fontWeight="bold">
            Δ -24 cm RELIEF
          </text>
        </svg>
      </div>

      <div className="flex justify-between text-[9px] border-t border-slate-100 pt-1.5">
        <span className="text-slate-500">SIMULATED RELIEF</span>
        <span className="font-bold text-emerald-600">{relief} (-4.5 hrs)</span>
      </div>
    </div>
  );
};

// Stage 07: ACT (Municipal Work Order Dispatch)
const ActArtVisual = ({ onNavigateCity }) => (
  <div className="space-y-2 text-left font-mono">
    <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-white text-[8px]">
      <div className="flex justify-between text-[#08B8F5] font-bold mb-1">
        <span>KMC WORK ORDER #9418</span>
        <span className="text-emerald-400">DISPATCHED</span>
      </div>
      <div>CREW: Borough VII Rapid Unit #4</div>
      <div className="text-sky-300 font-bold">ESTIMATED ARRIVAL: 11 MINS</div>
    </div>

    <button
      type="button"
      onClick={() => {
        audioEngine.playUiChirp(1000);
        if (onNavigateCity) onNavigateCity();
      }}
      className="w-full py-1.5 rounded-lg bg-[#0070F3] hover:bg-[#005bbd] text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
    >
      <span>Open Live Control Room →</span>
    </button>
  </div>
);

/* ========================================================================= */
/* MAIN COMPONENT: ELEVATED CINEMATIC INTELLIGENCE STAIRCASE                 */
/* ========================================================================= */
export const RobotPipelineStepping = ({
  isSectionVisible = true,
  onNavigateCity,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Active Stage Index (0 to 6)
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  /**
   * Phased State Machine:
   * 'IDLE' -> 'ANTICIPATING' -> 'JUMPING' -> 'LANDING' -> 'ANCHOR' ->
   * 'CONNECTOR' -> 'PORTAL_EXPAND' -> 'HOLDING' -> 'COLLAPSING'
   */
  const [phase, setPhase] = useState("IDLE");
  const [autoplay, setAutoplay] = useState(true);
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const timerRef = useRef(null);
  const activeStageRef = useRef(activeStageIdx);
  const autoplayRef = useRef(autoplay);
  const phaseRef = useRef(phase);

  useEffect(() => {
    activeStageRef.current = activeStageIdx;
  }, [activeStageIdx]);

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const transitionTo = useCallback((nextPhase, delayMs, callback) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setPhase(nextPhase);
      if (callback) callback();
    }, delayMs);
  }, [clearTimer]);

  // Subtle Mouse Parallax Handler
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x, y });
  };

  // Main Progression Cycle
  useEffect(() => {
    if (!autoplay || !isSectionVisible) {
      clearTimer();
      return;
    }

    if (phase === "ANTICIPATING") {
      transitionTo("JUMPING", 180, () => {
        audioEngine.playUiChirp(550 + activeStageRef.current * 40);
      });
    } else if (phase === "JUMPING") {
      transitionTo("LANDING", 650, () => {
        audioEngine.playUiChirp(700 + activeStageRef.current * 40);
      });
    } else if (phase === "LANDING") {
      transitionTo("ANCHOR", 200);
    } else if (phase === "ANCHOR") {
      transitionTo("CONNECTOR", 120);
    } else if (phase === "CONNECTOR") {
      transitionTo("PORTAL_EXPAND", 260, () => {
        setIsChapterOpen(true);
      });
    } else if (phase === "PORTAL_EXPAND") {
      transitionTo("HOLDING", 450);
    } else if (phase === "HOLDING") {
      transitionTo("COLLAPSING", 2400);
    } else if (phase === "COLLAPSING") {
      transitionTo("PREPARE", 400, () => {
        setIsChapterOpen(false);
        const nextStep = (activeStageRef.current + 1) % 7;
        setActiveStageIdx(nextStep);
        setPhase("ANTICIPATING");
      });
    }
  }, [phase, autoplay, isSectionVisible, transitionTo, clearTimer]);

  // Handle stage selection
  const handleSelectStage = (idx) => {
    clearTimer();
    audioEngine.playUiChirp(700 + idx * 40);
    setIsChapterOpen(false);
    setPhase("COLLAPSING");

    setTimeout(() => {
      setActiveStageIdx(idx);
      setPhase("ANTICIPATING");
      setAutoplay(false);
    }, 250);
  };

  const currentStage = KWI_PIPELINE_STAGES[activeStageIdx];
  const activeCoord = STAIR_PLATFORMS[activeStageIdx];

  const isAnticipating = phase === "ANTICIPATING";
  const isJumping = phase === "JUMPING";
  const isLanding = phase === "LANDING";
  const isLandingDeflect = phase === "LANDING";

  const showAnchor =
    phase === "ANCHOR" ||
    phase === "CONNECTOR" ||
    phase === "PORTAL_EXPAND" ||
    phase === "HOLDING";

  const showConnector =
    phase === "CONNECTOR" ||
    phase === "PORTAL_EXPAND" ||
    phase === "HOLDING";

  return (
    <div className="w-full select-none font-sans flex items-center justify-center py-4">
      {/* 
        ============================================================
        HERO CONTAINER (1024x560 PROPORTION & TRANSLUCENT LIGHT BORDER)
        ============================================================
      */}
      <div
        onMouseMove={handleMouseMove}
        className="relative w-full max-w-[1240px] aspect-[1024/560] min-h-[580px] rounded-[32px] sm:rounded-[40px] border border-slate-200/90 shadow-[0_25px_60px_rgba(15,23,42,0.06)] overflow-hidden bg-gradient-to-br from-[#f8fbfe] via-[#ffffff] to-[#f0f6fc]"
      >
        {/* 
          ============================================================
          1. LAYER 1: PURE NATIVE VECTOR ARCHITECTURAL CITYSCAPE
          ============================================================
        */}
        <ArchitecturalCityscape
          activeStep={activeStageIdx}
          mouseOffset={mouseOffset}
        />

        {/* 
          ============================================================
          2. LAYER 2: VECTOR DATA CONNECTOR PATH (CONNECTING STAIRS)
          ============================================================
        */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 1024 560"
        >
          <path
            d={`M ${STAIR_PLATFORMS[0].x},${STAIR_PLATFORMS[0].y} L ${STAIR_PLATFORMS[1].x},${STAIR_PLATFORMS[1].y} L ${STAIR_PLATFORMS[2].x},${STAIR_PLATFORMS[2].y} L ${STAIR_PLATFORMS[3].x},${STAIR_PLATFORMS[3].y} L ${STAIR_PLATFORMS[4].x},${STAIR_PLATFORMS[4].y} L ${STAIR_PLATFORMS[5].x},${STAIR_PLATFORMS[5].y} L ${STAIR_PLATFORMS[6].x},${STAIR_PLATFORMS[6].y}`}
            fill="none"
            stroke="#08B8F5"
            strokeWidth="1.8"
            strokeDasharray="5 4"
            opacity="0.65"
          />
        </svg>

        {/* 
          ============================================================
          3. LAYER 3: TOP HEADER & NAVIGATION
          ============================================================
        */}
        <div className="absolute top-6 sm:top-8 left-6 sm:left-10 right-6 sm:right-10 z-20 flex flex-col justify-between pointer-events-auto">
          
          {/* Top Row: Title + CTA */}
          <div className="flex items-start justify-between gap-4">
            
            {/* Left Header Title */}
            <div className="text-left max-w-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-3 bg-[#08B8F5] rounded-full" />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.2em] text-slate-500 uppercase">
                  KOLKATA WATER INTELLIGENCE
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-[#07152F] font-sans leading-tight">
                One report{" "}
                <span className="font-normal text-[#243A5A]">
                  becomes city intelligence.
                </span>
              </h1>

              <p className="text-[#71839B] text-xs sm:text-[13px] font-normal mt-1.5 leading-relaxed max-w-lg">
                A 7-stage autonomous pipeline that transforms citizen inputs
                into real-time action for a safer, more resilient Kolkata.
              </p>
            </div>

            {/* Right Top CTA & Autoplay Toggle */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 pt-1">
              {/* Pill Button: ▶ LET'S BEGIN → */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900);
                  setActiveStageIdx(0);
                  setAutoplay(true);
                  setPhase("ANTICIPATING");
                }}
                className="bg-gradient-to-r from-[#0070F3] to-[#08B8F5] hover:opacity-95 text-white font-mono font-bold text-xs sm:text-[13px] px-5 sm:px-6 py-2.5 rounded-full shadow-[0_6px_20px_rgba(8,184,245,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>LET'S BEGIN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Autoplay Toggle Switch */}
              <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-bold text-slate-600">
                <span className="hidden sm:inline">AUTOPLAY</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoplay;
                    setAutoplay(next);
                    if (next) setPhase("ANTICIPATING");
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                    autoplay ? "bg-[#08B8F5]" : "bg-slate-300"
                  }`}
                  title={autoplay ? "Pause autoplay" : "Enable autoplay"}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: autoplay ? 16 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Row of 7 Compact Stage Navigation Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-5 overflow-x-auto py-1 max-w-full">
            {KWI_PIPELINE_STAGES.map((stg, i) => {
              const isActive = i === activeStageIdx;

              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => handleSelectStage(i)}
                  className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? "bg-[#0070F3] text-white font-bold shadow-[0_4px_12px_rgba(0,112,243,0.35)]"
                      : "bg-white/85 hover:bg-white text-slate-600 font-semibold border border-slate-200/80 shadow-2xs"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {stg.num}
                  </span>
                  <span>{stg.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 
          ============================================================
          4. LEFT-SIDE SUPPORTING METRIC CARDS
          ============================================================
        */}
        <div className="absolute left-6 sm:left-10 top-[215px] sm:top-[235px] z-10 flex flex-col gap-3 pointer-events-auto">
          {/* Card 1: REAL-TIME ANALYSIS */}
          <div className="w-[125px] sm:w-[135px] bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3 text-left shadow-sm">
            <div className="w-5 h-5 rounded-md text-[#0070F3] flex items-center justify-center mb-1.5">
              <Droplets className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-[9px] font-mono font-bold text-slate-400 uppercase leading-none">
              REAL-TIME ANALYSIS
            </div>
            <div className="text-xl font-extrabold text-[#0070F3] font-sans mt-0.5">
              24/7
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              City Coverage
            </div>
          </div>

          {/* Card 2: DATA SOURCES */}
          <div className="w-[125px] sm:w-[135px] bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3 text-left shadow-sm">
            <div className="w-5 h-5 rounded-md text-[#08B8F5] flex items-center justify-center mb-1.5">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-[9px] font-mono font-bold text-slate-400 uppercase leading-none">
              DATA SOURCES
            </div>
            <div className="text-xl font-extrabold text-[#0070F3] font-sans mt-0.5">
              12+
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Integrated Systems
            </div>
          </div>
        </div>

        {/* 
          ============================================================
          5. THE 7 ARCHITECTURAL GLASS STAIR PLATFORMS
          ============================================================
        */}
        <div className="absolute inset-0 z-15 pointer-events-none">
          {STAIR_PLATFORMS.map((pos, idx) => {
            const isActive = idx === activeStageIdx;
            const stage = KWI_PIPELINE_STAGES[idx];

            return (
              <div
                key={`platform-${idx}`}
                style={{
                  position: "absolute",
                  left: `${(pos.x / 1024) * 100}%`,
                  top: `${(pos.y / 560) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="pointer-events-auto"
              >
                <ArchitecturalGlassPlatform
                  stage={stage}
                  index={idx}
                  isActive={isActive}
                  isLandingDeflect={isActive && isLandingDeflect}
                  onClick={() => handleSelectStage(idx)}
                />
              </div>
            );
          })}

          {/* 
            ANCHOR NODE & ARCHITECTURAL DATA TRACE TO CHAPTER
          */}
          {showAnchor && activeCoord.anchorX && (
            <div
              style={{
                position: "absolute",
                left: `${(activeCoord.anchorX / 1024) * 100}%`,
                top: `${(activeCoord.anchorY / 560) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="z-20 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-2.5 h-2.5 rounded-full bg-[#08B8F5] border-2 border-white shadow-[0_0_8px_#08B8F5]"
              />
            </div>
          )}

          {showConnector && activeCoord.anchorX && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-25"
              viewBox="0 0 1024 560"
            >
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.75 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                d={
                  activeCoord.openLeft
                    ? `M ${activeCoord.anchorX},${activeCoord.anchorY} Q ${activeCoord.anchorX - 180},${activeCoord.anchorY + 10} ${activeCoord.portalX + 250},${activeCoord.portalY + 40}`
                    : activeCoord.openDown
                    ? `M ${activeCoord.anchorX},${activeCoord.anchorY} Q ${activeCoord.anchorX + 40},${activeCoord.portalY + 10} ${activeCoord.portalX},${activeCoord.portalY + 30}`
                    : `M ${activeCoord.anchorX},${activeCoord.anchorY} Q ${activeCoord.anchorX + 40},${activeCoord.portalY + 40} ${activeCoord.portalX},${activeCoord.portalY + 40}`
                }
                fill="none"
                stroke="#08B8F5"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
          )}

          {/* 
            DYNAMIC ROBOT PROTAGONIST
            Leaps with believable physical kinematics between platforms
          */}
          <motion.div
            className="absolute z-40 pointer-events-none flex flex-col items-center"
            animate={{
              left: `${(activeCoord.x / 1024) * 100}%`,
              top: `${((activeCoord.y - 44) / 560) * 100}%`,
            }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {/* Concentric Active Glow Rings on the Active Landing Surface */}
            <div className="absolute top-10 w-24 h-12 flex items-center justify-center -z-10 pointer-events-none">
              <div className="absolute w-20 h-8 rounded-full border border-[#08B8F5] animate-ping opacity-45" />
              <div className="w-16 h-6 rounded-full bg-[#08B8F5]/25 blur-sm" />
            </div>

            {/* Protagonist Robot Character */}
            <ProtagonistRobot
              isAnticipating={isAnticipating}
              isJumping={isJumping}
              isLanding={isLanding}
            />
          </motion.div>

          {/* 
            SPEECH BUBBLE BESIDE ROBOT
          */}
          <motion.div
            className="absolute z-35 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-3.5 py-2.5 shadow-md text-left max-w-[170px]"
            animate={{
              left: `${((activeCoord.x + 46) / 1024) * 100}%`,
              top: `${((activeCoord.y - 75) / 560) * 100}%`,
            }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <div className="text-[12px] font-bold text-slate-900 leading-tight">
              {currentStage.speechTitle}
            </div>
            <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
              {currentStage.speechSub}
            </div>
            {/* Speech bubble tail */}
            <div className="absolute -left-1.5 top-4 w-3 h-3 bg-white border-l border-b border-slate-200/90 transform rotate-45" />
          </motion.div>

          {/* 
            FLOATING ANALYTICAL CHAPTER CARD (COLLISION-AWARE SAFE PLACEMENT)
            Unfolds without covering the robot!
          */}
          <AnimatePresence>
            {isChapterOpen && (
              <motion.div
                key={`analytical-chapter-${currentStage.id}`}
                initial={{ opacity: 0, scale: 0.92, y: 8, filter: "blur(3px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.92, y: 8, filter: "blur(3px)" }}
                transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
                style={{
                  left: `${(activeCoord.portalX / 1024) * 100}%`,
                  top: `${(activeCoord.portalY / 560) * 100}%`,
                }}
                className="absolute z-35 w-[250px] sm:w-[270px] bg-white/95 backdrop-blur-xl rounded-2xl border border-sky-200/80 shadow-xl p-3.5 pointer-events-auto text-left font-sans"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="text-[9px] font-mono font-bold text-[#08B8F5] uppercase">
                    STAGE {currentStage.num} // {currentStage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChapterOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-[11px] font-bold text-slate-900 leading-tight mb-0.5">
                  {currentStage.cardTitle}
                </div>
                <p className="text-[9px] text-slate-500 leading-normal mb-2">
                  {currentStage.cardSubtitle}
                </p>

                {/* Analytical Micro-Visual */}
                <div>
                  {activeStageIdx === 0 && <DetectArtVisual />}
                  {activeStageIdx === 1 && <VerifyArtVisual />}
                  {activeStageIdx === 2 && <CorrelateArtVisual />}
                  {activeStageIdx === 3 && <CatchmentArtVisual />}
                  {activeStageIdx === 4 && <PredictArtVisual />}
                  {activeStageIdx === 5 && <SimulateArtVisual />}
                  {activeStageIdx === 6 && <ActArtVisual onNavigateCity={onNavigateCity} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 
          ============================================================
          6. BOTTOM-RIGHT CONCEPTUAL RELATIONSHIP BANNER
          ============================================================
        */}
        <div className="absolute right-6 sm:right-10 bottom-8 sm:bottom-10 z-10 flex flex-col items-end pointer-events-auto">
          {/* Technical Vertical Hierarchy Label */}
          <div className="flex items-center gap-2 mb-2 text-left mr-2">
            <span className="w-0.5 h-6 bg-[#08B8F5]" />
            <div className="text-[8px] font-mono font-bold text-slate-400 leading-tight tracking-wider uppercase">
              <div>FROM CITIZEN INPUT</div>
              <div>TO A SAFER KOLKATA</div>
            </div>
          </div>

          {/* White Pill Banner */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 px-4 py-2.5 shadow-sm flex items-center gap-3 text-xs">
            {/* 1. Citizens Reports */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#0070F3] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800 leading-none">
                  Citizens
                </div>
                <div className="text-[9px] text-slate-500 leading-none mt-0.5">
                  Reports
                </div>
              </div>
            </div>

            <div className="w-4 h-[1px] bg-slate-300" />

            {/* 2. AI Intelligence */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#08B8F5] flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800 leading-none">
                  AI
                </div>
                <div className="text-[9px] text-slate-500 leading-none mt-0.5">
                  Intelligence
                </div>
              </div>
            </div>

            <div className="w-4 h-[1px] bg-slate-300" />

            {/* 3. City Action */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800 leading-none">
                  City
                </div>
                <div className="text-[9px] text-slate-500 leading-none mt-0.5">
                  Action
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 
          ============================================================
          7. BOTTOM FOOTNOTE LABELS
          ============================================================
        */}
        <div className="absolute bottom-3 left-6 sm:left-10 right-6 sm:right-10 z-10 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider pointer-events-none">
          <span>7-STAGE AUTONOMOUS WATER INTELLIGENCE MATRIX</span>
          <span>CLICK ANY TILE TO DISPATCH ROBOT</span>
        </div>

      </div>
    </div>
  );
};

export default RobotPipelineStepping;
