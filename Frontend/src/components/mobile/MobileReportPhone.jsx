import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Signal, Wifi, MapPin, Droplets, ChevronLeft, Zap, Lock, ChevronUp } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { audioEngine } from '../../utils/audioEngine'
import { MobileReportForm } from './MobileReportForm'
import { MobileReportVerification } from './MobileReportVerification'

export function MobileReportPhone() {
  const { isReportSubmitted } = useKWIStore()
  const phoneContainerRef = useRef(null)

  // -1: Lock Screen with Indian Flag Wallpaper, 0: Welcome Screen, 1: Report Your Problem, 2: Existing Report Form
  const [phoneStep, setPhoneStep] = useState(-1)
  const [islandExpanded, setIslandExpanded] = useState(false)

  // 1. Live Real-Time Clock & Date (iPhone Lock Screen Style)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date()
    const hours = now.getHours() % 12 || 12
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })

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

  return (
    <div className="w-full flex justify-center py-4 select-none">
      {/* Phone Hardware Mockup Shell - Exact iPhone 15/16 Pro Titanium Chassis */}
      <motion.div
        ref={phoneContainerRef}
        data-phone-mockup="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-[348px] sm:w-[374px] md:w-[384px] h-[710px] sm:h-[746px] rounded-[58px] sm:rounded-[60px] bg-gradient-to-b from-[#2a2a2e] via-[#1c1c20] to-[#141416] p-[10px] sm:p-[11px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.5),0_15px_35px_-8px_rgba(0,0,0,0.3)] ring-1 ring-white/20 border border-[#3e3e44] flex flex-col justify-between relative"
      >
        {/* Antenna Bands (Exact iPhone Placement) */}
        <div className="absolute -left-[1px] top-24 w-[2.5px] h-[3px] bg-[#44444a]" />
        <div className="absolute -right-[1px] top-24 w-[2.5px] h-[3px] bg-[#44444a]" />
        <div className="absolute -left-[1px] bottom-24 w-[2.5px] h-[3px] bg-[#44444a]" />
        <div className="absolute -right-[1px] bottom-24 w-[2.5px] h-[3px] bg-[#44444a]" />

        {/* Physical Side Buttons (Exact Pro Dimensions) */}
        {/* Left: Action Button & Volume Rockers */}
        <div className="absolute -left-[4px] top-26 w-[3px] h-6 bg-[#3a3a40] rounded-l-xs shadow-xs pointer-events-none" />
        <div className="absolute -left-[4px] top-37 w-[3px] h-12 bg-[#3a3a40] rounded-l-xs shadow-xs pointer-events-none" />
        <div className="absolute -left-[4px] top-52 w-[3px] h-12 bg-[#3a3a40] rounded-l-xs shadow-xs pointer-events-none" />

        {/* Right: Side / Power Button (Click to Lock/Unlock Phone) */}
        <button
          type="button"
          title={phoneStep === -1 ? 'Unlock Phone' : 'Lock Phone'}
          onClick={() => {
            if (audioEngine) audioEngine.playUiChirp(phoneStep === -1 ? 1200 : 700)
            setPhoneStep((prev) => (prev === -1 ? 0 : -1))
          }}
          className="absolute -right-[4px] top-38 w-[3px] h-16 bg-[#3a3a40] hover:bg-[#52525c] active:scale-95 rounded-r-xs shadow-xs cursor-pointer transition-all z-40"
        />

        {/* Top Speaker Micro-slit (Seamlessly Integrated Into Top Bezel) */}
        <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-16 h-[2.5px] bg-[#0c0c0e] rounded-full z-30 pointer-events-none" />

        {/* Screen Inner Bezel (Exact Symmetrical Apple Margins) */}
        <div
          className={`w-full h-full rounded-[48px] sm:rounded-[50px] overflow-hidden flex flex-col justify-between relative border border-slate-900/80 shadow-inner transition-colors duration-300 ${
            phoneStep === -1 ? 'bg-[#488bc6]' : 'bg-white'
          }`}
        >
          {/* Ceramic Shield Diagonal Glass Glint */}
          <div className="absolute -top-28 -left-20 w-80 h-[430px] bg-gradient-to-br from-white/14 via-white/4 to-transparent rotate-[35deg] pointer-events-none z-40" />

          {/* ============================================================ */}
          {/* EXACT APPLE DYNAMIC ISLAND WITH FLUID EXPANSION              */}
          {/* ============================================================ */}
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
              {/* Left Side: TrueDepth Sensor / Face ID */}
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

              {/* Center Activity Element */}
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

              {/* Right Side: TrueDepth Camera with Sapphire Lens Glint */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#030611] border border-[#1e293b]/90 flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#020308]" />
                {/* Blue/Violet Lens Coating Glint */}
                <div className="w-1 h-1 rounded-full bg-blue-500/40 absolute top-[2px] right-[2px]" />
                {/* Specular White Highlight */}
                <div className="w-0.5 h-0.5 rounded-full bg-white/80 absolute top-[1.5px] right-[1.5px]" />
              </div>
            </motion.div>
          </div>

          {/* 1. Native iPhone Status Bar (Symmetrically Flanking Dynamic Island) */}
          <div className="pt-2.5 px-6 sm:px-7 pb-1 flex items-center justify-between z-30 relative select-none shrink-0 bg-transparent">
            {/* Top Left: On Lock Screen, shows Carrier 'Jio 5G'; Inside App, shows Time '9:41' */}
            {phoneStep === -1 ? (
              <span className="text-[12px] font-semibold font-sans tracking-tight text-white/95 drop-shadow-sm flex items-center gap-1 min-w-[40px]">
                Jio 5G
              </span>
            ) : (
              <span className="text-[13px] font-semibold font-sans tracking-tight text-slate-900 min-w-[40px]">
                {currentTime}
              </span>
            )}

            {/* Empty Center Space: Guarantees Dynamic Island Clearance */}
            <div className="w-[126px] h-[34px] pointer-events-none" />

            {/* Top Right: Native iOS Status Icons (Cellular, WiFi, Battery) */}
            <div
              className={`flex items-center gap-1.5 transition-colors duration-300 ${
                phoneStep === -1 ? 'text-white' : 'text-slate-900'
              }`}
            >
              {/* iPhone 4-Bar Cellular Signal */}
              <div className="flex items-end gap-[1.5px] h-[11px] pb-[0.5px]">
                <span
                  className={`w-[2.5px] h-[3.5px] rounded-[0.8px] ${
                    phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                  }`}
                />
                <span
                  className={`w-[2.5px] h-[5.5px] rounded-[0.8px] ${
                    phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                  }`}
                />
                <span
                  className={`w-[2.5px] h-[7.5px] rounded-[0.8px] ${
                    phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                  }`}
                />
                <span
                  className={`w-[2.5px] h-[9.5px] rounded-[0.8px] ${
                    phoneStep === -1 ? 'bg-white shadow-xs' : 'bg-slate-900'
                  }`}
                />
              </div>

              {/* iPhone WiFi Icon */}
              <Wifi
                className={`w-[13.5px] h-[13.5px] stroke-[2.4] ${
                  phoneStep === -1 ? 'text-white' : 'text-slate-900'
                }`}
              />

              {/* Authentic iPhone Battery Capsule with Percentage INSIDE */}
              <div className="flex items-center pl-0.5">
                <svg
                  width="26"
                  height="13"
                  viewBox="0 0 25 12"
                  className="overflow-visible select-none"
                >
                  {/* Outer Capsule Border */}
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

                  {/* Terminal Tip */}
                  <path
                    d="M 23 4.2 C 23.8 4.2 24.2 4.6 24.2 5.2 L 24.2 6.8 C 24.2 7.4 23.8 7.8 23 7.8 Z"
                    fill={phoneStep === -1 ? '#ffffff' : '#0f172a'}
                    fillOpacity={phoneStep === -1 ? '0.7' : '0.4'}
                  />

                  {/* Inner Battery Fill Level */}
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

                  {/* Percentage Text or Charging Bolt */}
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

          {/* 2. Mobile App Screen Content Router */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {isReportSubmitted ? (
              <div className="p-4 flex-1 flex flex-col">
                <MobileReportVerification />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* ========================================================= */}
                {/* SCREEN -1: EXACT IPHONE LOCK SCREEN (INDIAN FLAG)         */}
                {/* ========================================================= */}
                {phoneStep === -1 && (
                  <motion.div
                    key="phone-lock-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={screenTransition}
                    onClick={() => {
                      if (audioEngine) audioEngine.playUiChirp(1200)
                      setPhoneStep(0)
                    }}
                    className="absolute inset-0 -top-12 -bottom-2 w-full h-[calc(100%+56px)] flex flex-col justify-between pt-16 pb-4 px-3.5 cursor-pointer select-none z-10 bg-[#488bc6]"
                  >
                    {/* Indian Flag Wallpaper (Edge-to-Edge Bleed with Contrast Vignette) */}
                    <div className="absolute inset-0 w-full h-full bg-[#488bc6] flex items-center justify-center overflow-hidden z-0 pointer-events-none">
                      <img
                        src="/textures/indian_flag_wallpaper.png"
                        alt="Indian Flag Wallpaper"
                        className="w-full h-full object-contain object-center scale-[1.32] translate-y-2 select-none"
                      />
                    </div>

                    {/* Authentic iOS Gradient Vignette for Razor-Sharp Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60 pointer-events-none z-0" />

                    {/* Exact iOS Lock Screen Header: Lock Icon, Date & Huge iOS Clock */}
                    <div className="relative z-10 flex flex-col items-center pt-3 text-center pointer-events-none">
                      <div className="flex items-center gap-1 text-white/95 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                        <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <p className="text-[13.5px] font-medium text-white/95 tracking-tight font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                        {currentDate}
                      </p>
                      <h1 className="text-[70px] sm:text-[76px] font-bold text-white tracking-tight font-sans leading-none drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] my-1 select-none">
                        {currentTime}
                      </h1>
                    </div>

                    {/* Spacer: Keeps Center Flag Clear */}
                    <div className="flex-1" />

                    {/* Bottom Area: Clean iOS Live Activity & Home Indicator */}
                    <div className="relative z-10 flex flex-col gap-3 pt-1 pb-1">
                      {/* Slim iOS Live Activity Notification Pill */}
                      <div className="w-full bg-black/45 hover:bg-black/60 backdrop-blur-2xl border border-white/25 rounded-2xl px-3.5 py-2.5 shadow-2xl text-left transition-all active:scale-[0.99] cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-md overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-2xs">
                              <img
                                src="/textures/KWI_LOGO.jpeg"
                                alt="KWI Logo"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <span className="text-[11.5px] font-bold text-white tracking-tight block leading-tight">
                                KWI Waterlogging Grid Active
                              </span>
                              <span className="text-[10px] text-white/85 block leading-tight mt-0.5">
                                Tap anywhere to unlock & report
                              </span>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-mono text-white/70">now</span>
                        </div>
                      </div>

                      {/* Swipe Up Unlock Text & Apple Home Indicator */}
                      <div className="flex flex-col items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] font-semibold text-white/90 tracking-wide flex items-center gap-1 drop-shadow-sm font-sans">
                          Swipe up to open <ChevronUp className="w-3.5 h-3.5 text-white/90" />
                        </span>
                        {/* Apple Home Indicator */}
                        <div className="w-36 h-[4.5px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================= */}
                {/* SCREEN 1: WELCOME SCREEN (CLEAN, SPACIOUS, CALM)          */}
                {/* ========================================================= */}
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
                      {/* Top Brand Header with Real Website Logo & Lock Button */}
                      <div className="flex items-center justify-between mb-4 pt-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
                            <img
                              src="/textures/KWI_LOGO.jpeg"
                              alt="KWI Logo"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                          <div>
                            <span className="text-[12px] font-bold text-slate-900 tracking-[0.08em] block leading-tight font-sans">
                              KWI
                            </span>
                            <span className="text-[10.5px] text-slate-500 font-medium block leading-tight mt-0.5">
                              Kolkata Water Intelligence
                            </span>
                          </div>
                        </div>

                        {/* Lock Screen Shortcut Button */}
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

                      {/* Main Confident Heading */}
                      <div className="mb-2">
                        <h2 className="text-[25px] sm:text-[27px] font-extrabold text-slate-950 tracking-tight leading-[1.15] font-sans">
                          Hello & Welcome<br />to our app
                        </h2>
                        <p className="text-[13px] text-slate-500 mt-2 leading-relaxed max-w-[260px]">
                          Help Kolkata identify waterlogging and respond faster.
                        </p>
                      </div>
                    </div>

                    {/* 2. Center Card: KOLKATA LIVE WATER NETWORK BLUEPRINT (Static & Crisp) */}
                    <div className="my-auto py-1">
                      {/* Blueprint Container Box */}
                      <div className="w-full h-[178px] rounded-2xl bg-gradient-to-b from-blue-50/80 via-white to-blue-50/40 border border-blue-200/90 p-3 flex flex-col justify-between relative shadow-2xs overflow-hidden">
                        {/* Blueprint Grid Background Pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f033_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f033_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                        {/* Top Card Label: KOLKATA */}
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

                        {/* Center Water Network Map (Hooghly River & Canal Nodes - Static & Clean) */}
                        <div className="relative flex-1 flex items-center justify-center my-0.5 z-10">
                          <svg
                            viewBox="0 0 240 100"
                            className="w-full h-full overflow-visible select-none"
                          >
                            {/* Gradient Definitions */}
                            <defs>
                              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                <stop offset="50%" stopColor="#2563eb" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.5" />
                              </linearGradient>
                            </defs>

                            {/* Stylized Hooghly River S-Curve */}
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

                            {/* Hooghly River Label & Wave Icon */}
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

                            {/* Canal Drainage Lines & Sensor Interconnections */}
                            {/* Horizontal Canal Branch (•───╲──•) */}
                            <line
                              x1="45"
                              y1="55"
                              x2="175"
                              y2="55"
                              stroke="#93c5fd"
                              strokeWidth="1.8"
                              strokeDasharray="2 2"
                            />
                            {/* Diagonal Drainage Outfall */}
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

                            {/* Telemetry Sensor Nodes (•) */}
                            {/* Node 1 */}
                            <circle cx="45" cy="55" r="4.5" fill="#2563eb" />
                            <circle cx="45" cy="55" r="2" fill="#ffffff" />

                            {/* Node 2 (Center River Junction) */}
                            <circle cx="105" cy="60" r="5" fill="#1d4ed8" />
                            <circle cx="105" cy="60" r="2" fill="#ffffff" />

                            {/* Node 3 */}
                            <circle cx="175" cy="55" r="4.5" fill="#2563eb" />
                            <circle cx="175" cy="55" r="2" fill="#ffffff" />

                            {/* Node 4 (South Outfall) */}
                            <circle cx="170" cy="82" r="4" fill="#3b82f6" />
                            <circle cx="170" cy="82" r="1.8" fill="#ffffff" />

                            {/* Canal Label */}
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

                        {/* Bottom Mini Metrics */}
                        <div className="flex items-center justify-between pt-1 border-t border-blue-100/80 text-[9px] font-mono text-slate-500 z-10">
                          <span className="flex items-center gap-1 font-semibold text-blue-700">
                            <Droplets className="w-3 h-3 text-blue-600" />
                            TELEMETRY READY
                          </span>
                          <span className="font-bold text-slate-700">32 GAUGES</span>
                        </div>
                      </div>

                      {/* Subcaption Badge: LIVE WATER NETWORK */}
                      <div className="flex items-center justify-center gap-1.5 mt-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                        <span className="text-[11px] font-bold font-mono tracking-[0.14em] text-blue-900 uppercase">
                          LIVE WATER NETWORK
                        </span>
                      </div>
                    </div>

                    {/* Bottom CTA & Progress Dots */}
                    <div className="pt-1 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (audioEngine) audioEngine.playUiChirp(1050)
                          setPhoneStep(1)
                        }}
                        className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-[14px] transition-all cursor-pointer shadow-xs flex items-center justify-center font-sans tracking-wide"
                      >
                        GET STARTED
                      </button>

                      {/* Screen Indicator Dots: Step 1 Active */}
                      <div className="flex justify-center items-center gap-1.5 mt-3">
                        <span className="w-4 h-1.5 rounded-full bg-blue-600 transition-all" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================= */}
                {/* SCREEN 1: REPORT FORM (DIRECT REPORTING PAGE)             */}
                {/* ========================================================= */}
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

          {/* 3. Bottom Home Indicator Bar (Only on In-App Screens) */}
          {phoneStep !== -1 && (
            <div className="py-2 bg-white flex justify-center shrink-0">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default MobileReportPhone

