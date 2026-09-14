import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Waves,
  ShieldCheck,
  Droplets,
} from "lucide-react";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { BorderBeam } from "../ui/BorderBeam";
import { CardSpotlight } from "../ui/CardSpotlight";
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

// Hotspot locality photographs corresponding to real Kolkata intersections
const HOTSPOT_PHOTOS = [
  "/images/kolkata_waterlog_sector_v.jpg", // #SV-024: College More & Ring Road, Salt Lake Sector V
  "/images/hotspot_behala.jpg", // #BH-019: Behala Chowrasta / Diamond Harbour Rd
  "/images/hotspot_park_street.jpg", // #PS-032: Park Street & Chowringhee Intersection
  "/images/hotspot_thanthania.jpg", // #TK-089: Thanthania Kalibari
  "/images/hotspot_hastings.jpg", // #HS-001: Hastings
  "/images/hotspot_kalighat.jpg", // #KG-001: Kalighat
];

// 4 Final Impact Statistics (System Impact)
const IMPACT_STATS = [
  {
    id: "stat-rain",
    value: "743",
    unit: "mm",
    label: "Total Rainfall (Last 24h)",
    icon: <Droplets className="w-4 h-4 text-cyan-500" />,
    color: "cyan",
    chart: (
      <div className="flex items-end gap-1 h-8 mt-3">
        {[25, 40, 30, 55, 70, 48, 82, 65, 95, 100].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`w-1.5 rounded-t-sm transition-all duration-500 ${
              i >= 8 ? "bg-cyan-500" : "bg-cyan-200/80"
            }`}
          />
        ))}
      </div>
    ),
  },
  {
    id: "stat-discharge",
    value: "85",
    unit: "",
    label: "Cusecs Outfall Discharge",
    icon: <Waves className="w-4 h-4 text-blue-500" />,
    color: "blue",
    chart: (
      <div className="h-8 mt-3 flex items-center overflow-hidden">
        <svg className="w-full h-6" viewBox="0 0 160 24" fill="none">
          <path
            d="M0 12 Q20 2 40 12 T80 12 T120 12 T160 12"
            stroke="#3b82f6"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M0 16 Q20 8 40 16 T80 16 T120 16 T160 16"
            stroke="#93c5fd"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 3"
          />
        </svg>
      </div>
    ),
  },
  {
    id: "stat-gates",
    value: "100%",
    unit: "",
    label: "Critical Gates Monitored",
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    color: "emerald",
    chart: (
      <div className="mt-4 space-y-1.5">
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/40 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full w-full" />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
          <span>41 / 41 Active</span>
          <span className="text-emerald-600 font-semibold">Optimal Flow</span>
        </div>
      </div>
    ),
  },
  {
    id: "stat-people",
    value: "4.2M",
    unit: "",
    label: "People Protected",
    icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
    color: "indigo",
    chart: (
      <div className="flex items-center gap-2 mt-3 pt-1">
        <div className="flex -space-x-2 overflow-hidden">
          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-[9px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300">
            AK
          </div>
          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-cyan-100 text-[9px] font-bold flex items-center justify-center text-cyan-700">
            SM
          </div>
          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 text-[9px] font-bold flex items-center justify-center text-blue-700">
            DB
          </div>
          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-100 text-[9px] font-bold flex items-center justify-center text-amber-700">
            RC
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-full">
          +4.2M
        </span>
      </div>
    ),
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
  const {
    navigate,
    currentUser,
    setSelectedIncident,
    incidents,
  } = useKWIStore();
  const isAdmin = isUserAdmin(currentUser);
  const isCitizenUser = Boolean(currentUser && !isAdmin);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const howItWorksRef = useRef(null);

  // Hotspot Accordion Gallery Items preserving exact incident data & functionality
  const effectiveIncidents = incidents && incidents.length > 0 ? incidents : ACTIVE_INCIDENTS;
  const hotspotGalleryItems = effectiveIncidents.map((inc, index) => ({
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
    <div className="relative min-h-screen bg-white text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-hidden">
      {/* 0. Ambient Top Radiant Glow & Micro-Grid (Dynamically morphs with threatLevel) */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] ${ambientGlowClass} transition-all duration-700 pointer-events-none -z-10`}
      />
      <div className="absolute top-0 inset-x-0 h-[480px] bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Global Navigation Bar */}
      <KWINavbar />

      {/* 2. Ask Kolkata Drawer */}
      <AskKolkataDrawer />

      {/* ======================================================== */}
      {/* 1. ATMOSPHERIC DIGITAL-TWIN HERO AREA                    */}
      {/* ======================================================== */}
      <section className="relative w-full overflow-hidden bg-white pt-8 sm:pt-12 pb-6 sm:pb-10 text-center z-20">
        {/* Authentic Kolkata Atmospheric Landscape (Howrah Bridge, Victoria Memorial, Writers' Building & Moving Clouds) */}
        <KolkataDecorativeLayer />

        <div className="relative max-w-4xl mx-auto px-4 z-10">
          {/* ● LIVE KOLKATA Location Pill */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-sky-200/90 shadow-[0_2px_12px_rgba(6,182,212,0.12)] mb-3.5 text-xs font-mono font-bold tracking-wider text-slate-800"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600" />
            </span>
            <span className="text-cyan-950 uppercase font-black">
              ● LIVE KOLKATA
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">
              Real Geographic Intelligence
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Monitoring Active
            </span>
          </motion.div>

          {/* Main Headline with Editorial Geometric Hierarchy */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.07]"
          >
            <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
              See the water.
            </span>
            <br />
            <span className="text-slate-900 drop-shadow-2xs">
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
            className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed"
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
                {isCitizenUser ? "Report an Issue" : "Explore Live City"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(950);
                const s = document.getElementById("how-it-works");
                if (s) s.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-sm shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>See How It Works</span>
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-cyan-600">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </span>
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
      {/* SECTION: CITIZEN REPORTING + AI VERIFICATION (Logged-in Citizen only) */}
      {/* ======================================================== */}
      {isCitizenUser && <CitizenReportingSection />}

      {/* ========================================================================= */}
      {/* SECTION: FIELD SENSOR STREAM & CENTERED HOTSPOT HEADING                    */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto border-t border-slate-100 flex flex-col gap-10">
        <div>
          {/* Centered Hotspot Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block text-[11px] font-mono font-bold text-cyan-700 tracking-[0.2em] uppercase mb-2">
              FIELD SENSOR STREAM
            </span>
            <div className="flex justify-center">
              <SplitText
                text="Active Ground Inundation Hotspots"
                className="text-2xl sm:text-3xl font-bold text-black tracking-tight text-center"
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
            <p className="text-sm text-black mt-2 leading-relaxed">
              Live field data, citizen reports and sensor streams to identify
              and respond faster.
            </p>
            <div className="mt-3.5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigate("/live-city")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800 transition-colors cursor-pointer group"
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
          <div className="text-center max-w-xl mx-auto pb-4">
            <span className="inline-block text-[11px] font-mono font-bold text-cyan-800 tracking-[0.2em] uppercase mb-1">
              CITYWIDE CAPACITY & IMPACT
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              Hydrological Telemetry & Outfall Impact
            </h3>
          </div>

          {/* Four Final Impact Statistics (MoltenMetal Background) */}
          <div className="relative rounded-[26px] overflow-hidden p-5 sm:p-7 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            {/* MoltenMetal Animated Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <MoltenMetal
                color1="#071ee0"
                color2="#a9a0a9"
                color3="#e6e2eb"
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

            {/* Impact Content Layer */}
            <div className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative">
                {IMPACT_STATS.map((stat, idx) => (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                      delay: idx * 0.25,
                    }}
                    className="group relative p-6 rounded-[22px] bg-white/85 dark:bg-[#16213a]/85 backdrop-blur-xl border border-white/70 dark:border-slate-700/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-white dark:border-slate-700 dark:hover:border-slate-600 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Header with Icon */}
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                        {stat.icon}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-950 dark:text-slate-100 font-mono tracking-tight">
                          {stat.value}
                        </span>
                        {stat.unit && (
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 font-mono">
                            {stat.unit}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                        {stat.label}
                      </div>
                    </div>

                    {/* Individual Impact Chart Graphic */}
                    <div>{stat.chart}</div>
                  </motion.div>
                ))}
              </div>
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
