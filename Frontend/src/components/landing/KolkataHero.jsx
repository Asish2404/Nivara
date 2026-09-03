import { motion } from 'framer-motion'
import { ArrowRight, Compass, Radio } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { GEOGRAPHIC_DISTRICTS, ACTIVE_INCIDENTS } from '../gis/kolkataCartographicData'

export function KolkataHero({ selectedDistrict, onSelectDistrict, onResetFocus }) {
  const { setActiveSection, navigate } = useKWIStore()
  const heroIncident = ACTIVE_INCIDENTS[0] // #SV-024

  const handleEnterLiveCity = () => {
    setActiveSection('CITY')
    navigate('/live-city')
  }

  const handleViewIncidents = () => {
    setActiveSection('INCIDENTS')
    navigate('/incidents')
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between pt-24 sm:pt-28 pb-12 sm:pb-16 px-5 sm:px-10 md:px-16 lg:px-20 pointer-events-none select-none">
      {/* 1. TOP-LEFT: Geospatial System Header & Coordinate Bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="pointer-events-auto max-w-xl"
      >
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.06)] font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] tracking-[0.16em] uppercase font-semibold text-slate-900">
            22°34'22" N, 88°21'50" E
          </span>
          <span className="text-slate-400 text-[9px]">//</span>
          <span className="text-[9px] tracking-wider text-slate-600 uppercase font-medium">
            KOLKATA GEOSPATIAL INTELLIGENCE
          </span>
        </div>
      </motion.div>

      {/* 2. MIDDLE-LEFT: Hero Typography & Primary Action CTAs */}
      <div className="max-w-2xl pointer-events-auto my-auto py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
        >
          {/* Main Headline - Bold, Crisp, Editorial Light Slate */}
          <div className="space-y-1 sm:space-y-2 mb-5">
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-none font-sans drop-shadow-xs"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              KNOW THE WATER.
            </motion.h1>
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-700 leading-none font-sans"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.38 }}
            >
              KNOW THE CITY.
            </motion.h1>
          </div>

          {/* Concise Supporting Text */}
          <motion.p
            className="text-sm sm:text-base md:text-lg text-slate-600 max-w-lg mb-8 leading-relaxed font-normal font-sans"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.54 }}
          >
            Turn rainfall, citizen signals and drainage intelligence into faster municipal decisions.
          </motion.p>

          {/* Primary & Secondary Action CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
          >
            {/* Primary CTA - Sleek Dark Slate Pill */}
            <button
              type="button"
              onClick={handleEnterLiveCity}
              className="group relative flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-slate-950 text-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-[0_4px_20px_rgba(15,23,42,0.2)] hover:bg-slate-800 hover:shadow-[0_4px_25px_rgba(15,23,42,0.3)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/30"
              aria-label="Enter Live City"
            >
              <span>ENTER LIVE CITY</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            {/* Secondary CTA - Frosted Glass Light Pill */}
            <button
              type="button"
              onClick={handleViewIncidents}
              className="group relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/90 text-slate-800 font-semibold text-xs sm:text-sm tracking-wider uppercase border border-slate-300/80 hover:border-slate-400 hover:bg-white transition-all duration-200 backdrop-blur-md shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              aria-label="View Active Incidents"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>VIEW ACTIVE INCIDENTS</span>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* 3. BOTTOM: Geographically Coherent District Explorer & Live Signal Telemetry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
        className="pointer-events-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        {/* District Quick Inspector Navigation */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-600 uppercase font-semibold">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>KOLKATA GEOGRAPHIC SECTORS</span>
            {selectedDistrict && (
              <button
                type="button"
                onClick={onResetFocus}
                className="text-[9px] text-sky-600 hover:underline cursor-pointer ml-2"
              >
                [RESET VIEW]
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {GEOGRAPHIC_DISTRICTS.map((district) => {
              const isActive = selectedDistrict === district.id
              return (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => onSelectDistrict(isActive ? null : district.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-md'
                      : 'bg-white/90 text-slate-700 hover:text-slate-950 hover:bg-white border border-slate-200/90 shadow-xs'
                  }`}
                >
                  {district.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Active Telemetry Signal Card (#SV-024) */}
        {heroIncident && (
          <div
            onClick={() => onSelectDistrict('sector_v')}
            className="group flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 hover:border-rose-400 transition-all duration-200 cursor-pointer shadow-[0_4px_18px_rgba(15,23,42,0.08)] max-w-sm"
            title="Click to focus Sector V incident in map"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Radio className="w-4 h-4 animate-pulse text-rose-600" />
            </div>
            <div className="flex flex-col leading-tight min-w-0 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-rose-600">
                  {heroIncident.id}
                </span>
                <span className="text-[9px] text-slate-500 uppercase">
                  // {heroIncident.waterDepth}
                </span>
              </div>
              <span className="text-xs font-sans font-semibold text-slate-800 truncate mt-0.5 group-hover:text-slate-950 transition-colors">
                {heroIncident.location}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default KolkataHero
