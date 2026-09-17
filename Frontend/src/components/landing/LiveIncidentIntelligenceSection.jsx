import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Droplets,
  CheckCircle2,
} from "lucide-react";

import { useKWIStore } from "../../store/useKWIStore";
import {
  aggregateIncidentsFromReports,
  mapIncidentQueueToCards,
} from "../../utils/incidentAggregator";
import { audioEngine } from "../../utils/audioEngine";

import { BorderBeam } from "../ui/BorderBeam";

import AnimatedContent from "../ui/AnimatedContent";
import FadeContent from "../ui/FadeContent";

// Visual & Animation Configurations Per Severity
const SEVERITY_CONFIG = {
  CRITICAL: {
    label: "CRITICAL",
    dotClass:
      "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse",
    badgeClass:
      "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-500/20",
    accentBorder:
      "hover:border-sky-400 dark:hover:border-sky-400",
    glowColor: "rgba(244, 63, 94, 0.14)",
    hasScanLine: true,
  },

  HIGH: {
    label: "HIGH",
    dotClass:
      "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)] animate-pulse",
    badgeClass:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200/80 dark:border-orange-500/20",
    accentBorder:
      "hover:border-sky-400 dark:hover:border-sky-400",
    glowColor: "rgba(249, 115, 22, 0.1)",
    hasScanLine: false,
  },

  MODERATE: {
    label: "MODERATE",
    dotClass: "bg-amber-500",
    badgeClass:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/20",
    accentBorder:
      "hover:border-sky-400 dark:hover:border-sky-400",
    glowColor: "rgba(245, 158, 11, 0.08)",
    hasScanLine: false,
  },

  MEDIUM: {
    label: "MODERATE",
    dotClass: "bg-amber-500",
    badgeClass:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/20",
    accentBorder:
      "hover:border-sky-400 dark:hover:border-sky-400",
    glowColor: "rgba(245, 158, 11, 0.08)",
    hasScanLine: false,
  },

  LOW: {
    label: "LOW",
    dotClass: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
    badgeClass:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/80 dark:border-emerald-500/20",
    accentBorder:
      "hover:border-sky-400 dark:hover:border-sky-400",
    glowColor: "rgba(16, 185, 129, 0.08)",
    hasScanLine: false,
  },

  MONITORING: {
    label: "MONITORING",
    dotClass: "bg-cyan-500",
    badgeClass:
      "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200/80 dark:border-cyan-500/20",
    accentBorder:
      "hover:border-sky-400 dark:hover:border-sky-400",
    glowColor: "rgba(6, 182, 212, 0.06)",
    hasScanLine: false,
  },
};

export function LiveIncidentIntelligenceSection() {
  const {
    allReports,
    myReports,
    incidentQueue,
    fetchAllReports,
    fetchIncidentQueue,
    setSelectedIncident,
    setHoveredIncidentId,
    navigate,
  } = useKWIStore();

  const [showAll, setShowAll] = useState(false);

  // Load municipal reports and active incident queue on mount + poll periodically
  useEffect(() => {
    fetchAllReports?.().catch(() => {});
    fetchIncidentQueue?.().catch(() => {});
    const interval = setInterval(() => {
      fetchIncidentQueue?.().catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAllReports, fetchIncidentQueue]);

  // Merge server and local citizen reports
  const combinedReports = useMemo(() => {
    return [
      ...(allReports || []),
      ...(myReports || []).filter(
        (mr) => !(allReports || []).some((ar) => ar.report_id === mr.report_id)
      ),
    ];
  }, [allReports, myReports]);

  // Dynamically derive active incidents: prioritize database incidentQueue table, fallback to reports
  // Strictly sorted: Critical -> High -> Moderate -> Low -> Monitoring, then report count desc
  const sortedIncidents = useMemo(() => {
    if (Array.isArray(incidentQueue) && incidentQueue.length > 0) {
      return mapIncidentQueueToCards(incidentQueue);
    }
    return aggregateIncidentsFromReports(combinedReports);
  }, [incidentQueue, combinedReports]);


  // Dynamically calculated active incidents count
  const activeCount = useMemo(() => {
    return sortedIncidents.length;
  }, [sortedIncidents]);

  const formattedActiveCount =
    activeCount < 10
      ? `0${activeCount}`
      : `${activeCount}`;

  // Visible incidents: default 6 (matching 3x2 grid) vs all
  const INITIAL_VISIBLE = 6;
  const visibleIncidents = showAll
    ? sortedIncidents
    : sortedIncidents.slice(0, INITIAL_VISIBLE);

  const hasMore = sortedIncidents.length > INITIAL_VISIBLE;

  const handleInspect = (incident) => {
    audioEngine.playUiChirp(1050);

    setSelectedIncident(incident);
    setHoveredIncidentId(incident.id);

    const mapEl =
      document.getElementById("gis-map-viewport");

    if (mapEl) {
      mapEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const toggleShowMore = () => {
    audioEngine.playUiChirp(900);
    setShowAll((prev) => !prev);
  };

  return (
    <section className="relative w-full py-4 sm:py-6 font-sans">

      {/* ======================================================== */}
      {/* 1. SECTION HEADER                                        */}
      {/* ======================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-5 px-1">

        <div>

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-cyan-700 dark:text-[#00E5FF] mb-1">
            <span>LIVE INCIDENT INTELLIGENCE</span>
          </div>

          {/* Supporting Text */}
          <p className="text-sm sm:text-[15px] font-semibold text-slate-800 dark:text-[#F2FBFD] tracking-tight">
            Ground reports requiring attention
          </p>

        </div>

        {/* Dynamic Active Count Pill */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#10313E]/90 backdrop-blur-md border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_2px_12px_rgba(15,23,42,0.03)] font-mono text-xs text-slate-700 dark:text-[#F2FBFD]">

          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />

          <span className="font-bold text-slate-900 dark:text-[#F2FBFD] tracking-wider">
            {formattedActiveCount} ACTIVE
          </span>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. INCIDENT CARDS GRID                                   */}
      {/* ======================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">

        <AnimatePresence initial={false}>

          {visibleIncidents.map((incident, idx) => {

            const config =
              SEVERITY_CONFIG[incident.severity] ||
              SEVERITY_CONFIG.MONITORING;

            const isDepthPending =
              incident.waterDepth === "Pending" ||
              !incident.waterDepth ||
              incident.waterDepth === "Telemetry Pending" ||
              incident.waterDepth === "0 cm water depth";

            const displayDepth = isDepthPending
              ? "Telemetry Pending"
              : String(incident.waterDepth).includes("water depth")
              ? incident.waterDepth
              : `${incident.waterDepth} water depth`;

            const reportCount =
              incident.verifiedReports ?? 0;

            const displayReports =
              `${reportCount} verified ${reportCount === 1
                ? "report"
                : "reports"
              }`;

            return (

              <AnimatedContent
                key={incident.id}
                distance={55}
                direction="vertical"
                reverse={false}
                duration={0.75}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity={true}
                scale={0.97}
                threshold={0.15}
                delay={(idx % 3) * 0.1}
              >

                <FadeContent
                  blur={true}
                  duration={0.55}
                  ease="power2.out"
                  threshold={0.15}
                >

                  <motion.div
                    layout
                    initial={{
                      opacity: 1,
                      y: 0,
                      x: 0,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      transition: {
                        duration: 0.25,
                      },
                    }}

                    onMouseEnter={() => {
                      setHoveredIncidentId(
                        incident.id
                      );
                    }}

                    onMouseLeave={() => {
                      setHoveredIncidentId(null);
                    }}

                    className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-[18px] bg-white/90 dark:bg-[#10313E]/90 backdrop-blur-xl border border-sky-300/50 dark:border-[rgba(94,183,201,0.16)] ${config.accentBorder} shadow-[0_4px_20px_rgba(56,189,248,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_36px_rgba(56,189,248,0.22)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default`}
                  >

                    {/* Animated Light Blue Border Beam Effect */}
                    <BorderBeam
                      size={260}
                      duration={
                        7 + (idx % 3) * 2
                      }
                      borderWidth={1.8}
                      colorFrom="#38bdf8"
                      colorTo="#0284c7"
                      delay={idx * 2.5}
                    />

                    {/* One-time entrance Risk Scan-line for CRITICAL */}
                    {config.hasScanLine && (
                      <motion.div
                        initial={{
                          left: "-100%",
                        }}
                        animate={{
                          left: "140%",
                        }}
                        transition={{
                          duration: 1.1,
                          delay: 0.2,
                          ease: [
                            0.22,
                            1,
                            0.36,
                            1,
                          ],
                        }}
                        className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-rose-500/15 to-transparent skew-x-[-20deg] z-10"
                      />
                    )}

                    {/* Card Top: Severity Badge + ID + Location */}
                    <div>

                      {/* Top Metadata Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">

                        <div className="flex items-center gap-2">

                          <span
                            className={`w-2 h-2 rounded-full ${config.dotClass}`}
                          />

                          <span
                            className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md border ${config.badgeClass}`}
                          >
                            {config.label}
                          </span>

                        </div>

                        <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-[#6D949D] tracking-tight">
                          {incident.id}
                        </span>

                      </div>

                      {/* Incident Location Headline */}
                      <h3 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-[#F2FBFD] tracking-tight leading-snug line-clamp-2 mb-4 group-hover:text-cyan-700 dark:group-hover:text-[#00E5FF] transition-colors">
                        {incident.location}
                      </h3>

                    </div>

                    {/* Card Middle: Minimalist Telemetry Subset */}
                    <div className="space-y-2 pt-3 border-t border-slate-100/90 dark:border-[rgba(94,183,201,0.16)]">

                      {/* Water Depth */}
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-[#B2D2D9]">

                        <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00E5FF] shrink-0" />

                        <span className="font-semibold text-slate-900 dark:text-[#F2FBFD] font-mono">
                          {displayDepth}
                        </span>

                      </div>

                      {/* Verified Reports */}
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#6D949D]">

                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#6D949D] shrink-0" />

                        <span>
                          {displayReports}
                        </span>

                      </div>

                    </div>

                    {/* Card Bottom: Inspect Action */}
                    <div className="pt-3.5 mt-3 border-t border-slate-100/90 dark:border-[rgba(94,183,201,0.16)] flex items-center justify-between">

                      <span className="text-[11px] font-mono text-slate-400 dark:text-[#6D949D]">
                        {incident.subdivision ||
                          "KOLKATA GRID"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleInspect(incident)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-[#00E5FF] dark:hover:text-[#38BDF8] transition-colors cursor-pointer group/inspect"
                        title={`Inspect details for ${incident.id}`}
                      >

                        <span>Inspect</span>

                        <ArrowRight className="w-3.5 h-3.5 group-hover/inspect:translate-x-1 transition-transform" />

                      </button>

                    </div>

                  </motion.div>

                </FadeContent>

              </AnimatedContent>

            );
          })}

        </AnimatePresence>

      </div>

      {/* ======================================================== */}
      {/* 3. SHOW MORE / SHOW LESS CONTROL                         */}
      {/* ======================================================== */}

      {hasMore && (

        <div className="mt-5 sm:mt-6 flex justify-center">

          <button
            type="button"
            onClick={toggleShowMore}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/85 dark:bg-[#10313E]/85 hover:bg-slate-50 dark:hover:bg-[#163F4E] text-slate-700 dark:text-[#F2FBFD] hover:text-cyan-700 dark:hover:text-[#00E5FF] border border-slate-200/90 dark:border-[rgba(94,183,201,0.16)] font-mono text-xs font-bold tracking-wider uppercase shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98"
          >

            {showAll ? (
              <>
                <span>SHOW LESS</span>

                <ChevronUp className="w-3.5 h-3.5 text-cyan-600" />
              </>
            ) : (
              <>
                <span>SHOW MORE</span>

                <ChevronDown className="w-3.5 h-3.5 text-cyan-600" />
              </>
            )}

          </button>

        </div>

      )}

    </section>
  );
}

export default LiveIncidentIntelligenceSection;