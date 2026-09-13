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
      className="absolute top-0 inset-x-0 h-[560px] sm:h-[640px] lg:h-[700px] pointer-events-none overflow-hidden select-none z-0"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 6%, rgba(0,0,0,1) 18%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.5) 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 6%, rgba(0,0,0,1) 18%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.5) 90%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <style>{`
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
      {/* 1. AUTHENTIC LIGHT CLOUDY PANORAMA - FULLY VISIBLE & VIBRANT               */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full bg-no-repeat bg-cover pointer-events-none opacity-100 transition-opacity duration-700"
        style={{
          backgroundImage: `url('/images/kolkata_sky_clouds.jpg')`,
          backgroundPosition: "center 55%",
          backgroundSize: "cover",
          filter: "contrast(1.22) saturate(1.1) brightness(0.98)",
        }}
      />

      {/* Soft Central Text Glow: Diffuses softly behind headline without washing out landmarks */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 44% 50% at 50% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 45%, transparent 75%)",
        }}
      />

      {/* Soft Upper Border Dissolve: Eliminates any visible top border into clean white */}
      <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-white/90 via-white/50 to-transparent pointer-events-none z-10" />

      {/* ========================================================================= */}
      {/* 2. PRECISE LANDMARK TECHNICAL LABELS - CLEANLY POSITIONED ABOVE STRUCTURES  */}
      {/* ========================================================================= */}
      {/* HOWRAH BRIDGE Annotation (Upper Left: nestled tightly above the cantilever bridge) */}
      <div className="absolute top-12 sm:top-16 lg:top-20 left-4 sm:left-8 lg:left-14 xl:left-24 pointer-events-none text-left font-mono z-10 hidden sm:block">
        <div className="flex items-center gap-1 text-slate-800 font-extrabold text-[10.5px] tracking-widest drop-shadow-xs">
          <span className="text-xs">↓</span>
          <span>HOWRAH BRIDGE</span>
        </div>
        <div className="text-[9px] text-slate-600 font-semibold tracking-wider pl-3 leading-tight mt-0.5">
          22.5958° N<br />
          88.2636° E
        </div>
      </div>

      {/* VICTORIA MEMORIAL Annotation (Upper Right: nestled tightly above the dome and angel) */}
      <div className="absolute top-12 sm:top-16 lg:top-18 right-36 sm:right-48 lg:right-60 xl:right-80 pointer-events-none text-left font-mono z-10 hidden md:block">
        <div className="text-slate-800 font-extrabold text-[10.5px] tracking-widest drop-shadow-xs">
          VICTORIA MEMORIAL
        </div>
        <div className="text-[9px] text-slate-600 font-semibold tracking-wider leading-tight mt-0.5">
          22.5448° N<br />
          88.3426° E
        </div>
      </div>

      {/* WRITERS' BUILDING Annotation (Far Right: nestled tightly above the clock tower) */}
      <div className="absolute top-12 sm:top-16 lg:top-18 right-4 sm:right-8 lg:left-auto lg:right-12 xl:right-20 pointer-events-none text-left font-mono z-10 hidden lg:block">
        <div className="text-slate-800 font-extrabold text-[10.5px] tracking-widest drop-shadow-xs">
          WRITERS' BUILDING
        </div>
        <div className="text-[9px] text-slate-600 font-semibold tracking-wider leading-tight mt-0.5">
          22.5784° N<br />
          88.3466° E
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIGHT, AIRY MOVING CLOUD DRIFT                                          */}
      {/* ========================================================================= */}
      <div
        className="absolute top-2 left-1/4 w-[380px] h-[180px] pointer-events-none opacity-[0.14] hidden xl:block"
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

      <div
        className="absolute top-2 right-1/4 w-[380px] h-[180px] pointer-events-none opacity-[0.14] hidden xl:block"
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
      {/* 4. TECHNICAL GIS NODES (Subtle Outer Telemetry)                            */}
      {/* ========================================================================= */}
      <div className="absolute bottom-24 left-8 flex items-center gap-1.5 opacity-[0.25] text-slate-700 font-mono text-[8px] tracking-wider hidden md:flex">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
        <span>HOOGHLY TIDAL REACH // 22.58°N</span>
      </div>

      <div className="absolute bottom-24 right-8 flex items-center gap-1.5 opacity-[0.25] text-slate-700 font-mono text-[8px] tracking-wider hidden md:flex">
        <span>KMC-BASIN // S-09</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
      </div>
    </div>
  );
}

export default KolkataDecorativeLayer;
