import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Play,
  Pause,
  ArrowRight,
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

/* ========================================================================= */
/* 1. SEVEN PIPELINE STAGES WITH QUANTIFIED MICRO-COPY                       */
/* ========================================================================= */
export const KWI_PIPELINE_STAGES = [
  {
    num: "01",
    id: "detect",
    name: "DETECT",
    microLabel: "ACOUSTIC & CITIZEN SENSING",
    speechTitle: "Signal Registered",
    speechSub:
      "Acoustic IoT Hydro-node #86 confirms 25.0cm street immersion (Ward 86).",
    cardTitle: "Citizen Field Observation Ingested",
    cardSubtitle:
      "Acoustic IoT sensor and geotagged field observation registered at Ward 86",
    accent: "#08B8F5",
    icon: Radio,
    metricName: "MEASURED DEPTH",
    metricValue: 25.0,
    metricUnit: "cm",
    metricDecimals: 1,
    statusText: "Acoustic Signal Verified",
  },
  {
    num: "02",
    id: "verify",
    name: "VERIFY",
    microLabel: "SPATIAL COMPUTER VISION",
    speechTitle: "Spatial Geometry Calibrated",
    speechSub:
      "Edge CV validated curb datum: 38.5cm water column at 99.4% confidence.",
    cardTitle: "Spatial Computer Vision Validation",
    cardSubtitle: "Edge model calibrated against physical curb datum landmarks",
    accent: "#08B8F5",
    icon: ShieldCheck,
    metricName: "CONFIDENCE",
    metricValue: 99.4,
    metricUnit: "%",
    metricDecimals: 1,
    statusText: "3.2s Edge Inference",
  },
  {
    num: "03",
    id: "correlate",
    name: "CORRELATE",
    microLabel: "HYDRAULIC GRAPH TOPOLOGY",
    speechTitle: "Topology Synchronized",
    speechSub:
      "41 conduit nodes & sluice gates linked; trunk saturation at 72% (flow: 2.1 m/s).",
    cardTitle: "Hydraulic Conduit Graph Network",
    cardSubtitle:
      "Conduit saturation correlated with Palmer Bridge siphon capacity",
    accent: "#08B8F5",
    icon: Activity,
    metricName: "TRUNK SATURATION",
    metricValue: 72,
    metricUnit: "%",
    metricDecimals: 0,
    statusText: "Flow Velocity: 2.1 m/s",
  },
  {
    num: "04",
    id: "simulate",
    name: "SIMULATE",
    microLabel: "CATCHMENT VULNERABILITY",
    speechTitle: "Bottleneck Isolated",
    speechSub:
      "Catchment risk 84/100. Bottleneck: Palmer Bridge conduit sill (-62% throughput).",
    cardTitle: "Catchment Risk Scoring & Matrix",
    cardSubtitle: "Real-time risk scoring across Borough VII drainage basin",
    accent: "#08B8F5",
    icon: Zap,
    metricName: "CATCHMENT RISK",
    metricValue: 84,
    metricUnit: "/100",
    metricDecimals: 0,
    statusText: "Palmer Sill: -62% Flow",
  },
  {
    num: "05",
    id: "predict",
    name: "PREDICT",
    microLabel: "STORM SURGE FORECAST",
    speechTitle: "Surge Trajectory Projected",
    speechSub:
      "60-min Doppler runoff curve: storm surge peaks at T+25m (+18cm rise), Hooghly tidal lockout active.",
    cardTitle: "60-Minute Radar Runoff Projection",
    cardSubtitle:
      "Doppler storm runoff curve constrained by Hooghly tidal lockout",
    accent: "#08B8F5",
    icon: Waves,
    metricName: "PROJECTED PEAK",
    metricValue: 18,
    metricPrefix: "+",
    metricUnit: "cm",
    metricDecimals: 0,
    statusText: "Tidal Crest Lockout Active",
  },
  {
    num: "06",
    id: "alert",
    name: "ALERT",
    microLabel: "DIGITAL TWIN INTERVENTION",
    speechTitle: "Relief Strategy Modeled",
    speechSub:
      "Digital twin pump simulation: 3 high-capacity mobile pumps achieve -24cm relief in 4.5 hrs.",
    cardTitle: "Digital Twin Mobile Pump Modeling",
    cardSubtitle: "Simulates high-capacity mobile pump dispatch at EM Bypass",
    accent: "#08B8F5",
    icon: AlertTriangle,
    metricName: "SIMULATED RELIEF",
    metricValue: 24,
    metricPrefix: "-",
    metricUnit: "cm",
    metricDecimals: 0,
    statusText: "3 Pumps (-4.5 hrs drain)",
  },
  {
    num: "07",
    id: "act",
    name: "ACT",
    microLabel: "MUNICIPAL DISPATCH EXECUTION",
    speechTitle: "Work Order Dispatched",
    speechSub:
      "Municipal Work Order #9418 dispatched to Borough VII Rapid Unit #4; live ETA 11 mins.",
    cardTitle: "Municipal Work Order Generation",
    cardSubtitle: "Direct field crew dispatch with live 11-min ETA tracking",
    accent: "#08B8F5",
    icon: CheckCircle2,
    metricName: "DISPATCH ETA",
    metricValue: 11,
    metricUnit: "min",
    metricDecimals: 0,
    statusText: "Crew En Route (#9418)",
  },
];

/* ========================================================================= */
/* 2. PLATFORM COORDINATES & CAMERA VIEWPORT CALIBRATION                    */
/* ========================================================================= */
const STAIR_PLATFORMS = [
  {
    x: 155,
    y: 460,
    label: "DETECT",
    portalX: 310,
    portalY: 260,
    anchorX: 205,
    anchorY: 465,
    camX: 80,
    camY: -20,
    camScale: 1.02,
  },
  {
    x: 310,
    y: 405,
    label: "VERIFY",
    portalX: 430,
    portalY: 215,
    anchorX: 360,
    anchorY: 410,
    camX: 35,
    camY: -5,
    camScale: 1.02,
  },
  {
    x: 395,
    y: 345,
    label: "CORRELATE",
    portalX: 490,
    portalY: 195,
    anchorX: 445,
    anchorY: 350,
    camX: -10,
    camY: 12,
    camScale: 1.03,
  },
  {
    x: 485,
    y: 285,
    label: "SIMULATE",
    portalX: 550,
    portalY: 185,
    anchorX: 535,
    anchorY: 290,
    camX: -45,
    camY: 28,
    camScale: 1.03,
  },
  {
    x: 570,
    y: 230,
    label: "PREDICT",
    portalX: 615,
    portalY: 195,
    anchorX: 620,
    anchorY: 235,
    openDown: true,
    camX: -80,
    camY: 44,
    camScale: 1.04,
  },
  {
    x: 655,
    y: 188,
    label: "ALERT",
    portalX: 625,
    portalY: 210,
    anchorX: 705,
    anchorY: 193,
    openDown: true,
    camX: -115,
    camY: 58,
    camScale: 1.04,
  },
  {
    x: 740,
    y: 142,
    label: "ACT",
    portalX: 370,
    portalY: 195,
    anchorX: 740,
    anchorY: 147,
    openLeft: true,
    camX: -60,
    camY: 72,
    camScale: 1.04,
  },
];

/* Smooth Count-up hook with Audio shimmer */
function useCountUp(
  targetValue,
  duration = 450,
  decimals = 0,
  shouldPlaySound = true,
) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrameId = null;
    const startValue = 0;
    const target = Number(targetValue) || 0;

    if (shouldPlaySound) {
      audioEngine.playDataShimmer();
    }

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Cubic-bezier easeOut: 1 - (1-x)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration, shouldPlaySound]);

  return decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue);
}

/* ========================================================================= */
/* 3. ARCHITECTURAL GLASS STAIR PLATFORM COMPONENT                           */
/* Features restrained cyan focus, ripple ring on arrival, and bounce deflect */
/* ========================================================================= */
const ArchitecturalGlassPlatform = ({
  stage,
  index,
  isActive,
  isAnticipating,
  isArrivalRipple,
  isLandingDeflect,
  onClick,
  isMobile,
}) => {
  return (
    <motion.div
      onClick={onClick}
      animate={{
        y: isLandingDeflect ? 2.8 : 0,
      }}
      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
      className={`relative cursor-pointer select-none transition-all duration-300 ${
        isActive
          ? "scale-[1.05] filter drop-shadow-[0_10px_22px_rgba(8,184,245,0.32)]"
          : "hover:scale-[1.02] filter drop-shadow-[0_4px_10px_rgba(15,23,42,0.06)]"
      }`}
    >
      {/* (a) Anticipation Pulse Ring (200ms before departure) */}
      <AnimatePresence>
        {isAnticipating && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[110%] rounded-[50%] border-2 border-[#22D3EE] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      {/* (c) Arrival Ripple Ring Emanating Outward on Landing (400ms, ease-out) */}
      <AnimatePresence>
        {isArrivalRipple && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0.9, borderColor: "#22D3EE" }}
            animate={{ scale: 1.55, opacity: 0, borderColor: "#08B8F5" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[100%] rounded-[50%] border-2 pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 114 62"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-[60px] h-[33px] min-[360px]:w-[65px] min-[360px]:h-[35px] min-[390px]:w-[72px] min-[390px]:h-[39px] sm:w-[90px] sm:h-[49px] md:w-[114px] md:h-[62px]"
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

        {/* 1. Left Vertical Face */}
        <polygon
          points="8,25 57,44 57,52 8,33"
          fill={isActive ? "#dbeafe" : "#edf2f7"}
          stroke={isActive ? "#38bdf8" : "#cbd5e1"}
          strokeWidth="0.8"
        />

        {/* 2. Right Vertical Face */}
        <polygon
          points="57,44 106,25 106,33 57,52"
          fill={isActive ? "#e0f2fe" : "#f8fafc"}
          stroke={isActive ? "#38bdf8" : "#e2e8f0"}
          strokeWidth="0.8"
        />

        {/* 3. Top Surface Diamond - Luminous cyan-tinted white on active arrival */}
        <polygon
          points="57,7 106,25 57,44 8,25"
          fill={isActive ? "#f0f9ff" : "#ffffff"}
          stroke={isActive ? "#08B8F5" : "#cbd5e1"}
          strokeWidth={isActive ? "2" : "1"}
        />

        {/* Top Active Cyan Gradient Refraction Highlight */}
        {isActive && (
          <polygon
            points="57,9 102,25 57,42 12,25"
            fill="url(#activeStairRefract)"
            opacity="0.45"
          />
        )}

        {/* Stage Number Permanently Positioned on Top Surface Diamond */}
        <text
          x="57"
          y="27"
          textAnchor="middle"
          dominantBaseline="central"
          fill={isActive ? "#0284c7" : "#0f172a"}
          fontSize={isMobile ? "13" : "14"}
          fontWeight="900"
          fontFamily="ui-monospace, monospace"
          letterSpacing="-0.02em"
          style={{ pointerEvents: "none" }}
        >
          {stage.num}
        </text>

        {/* Stage Name Permanently Positioned Beneath Front Face Rim with Crisp White Contour */}
        <text
          x="57"
          y={isMobile ? "55" : "56"}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isActive ? "#0284c7" : "#0f172a"}
          stroke="#ffffff"
          strokeWidth={isMobile ? "1.5" : "1.8"}
          strokeLinejoin="round"
          paintOrder="stroke fill"
          fontSize={isMobile ? "10" : "9.8"}
          fontWeight="900"
          fontFamily="ui-monospace, monospace"
          letterSpacing={isMobile ? "0.04em" : "0.08em"}
          style={{ pointerEvents: "none" }}
        >
          {stage.name}
        </text>

        {/* Corner Technical Node Pin */}
        <circle
          cx="106"
          cy="25"
          r="2.5"
          fill={isActive ? "#08B8F5" : "#cbd5e1"}
        />
        {isActive && (
          <circle
            cx="106"
            cy="25"
            r="4.5"
            fill="rgba(8,184,245,0.3)"
          />
        )}

        <defs>
          <linearGradient
            id="activeStairRefract"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#08B8F5" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

/* ========================================================================= */
/* 4. ARTICULATED PROCEDURAL WALKING ROBOT (FLAGSHIP SKELETAL GAIT)          */
/* True mechanical locomotion: weight shifts, knee flexion, counter-arm pump, */
/* foot plants, dynamic landing squash, and visor look-ahead tracking       */
/* ========================================================================= */
const ProtagonistRobot = ({
  isAnticipating,
  isTraversing,
  isLanding,
  isHolding,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Keep gait audio loop — footstep sounds on traversal frames 2 and 6
  useEffect(() => {
    if (!isTraversing) return;
    let frame = 0;
    const strideInterval = setInterval(() => {
      frame = (frame + 1) % 8;
      if (frame === 2 || frame === 6) {
        audioEngine.playMechanicalStep(frame === 2 ? 460 : 420);
      }
    }, 85);
    return () => clearInterval(strideInterval);
  }, [isTraversing]);

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-none z-40 origin-bottom scale-[0.68] min-[360px]:scale-[0.72] min-[390px]:scale-[0.78] sm:scale-90 md:scale-100">
      <motion.div
        className="relative flex flex-col items-center"
        style={{ width: "52px" }}
        animate={
          shouldReduceMotion
            ? {}
            : isAnticipating
              ? {
                  y: 5.5,
                  scaleY: 0.93,
                  scaleX: 1.05,
                  rotate: 6.5,
                }
              : isTraversing
                ? {
                    y: [0, -7, 0],
                    scaleY: [0.98, 1.03, 0.98],
                    scaleX: [1.02, 0.98, 1.02],
                    rotate: [6.5, 4.5, 7.5, 6.5],
                  }
                : isLanding
                  ? {
                      y: [0, 4.5, 0],
                      scaleY: [1, 0.96, 1],
                      scaleX: [1, 1.04, 1],
                      rotate: 0,
                    }
                  : {
                      y: [0, -2.5, 0],
                      scaleY: [1, 1.015, 1],
                      rotate: [-0.6, 1.0, -0.6],
                    }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : isAnticipating
              ? { duration: 0.18, ease: "easeIn" }
              : isTraversing
                ? { duration: 0.68, ease: [0.25, 1, 0.5, 1] }
                : isLanding
                  ? { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                  : { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
        }
      >
        {/* Ambient Cyan Glow behind robot */}
        <div className="absolute inset-x-0 bottom-0 h-10 rounded-full bg-[#08B8F5]/18 blur-lg -z-10" />

        {/* KWI Standing Bot Image */}
        <img
          src="/assets/kwi-standing-bot.png"
          alt="KWI AI Robot"
          className="h-[84px] sm:h-[96px] md:h-[110px] w-auto object-contain filter drop-shadow-[0_6px_18px_rgba(8,184,245,0.42)] drop-shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
          draggable="false"
        />

        {/* Dynamic Floor Contact Shadow */}
        <motion.div
          className="w-10 h-2 bg-slate-950/38 rounded-full blur-[1.5px] -mt-1"
          animate={
            isAnticipating
              ? { scaleX: 1.18, scaleY: 1.1, opacity: 0.55 }
              : isTraversing
                ? {
                    scaleX: [1.1, 0.6, 1.05],
                    scaleY: [1, 0.5, 0.95],
                    opacity: [0.5, 0.18, 0.46],
                  }
                : isLanding
                  ? {
                      scaleX: [1, 1.35, 1],
                      scaleY: [1, 1.22, 1],
                      opacity: [0.45, 0.78, 0.45],
                    }
                  : {
                      scaleX: [1, 0.93, 1],
                      opacity: [0.44, 0.3, 0.44],
                    }
          }
          transition={
            isAnticipating
              ? { duration: 0.18 }
              : isTraversing
                ? { duration: 0.68, ease: "easeInOut" }
                : isLanding
                  ? { duration: 0.24, ease: "easeOut" }
                  : { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
          }
        />
      </motion.div>
    </div>
  );
};

/* ========================================================================= */
/* 5. SEVEN ANALYTICAL DATA VISUALS WITH REAL-TIME STAGGER & ANIMATED NUMBERS */
/* ========================================================================= */

// Stage 01: DETECT
const DetectArtVisual = () => {
  const depth = useCountUp(25.0, 480, 1);

  return (
    <div className="space-y-2.5 text-left font-mono">
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="relative rounded-lg overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200"
        >
          <img
            src="/images/kolkata_waterlog_sector_v.jpg"
            alt="Ingested Citizen Report"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 bg-slate-950/85 backdrop-blur-xs text-[#08B8F5] text-[7px] px-1 py-0.5 rounded flex items-center gap-0.5 border border-white/10">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEO-INGESTED</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg bg-sky-50/80 border border-sky-100 p-2 flex flex-col justify-between text-[9px]"
        >
          <div className="text-slate-500 font-semibold">GPS ACCURACY: ±1.2m</div>
          <div className="flex items-center justify-center my-1">
            <div className="w-5 h-5 rounded-full bg-[#0070F3] text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-3 h-3" />
            </div>
          </div>
          <div className="text-center font-bold text-slate-800">
            22.5726° N, 88.3639° E
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="flex justify-between items-center border-t border-slate-100 pt-1.5 text-[10px]"
      >
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-semibold">
            MEASURED DEPTH
          </span>
          <span className="font-extrabold text-[#08B8F5] text-xs">
            {depth} cm
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[8px] uppercase font-semibold">
            STATUS
          </span>
          <span className="font-semibold text-emerald-600">
            Acoustic Signal Verified
          </span>
        </div>
      </motion.div>
    </div>
  );
};

// Stage 02: VERIFY
const VerifyArtVisual = () => {
  const conf = useCountUp(99.4, 450, 1);
  const datum = useCountUp(15.0, 400, 1);
  const waterLevel = useCountUp(38.5, 500, 1);

  return (
    <div className="space-y-2 text-left font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="relative rounded-lg overflow-hidden aspect-[16/8] bg-slate-950 border border-slate-800 p-2.5 flex flex-col justify-between shadow-inner"
      >
        {/* Horizontal Scanner Sweep */}
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: ["0%", "100%", "45%"] }}
          transition={{ duration: 1.1, ease: [0.25, 1, 0.5, 1] }}
          className="absolute top-0 bottom-0 w-[2px] bg-[#08B8F5] shadow-[0_0_8px_#08B8F5] z-10 pointer-events-none"
        />

        <div className="flex items-center justify-between text-[9px] text-[#08B8F5] z-10 font-bold">
          <span>SPATIAL CV SCANNER</span>
          <span className="bg-sky-950/80 border border-sky-500/40 px-1.5 py-0.5 rounded text-sky-300 font-bold">
            CONFIDENCE: {conf}%
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-[9px] text-slate-300 z-10 font-medium">
          <div>
            CURB DATUM: <span className="text-white font-bold">{datum} cm</span>
          </div>
          <div>
            WATER LEVEL:{" "}
            <span className="text-emerald-400 font-bold">{waterLevel} cm</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-1.5"
      >
        <span className="text-slate-500 font-medium">EDGE INFERENCE TIME</span>
        <span className="font-bold text-[#08B8F5]">3.2s Validated</span>
      </motion.div>
    </div>
  );
};

// Stage 03: CORRELATE
const CorrelateArtVisual = () => {
  const sat = useCountUp(72, 450, 0);

  return (
    <div className="space-y-2 text-left font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-lg bg-slate-900 border border-slate-800 p-2"
      >
        <div className="flex justify-between text-[8.5px] text-sky-400 mb-1 font-bold">
          <span>CONDUIT TOPOLOGY GRAPH</span>
          <span>41 NODES LINKED</span>
        </div>
        <svg className="w-full h-10" viewBox="0 0 200 40" fill="none">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            d="M 10,20 L 60,12 L 110,28 L 160,15 L 190,20"
            stroke="#08B8F5"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          <circle cx="10" cy="20" r="5" fill="#0070F3" />
          <circle
            cx="60"
            cy="12"
            r="6"
            fill="#0f172a"
            stroke="#08B8F5"
            strokeWidth="1.5"
          />
          <circle
            cx="110"
            cy="28"
            r="7"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
          <circle
            cx="160"
            cy="15"
            r="6"
            fill="#0f172a"
            stroke="#08B8F5"
            strokeWidth="1.5"
          />
          <circle cx="190" cy="20" r="5" fill="#0070F3" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="flex justify-between text-[10px] border-t border-slate-100 pt-1.5"
      >
        <span className="text-slate-500 font-medium">TRUNK SATURATION</span>
        <span className="font-bold text-[#08B8F5]">
          {sat}% Capacity (Flow: 2.1 m/s)
        </span>
      </motion.div>
    </div>
  );
};

// Stage 04: SIMULATE
const CatchmentArtVisual = () => {
  const score = useCountUp(84, 450, 0);
  const soil = useCountUp(91, 400, 0);
  const runoff = useCountUp(88, 420, 0);

  return (
    <div className="space-y-2 text-left font-mono">
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-lg bg-rose-50 border border-rose-200/70 p-2 flex flex-col justify-between"
        >
          <span className="text-[8px] text-rose-700 font-bold uppercase">
            CATCHMENT RISK
          </span>
          <div className="text-xl font-black text-rose-600 my-0.5">
            {score}
            <span className="text-xs text-rose-400 font-bold">/100</span>
          </div>
          <span className="text-[8px] text-slate-500 font-medium">Borough VII Basin</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg bg-slate-50 border border-slate-200/80 p-2 flex flex-col justify-center space-y-1"
        >
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8px] text-slate-600 font-medium">
              <span>Soil Saturation</span>
              <span className="text-rose-600 font-bold">{soil}%</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${soil}%` }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="h-full bg-rose-500 rounded-full"
              />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8px] text-slate-600 font-medium">
              <span>Runoff Index</span>
              <span className="text-amber-600 font-bold">{runoff}%</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${runoff}%` }}
                transition={{
                  duration: 0.5,
                  delay: 0.06,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="h-full bg-amber-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="text-[9px] text-slate-600 border-t border-slate-100 pt-1.5"
      >
        <span className="font-bold text-amber-700">BOTTLENECK:</span> Palmer
        Bridge conduit sill (-62% throughput).
      </motion.div>
    </div>
  );
};

// Stage 05: PREDICT
const PredictArtVisual = () => {
  const peak = useCountUp(18, 450, 0);

  return (
    <div className="space-y-2 text-left font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-lg bg-slate-950 border border-slate-800 p-2"
      >
        <div className="flex justify-between text-[8.5px] text-indigo-300 mb-1 font-bold">
          <span>60-MIN RUNOFF PROJECTION</span>
          <span className="text-rose-400 font-bold">HOOGHLY LOCK: +3.8M</span>
        </div>
        <svg className="w-full h-10" viewBox="0 0 200 40" fill="none">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            d="M 10,32 Q 50,28 90,12 T 150,8 T 190,18"
            stroke="#818cf8"
            strokeWidth="2"
          />
          <circle cx="100" cy="10" r="2.5" fill="#f43f5e" />
          <text
            x="100"
            y="6"
            fill="#f87171"
            fontSize="6.5"
            fontWeight="bold"
            textAnchor="middle"
          >
            PEAK +{peak}cm @ T+25m
          </text>
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="flex justify-between text-[10px] border-t border-slate-100 pt-1.5"
      >
        <span className="text-slate-500 font-medium">TIDAL CREST LOCKOUT</span>
        <span className="font-bold text-rose-500">
          Gravity Gates Constrained
        </span>
      </motion.div>
    </div>
  );
};

// Stage 06: ALERT
const SimulateArtVisual = () => {
  const relief = useCountUp(24, 450, 0);

  return (
    <div className="space-y-2 text-left font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-lg bg-slate-950 border border-slate-800 p-2"
      >
        <div className="flex justify-between text-[8.5px] text-emerald-400 mb-1 font-bold">
          <span>DIGITAL TWIN INTERVENTION</span>
          <span>3 MOBILE PUMPS</span>
        </div>
        <svg className="w-full h-10" viewBox="0 0 200 40" fill="none">
          <path
            d="M 10,25 Q 60,18 100,8 T 190,6"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            d="M 10,25 Q 60,18 100,18 T 190,32"
            stroke="#10b981"
            strokeWidth="2"
          />
          <text x="130" y="16" fill="#08B8F5" fontSize="7.5" fontWeight="bold">
            Δ -{relief} cm RELIEF
          </text>
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="flex justify-between text-[10px] border-t border-slate-100 pt-1.5"
      >
        <span className="text-slate-500 font-medium">SIMULATED RELIEF</span>
        <span className="font-bold text-emerald-600">
          -{relief} cm (-4.5 hrs)
        </span>
      </motion.div>
    </div>
  );
};

// Stage 07: ACT
const ActArtVisual = ({ onNavigateCity }) => {
  const eta = useCountUp(11, 400, 0);

  return (
    <div className="space-y-2 text-left font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-white text-[9px]"
      >
        <div className="flex justify-between text-[#08B8F5] font-bold mb-1">
          <span>KMC WORK ORDER #9418</span>
          <span className="text-emerald-400">DISPATCHED</span>
        </div>
        <div className="font-medium">CREW: Borough VII Rapid Unit #4</div>
        <div className="text-sky-300 font-bold mt-0.5">
          ESTIMATED ARRIVAL: {eta} MINS
        </div>
      </motion.div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        onClick={() => {
          audioEngine.playUiChirp(1000);
          if (onNavigateCity) onNavigateCity();
        }}
        className="w-full py-2.5 rounded-xl bg-[#0070F3] hover:bg-[#005bbd] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
      >
        <span>Open Live Control Room →</span>
      </motion.button>
    </div>
  );
};

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
   * 3-Beat State Machine:
   * (a) 'ANTICIPATING' (200ms) - Cyan pulse on current platform, visor look-ahead lock
   * (b) 'TRAVERSING' (680ms) - Mechanical walking gait locomotion along the stair vector
   * (c) 'ARRIVING' (400ms) - Touchdown on destination platform with ripple & chime
   * Followed by: 'ANCHOR' -> 'CONNECTOR' -> 'PORTAL_EXPAND' -> 'HOLDING' -> 'COLLAPSING'
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

  const transitionTo = useCallback(
    (nextPhase, delayMs, callback) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        setPhase(nextPhase);
        if (callback) callback();
      }, delayMs);
    },
    [clearTimer],
  );

  // Subtle Parallax Mouse Handler
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x, y });
  };

  // Main Progression Cycle with 3-Beat Transition & Cinematic Pacing
  useEffect(() => {
    if (!autoplay || !isSectionVisible) {
      clearTimer();
      return;
    }

    if (phase === "IDLE") {
      transitionTo("ANTICIPATING", 700);
    } else if (phase === "ANTICIPATING") {
      // Beat (a): Anticipation beat (200ms) with cyan ring pulse on current platform
      transitionTo("TRAVERSING", 200, () => {
        audioEngine.playUiChirp(520 + activeStageRef.current * 35);
      });
    } else if (phase === "TRAVERSING") {
      // Beat (b): Traversal locomotion (680ms) with mechanical walk cycle
      transitionTo("ARRIVING", 680, () => {
        // Beat (c): Arrival chime on platform touchdown
        audioEngine.playArrivalChime();
      });
    } else if (phase === "ARRIVING") {
      // Beat (c): Arrival ripple & platform deflection (400ms)
      transitionTo("ANCHOR", 400);
    } else if (phase === "ANCHOR") {
      transitionTo("CONNECTOR", 120);
    } else if (phase === "CONNECTOR") {
      transitionTo("PORTAL_EXPAND", 240, () => {
        setIsChapterOpen(true);
      });
    } else if (phase === "PORTAL_EXPAND") {
      transitionTo("HOLDING", 420);
    } else if (phase === "HOLDING") {
      transitionTo("COLLAPSING", 2600);
    } else if (phase === "COLLAPSING") {
      transitionTo("PREPARE", 380, () => {
        setIsChapterOpen(false);
        const nextStep = (activeStageRef.current + 1) % 7;
        setActiveStageIdx(nextStep);
        setPhase("ANTICIPATING");
      });
    }
  }, [phase, autoplay, isSectionVisible, transitionTo, clearTimer]);

  // Handle direct manual stage selection
  const handleSelectStage = (idx) => {
    clearTimer();
    audioEngine.playUiChirp(680 + idx * 40);
    setActiveStageIdx(idx);
    setPhase("HOLDING");
    setIsChapterOpen(true);
    setAutoplay(false);
  };

  const currentStage = KWI_PIPELINE_STAGES[activeStageIdx];
  const activeCoord = STAIR_PLATFORMS[activeStageIdx];
  const nextTargetCoord = STAIR_PLATFORMS[(activeStageIdx + 1) % 7];

  // Calculate angle toward next step for head-tracking visor
  const lookAheadAngle = useMemo(() => {
    if (!activeCoord || !nextTargetCoord) return 0;
    const dx = nextTargetCoord.x - activeCoord.x;
    const dy = nextTargetCoord.y - activeCoord.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, [activeCoord, nextTargetCoord]);

  const isAnticipating = phase === "ANTICIPATING";
  const isTraversing = phase === "TRAVERSING";
  const isLanding = phase === "ARRIVING";
  const isLandingDeflect = phase === "ARRIVING";
  const isHolding = phase === "HOLDING";

  const showAnchor =
    phase === "ANCHOR" ||
    phase === "CONNECTOR" ||
    phase === "PORTAL_EXPAND" ||
    phase === "HOLDING";

  const showConnector =
    phase === "CONNECTOR" || phase === "PORTAL_EXPAND" || phase === "HOLDING";

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Optical Camera Pan/Zoom target to keep active platform in center-right with full robot headroom
  const cameraX = isMobile ? 20 + (activeCoord.camX || 0) * 0.45 : (activeCoord.camX || 0);
  const cameraY = isMobile ? 24 + (activeCoord.camY || 0) * 0.8 : (activeCoord.camY || 0);
  const cameraScale = isMobile ? 1.06 : (activeCoord.camScale || 1.03);

  const renderChapterCardContent = () => (
    <>
      {/* 1. Header Bar: Stage Badge + Micro Label + Close (Fades first 100ms) */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0070F3] border border-sky-200/80 font-mono font-bold text-[10px] tracking-wider uppercase">
            STAGE {currentStage.num} // {currentStage.name}
          </span>
          <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wide">
            {currentStage.microLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsChapterOpen(false)}
          className="text-slate-400 hover:text-slate-700 w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
          title="Close"
        >
          ✕
        </button>
      </motion.div>

      {/* 2. Unified Robot Speech / Live Signal Banner (150ms delay) */}
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
        className="flex items-start gap-2 bg-gradient-to-r from-sky-50/95 via-sky-50/50 to-transparent border border-sky-200/80 rounded-xl p-2 sm:p-2.5 mb-2"
      >
        <div className="w-5 h-5 rounded-lg bg-white shadow-xs border border-sky-200/80 flex items-center justify-center text-[#08B8F5] flex-shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-[#08B8F5]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] sm:text-[12.5px] font-bold text-slate-900 leading-tight">
            {currentStage.speechTitle}
          </div>
          <div className="text-[10.5px] sm:text-[11px] text-slate-700 leading-snug mt-0.5 font-medium">
            {currentStage.speechSub}
          </div>
        </div>
      </motion.div>

      {/* 3. Stage Analysis Title & Quantified Subtitle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.18 }}
        className="mb-2"
      >
        <h4 className="text-[12.5px] sm:text-[13.5px] font-bold text-slate-900 leading-snug">
          {currentStage.cardTitle}
        </h4>
        <p className="text-[10.5px] sm:text-[11px] text-slate-600 leading-relaxed mt-0.5 font-medium">
          {currentStage.cardSubtitle}
        </p>
      </motion.div>

      {/* 4. Analytical Micro-Visual (Staggered data rows & counting numbers) */}
      <div>
        {activeStageIdx === 0 && <DetectArtVisual />}
        {activeStageIdx === 1 && <VerifyArtVisual />}
        {activeStageIdx === 2 && <CorrelateArtVisual />}
        {activeStageIdx === 3 && <CatchmentArtVisual />}
        {activeStageIdx === 4 && <PredictArtVisual />}
        {activeStageIdx === 5 && <SimulateArtVisual />}
        {activeStageIdx === 6 && (
          <ActArtVisual onNavigateCity={onNavigateCity} />
        )}
      </div>
    </>
  );

  return (
    <div className="w-full select-none font-sans flex items-center justify-center py-4">
      {/*
        ============================================================
        HERO CONTAINER (1024x560 PROPORTION & REFINED BORDER)
        ============================================================
      */}
      <div
        onMouseMove={handleMouseMove}
        className="relative w-full max-w-[1440px] md:aspect-[1024/560] md:min-h-[560px] lg:min-h-[640px] rounded-[24px] sm:rounded-[36px] lg:rounded-[44px] border border-slate-200/90 shadow-[0_30px_70px_rgba(15,23,42,0.07)] overflow-hidden bg-gradient-to-br from-[#f8fbfe] via-[#ffffff] to-[#f0f6fc] flex flex-col md:block"
      >
        {/*
          ============================================================
          1. LAYER 1: BACKGROUND SKY DRIFT (NEAR-STATIC PARALLAX)
          ============================================================
        */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Extremely slow drift animation + subtle mouse parallax */}
          <motion.div
            className="absolute inset-0 w-[108%] h-[108%] -left-[4%] -top-[4%] bg-no-repeat bg-cover pointer-events-none opacity-80"
            style={{
              backgroundImage: `url('/assets/serene-sky-bg.jpg')`,
              backgroundPosition: "center 25%",
              backgroundSize: "cover",
              filter: "brightness(0.92) contrast(1.04) saturate(0.95)",
            }}
            animate={{
              x: mouseOffset.x * 12,
              y: mouseOffset.y * 8,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Soft comfortable ambient shading */}
          <div className="absolute inset-0 bg-slate-900/[0.04] pointer-events-none" />

          {/* Diffused radial glow */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 50% at 24% 20%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.2) 55%, transparent 80%)",
            }}
          />

          {/* Soft edge dissolves */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/60 via-white/10 to-transparent pointer-events-none" />
        </div>

        {/*
          ============================================================
          2. LAYER 2: TOP HEADER & NAVIGATION (FOREGROUND STABLE)
          ============================================================
        */}
        <div className="relative md:absolute md:top-8 md:left-10 md:right-10 z-30 pt-2.5 sm:pt-3 px-3 sm:px-6 pb-0.5 md:p-0 flex flex-col justify-between pointer-events-auto">
          {/* Top Row: Title + CTA */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2.5 sm:gap-4">
            {/* Left Header Title & 7 Dynamic Steps */}
            <div className="text-left max-w-2xl sm:max-w-3xl">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
                <span className="w-1.5 h-3 bg-[#08B8F5] rounded-full" />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.2em] text-slate-500 uppercase">
                  NIVARA
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#07152F] font-sans leading-tight">
                One report{" "}
                <span className="font-normal text-[#243A5A]">
                  becomes city intelligence.
                </span>
              </h1>

              {/* Row of 7 Compact Dynamic Stage Navigation Steps */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 mt-1.5 sm:mt-3 py-0.5 sm:py-1 max-w-full">
                {KWI_PIPELINE_STAGES.map((stg, i) => {
                  const isActive = i === activeStageIdx;

                  return (
                    <button
                      key={stg.id}
                      type="button"
                      onClick={() => handleSelectStage(i)}
                      className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9.5px] min-[360px]:text-[10px] sm:text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                        isActive
                          ? "bg-[#0070F3] text-white font-bold shadow-[0_4px_12px_rgba(0,112,243,0.35)]"
                          : "bg-white/90 hover:bg-white text-slate-700 font-semibold border border-slate-200/90 shadow-2xs"
                      }`}
                    >
                      <span
                        className={isActive ? "text-white" : "text-slate-400"}
                      >
                        {stg.num}
                      </span>
                      <span>{stg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Top CTA & Autoplay Toggle */}
            <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0 pt-0.5 sm:pt-1">
              {/* Pill Button: ▶ LET'S BEGIN → */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900);
                  setActiveStageIdx(0);
                  setAutoplay(true);
                }}
                className="group relative px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0070F3] hover:bg-[#005bb5] text-white font-mono font-bold text-xs sm:text-[13px] tracking-wide transition-all shadow-[0_4px_14px_rgba(0,112,243,0.35)] hover:shadow-[0_6px_20px_rgba(0,112,243,0.45)] active:scale-95 cursor-pointer flex items-center gap-1.5 overflow-hidden"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LET'S BEGIN</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Autoplay Toggle Switch */}
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] font-bold text-slate-600">
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
                    className="w-4 h-4 rounded-full bg-white shadow-xs"
                    animate={{ x: autoplay ? 16 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*
          ============================================================
          3. CINEMATIC VIEWPORT CAMERA SYSTEM (PANS & ZOOMS AS ROBOT CLIMBS)
          ============================================================
        */}
        <div className="relative md:absolute md:inset-0 w-full h-[280px] min-[360px]:h-[300px] min-[390px]:h-[320px] sm:h-[360px] md:h-full pointer-events-none overflow-hidden my-0">
          <motion.div
            className="w-full h-full relative"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: cameraX,
                    y: cameraY,
                    scale: cameraScale,
                  }
            }
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          >
          {/*
            VECTOR DATA CONNECTOR PATH (CONNECTING STAIRS) WITH TRAIL LIGHTING
          */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1024 560"
            preserveAspectRatio="none"
          >
            {/* Base Dotted Platform Path */}
            <path
              d={`M ${STAIR_PLATFORMS[0].x},${STAIR_PLATFORMS[0].y} L ${STAIR_PLATFORMS[1].x},${STAIR_PLATFORMS[1].y} L ${STAIR_PLATFORMS[2].x},${STAIR_PLATFORMS[2].y} L ${STAIR_PLATFORMS[3].x},${STAIR_PLATFORMS[3].y} L ${STAIR_PLATFORMS[4].x},${STAIR_PLATFORMS[4].y} L ${STAIR_PLATFORMS[5].x},${STAIR_PLATFORMS[5].y} L ${STAIR_PLATFORMS[6].x},${STAIR_PLATFORMS[6].y}`}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              opacity="0.45"
            />

            {/* Active illuminated path trail behind the robot */}
            <motion.path
              d={`M ${STAIR_PLATFORMS[0].x},${STAIR_PLATFORMS[0].y} L ${STAIR_PLATFORMS[1].x},${STAIR_PLATFORMS[1].y} L ${STAIR_PLATFORMS[2].x},${STAIR_PLATFORMS[2].y} L ${STAIR_PLATFORMS[3].x},${STAIR_PLATFORMS[3].y} L ${STAIR_PLATFORMS[4].x},${STAIR_PLATFORMS[4].y} L ${STAIR_PLATFORMS[5].x},${STAIR_PLATFORMS[5].y} L ${STAIR_PLATFORMS[6].x},${STAIR_PLATFORMS[6].y}`}
              fill="none"
              stroke="#08B8F5"
              strokeWidth="2.4"
              initial={{ pathLength: 0.14 }}
              animate={{
                pathLength: (activeStageIdx + 1) / 7,
              }}
              transition={{ duration: 0.68, ease: [0.25, 1, 0.5, 1] }}
            />
          </svg>

          {/*
            THE 7 ARCHITECTURAL GLASS STAIR PLATFORMS
          */}
          <div className="absolute inset-0 z-20 pointer-events-none">
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
                    isAnticipating={isActive && isAnticipating}
                    isArrivalRipple={isActive && isLanding}
                    isLandingDeflect={isActive && isLandingDeflect}
                    onClick={() => handleSelectStage(idx)}
                    isMobile={isMobile}
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
                className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-25"
                viewBox="0 0 1024 560"
              >
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.75 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
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
              DYNAMIC ARTICULATED ROBOT PROTAGONIST
            */}
            <motion.div
              className="absolute z-40 pointer-events-none flex flex-col items-center"
              animate={{
                left: `${(activeCoord.x / 1024) * 100}%`,
                top: `${((activeCoord.y - 4) / 560) * 100}%`,
              }}
              transition={{
                duration: shouldReduceMotion ? 0.01 : 0.68,
                ease: [0.25, 1, 0.5, 1],
              }}
              style={{ transform: "translate(-50%, -100%)" }}
            >
              {/* Concentric Active Holographic Stepping Ring on Active Landing */}
              <div className="absolute -bottom-1 w-11 h-4 sm:w-16 sm:h-6 flex items-center justify-center -z-10 pointer-events-none">
                <div className="w-9 h-2.5 sm:w-12 sm:h-3 rounded-full bg-[#08B8F5]/30 blur-xs sm:blur-sm" />
              </div>

              <ProtagonistRobot
                isAnticipating={isAnticipating}
                isTraversing={isTraversing}
                isLanding={isLanding}
                isHolding={isHolding}
              />
            </motion.div>

            {/*
              DESKTOP ASSEMBLED CHAPTER CARD (Positioned in isometric camera coordinate space)
            */}
            <AnimatePresence>
              {!isMobile && isChapterOpen && (
                <motion.div
                  key={`analytical-chapter-desktop-${currentStage.id}`}
                  initial={{
                    opacity: 0,
                    scale: 0.94,
                    y: 10,
                    filter: "blur(4px)",
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.94, y: 8, filter: "blur(3px)" }}
                  transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
                  style={{
                    left: `${(activeCoord.portalX / 1024) * 100}%`,
                    top: `${(activeCoord.portalY / 560) * 100}%`,
                  }}
                  className="w-[375px] absolute z-40 bg-white/95 backdrop-blur-xl rounded-2xl border border-sky-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.14)] p-4 pointer-events-auto text-left font-sans"
                >
                  {renderChapterCardContent()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

        {/*
          MOBILE ASSEMBLED CHAPTER CARD
          Cleanly docked below the 3D staircase so it never covers the robot or steps
        */}
        <div className="block md:hidden relative z-30 px-3 pb-3 w-full pointer-events-auto">
          <AnimatePresence mode="wait">
            {isMobile && (
              <motion.div
                key={`analytical-chapter-mobile-${currentStage.id}`}
                onClick={() => setAutoplay(false)}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="w-full bg-white/98 backdrop-blur-xl rounded-2xl border border-sky-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-3 text-left font-sans"
              >
                {renderChapterCardContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/*
          ============================================================
          4. BOTTOM-RIGHT CONCEPTUAL RELATIONSHIP BANNER
          ============================================================
        */}
        <div className="hidden sm:flex absolute right-6 sm:right-10 bottom-8 sm:bottom-10 z-20 flex-col items-end pointer-events-auto">
          {/* White Pill Banner */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 px-4 py-2.5 shadow-xs flex items-center gap-3 text-xs">
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
          5. BOTTOM FOOTNOTE LABELS
          ============================================================
        */}
        <div className="relative md:absolute md:bottom-3 left-0 right-0 py-2.5 px-4 md:px-10 z-20 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider pointer-events-none">
          <span>7-STAGE AUTONOMOUS WATER INTELLIGENCE MATRIX</span>
        </div>
      </div>
    </div>
  );
};

export default RobotPipelineStepping;
