import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Signal, Wifi, MapPin, Droplets, ChevronLeft, Zap, Lock, ChevronUp, RotateCw } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { audioEngine } from '../../utils/audioEngine'
import { MobileReportForm } from './MobileReportForm'
import { MobileReportVerification } from './MobileReportVerification'

const CHASSIS_SLICES = Array.from({ length: 29 }, (_, i) => i - 14)

export function MobileReportPhone() {
  const { isReportSubmitted, currentUser, navigate } = useKWIStore()
  const phoneContainerRef = useRef(null)

  // 3D Turntable Rotation State (0deg -> 360deg full continuous rotation around central vertical Y-axis)
  const [rotationKey, setRotationKey] = useState(0)
  const [isRotating, setIsRotating] = useState(true)

  // -1: Lock Screen with Indian Flag Wallpaper, 0: Welcome Screen, 1: Report Form
  const [phoneStep, setPhoneStep] = useState(-1)
  const [islandExpanded, setIslandExpanded] = useState(false)

  // 1. Live Real-Time Clock & Date (iPhone Lock Screen Style with 12-hour AM/PM)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date()
    const hours = now.getHours() % 12 || 12
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })

  const [ampm, setAmpm] = useState(() => (new Date().getHours() >= 12 ? 'PM' : 'AM'))

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours() % 12 || 12
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
      setAmpm(now.getHours() >= 12 ? 'PM' : 'AM')
      setCurrentDate(
        now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Real Device Battery Percentage via Web Battery API
  const [batteryLevel, setBatteryLevel] = useState(88)
  const [isCharging, setIsCharging] = useState(false)

  useEffect(() => {
    let batteryObj = null

    const handleBatteryUpdate = (battery) => {
      if (battery) {
        const pct = Math.round((battery.level ?? 0.88) * 100)
        setBatteryLevel(pct)
        setIsCharging(Boolean(battery.charging))
      }
    }

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        batteryObj = battery
        handleBatteryUpdate(battery)

        battery.addEventListener('levelchange', () => handleBatteryUpdate(battery))
        battery.addEventListener('chargingchange', () => handleBatteryUpdate(battery))
      }).catch(() => {
        setBatteryLevel(88)
      })
    }

    return () => {
      if (batteryObj) {
        try {
          batteryObj.removeEventListener('levelchange', () => handleBatteryUpdate(batteryObj))
          batteryObj.removeEventListener('chargingchange', () => handleBatteryUpdate(batteryObj))
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const screenTransition = {
    duration: 0.2,
    ease: 'easeInOut',
  }

  const handleReplay3D = () => {
    if (audioEngine) audioEngine.playUiChirp(1200)
    setIsRotating(true)
    setRotationKey((prev) => prev + 1)
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 select-none">
      {/* 3D Perspective Stage Container - Fixed Camera */}
      <div
        className="relative flex items-center justify-center scale-[0.68] min-[360px]:scale-[0.74] min-[400px]:scale-[0.84] sm:scale-100 origin-top -mb-60 min-[360px]:-mb-48 min-[400px]:-mb-28 sm:mb-0"
        style={{
          perspective: '1500px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* =================================================================== */}
        {/* TRUE 3D TURNTABLE OBJECT - ROTATES 720° (2 COMPLETE ROTATIONS) */}
        {/* =================================================================== */}
        <motion.div
          key={rotationKey}
          ref={phoneContainerRef}
          data-phone-mockup="true"
          initial={{ rotateY: 0, scale: 0.92 }}
          whileInView={{
            rotateY: 720,
            scale: [0.92, 0.92, 1.03, 1.0],
          }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{
            rotateY: {
              duration: 9.5,
              ease: [0.25, 1, 0.35, 1], // Smooth continuous rotation settling front-facing
            },
            scale: {
              duration: 9.5,
              times: [0, 0.75, 0.92, 1],
              ease: [0.22, 1, 0.36, 1], // Smooth cinematic forward zoom punch-in as rotation stops
            },
          }}
          onAnimationStart={() => setIsRotating(true)}
          onAnimationComplete={() => setIsRotating(false)}
          className="relative w-[348px] sm:w-[370px] h-[716px] sm:h-[742px]"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center 0px',
            transform: 'rotateX(0deg) rotateZ(0deg)',
          }}
        >
          {/* =============================================================== */}
          {/* 1. FRONT FACE (Z = +14px): EXACT INTERACTIVE PHONE SCREEN        */}
          {/* =============================================================== */}
          <div
            className="absolute inset-0 w-full h-full rounded-[54px] sm:rounded-[56px] bg-gradient-to-b from-[#2a2a2e] via-[#1c1c20] to-[#141416] p-[10px] sm:p-[11px] ring-1 ring-white/20 border border-[#3e3e44] flex flex-col justify-between shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)]"
            style={{
              transform: 'translateZ(14.5px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Antenna Bands on Front Edge */}
            <div className="absolute -left-[1px] top-24 w-[2.5px] h-[3px] bg-[#44444a]" />
            <div className="absolute -right-[1px] top-24 w-[2.5px] h-[3px] bg-[#44444a]" />
            <div className="absolute -left-[1px] bottom-24 w-[2.5px] h-[3px] bg-[#44444a]" />
            <div className="absolute -right-[1px] bottom-24 w-[2.5px] h-[3px] bg-[#44444a]" />

            {/* Top Speaker Micro-slit */}
            <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-16 h-[2.5px] bg-[#0c0c0e] rounded-full z-30 pointer-events-none" />

            {/* Screen Inner Bezel */}
            <div
              className={`w-full h-full rounded-[44px] sm:rounded-[46px] overflow-hidden flex flex-col justify-between relative border border-slate-900/80 shadow-inner transition-colors duration-300 ${phoneStep === -1 ? 'bg-[#488bc6]' : 'bg-white'
                }`}
            >
              {/* Ceramic Shield Diagonal Glass Glint */}
              <div className="absolute -top-28 -left-20 w-80 h-[430px] bg-gradient-to-br from-white/14 via-white/4 to-transparent rotate-[35deg] pointer-events-none z-40" />

              {/* Dynamic Island */}
              <div className="absolute top-[11px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                <motion.div
                  layout
                  onMouseEnter={() => setIslandExpanded(true)}
                  onMouseLeave={() => setIslandExpanded(false)}
                  onClick={() => {
                    if (audioEngine) audioEngine.playUiChirp(900)
                    setIslandExpanded((prev) => !prev)
                  }}
                  animate={{
                    width: islandExpanded ? 196 : 124,
                    height: 34,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="bg-black rounded-full px-3 flex items-center justify-between shadow-[0_4px_14px_rgba(0,0,0,0.85)] ring-[0.5px] ring-white/15 select-none cursor-pointer transition-shadow hover:shadow-cyan-500/10"
                >
                  {/* Left: TrueDepth Sensor */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0f] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#040406]" />
                    </div>
                    {islandExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[9.5px] font-mono font-bold text-cyan-300 tracking-wider uppercase pl-1"
                      >
                        KWI GRID
                      </motion.span>
                    )}
                  </div>

                  {/* Center: Activity Element */}
                  {!islandExpanded ? (
                    phoneStep >= 0 ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                    )
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1 text-[9px] font-mono text-white/80"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>ONLINE</span>
                    </motion.div>
                  )}

                  {/* Right: TrueDepth Camera with Sapphire Lens Glint */}
                  <div className="w-3.5 h-3.5 rounded-full bg-[#030611] border border-[#1e293b]/90 flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#020308]" />
                    <div className="w-1 h-1 rounded-full bg-blue-500/40 absolute top-[2px] right-[2px]" />
                    <div className="w-0.5 h-0.5 rounded-full bg-white/80 absolute top-[1.5px] right-[1.5px]" />
                  </div>
                </motion.div>
              </div>

              {/* Status Bar */}
              <div className="pt-2.5 px-6 sm:px-7 pb-1 flex items-center justify-between z-30 relative select-none shrink-0 bg-transparent">
                {phoneStep === -1 ? (
                  <span className="text-[12px] font-semibold font-sans tracking-tight text-white/95 drop-shadow-sm flex items-center gap-1 min-w-[40px]">
                    Jio 5G
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold font-sans tracking-tight text-slate-900 min-w-[40px]">
                    {currentTime} <span className="text-[10px] font-mono">{ampm}</span>
                  </span>
                )}

                <div className="w-[126px] h-[34px] pointer-events-none" />

                <div
                  className={`flex items-center gap-1.5 transition-colors duration-300 ${phoneStep === -1 ? 'text-white' : 'text-slate-900'
                    }`}
                >
                  <div className="flex items-end gap-[1.5px] h-[11px] pb-[0.5px]">
                    <span
                      className={`w-[2.5px] h-[3.5px] rounded-[0.8px] ${phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                        }`}
                    />
                    <span
                      className={`w-[2.5px] h-[5.5px] rounded-[0.8px] ${phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                        }`}
                    />
                    <span
                      className={`w-[2.5px] h-[7.5px] rounded-[0.8px] ${phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                        }`}
                    />
                    <span
                      className={`w-[2.5px] h-[9.5px] rounded-[0.8px] ${phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                        }`}
                    />
                  </div>

                  <Wifi
                    className={`w-[13.5px] h-[13.5px] stroke-[2.4] ${phoneStep === -1 ? 'text-white' : 'text-slate-900'
                      }`}
                  />

                  {/* Battery Capsule */}
                  <div className="flex items-center pl-0.5">
                    <svg
                      width="26"
                      height="13"
                      viewBox="0 0 25 12"
                      className="overflow-visible select-none"
                    >
                      <rect
                        x="0.5"
                        y="0.5"
                        width="21.5"
                        height="11"
                        rx="3.5"
                        fill="none"
                        stroke={phoneStep === -1 ? '#ffffff' : '#0f172a'}
                        strokeWidth="1.1"
                        strokeOpacity={phoneStep === -1 ? '0.7' : '0.4'}
                      />
                      <path
                        d="M 23 4.2 C 23.8 4.2 24.2 4.6 24.2 5.2 L 24.2 6.8 C 24.2 7.4 23.8 7.8 23 7.8 Z"
                        fill={phoneStep === -1 ? '#ffffff' : '#0f172a'}
                        fillOpacity={phoneStep === -1 ? '0.7' : '0.4'}
                      />
                      <rect
                        x="1.8"
                        y="1.8"
                        width={Math.max(2, 18.9 * (batteryLevel / 100))}
                        height="8.4"
                        rx="2.2"
                        fill={
                          isCharging
                            ? '#22c55e'
                            : batteryLevel <= 20
                              ? '#ef4444'
                              : phoneStep === -1
                                ? '#ffffff'
                                : '#0f172a'
                        }
                        className="transition-all duration-300"
                      />
                      {isCharging ? (
                        <path
                          d="M 11.5 2.5 L 9 6.5 L 11 6.5 L 10.5 9.5 L 13.5 5.5 L 11.5 5.5 Z"
                          fill={phoneStep === -1 ? '#000000' : '#ffffff'}
                        />
                      ) : (
                        <text
                          x="11.2"
                          y="8.2"
                          textAnchor="middle"
                          fontSize="7.5"
                          fontWeight="800"
                          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Plus Jakarta Sans', sans-serif"
                          fill={
                            batteryLevel > 45
                              ? phoneStep === -1
                                ? '#0f172a'
                                : '#ffffff'
                              : phoneStep === -1
                                ? '#ffffff'
                                : '#0f172a'
                          }
                          letterSpacing="-0.3px"
                        >
                          {batteryLevel}
                        </text>
                      )}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mobile App Screen Content Router */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {isReportSubmitted ? (
                  <div className="p-4 flex-1 flex flex-col">
                    <MobileReportVerification />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {/* SCREEN -1: LOCK SCREEN (INDIAN FLAG + NOTIFICATIONS) */}
                    {phoneStep === -1 && (
                      <motion.div
                        key="phone-lock-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={screenTransition}
                        onClick={() => {
                          if (!currentUser) {
                            navigate('/login')
                            return
                          }
                          if (audioEngine) audioEngine.playUiChirp(1200)
                          setPhoneStep(0)
                        }}
                        onPanEnd={(e, info) => {
                          if (info.offset.y < -20 || info.velocity.y < -100) {
                            if (!currentUser) {
                              navigate('/login')
                              return
                            }
                            if (audioEngine) audioEngine.playUiChirp(1200)
                            setPhoneStep(0)
                          }
                        }}
                        className="absolute inset-0 -top-12 -bottom-2 w-full h-[calc(100%+56px)] flex flex-col justify-between pt-16 pb-4 px-3.5 cursor-pointer select-none z-10 bg-[#488bc6]"
                      >
                        <div className="absolute inset-0 w-full h-full bg-[#488bc6] flex items-center justify-center overflow-hidden z-0 pointer-events-none">
                          <img
                            src="/textures/indian_flag_wallpaper.png"
                            alt="Indian Flag Wallpaper"
                            className="w-full h-full object-contain object-center scale-[1.32] translate-y-2 select-none"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60 pointer-events-none z-0" />

                        {/* Lock Screen Header */}
                        <div className="relative z-10 flex flex-col items-center pt-3 text-center pointer-events-none">
                          <div className="flex items-center gap-1 text-white/95 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <p className="text-[13.5px] font-medium text-white/95 tracking-tight font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                            {currentDate}
                          </p>
                          <div className="flex items-baseline justify-center gap-1.5 my-1 select-none">
                            <h1 className="text-[70px] sm:text-[76px] font-bold text-white tracking-tight font-sans leading-none drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
                              {currentTime}
                            </h1>
                            <span className="text-base font-bold text-white/90 drop-shadow-md uppercase tracking-wider font-mono">
                              {ampm}
                            </span>
                          </div>
                        </div>

                        {/* Lock Screen Notification Banners */}
                        <div className="relative z-10 my-auto space-y-2 px-1 pointer-events-none">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-2.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 text-white shadow-lg flex items-start gap-2.5"
                          >
                            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                              <Droplets className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-[10.5px] font-bold text-white tracking-tight">KWI GRID ALERT</span>
                                <span className="text-[8.5px] text-white/70">now</span>
                              </div>
                              <p className="text-[10px] text-white/90 leading-tight mt-0.5">
                                Live Telemetry Active • 32 drainage sensors calibrated.
                              </p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Bottom Area: Clean iOS Swipe Up & Home Indicator */}
                        <div className="relative z-10 flex flex-col items-center gap-2 pb-2 pointer-events-none">
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-white/95 tracking-wide drop-shadow-md font-sans"
                          >
                            <span>Swipe up or tap to open</span>
                            <ChevronUp className="w-3.5 h-3.5 text-white/95" />
                          </motion.div>
                          <div className="w-36 h-[4.5px] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 0: WELCOME SCREEN */}
                    {phoneStep === 0 && (
                      <motion.div
                        key="phone-step-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={screenTransition}
                        className="p-4 flex flex-col justify-between h-full text-left"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4 pt-1">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
                                <img
                                  src="/textures/NIVARA_LOGO.png"
                                  alt="NIVARA Logo"
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              </div>
                              <div>
                                <span className="text-[12px] font-bold text-slate-900 tracking-[0.08em] block leading-tight font-sans">
                                  NIVARA
                                </span>
                                <span className="text-[10.5px] text-slate-500 font-medium block leading-tight mt-0.5">
                                  {/* Water Intelligence */}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              title="Lock Phone"
                              onClick={() => {
                                if (audioEngine) audioEngine.playUiChirp(700)
                                setPhoneStep(-1)
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mb-2">
                            <h2 className="text-[25px] sm:text-[27px] font-extrabold text-slate-950 tracking-tight leading-[1.15] font-sans">
                              Hello & Welcome<br />to our app
                            </h2>
                            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed max-w-[260px]">
                              Help Kolkata identify waterlogging and respond faster.
                            </p>
                          </div>
                        </div>

                        {/* Center Card: KOLKATA LIVE WATER NETWORK BLUEPRINT */}
                        <div className="my-auto py-1">
                          <div className="w-full h-[178px] rounded-2xl bg-gradient-to-b from-blue-50/80 via-white to-blue-50/40 border border-blue-200/90 p-3 flex flex-col justify-between relative shadow-2xs overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f033_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f033_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                            <div className="flex items-center justify-between z-10 relative">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                <span className="text-[11px] font-extrabold font-mono tracking-[0.18em] text-blue-950 uppercase">
                                  KOLKATA
                                </span>
                              </div>
                              <span className="text-[9.5px] font-mono font-semibold text-blue-600/80 tracking-wider">
                                22.57° N, 88.36° E
                              </span>
                            </div>

                            <div className="relative flex-1 flex items-center justify-center my-0.5 z-10">
                              <svg
                                viewBox="0 0 240 100"
                                className="w-full h-full overflow-visible select-none"
                              >
                                <defs>
                                  <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                    <stop offset="50%" stopColor="#2563eb" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.5" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M 50 10 C 70 30, 80 50, 105 60 C 130 70, 140 85, 160 95"
                                  fill="none"
                                  stroke="url(#riverGrad)"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M 50 10 C 70 30, 80 50, 105 60 C 130 70, 140 85, 160 95"
                                  fill="none"
                                  stroke="#60a5fa"
                                  strokeWidth="2"
                                  strokeDasharray="4 3"
                                  strokeLinecap="round"
                                />
                                <g transform="translate(18, 24)">
                                  <text
                                    x="0"
                                    y="0"
                                    fontSize="9"
                                    fontWeight="700"
                                    fontFamily="monospace"
                                    fill="#2563eb"
                                    letterSpacing="0.05em"
                                  >
                                    ~~~ Hooghly
                                  </text>
                                </g>
                                <line
                                  x1="45"
                                  y1="55"
                                  x2="175"
                                  y2="55"
                                  stroke="#93c5fd"
                                  strokeWidth="1.8"
                                  strokeDasharray="2 2"
                                />
                                <line
                                  x1="60"
                                  y1="82"
                                  x2="105"
                                  y2="60"
                                  stroke="#93c5fd"
                                  strokeWidth="1.5"
                                />
                                <line
                                  x1="105"
                                  y1="60"
                                  x2="170"
                                  y2="82"
                                  stroke="#93c5fd"
                                  strokeWidth="1.5"
                                />
                                <circle cx="45" cy="55" r="4.5" fill="#2563eb" />
                                <circle cx="45" cy="55" r="2" fill="#ffffff" />
                                <circle cx="105" cy="60" r="5" fill="#1d4ed8" />
                                <circle cx="105" cy="60" r="2" fill="#ffffff" />
                                <circle cx="175" cy="55" r="4.5" fill="#2563eb" />
                                <circle cx="175" cy="55" r="2" fill="#ffffff" />
                                <circle cx="170" cy="82" r="4" fill="#3b82f6" />
                                <circle cx="170" cy="82" r="1.8" fill="#ffffff" />
                                <g transform="translate(48, 86)">
                                  <text
                                    x="0"
                                    y="0"
                                    fontSize="8.5"
                                    fontWeight="700"
                                    fontFamily="monospace"
                                    fill="#3b82f6"
                                    letterSpacing="0.04em"
                                  >
                                    canal •
                                  </text>
                                </g>
                              </svg>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-blue-100/80 text-[9px] font-mono text-slate-500 z-10">
                              <span className="flex items-center gap-1 font-semibold text-blue-700">
                                <Droplets className="w-3 h-3 text-blue-600" />
                                TELEMETRY READY
                              </span>
                              <span className="font-bold text-slate-700">32 GAUGES</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-1.5 mt-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                            <span className="text-[11px] font-bold font-mono tracking-[0.14em] text-blue-900 uppercase">
                              LIVE WATER NETWORK
                            </span>
                          </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="pt-1 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser) {
                                navigate('/login')
                                return
                              }
                              if (audioEngine) audioEngine.playUiChirp(1050)
                              setPhoneStep(1)
                            }}
                            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-[14px] transition-all cursor-pointer shadow-xs flex items-center justify-center font-sans tracking-wide"
                          >
                            GET STARTED
                          </button>
                          <div className="flex justify-center items-center gap-1.5 mt-3">
                            <span className="w-4 h-1.5 rounded-full bg-blue-600 transition-all" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 1: REPORT FORM */}
                    {phoneStep === 1 && (
                      <motion.div
                        key="phone-step-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={screenTransition}
                        className="flex-1 h-full flex flex-col p-4"
                      >
                        <MobileReportForm onBackToStep1={() => setPhoneStep(0)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Bottom Home Indicator Bar */}
              {phoneStep !== -1 && (
                <div className="py-2 bg-white flex justify-center shrink-0">
                  <div className="w-28 h-1 bg-slate-300 rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* SOLID UNIBODY CHASSIS EXTRUSION (CONNECTS FRONT & BACK)         */}
          {/* =============================================================== */}
          {CHASSIS_SLICES.map((z) => (
            <div
              key={z}
              className="absolute inset-0 w-full h-full rounded-[54px] sm:rounded-[56px] bg-[#161b24] border-[1.5px] border-[#363f4e] pointer-events-none"
              style={{
                transform: `translateZ(${z}px)`,
              }}
            />
          ))}

          {/* =============================================================== */}
          {/* 2. BACK FACE (Z = -14.5px, rotateY = 180deg): 3D TITANIUM REAR   */}
          {/* =============================================================== */}
          <div
            className="absolute inset-0 w-full h-full rounded-[54px] sm:rounded-[56px] bg-gradient-to-b from-[#252528] via-[#1a1a1c] to-[#121214] border border-[#3e3e44] p-5 flex flex-col justify-between shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)]"
            style={{
              transform: 'rotateY(180deg) translateZ(14.5px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Ceramic Matte Frosted Texture overlay */}
            <div className="absolute inset-0 rounded-[54px] sm:rounded-[56px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />

            {/* Elevated 3D Camera Island (Top Left) */}
            <div className="w-[146px] h-[146px] rounded-[34px] bg-gradient-to-br from-[#2f2f34] via-[#1f1f23] to-[#161618] border border-white/15 p-3.5 shadow-[0_12px_24px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.2)] relative flex flex-wrap justify-between items-center">
              {/* Camera Lens 1: Main 48MP Sapphire Lens */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#111] to-[#050508] border-[3px] border-[#3a3a42] flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#030610] border border-cyan-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-900 via-blue-700 to-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-3 right-3" />
                </div>
              </div>

              {/* Camera Lens 2: Ultra-Wide Lens */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#111] to-[#050508] border-[3px] border-[#3a3a42] flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#030610] border border-amber-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-emerald-900 via-teal-700 to-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-3 right-3" />
                </div>
              </div>

              {/* Camera Lens 3: Telephoto 5x Lens */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#111] to-[#050508] border-[3px] border-[#3a3a42] flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#030610] border border-purple-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-900 via-violet-700 to-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-3 right-3" />
                </div>
              </div>

              {/* Right Side: True Tone Dual-LED Flash + LiDAR Sensor */}
              <div className="w-14 h-14 flex flex-col items-center justify-around py-1">
                {/* Dual-Tone LED Flash */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border border-white/40 shadow-inner flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
                {/* LiDAR Scanner */}
                <div className="w-4.5 h-4.5 rounded-full bg-black border border-slate-700 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                </div>
              </div>
            </div>

            {/* Apple / KWI Precision Titanium Emblem (Center of Back) */}
            <div className="self-center flex flex-col items-center opacity-60 my-auto">
              <svg
                width="36"
                height="44"
                viewBox="0 0 170 170"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <path
                  d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.74-7.94-12.14-14.58-6.19-9.35-11.03-19.78-14.52-31.29-3.48-11.51-5.22-22.38-5.22-32.61 0-14.42 3.65-26.1 10.96-35.03 7.31-8.93 16.53-13.48 27.67-13.65 4.35 0 9.4 1.18 15.15 3.53 5.75 2.35 9.4 3.59 10.96 3.73 1.96-.28 5.76-1.57 11.39-3.87 5.63-2.3 10.63-3.34 15.02-3.11 11.52.59 20.69 4.88 27.53 12.87-10.05 6.09-14.97 14.58-14.75 25.48.22 8.7 3.57 15.99 10.06 21.87 6.49 5.88 14.28 9.25 23.36 10.1-2.4 7.24-5.34 14.22-8.81 20.93zm-30.82-120.31c0 6.64-2.42 12.87-7.26 18.69-5.87 7.02-12.98 11.17-21.32 12.45-.11-.94-.17-1.88-.17-2.82 0-6.64 2.61-13.1 7.83-19.38 2.61-3.14 5.88-5.74 9.8-7.79 3.93-2.06 7.64-3.23 11.12-3.52z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-[9px] font-mono tracking-[0.25em] text-white/50 mt-1 uppercase">
                TITANIUM
              </span>
            </div>

            {/* Bottom Regulatory Text */}
            <div className="text-center text-[8px] font-mono text-white/30 tracking-widest pb-1">
              DESIGNED BY APPLE IN CALIFORNIA • ASSEMBLED FOR KWI
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. RIGHT SIDE RAIL (X = +174px, rotateY = +90deg): 28px DEPTH   */}
          {/* =============================================================== */}
          <div
            className="absolute top-[52px] bottom-[52px] w-[28px] bg-gradient-to-b from-[#333338] via-[#222226] to-[#18181c] border-x border-[#44444c] flex flex-col justify-between items-center py-20"
            style={{
              left: 'calc(100% - 14px)',
              transform: 'rotateY(90deg)',
              transformOrigin: 'center center',
            }}
          >
            {/* Top Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />

            {/* Power / Lock Physical Button */}
            <button
              type="button"
              title={phoneStep === -1 ? 'Unlock Phone' : 'Lock Phone'}
              onClick={() => {
                if (audioEngine) audioEngine.playUiChirp(phoneStep === -1 ? 1200 : 700)
                if (phoneStep === -1) {
                  if (!currentUser) {
                    navigate('/login')
                    return
                  }
                  setPhoneStep(0)
                } else {
                  setPhoneStep(-1)
                }
              }}
              className="w-[6px] h-20 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-md cursor-pointer hover:bg-slate-400 active:scale-95 transition-all"
            />

            {/* Bottom Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />
          </div>

          {/* =============================================================== */}
          {/* 4. LEFT SIDE RAIL (X = -174px, rotateY = -90deg): 28px DEPTH    */}
          {/* =============================================================== */}
          <div
            className="absolute top-[52px] bottom-[52px] w-[28px] bg-gradient-to-b from-[#333338] via-[#222226] to-[#18181c] border-x border-[#44444c] flex flex-col justify-between items-center py-16"
            style={{
              left: '-14px',
              transform: 'rotateY(-90deg)',
              transformOrigin: 'center center',
            }}
          >
            {/* Top Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />

            {/* Action Button & Volume Rockers */}
            <div className="flex flex-col items-center gap-5">
              {/* Action Button */}
              <div className="w-[6px] h-7 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-sm" />
              {/* Volume Up */}
              <div className="w-[6px] h-14 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-sm" />
              {/* Volume Down */}
              <div className="w-[6px] h-14 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-sm" />
            </div>

            {/* Bottom Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />
          </div>

          {/* =============================================================== */}
          {/* 5. TOP RAIL (Y = -360px, rotateX = +90deg): 28px DEPTH          */}
          {/* =============================================================== */}
          <div
            className="absolute left-[52px] right-[52px] h-[28px] bg-gradient-to-r from-[#333338] via-[#222226] to-[#18181c] border-y border-[#44444c] flex items-center justify-center"
            style={{
              top: '-14px',
              transform: 'rotateX(90deg)',
              transformOrigin: 'center center',
            }}
          >
            {/* Microphone pinhole */}
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c] border border-white/10" />
          </div>

          {/* =============================================================== */}
          {/* 6. BOTTOM RAIL (Y = +360px, rotateX = -90deg): USB-C + SPEAKERS */}
          {/* =============================================================== */}
          <div
            className="absolute left-[52px] right-[52px] h-[28px] bg-gradient-to-r from-[#333338] via-[#222226] to-[#18181c] border-y border-[#44444c] flex items-center justify-around px-8"
            style={{
              bottom: '-14px',
              transform: 'rotateX(-90deg)',
              transformOrigin: 'center center',
            }}
          >
            {/* Left Stereo Speaker Grilles (3 holes) */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
            </div>

            {/* USB-C Port */}
            <div className="w-8 h-3 rounded-full bg-[#0a0a0c] border border-white/20 flex items-center justify-center">
              <div className="w-4 h-1 rounded-sm bg-[#222]" />
            </div>

            {/* Right Stereo Speaker Grilles (5 holes) */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
            </div>
          </div>
        </motion.div>

        {/* Dynamic Contact Floor Shadow */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[300px] sm:w-[320px] h-8 bg-black/35 blur-xl rounded-full pointer-events-none" />
      </div>

      {/* Subtle 3D Replay Button */}
      {!isRotating && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleReplay3D}
          className="mt-4 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          title="Replay 720° 3D Rotation"
        >
          <RotateCw className="w-3 h-3 text-blue-600" />
          <span>Replay 720° 3D View</span>
        </motion.button>
      )}
    </div>
  )
}

export default MobileReportPhone

