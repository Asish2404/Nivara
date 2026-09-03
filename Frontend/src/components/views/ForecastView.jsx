import { useState } from "react";
import { motion } from "framer-motion";
import { KolkataGisMap } from "../gis/KolkataGisMap";

export function ForecastView() {
  const [timeOffset, setTimeOffset] = useState("NOW"); // 'NOW' | '+30 MIN' | '+60 MIN'

  const FORECAST_DATA = {
    NOW: {
      rainMm: "74 mm / 3 hr",
      peakDepth: "28 cm",
      riskScore: "82",
      riskLabel: "High (Borough VII & Sector V)",
      drainagePressure: "94% Basin Capacity",
      activeWards: "14 Wards Constrained",
      tideM: "3.42 m (Rising)",
    },
    "+30 MIN": {
      rainMm: "88 mm / 3 hr (Peak Intensity)",
      peakDepth: "32 cm",
      riskScore: "88",
      riskLabel: "Critical (Park Circus & Sector V)",
      drainagePressure: "99% Basin Capacity",
      activeWards: "22 Wards Constrained",
      tideM: "3.65 m (High Tide Surge)",
    },
    "+60 MIN": {
      rainMm: "52 mm / 3 hr (Easing)",
      peakDepth: "24 cm",
      riskScore: "71",
      riskLabel: "Moderate (Post-Peak Gravity Drainage)",
      drainagePressure: "82% Basin Capacity",
      activeWards: "11 Wards Constrained",
      tideM: "3.30 m (Ebbing)",
    },
  };

  const current = FORECAST_DATA[timeOffset];

  return (
    <div className="w-full font-sans text-slate-900 pb-16">
      {/* Header */}
      <div className="max-w-2xl mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 block mb-1">
          HYDROLOGICAL FORECAST · 11:24 AM IST
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Predict What Happens Next
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          See how rainfall and drainage conditions may affect Kolkata over the
          next hour based on IMD radar and Hooghly tidal heights.
        </p>
      </div>

      {/* Clean Timeline Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {["NOW", "+30 MIN", "+60 MIN"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTimeOffset(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeOffset === tab
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-3 hidden sm:inline">
          Model: Alipore Doppler + KMC Stormwater Runoff Engine
        </span>
      </div>

      {/* Large Clean Geographic Visualization */}
      <div className="relative w-full h-[520px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs mb-8">
        <KolkataGisMap />

        {/* Dynamic Forecast Overlay Tag */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-3.5 py-2 text-xs shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            Projected Window
          </span>
          <span className="font-bold text-slate-900">
            {timeOffset} Projected Inundation Footprint
          </span>
        </div>
      </div>

      {/* Key Forecast Metrics Grid with smooth number presentation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Rainfall Rate
          </span>
          <span className="text-xl font-bold text-slate-900">
            {current.rainMm}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Radar reflectivity
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Peak Water Depth
          </span>
          <span className="text-xl font-bold text-rose-600">
            {current.peakDepth}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            At low curb points
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Risk Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-600">
              {current.riskScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">
            {current.riskLabel}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Hooghly Tide Level
          </span>
          <span className="text-xl font-bold text-blue-600">
            {current.tideM}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Princep Ghat gauge
          </span>
        </div>
      </div>
    </div>
  );
}

export default ForecastView;
