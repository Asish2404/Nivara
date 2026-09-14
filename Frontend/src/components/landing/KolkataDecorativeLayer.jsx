import React from "react";

/**
 * KolkataDecorativeLayer
 * Authentic Light Cloudy Kolkata Atmosphere:
 * - Shifted Howrah Bridge, Victoria Memorial, and Writers' Building more upward (center 58%)
 * - Reduced gap between Howrah Bridge, Victoria, Writers' Building and their location indicators
 * - Seamless single-element blending between upper atmosphere and satellite map
 * - 100% pointer-events-none and hardware-accelerated
 */
export function KolkataDecorativeLayer() {
  return (
    <div
      className="kolkata-decorative-mask absolute top-0 inset-x-0 h-[560px] sm:h-[640px] lg:h-[700px] pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      <style>{`
        .kolkata-decorative-mask {
          mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 6%, rgba(0,0,0,1) 18%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.5) 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 6%, rgba(0,0,0,1) 18%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.5) 90%, transparent 100%);
        }
        .dark .kolkata-decorative-mask {
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.5) 88%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.5) 88%, transparent 100%);
        }
        @keyframes cloudDriftSlowLeft {
          0% { transform: translate3d(-18px, 0, 0); }
          50% { transform: translate3d(22px, -3px, 0); }
          100% { transform: translate3d(-18px, 0, 0); }
        }
        @keyframes cloudDriftSlowRight {
          0% { transform: translate3d(16px, 0, 0); }
          50% { transform: translate3d(-22px, 2px, 0); }
          100% { transform: translate3d(16px, 0, 0); }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. LIGHT MODE CLOUDY PANORAMA                                             */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full bg-no-repeat bg-cover pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-700"
        style={{
          backgroundImage: `url('/images/kolkata_sky_clouds.jpg')`,
          backgroundPosition: "center 55%",
          backgroundSize: "cover",
          filter: "contrast(1.22) saturate(1.1) brightness(1.0)",
        }}
      />

      {/* ========================================================================= */}
      {/* 2. DARK MODE NIGHT PANORAMA (Kolkata_clouds_night.png)                    */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full bg-no-repeat bg-cover pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700"
        style={{
          backgroundImage: `url('/images/Kolkata_clouds_night.png')`,
          backgroundPosition: "center 55%",
          backgroundSize: "cover",
          filter: "contrast(1.18) saturate(1.1) brightness(1.02)",
        }}
      />

      {/* Soft Central Text Glow: Diffuses softly behind headline without washing out landmarks */}
      {/* Light mode white diffused glow */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(ellipse 44% 50% at 50% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 45%, transparent 75%)",
        }}
      />
      {/* Dark mode soft ambient glow */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(ellipse 48% 50% at 50% 28%, rgba(10,30,59,0.5) 0%, rgba(10,30,59,0.2) 45%, transparent 80%)",
        }}
      />

      {/* Soft Upper Border Dissolve */}
      <div className="absolute top-0 inset-x-0 h-16 sm:h-24 bg-gradient-to-b from-white/90 via-white/50 to-transparent dark:from-[#0A1E3B] dark:via-[#0A1E3B]/50 dark:to-transparent pointer-events-none z-10" />

      {/* Horizontal Edge Soft Fades for Ultra-Wide Displays */}
      <div className="absolute inset-y-0 left-0 w-16 sm:w-36 bg-gradient-to-r from-white via-white/40 to-transparent dark:from-[#0A1E3B] dark:via-[#0A1E3B]/50 dark:to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-36 bg-gradient-to-l from-white via-white/40 to-transparent dark:from-[#0A1E3B] dark:via-[#0A1E3B]/50 dark:to-transparent pointer-events-none z-10" />

      {/* ========================================================================= */}
      {/* 3. PRECISE LANDMARK TECHNICAL LABELS - CLEANLY POSITIONED ABOVE STRUCTURES  */}
      {/* ========================================================================= */}
      {/* HOWRAH BRIDGE Annotation (Upper Left: nestled tightly above the cantilever bridge) */}
      <div className="absolute top-12 sm:top-16 lg:top-20 left-4 sm:left-8 lg:left-14 xl:left-24 pointer-events-none text-left font-mono z-10 hidden sm:block">
        <div className="flex items-center gap-1 text-slate-800 dark:text-slate-100 font-extrabold text-[10.5px] tracking-widest drop-shadow-xs dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          <span className="text-xs text-cyan-600 dark:text-cyan-400">↓</span>
          <span>HOWRAH BRIDGE</span>
        </div>
        <div className="text-[9px] text-slate-600 dark:text-slate-300 font-semibold tracking-wider pl-3 leading-tight mt-0.5 dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          22.5958° N<br />
          88.2636° E
        </div>
      </div>

      {/* VICTORIA MEMORIAL Annotation (Upper Right: nestled tightly above the dome and angel) */}
      <div className="absolute top-12 sm:top-16 lg:top-18 right-36 sm:right-48 lg:right-60 xl:right-80 pointer-events-none text-left font-mono z-10 hidden md:block">
        <div className="text-slate-800 dark:text-slate-100 font-extrabold text-[10.5px] tracking-widest drop-shadow-xs dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          VICTORIA MEMORIAL
        </div>
        <div className="text-[9px] text-slate-600 dark:text-slate-300 font-semibold tracking-wider leading-tight mt-0.5 dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          22.5448° N<br />
          88.3426° E
        </div>
      </div>

      {/* WRITERS' BUILDING Annotation (Far Right: nestled tightly above the clock tower) */}
      <div className="absolute top-12 sm:top-16 lg:top-18 right-4 sm:right-8 lg:left-auto lg:right-12 xl:right-20 pointer-events-none text-left font-mono z-10 hidden lg:block">
        <div className="text-slate-800 dark:text-slate-100 font-extrabold text-[10.5px] tracking-widest drop-shadow-xs dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          WRITERS' BUILDING
        </div>
        <div className="text-[9px] text-slate-600 dark:text-slate-300 font-semibold tracking-wider leading-tight mt-0.5 dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          22.5784° N<br />
          88.3466° E
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LIGHT, AIRY MOVING CLOUD DRIFT                                          */}
      {/* ========================================================================= */}
      <div
        className="absolute top-2 left-1/4 w-[380px] h-[180px] pointer-events-none opacity-[0.14] dark:opacity-[0.06] hidden xl:block"
        style={{ animation: "cloudDriftSlowLeft 48s ease-in-out infinite" }}
      >
        <svg
          viewBox="0 0 400 200"
          className="w-full h-full [filter:blur(24px)]"
        >
          <ellipse cx="200" cy="100" rx="170" ry="60" fill="#ffffff" />
          <ellipse cx="140" cy="90" rx="100" ry="45" fill="#cbd5e1" />
        </svg>
      </div>

      {/* Cloud 2 */}
      <div
        className="absolute top-2 right-1/4 w-[380px] h-[180px] pointer-events-none opacity-[0.14] dark:opacity-[0.06] hidden xl:block"
        style={{ animation: "cloudDriftSlowRight 54s ease-in-out infinite" }}
      >
        <svg
          viewBox="0 0 400 200"
          className="w-full h-full [filter:blur(24px)]"
        >
          <ellipse cx="200" cy="100" rx="170" ry="60" fill="#ffffff" />
          <ellipse cx="260" cy="90" rx="100" ry="45" fill="#cbd5e1" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 5. TECHNICAL GIS NODES (Subtle Outer Telemetry)                            */}
      {/* ========================================================================= */}
      <div className="absolute bottom-24 left-8 flex items-center gap-1.5 opacity-[0.3] dark:opacity-[0.7] text-slate-700 dark:text-slate-300 font-mono text-[8px] tracking-wider hidden md:flex">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-[#00E5FF] animate-pulse" />
        <span>HOOGHLY TIDAL REACH // 22.58°N</span>
      </div>

      <div className="absolute bottom-24 right-8 flex items-center gap-1.5 opacity-[0.3] dark:opacity-[0.7] text-slate-700 dark:text-slate-300 font-mono text-[8px] tracking-wider hidden md:flex">
        <span>KMC-BASIN // S-09</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
      </div>
    </div>
  );
}

export default KolkataDecorativeLayer;
