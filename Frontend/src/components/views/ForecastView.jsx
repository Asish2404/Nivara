import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CloudRain, Waves, ShieldAlert, Sparkles, Compass, ArrowRight } from "lucide-react";
import { KolkataGisMap } from "../gis/KolkataGisMap";
import { CardSpotlight } from "../ui/CardSpotlight";
import { BorderBeam } from "../ui/BorderBeam";
import { audioEngine } from "../../utils/audioEngine";

export function ForecastView() {
  const [timeOffset, setTimeOffset] = useState("NOW"); // 'NOW' | '+15 MIN' | '+30 MIN' | '+45 MIN' | '+60 MIN'

  const FORECAST_DATA = {
    NOW: {
      rainMm: "74 mm / 3 hr",
      peakDepth: "28 cm",
      riskScore: "82",
      riskLabel: "High (Sector V Basin)",
      drainagePressure: "94% Capacity",
      activeWards: "14 Wards",
      tideM: "3.42 m (Rising)",
      wavePercent: 70,
    },
    "+15 MIN": {
      rainMm: "82 mm / 3 hr",
      peakDepth: "30 cm",
      riskScore: "85",
      riskLabel: "High-Critical Surge",
      drainagePressure: "96% Capacity",
      activeWards: "18 Wards",
      tideM: "3.55 m (High Sluice Cutoff)",
      wavePercent: 82,
    },
    "+30 MIN": {
      rainMm: "88 mm / 3 hr",
      peakDepth: "34 cm",
      riskScore: "91",
      riskLabel: "Critical (Park Circus & Sector V)",
      drainagePressure: "99% Capacity",
      activeWards: "22 Wards",
      tideM: "3.65 m (Surge Peak)",
      wavePercent: 95,
    },
    "+45 MIN": {
      rainMm: "68 mm / 3 hr",
      peakDepth: "29 cm",
      riskScore: "79",
      riskLabel: "Gravity Flow Resuming",
      drainagePressure: "89% Capacity",
      activeWards: "16 Wards",
      tideM: "3.48 m (Ebbing)",
      wavePercent: 74,
    },
    "+60 MIN": {
      rainMm: "52 mm / 3 hr",
      peakDepth: "22 cm",
      riskScore: "68",
      riskLabel: "Moderate (Receding Basin)",
      drainagePressure: "78% Capacity",
      activeWards: "9 Wards",
      tideM: "3.25 m (Low Tide Draw)",
      wavePercent: 55,
    },
  };

  const current = FORECAST_DATA[timeOffset] || FORECAST_DATA["NOW"];

  return (
    <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/5 dark:bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300 font-mono mb-2 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
          <span className="font-semibold tracking-wider">PREDICTIVE STORM SURGE NOWCASTING</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-500 dark:text-slate-400">60-MIN TIME HORIZON</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Hydro-AI <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">Storm Surge Forecast</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Simulate rainfall inundation footprint progression and Hooghly tidal surge lockouts before floodwaters crest.
        </p>
      </div>

      {/* Interactive Cyber Timeline Scrubber Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 text-white shadow-xl mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 font-mono text-xs text-cyan-400 font-bold uppercase">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>HORIZON:</span>
          </div>
          {Object.keys(FORECAST_DATA).map((tab) => {
            const isSelected = timeOffset === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setTimeOffset(tab);
                  audioEngine.playUiChirp(isSelected ? 900 : 1150);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300/50"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-transparent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 pr-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Alipore Dual-Pol Doppler + KMC Stormwater Engine</span>
        </div>
      </div>

      {/* Large Geographic Map Viewport with Border Beam Laser & Tactical HUD Framing */}
      <div className="relative w-full h-[560px] rounded-3xl border border-slate-200/90 bg-slate-950 overflow-hidden shadow-2xl mb-8">
        <BorderBeam size={360} duration={12} colorFrom="#00f0ff" colorTo="#8b5cf6" />

        {/* Cybernetic HUD Corner Brackets */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-400 z-[400] pointer-events-none" />
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400 z-[400] pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400 z-[400] pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400 z-[400] pointer-events-none" />

        {/* Dynamic Forecast Overlay Tag */}
        <div className="absolute top-4 left-4 z-[400] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2 text-xs text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <span className="text-[10px] font-bold text-cyan-400 block uppercase font-mono">
              PROJECTED FOOTPRINT WINDOW
            </span>
            <span className="font-bold text-white">
              T+{timeOffset === "NOW" ? "00" : timeOffset.replace("+", "")} // Inundation Extent
            </span>
          </div>
        </div>

        <KolkataGisMap />
      </div>

      {/* Key Forecast Holographic Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSpotlight
          soundFreq={940}
          spotlightColor="rgba(6, 182, 212, 0.12)"
          borderColor="rgba(6, 182, 212, 0.45)"
          className="p-5 rounded-2xl bg-white/95 dark:bg-[#16213a]/95 border-slate-200/90 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block font-mono">
              RAINFALL ACCUMULATION
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white font-mono">
            {current.rainMm}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span>Doppler radar reflectivity band</span>
          </div>
        </CardSpotlight>

        <CardSpotlight
          soundFreq={1040}
          spotlightColor="rgba(244, 63, 94, 0.12)"
          borderColor="rgba(244, 63, 94, 0.45)"
          className="p-5 rounded-2xl bg-white/95 dark:bg-[#16213a]/95 border-slate-200/90 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-rose-600 dark:text-rose-400 block font-mono">
              PEAK WATER DEPTH
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {current.peakDepth}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>Critical curb low-gradient points</span>
          </div>
        </CardSpotlight>

        <CardSpotlight
          soundFreq={1140}
          spotlightColor="rgba(245, 158, 11, 0.12)"
          borderColor="rgba(245, 158, 11, 0.45)"
          className="p-5 rounded-2xl bg-white/95 dark:bg-[#16213a]/95 border-slate-200/90 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-amber-600 dark:text-amber-400 block font-mono">
              DYNAMIC RISK SCORE
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {current.riskScore}
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">/ 100</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{current.riskLabel}</span>
          </div>
        </CardSpotlight>

        <CardSpotlight
          soundFreq={1240}
          spotlightColor="rgba(59, 130, 246, 0.12)"
          borderColor="rgba(59, 130, 246, 0.45)"
          className="p-5 rounded-2xl bg-white/95 dark:bg-[#16213a]/95 border-slate-200/90 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 block font-mono">
              HOOGHLY TIDAL SURGE
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {current.tideM}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Princep & Bagbazar lock gauges</span>
          </div>
        </CardSpotlight>
      </div>
    </div>
  );
}

export default ForecastView;
