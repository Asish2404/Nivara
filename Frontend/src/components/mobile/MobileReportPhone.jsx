import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Signal, Wifi, MapPin, Droplets, ChevronLeft, Zap, Lock, Flashlight, Camera, ChevronUp } from 'lucide-react'
import gsap from 'gsap'
import { useKWIStore } from '../../store/useKWIStore'
import { audioEngine } from '../../utils/audioEngine'
import { MobileReportForm } from './MobileReportForm'
import { MobileReportVerification } from './MobileReportVerification'

export function MobileReportPhone() {
  const { isReportSubmitted } = useKWIStore()
  const phoneContainerRef = useRef(null)
  const beaconRef = useRef(null)
  const ripple1Ref = useRef(null)
  const ripple2Ref = useRef(null)
  const ripple3Ref = useRef(null)

  // -1: Lock Screen with Indian Flag Wallpaper, 0: Welcome Screen, 1: Report Your Problem, 2: Existing Report Form
  const [phoneStep, setPhoneStep] = useState(-1)
  const [flashlightOn, setFlashlightOn] = useState(false)

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

  // 3. GSAP Realistic Micro-Animations & Interactive Parallax (No Up-Down Bobbing)
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Atmospheric ambient breathing glow behind phone
      if (phoneContainerRef.current) {
        gsap.to(phoneContainerRef.current, {
          boxShadow: '0 30px 70px -15px rgba(37, 99, 235, 0.18), 0 12px 30px -8px rgba(15, 23, 42, 0.15)',
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }

      // Organic radar sonar expansion on Kolkata pin
      if (ripple1Ref.current && ripple2Ref.current && ripple3Ref.current) {
        gsap.to(ripple1Ref.current, {
          scale: 1.25,
          opacity: 0.15,
          duration: 2.2,
          repeat: -1,
          ease: 'power2.out',
        })
        gsap.to(ripple2Ref.current, {
          scale: 1.35,
          opacity: 0.1,
          duration: 2.2,
          repeat: -1,
          delay: 0.6,
          ease: 'power2.out',
        })
        gsap.to(ripple3Ref.current, {
          scale: 1.45,
          opacity: 0.05,
          duration: 2.2,
          repeat: -1,
          delay: 1.2,
          ease: 'power2.out',
        })
      }

      // Soft radar pulse on location beacon
      if (beaconRef.current) {
        gsap.to(beaconRef.current, {
          scale: 1.04,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
    })

    return () => ctx.revert()
  }, [phoneStep])

  // Interactive smooth GSAP micro-tilt on mouse move (Silk-smooth physics)
  const handleMouseMove = (e) => {
    if (!phoneContainerRef.current) return
    const rect = phoneContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    gsap.to(phoneContainerRef.current, {
      rotationY: (x / rect.width) * 6,
      rotationX: -(y / rect.height) * 6,
      ease: 'power2.out',
      duration: 0.6,
      transformPerspective: 1000,
      transformOrigin: 'center center',
    })
  }

  const handleMouseLeave = () => {
    if (!phoneContainerRef.current) return
    gsap.to(phoneContainerRef.current, {
      rotationY: 0,
      rotationX: 0,
      ease: 'power2.out',
      duration: 0.9,
    })
  }

  const screenTransition = {
    duration: 0.28,
    ease: [0.16, 1, 0.3, 1],
  }

  return (
    <div 
      className="w-full flex justify-center py-4 select-none perspective-[1200px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Phone Hardware Mockup Shell */}
      <motion.div
        ref={phoneContainerRef}
        data-phone-mockup="true"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-[310px] sm:w-[325px] h-[620px] rounded-[48px] bg-[#18181b] p-[9px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.22),0_10px_25px_-5px_rgba(15,23,42,0.1)] ring-1 ring-slate-800/80 flex flex-col justify-between relative will-change-transform"
      >
        {/* Physical Side Buttons (Titanium Finish) - Power Button clicks to lock/unlock */}
        <div className="absolute -left-[11px] top-24 w-[3.5px] h-9 bg-slate-700 rounded-l-xs shadow-xs pointer-events-none" />
        <div className="absolute -left-[11px] top-37 w-[3.5px] h-9 bg-slate-700 rounded-l-xs shadow-xs pointer-events-none" />
        <button
          type="button"
          title={phoneStep === -1 ? 'Unlock Phone' : 'Lock Phone'}
          onClick={() => {
            if (audioEngine) audioEngine.playUiChirp(phoneStep === -1 ? 1200 : 700)
            setPhoneStep((prev) => (prev === -1 ? 0 : -1))
          }}
          className="absolute -right-[11px] top-28 w-[3.5px] h-14 bg-slate-600 hover:bg-slate-500 active:scale-95 rounded-r-xs shadow-xs cursor-pointer transition-all z-30"
        />

        {/* Screen Inner Bezel */}
        <div
          className={`w-full h-full rounded-[40px] overflow-hidden flex flex-col justify-between relative border border-slate-200/90 shadow-inner transition-colors duration-300 ${
            phoneStep === -1 ? 'bg-[#488bc6]' : 'bg-white'
          }`}
        >
          {/* 1. Dynamic Island & Native iPhone Status Bar (Floating transparently) */}
          <div className="pt-3 px-5 pb-1 flex items-center justify-between z-30 relative select-none shrink-0 bg-transparent">
            {/* Real Time Display (iPhone SF Pro style font) */}
            <span
              className={`text-[12px] font-bold font-sans tracking-tight min-w-[32px] transition-colors duration-300 ${
                phoneStep === -1 ? 'text-white drop-shadow-sm' : 'text-slate-900'
              }`}
            >
              {currentTime}
            </span>

            {/* Pill Dynamic Island */}
            <div className="w-20 h-[18px] bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-[#111] ring-1 ring-slate-800" />
              <div className="w-1 h-1 rounded-full bg-blue-900/60" />
            </div>

            {/* Native iPhone Status Icons */}
            <div
              className={`flex items-center gap-1.5 transition-colors duration-300 ${
                phoneStep === -1 ? 'text-white' : 'text-slate-900'
              }`}
            >
              {/* iPhone 4-Bar Cellular Signal */}
              <div className="flex items-end gap-[1.5px] h-[10px] pb-[0.5px]">
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
                className={`w-[12.5px] h-[12.5px] stroke-[2.4] ${
                  phoneStep === -1 ? 'text-white' : 'text-slate-900'
                }`}
              />

              {/* Authentic iPhone Battery Capsule with Percentage INSIDE */}
              <div className="flex items-center pl-0.5">
                <svg
                  width="25"
                  height="12"
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
                {/* SCREEN -1: AUTHENTIC IPHONE LOCK SCREEN (INDIAN FLAG)      */}
                {/* ========================================================= */}
                {phoneStep === -1 && (
                  <motion.div
                    key="phone-lock-screen"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      if (audioEngine) audioEngine.playUiChirp(1200)
                      setPhoneStep(0)
                    }}
                    className="absolute inset-0 -top-12 -bottom-2 w-full h-[calc(100%+56px)] flex flex-col justify-between pt-14 pb-4 px-3.5 cursor-pointer select-none z-10 bg-[#488bc6]"
                  >
                    {/* Indian Flag Wallpaper (Full Edge-to-Edge Bleed from Top Bezel to Bottom) */}
                    <div className="absolute inset-0 w-full h-full bg-[#488bc6] flex items-center justify-center overflow-hidden z-0 pointer-events-none">
                      <img
                        src="/textures/indian_flag_wallpaper.png"
                        alt="Indian Flag Wallpaper"
                        className="w-full h-full object-contain object-center scale-[1.28] translate-y-2 select-none"
                      />
                    </div>

                    {/* Subtle Sky Vignette for Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55 pointer-events-none z-0" />

                    {/* Flashlight beam simulation */}
                    {flashlightOn && (
                      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-0" />
                    )}

                    {/* Lock Screen Header: Lock Icon, Date & Big iOS Clock */}
                    <div className="relative z-10 flex flex-col items-center pt-2 text-center pointer-events-none">
                      <div className="flex items-center gap-1 text-white/95 mb-0.5 drop-shadow-sm">
                        <Lock className="w-3.5 h-3.5 stroke-[2.4]" />
                      </div>
                      <p className="text-[12px] font-semibold text-white/95 tracking-tight font-sans drop-shadow-sm">
                        {currentDate}
                      </p>
                      <h1 className="text-[52px] font-extrabold text-white tracking-tight font-sans leading-none drop-shadow-md my-0.5 select-none">
                        {currentTime}
                      </h1>
                    </div>

                    {/* Spacer: Keeps Center Flag 100% Clear and Unobstructed */}
                    <div className="flex-1" />

                    {/* Bottom Area: Slim iOS Notification + Quick Action Buttons */}
                    <div className="relative z-10 flex flex-col gap-2 pt-1 pb-0">
                      {/* Slim iOS Live Activity Notification Pill */}
                      <div className="w-full bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 shadow-lg text-left transition-all hover:bg-black/55">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md overflow-hidden bg-white flex items-center justify-center p-0.5">
                              <img
                                src="/textures/KWI_LOGO.jpeg"
                                alt="KWI Logo"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-white tracking-tight block leading-tight">
                                KWI Waterlogging Grid Active
                              </span>
                              <span className="text-[9.5px] text-white/80 block leading-tight">
                                Tap anywhere to unlock & report
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-white/70">now</span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="w-full flex items-center justify-between px-1">
                        {/* Flashlight Button */}
                        <button
                          type="button"
                          title="Toggle Flashlight"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFlashlightOn((v) => !v)
                            if (audioEngine) audioEngine.playUiChirp(800)
                          }}
                          className={`w-9.5 h-9.5 rounded-full backdrop-blur-md border border-white/30 flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 ${
                            flashlightOn
                              ? 'bg-white text-slate-900 ring-2 ring-white/60'
                              : 'bg-black/40 text-white hover:bg-black/60'
                          }`}
                        >
                          <Flashlight className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Camera Button */}
                        <button
                          type="button"
                          title="Open Camera"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (audioEngine) audioEngine.playUiChirp(1100)
                            setPhoneStep(0)
                          }}
                          className="w-9.5 h-9.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all shadow-md"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Swipe Up Unlock Text & Home Indicator */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10.5px] font-semibold text-white/90 tracking-wider flex items-center gap-1 drop-shadow-sm font-sans">
                          Swipe up to open <ChevronUp className="w-3.5 h-3.5 animate-bounce text-white" />
                        </span>
                        <div className="w-28 h-1 bg-white rounded-full shadow-xs" />
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
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================= */}
                {/* SCREEN 2: REPORT YOUR PROBLEM                             */}
                {/* ========================================================= */}
                {phoneStep === 1 && (
                  <motion.div
                    key="phone-step-1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={screenTransition}
                    className="p-4 flex flex-col justify-between h-full text-left"
                  >
                    <div>
                      {/* Subtle Back Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (audioEngine) audioEngine.playUiChirp(900)
                          setPhoneStep(0)
                        }}
                        className="text-[13px] font-semibold text-blue-600 flex items-center gap-1 cursor-pointer opacity-85 hover:opacity-100 mb-2 -mt-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>

                      {/* Top Brand Header */}
                      <div className="flex items-center gap-2.5 mb-3 pt-0.5">
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

                      {/* Section Heading */}
                      <div className="mb-4">
                        <h2 className="text-[23px] sm:text-[25px] font-extrabold text-slate-900 tracking-tight leading-tight font-sans">
                          Report Your Problem Here
                        </h2>
                        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                          Tell us what you're experiencing and help Kolkata respond faster.
                        </p>
                      </div>

                      {/* Clean Action Card */}
                      <div className="mt-4 p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 flex items-start gap-3.5 shadow-xs cursor-pointer transition-all">
                        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <Droplets className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[14px] font-bold text-slate-900 block leading-tight font-sans">
                            Report Waterlogging
                          </span>
                          <span className="text-[12px] text-slate-600 mt-0.5 block leading-normal">
                            Waterlogging, flooding or drainage issues
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA & Progress Dots */}
                    <div className="pt-2 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (audioEngine) audioEngine.playUiChirp(1050)
                          setPhoneStep(2)
                        }}
                        className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-[14px] transition-all cursor-pointer shadow-xs flex items-center justify-center font-sans"
                      >
                        CONTINUE
                      </button>

                      {/* Screen Indicator Dots: Step 2 Active */}
                      <div className="flex justify-center items-center gap-1.5 mt-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-all" />
                        <span className="w-4 h-1.5 rounded-full bg-blue-600 transition-all" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================= */}
                {/* SCREEN 3: EXISTING REPORT FORM                            */}
                {/* ========================================================= */}
                {phoneStep === 2 && (
                  <motion.div
                    key="phone-step-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={screenTransition}
                    className="flex-1 h-full flex flex-col p-4"
                  >
                    <MobileReportForm onBackToStep1={() => setPhoneStep(1)} />
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

