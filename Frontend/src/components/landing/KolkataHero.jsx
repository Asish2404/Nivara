import { motion } from 'framer-motion'
import { ArrowRight, Compass, Radio } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { DISTRICT_TARGETS, HERO_INCIDENT } from '../3d/kolkataGeoData'

export function KolkataHero({ selectedDistrict, onSelectDistrict, onResetFocus }) {
  const { setActiveSection } = useKWIStore()

  const handleEnterLiveCity = () => {
    setActiveSection('CITY')
    // Smooth scroll down to operational context or command footer if needed
    window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' })
  }

  const handleViewIncidents = () => {
    setActiveSection('INCIDENTS')
    // If district is not Sector V, focus Sector V where active incident is
    if (onSelectDistrict) {
      onSelectDistrict('sector_v')
    }
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
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#080d16]/80 backdrop-blur-md border border-white/10 text-neutral-300 shadow-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
          </span>
          <span className="text-[10px] font-mono tracking-[0.16em] uppercase font-semibold text-neutral-200">
            22°34'22" N, 88°21'50" E
          </span>
          <span className="text-neutral-500 font-mono text-[9px]">//</span>
          <span className="text-[9px] font-mono tracking-wider text-neutral-300 uppercase font-medium">
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
          {/* Main Headline - Crisp, Editorial, Sober */}
          <div className="space-y-1 sm:space-y-2 mb-5">
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none font-sans"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              KNOW THE WATER.
            </motion.h1>
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-300 leading-none font-sans"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.38 }}
            >
              KNOW THE CITY.
            </motion.h1>
          </div>

          {/* Concise Supporting Text */}
          <motion.p
            className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-lg mb-8 leading-relaxed font-normal font-sans"
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
            {/* Primary CTA - Confident Clean White Pill */}
            <button
              type="button"
              onClick={handleEnterLiveCity}
              className="group relative flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-[0_4px_25px_rgba(255,255,255,0.18)] hover:bg-neutral-200 hover:shadow-[0_4px_30px_rgba(255,255,255,0.28)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Enter Live City"
            >
              <span>ENTER LIVE CITY</span>
              <ArrowRight className="w-4 h-4 text-neutral-950 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            {/* Secondary CTA - Clean Frosted Glass */}
            <button
              type="button"
              onClick={handleViewIncidents}
              className="group relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/[0.04] text-neutral-300 font-semibold text-xs sm:text-sm tracking-wider uppercase border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/[0.08] transition-all duration-200 backdrop-blur-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="View Active Incidents"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
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
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>KOLKATA GEOGRAPHIC SECTORS</span>
            {selectedDistrict && (
              <button
                type="button"
                onClick={onResetFocus}
                className="text-[9px] text-cyan-400 hover:underline cursor-pointer ml-2"
              >
                [RESET VIEW]
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {DISTRICT_TARGETS.map((district) => {
              const isActive = selectedDistrict === district.id
              return (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => onSelectDistrict(isActive ? null : district.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-neutral-950 font-bold shadow-[0_2px_12px_rgba(255,255,255,0.2)]'
                      : 'bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] border border-white/10'
                  }`}
                >
                  {district.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Active Telemetry Signal Card (#SV-024) */}
        <div
          onClick={() => onSelectDistrict('sector_v')}
          className="group flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#080d18]/85 backdrop-blur-md border border-white/10 hover:border-rose-500/50 transition-all duration-200 cursor-pointer shadow-xl max-w-sm"
          title="Click to focus Sector V incident in 3D map"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse text-rose-400" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-rose-400">
                {HERO_INCIDENT.id}
              </span>
              <span className="text-[9px] font-mono text-neutral-400 uppercase">
                // {HERO_INCIDENT.waterLevel}
              </span>
            </div>
            <span className="text-xs font-semibold text-neutral-200 truncate mt-0.5 group-hover:text-white transition-colors">
              {HERO_INCIDENT.location}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default KolkataHero
