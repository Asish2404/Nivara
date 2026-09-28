/**
 * Standardized KWI Telemetry Loader for NIVARA
 * Aligned with the Home tactical HUD and Dashboard telemetry design language:
 * - Precision monospace telemetry typography
 * - Concentric rotating reticle rings with dashed accents
 * - Cyan-400 / #00E5FF illumination with ambient depth glow
 */
export function KWITelemetryLoader({
  title = "LIVE MUNICIPAL TELEMETRY",
  subtitle = "SYNCHRONIZING SENSORS // 41 HOOGHLY SLUICE GATES LINKED",
  badge = "KWI-TACTICAL ARRAY",
  className = "",
}) {
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative select-none flex flex-col items-center justify-center font-mono p-4 w-full ${className}`}
    >
      {/* Concentric Tactical Reticle */}
      <div className="relative flex items-center justify-center my-2">
        {/* Outer dashed spinning ring */}
        <div
          className={`rounded-full border border-dashed border-cyan-400/35 flex items-center justify-center w-12 h-12 ${
            isReducedMotion ? "" : "animate-[spin_12s_linear_infinite]"
          }`}
        >
          {/* Inner ring */}
          <div className="rounded-full border border-cyan-500/25 w-8 h-8" />
        </div>

        {/* Pulse Radar Wave */}
        {!isReducedMotion && (
          <span className="absolute rounded-full border border-cyan-400/40 animate-ping pointer-events-none w-10 h-10" />
        )}

        {/* Center Illuminated Core */}
        <div className="absolute rounded-full bg-cyan-950/90 border border-cyan-400/70 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] w-6 h-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00E5FF]" />
        </div>
      </div>

      {/* Status Badge */}
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
    </div>
  );
}

export default KWITelemetryLoader;
