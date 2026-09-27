import { motion } from "framer-motion";
import { Compass, Radio, Activity } from "lucide-react";
import { TRANSITION_EASE, DURATION } from "../../utils/motionVariants";

/**
 * Standardized KWI Telemetry Loader for NIVARA
 * Aligned with the Home tactical HUD and Dashboard telemetry design language:
 * - Precision monospace telemetry typography
 * - Concentric rotating reticle rings with dashed accents
 * - Cyan-400 / #00E5FF illumination with ambient depth glow
 * - Clean fade-in / fade-out lifecycle
 */
export function KWITelemetryLoader({
  title = "LIVE MUNICIPAL TELEMETRY",
  subtitle = "SYNCHRONIZING SENSORS // 41 HOOGHLY SLUICE GATES LINKED",
  badge = "KWI-TACTICAL ARRAY",
  fullscreen = false,
  inline = false,
  showTelemetry = true,
  className = "",
}) {
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`relative select-none flex flex-col items-center justify-center font-mono ${
        inline ? "p-4 w-full" : "p-6 min-h-[220px]"
      } ${className}`}
    >
      {/* 1. Tactical Framing Brackets (when not compact inline) */}
      {!inline && (
        <>
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-4 h-4 sm:w-6 sm:h-6 border-t border-l border-cyan-400/50 pointer-events-none" />
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-4 h-4 sm:w-6 sm:h-6 border-t border-r border-cyan-400/50 pointer-events-none" />
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-4 h-4 sm:w-6 sm:h-6 border-b border-l border-cyan-400/50 pointer-events-none" />
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-6 sm:h-6 border-b border-r border-cyan-400/50 pointer-events-none" />
        </>
      )}

      {/* 2. Concentric Tactical Reticle */}
      <div className="relative flex items-center justify-center my-2">
        {/* Outer dashed spinning ring */}
        <div
          className={`rounded-full border border-dashed border-cyan-400/35 flex items-center justify-center ${
            inline ? "w-12 h-12" : "w-20 h-20 sm:w-24 sm:h-24"
          } ${isReducedMotion ? "" : "animate-[spin_12s_linear_infinite]"}`}
        >
          {/* Inner ring */}
          <div
            className={`rounded-full border border-cyan-500/25 ${
              inline ? "w-8 h-8" : "w-14 h-14 sm:w-16 sm:h-16"
            }`}
          />
        </div>

        {/* Pulse Radar Wave */}
        {!isReducedMotion && (
          <span
            className={`absolute rounded-full border border-cyan-400/40 animate-ping pointer-events-none ${
              inline ? "w-10 h-10" : "w-16 h-16 sm:w-20 sm:h-20"
            }`}
          />
        )}

        {/* Center Illuminated Core */}
        <div
          className={`absolute rounded-full bg-cyan-950/90 border border-cyan-400/70 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] ${
            inline ? "w-6 h-6" : "w-8 h-8 sm:w-9 sm:h-9"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00E5FF]" />
        </div>
      </div>

      {/* 3. Status Badge */}
      <div className="mt-3 flex flex-col items-center gap-1.5 text-center max-w-[92vw]">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-cyan-300 uppercase shadow-[0_0_12px_rgba(0,229,255,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{badge}</span>
        </div>

        {/* Title */}
        <div className="text-xs sm:text-[13px] font-bold text-white tracking-wider uppercase mt-0.5">
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-[10px] sm:text-[11px] text-cyan-300/85 tracking-wide max-w-md truncate px-2">
            {subtitle}
          </div>
        )}
      </div>

      {/* 4. Bottom Micro Telemetry Strip (Optional, for full views) */}
      {showTelemetry && !inline && (
        <div className="mt-4 pt-2.5 border-t border-cyan-500/20 flex items-center gap-3 sm:gap-4 text-[9.5px] sm:text-[10px] text-slate-400 tracking-wider">
          <div className="flex items-center gap-1 text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>DOWNLINK: 99.8%</span>
          </div>
          <span className="text-cyan-500/30">|</span>
          <div className="flex items-center gap-1 text-cyan-300/80">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>LATENCY: 14MS</span>
          </div>
          <span className="hidden sm:inline text-cyan-500/30">|</span>
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>GRID: KOLKATA [22.57°N, 88.36°E]</span>
          </div>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: isReducedMotion ? 0.05 : DURATION.standard,
          ease: TRANSITION_EASE,
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 dark:bg-[#070c14]/92 backdrop-blur-xl pointer-events-auto"
      >
        {/* Ambient Radial Illumination */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.05) 45%, transparent 75%)",
          }}
        />
        {/* Subtle Scanline Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

        <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-[#091522]/90 border border-cyan-500/30 shadow-[0_0_35px_rgba(0,229,255,0.18)] p-4 sm:p-6">
          {content}
        </div>
      </motion.div>
    );
  }

  return content;
}

export default KWITelemetryLoader;
