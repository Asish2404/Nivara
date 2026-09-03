import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Compass, Crosshair, Radio, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { audioEngine } from '../../utils/audioEngine'

export function TacticalHudOverlay({ stage, onSkip }) {
  const [altitude, setAltitude] = useState(35786)
  const [soundActive, setSoundActive] = useState(false)
  const isZooming = stage === 'zooming'

  // Sync with audio engine mute state
  useEffect(() => {
    return audioEngine.subscribe((isActive) => setSoundActive(isActive))
  }, [])

  // Trigger warp sweep and countdown on zooming
  useEffect(() => {
    if (!isZooming) {
      setAltitude(35786)
      return
    }

    // Play cinematic atmospheric entry sweep if sound is enabled
    audioEngine.playWarpSweep()

    const startTime = performance.now()
    const duration = 4800 // ~5 seconds transition

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentAlt = Math.round(35786 - eased * (35786 - 420))
      setAltitude(currentAlt)

      if (progress >= 1) clearInterval(interval)
    }, 40)

    return () => clearInterval(interval)
  }, [isZooming])

  const handleAudioToggle = () => {
    audioEngine.toggleMute()
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 font-mono text-cyan-400 select-none">
      {/* 1. Tactical Corner Framing */}
      <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-cyan-400/70" />
      <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-cyan-400/70" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-cyan-400/70" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-cyan-400/70" />

      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      {/* 2. Top Status Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-cyan-300">
            KWI-ORBITAL // SENTINEL-5 SURVEILLANCE
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-200">
            GEO-STATIONARY ARRAY
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={handleAudioToggle}
            onMouseEnter={() => audioEngine.playUiChirp(1050)}
            className="pointer-events-auto flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 hover:bg-cyan-950/80 border border-cyan-400/30 hover:border-cyan-400/60 text-cyan-300 text-[11px] transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            title="Toggle high-tech space sound"
          >
            {soundActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">AUDIO ON</span>
                {/* Micro Animated Equalizer */}
                <span className="flex items-end gap-0.5 h-2.5 ml-0.5">
                  <span className="w-0.5 h-2 bg-cyan-400 animate-[pulse_0.8s_ease-in-out_infinite]" />
                  <span className="w-0.5 h-3 bg-cyan-300 animate-[pulse_0.5s_ease-in-out_infinite]" />
                  <span className="w-0.5 h-1.5 bg-cyan-400 animate-[pulse_0.9s_ease-in-out_infinite]" />
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline text-slate-400">UNMUTE</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>DOWNLINK:</span> 99.8%
          </div>
          <div className="text-slate-400 text-[11px]">
            LATENCY: <span className="text-cyan-300">14MS</span>
          </div>
        </div>
      </motion.header>

      {/* 3. Center Target Lock Reticle */}
      <div className="relative flex flex-col items-center justify-center pointer-events-none my-auto">
        <motion.div
          animate={{
            scale: isZooming ? [1, 1.08, 0.95] : [1, 1.03, 1],
            rotate: isZooming ? 180 : 360,
          }}
          transition={{
            duration: isZooming ? 4 : 20,
            repeat: isZooming ? 0 : Infinity,
            ease: 'linear',
          }}
          className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center"
        >
          {/* Inner ring */}
          <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-cyan-500/20" />
          {/* Crosshair arms */}
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
          {/* Center reticle */}
          <Crosshair className="w-8 h-8 text-cyan-400 opacity-60" />
        </motion.div>

        {/* Target Acquisition Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md px-4 py-2 rounded border border-cyan-500/30"
        >
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold tracking-wider">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isZooming ? 'TARGET LOCKED // APPROACHING VECTOR' : 'SEARCHING GLOBAL BASIN'}</span>
          </div>
          <div className="text-[11px] text-cyan-400/80">
            TARGET: <span className="text-white font-semibold">KOLKATA [22.5726° N, 88.3639° E]</span>
          </div>
        </motion.div>
      </div>

      {/* 4. Bottom Telemetry & Controls */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-t border-cyan-500/20 pt-4"
      >
        {/* Left Telemetry */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">ALTITUDE:</span>
            <span className="text-white font-bold tracking-wider text-sm sm:text-base">
              {altitude.toLocaleString()} KM
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-cyan-400/80">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>HOOGHLY TIDAL GAUGES: 41 SENSORS SYNCHRONIZED</span>
          </div>
        </div>

        {/* Right Action: Skip / Direct Access button */}
        {onSkip && (
          <button
            type="button"
            onClick={() => {
              audioEngine.playUiChirp(1200)
              onSkip()
            }}
            onMouseEnter={() => audioEngine.playUiChirp(900)}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 text-xs font-semibold tracking-wider hover:text-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer"
          >
            <span>ENTER CITY SYSTEM</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.footer>
    </div>
  )
}
