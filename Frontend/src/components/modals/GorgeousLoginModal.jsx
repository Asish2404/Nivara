import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Fingerprint,
  ShieldCheck,
  KeyRound,
  CreditCard,
  Building2,
  Cpu,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Radio,
  Lock,
  Eye,
  EyeOff,
  Terminal,
  ChevronRight,
  RefreshCw,
  LogOut,
  Sliders,
  Zap,
} from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { audioEngine } from '../../utils/audioEngine'

// Pre-configured official persona presets for rapid demoing & testing
const ROLES = [
  {
    id: 'kmc_officer',
    title: 'KMC Municipal Officer',
    badge: 'COMMAND CLEARANCE',
    icon: Building2,
    color: 'from-blue-600 via-cyan-500 to-teal-400',
    borderGlow: 'rgba(6, 182, 212, 0.4)',
    accentColor: '#00f0ff',
    desc: 'Drainage Department, Sluice Command & Pump Station Dispatch',
    defaultUser: {
      name: 'Officer Devjyoti Sen',
      role: 'Chief Drainage Officer',
      department: 'KMC Sewerage & Drainage Directorate',
      badgeId: 'KMC-DIR-7049',
      clearance: 'Level 4 // Command Clearance',
      initials: 'DS',
      wardAccess: 'All Boroughs (I - XVI)',
    },
  },
  {
    id: 'field_engineer',
    title: 'IoT Field Engineer',
    badge: 'TELEMETRY CLEARANCE',
    icon: Cpu,
    color: 'from-violet-600 via-purple-500 to-indigo-400',
    borderGlow: 'rgba(168, 85, 247, 0.4)',
    accentColor: '#a855f7',
    desc: 'Sensor Calibration, Lock Gates & Submersible Pump Fleet',
    defaultUser: {
      name: 'Priyanka Mukherjee',
      role: 'Lead Sensor Systems Engineer',
      department: 'KWI Real-time Telemetry Wing',
      badgeId: 'ENG-TELEMETRY-284',
      clearance: 'Level 3 // Systems Ops',
      initials: 'PM',
      wardAccess: 'Sector V & Central Boroughs',
    },
  },
  {
    id: 'citizen_verifier',
    title: 'Citizen Contributor',
    badge: 'COMMUNITY VERIFIED',
    icon: UserCheck,
    color: 'from-emerald-500 via-teal-500 to-cyan-400',
    borderGlow: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10b981',
    desc: 'Geo-Tagged Field Reports, Community Water-Watch & Alerts',
    defaultUser: {
      name: 'Anirban Chatterjee',
      role: 'Community Lead Reporter',
      department: 'Kolkata Citizen Water Watch',
      badgeId: 'CITIZEN-KOL-9182',
      clearance: 'Verified Citizen ID',
      initials: 'AC',
      wardAccess: 'Salt Lake & South Kolkata',
    },
  },
]

export function GorgeousLoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginUser, currentUser, navigate } = useKWIStore()

  const [selectedRole, setSelectedRole] = useState('kmc_officer')
  const [authMethod, setAuthMethod] = useState('biometric') // 'biometric' | 'smartcard' | 'passcode'

  // Biometric scanner state
  const [scanProgress, setScanProgress] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('READY') // 'READY' | 'SCANNING' | 'VERIFYING' | 'SUCCESS'
  const scanIntervalRef = useRef(null)

  // Passcode state
  const [pinDigits, setPinDigits] = useState(['8', '4', '2', '', '', ''])
  const [emailInput, setEmailInput] = useState('officer.sen@kmc.gov.in')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Smartcard tilt hover state
  const [cardHovered, setCardHovered] = useState(false)

  const activeRoleObj = ROLES.find((r) => r.id === selectedRole) || ROLES[0]

  useEffect(() => {
    if (!isLoginModalOpen) {
      // Reset scanner on close
      clearInterval(scanIntervalRef.current)
      setIsScanning(false)
      setScanProgress(0)
      setScanStatus('READY')
      setIsAuthenticating(false)
    } else {
      audioEngine.playUiChirp(1050)
    }
  }, [isLoginModalOpen])

  if (!isLoginModalOpen) return null

  // Biometric scan handler
  const handleStartBiometricScan = () => {
    if (isScanning || scanStatus === 'SUCCESS') return

    audioEngine.playUiChirp(840)
    setIsScanning(true)
    setScanStatus('SCANNING')
    setScanProgress(5)

    let progress = 5
    scanIntervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current)
        setScanProgress(100)
        setScanStatus('VERIFYING')
        audioEngine.playUiChirp(1200)

        setTimeout(() => {
          setScanStatus('SUCCESS')
          audioEngine.playStationLock()

          setTimeout(() => {
            loginUser(activeRoleObj.defaultUser)
          }, 800)
        }, 600)
      } else {
        setScanProgress(progress)
        audioEngine.playUiChirp(600 + progress * 6)
      }
    }, 140)
  }

  // Quick Direct Smart Card Auth
  const handleSmartCardAuth = () => {
    setIsAuthenticating(true)
    audioEngine.playUiChirp(980)
    setTimeout(() => {
      audioEngine.playStationLock()
      setIsAuthenticating(false)
      loginUser(activeRoleObj.defaultUser)
    }, 1100)
  }

  // Passcode submit handler
  const handlePasscodeSubmit = (e) => {
    e.preventDefault()
    setIsAuthenticating(true)
    audioEngine.playUiChirp(920)
    setTimeout(() => {
      audioEngine.playStationLock()
      setIsAuthenticating(false)
      loginUser({
        ...activeRoleObj.defaultUser,
        email: emailInput,
      })
    }, 900)
  }

  // Quick fill demo credentials
  const handleQuickDemoFill = (roleId) => {
    setSelectedRole(roleId)
    const role = ROLES.find((r) => r.id === roleId)
    if (roleId === 'kmc_officer') {
      setEmailInput('officer.sen@kmc.gov.in')
      setPinDigits(['8', '4', '2', '0', '9', '1'])
    } else if (roleId === 'field_engineer') {
      setEmailInput('priyanka.eng@kwi.wb.gov.in')
      setPinDigits(['9', '1', '7', '4', '3', '0'])
    } else {
      setEmailInput('citizen.anirban@kolkata.org')
      setPinDigits(['5', '5', '8', '2', '1', '0'])
    }
    audioEngine.playUiChirp(1150)
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Backdrop Glass Blur & Ambient Vignette */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeLoginModal}
        className="fixed inset-0 bg-[#02050f]/80 backdrop-blur-xl"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0.9) 70%, #000 100%)',
        }}
      />

      {/* 2. Main Holographic Login Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#091124]/95 via-[#060b18]/98 to-[#03060e] border border-cyan-500/30 rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_60px_rgba(0,240,255,0.18)] p-6 sm:p-8 text-white overflow-hidden z-10 backdrop-blur-3xl font-sans my-auto"
      >
        {/* Animated Conic Rim Ambient Beam */}
        <div
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] pointer-events-none opacity-20 animate-[spin_18s_linear_infinite]"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, transparent 0deg, #00f0ff 60deg, #3b82f6 120deg, transparent 180deg, #a855f7 240deg, transparent 360deg)',
          }}
        />

        {/* Tactical Corner HUD Brackets */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-md pointer-events-none" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-md pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/50 rounded-bl-md pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/50 rounded-br-md pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            audioEngine.playUiChirp(700)
            closeLoginModal()
          }}
          className="absolute top-6 right-6 p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer z-20 group"
          aria-label="Close Login Modal"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* ===================================================== */}
        {/* HEADER: Municipal Shield & Secure Telemetry Title     */}
        {/* ===================================================== */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-blue-600/30 to-indigo-600/40 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <ShieldCheck className="w-5 h-5 text-cyan-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-cyan-400">
                  KOLKATA MUNICIPAL SECURE ACCESS
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  AES-256 GCM
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                KWI Command Portal Sign In
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-lg">
            Authorized entry point for KMC Drainage Directors, Sluice Operators, Field Engineers, and Verified Citizen Reporters.
          </p>
        </div>

        {/* ===================================================== */}
        {/* ROLE PERSONA SWITCHER TABS                            */}
        {/* ===================================================== */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Select Access Persona</span>
            <span className="text-[10px] text-cyan-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> One-Click Preset Switching
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id
              const RoleIcon = role.icon
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleQuickDemoFill(role.id)}
                  className={`relative p-2.5 sm:p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${isSelected
                      ? `bg-gradient-to-b from-cyan-950/50 to-blue-950/40 border-cyan-400 shadow-[0_0_20px_${role.borderGlow}]`
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8 text-slate-400'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                          : 'bg-white/5 text-slate-400'
                        }`}
                    >
                      <RoleIcon className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block leading-tight ${isSelected ? 'text-white' : 'text-slate-300'
                        }`}
                    >
                      {role.title}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400/90 block mt-0.5 truncate">
                      {role.badge}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ===================================================== */}
        {/* AUTHENTICATION METHOD SELECTOR (Biometric / Card / PIN) */}
        {/* ===================================================== */}
        <div className="relative z-10 mt-5">
          <div className="flex items-center justify-center p-1 bg-black/50 border border-white/10 rounded-2xl max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('biometric')
                audioEngine.playUiChirp(820)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${authMethod === 'biometric'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Biometric Scan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('smartcard')
                audioEngine.playUiChirp(860)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${authMethod === 'smartcard'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Smart Pass NFC</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('passcode')
                audioEngine.playUiChirp(900)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${authMethod === 'passcode'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Matrix Key</span>
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* TAB 1: BIOMETRIC NEURAL SCANNER                       */}
        {/* ===================================================== */}
        {authMethod === 'biometric' && (
          <div className="relative z-10 mt-6 flex flex-col items-center justify-center py-4 px-2">
            {/* Interactive Scanner Core */}
            <div className="relative flex flex-col items-center">
              <button
                type="button"
                onClick={handleStartBiometricScan}
                disabled={isScanning || scanStatus === 'SUCCESS'}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 flex items-center justify-center cursor-pointer transition-all duration-300 group ${scanStatus === 'SUCCESS'
                    ? 'border-2 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)] bg-emerald-950/40'
                    : isScanning
                      ? 'border-2 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.6)] bg-cyan-950/40 scale-105'
                      : 'border-2 border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.35)] bg-black/60 hover:scale-102'
                  }`}
              >
                {/* Sonar Ripple Rings when scanning */}
                {isScanning && (
                  <>
                    <span className="absolute inset-0 rounded-3xl border border-cyan-400 animate-ping opacity-60 pointer-events-none" />
                    <span className="absolute -inset-3 rounded-3xl border border-blue-400 animate-pulse opacity-40 pointer-events-none" />
                  </>
                )}

                {/* Laser Scanning Bar */}
                {isScanning && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#00f0ff] z-20 pointer-events-none"
                  />
                )}

                {/* Icon inside Pad */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  {scanStatus === 'SUCCESS' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-emerald-400 flex flex-col items-center"
                    >
                      <CheckCircle2 className="w-12 h-12 mb-1 drop-shadow-[0_0_10px_#10b981]" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300">
                        MATCH VERIFIED
                      </span>
                    </motion.div>
                  ) : (
                    <>
                      <Fingerprint
                        className={`w-12 h-12 transition-colors ${isScanning
                            ? 'text-cyan-300 drop-shadow-[0_0_15px_#00f0ff]'
                            : 'text-slate-400 group-hover:text-cyan-400'
                          }`}
                      />
                      <span className="text-[10px] font-mono tracking-widest text-slate-400 group-hover:text-cyan-300 mt-1 uppercase">
                        {isScanning ? `${scanProgress}%` : 'TAP TO SCAN'}
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Dermal Status Feedback */}
              <div className="mt-4 text-center">
                <div className="text-xs font-semibold text-white">
                  {scanStatus === 'READY' && 'Place finger or click scanner to verify officer identity'}
                  {scanStatus === 'SCANNING' && 'Analyzing dermal ridge patterns & encrypted token...'}
                  {scanStatus === 'VERIFYING' && 'Connecting to KMC Sluice & Drainage Registry...'}
                  {scanStatus === 'SUCCESS' && `Welcome, ${activeRoleObj.defaultUser.name}! Logging in...`}
                </div>
                <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
                  ID: {activeRoleObj.defaultUser.badgeId} • {activeRoleObj.defaultUser.clearance}
                </div>
              </div>

              {/* Simulated Progress Bar */}
              {isScanning && (
                <div className="w-64 h-1.5 bg-black/60 rounded-full mt-3 overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 shadow-[0_0_8px_#00f0ff]"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 2: HOLOGRAPHIC SMART PASS / NFC CARD              */}
        {/* ===================================================== */}
        {authMethod === 'smartcard' && (
          <div className="relative z-10 mt-6 flex flex-col items-center">
            {/* 3D Holographic Card Preview */}
            <div
              onMouseEnter={() => setCardHovered(true)}
              onMouseLeave={() => setCardHovered(false)}
              className="relative w-full max-w-sm h-48 rounded-3xl p-5 border border-cyan-400/40 bg-gradient-to-br from-[#0e1e38] via-[#09152b] to-[#040915] shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.15)] overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Refractive Sheen Foil Effect */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none transition-transform duration-700"
                style={{
                  background:
                    'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) 45%, rgba(0,240,255,0.4) 55%, transparent 80%)',
                  transform: cardHovered ? 'translateX(100%)' : 'translateX(-100%)',
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
                    WB
                  </div>
                  <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">
                    GOVT OF WEST BENGAL
                  </span>
                </div>
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>

              {/* Gold Chip & Contactless Emblem */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border border-amber-200/60 shadow-inner flex items-center justify-center">
                  <div className="w-full h-[1px] bg-amber-800/40" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">NFC ENCRYPTED</span>
              </div>

              {/* Officer Data */}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-sm font-bold text-white tracking-wide">
                    {activeRoleObj.defaultUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300">
                    {activeRoleObj.defaultUser.role}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    {activeRoleObj.defaultUser.badgeId}
                  </div>
                </div>

                <div className="text-2xl select-none">{activeRoleObj.defaultUser.avatar}</div>
              </div>
            </div>

            {/* Smartcard Tap CTA */}
            <button
              type="button"
              onClick={handleSmartCardAuth}
              disabled={isAuthenticating}
              className="w-full max-w-sm mt-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.7)] transition-all cursor-pointer active:scale-[0.98]"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Syncing NFC Credentials...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 text-black" />
                  <span>Tap Digital ID to Sign In</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 3: MATRIX PASSCODE / MAGIC CREDENTIALS            */}
        {/* ===================================================== */}
        {authMethod === 'passcode' && (
          <form onSubmit={handlePasscodeSubmit} className="relative z-10 mt-6 space-y-4 max-w-md mx-auto">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Official Municipal Email</span>
                <span className="text-[10px] text-cyan-400">Gov SSO Verified</span>
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="officer.name@kmc.gov.in"
                className="w-full px-4 py-2.5 bg-black/60 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>6-Digit Matrix Security Token</span>
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isPasswordVisible ? 'Mask' : 'Reveal'}</span>
                </button>
              </label>

              <div className="grid grid-cols-6 gap-2">
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    type={isPasswordVisible ? 'text' : 'password'}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value
                      const updated = [...pinDigits]
                      updated[index] = val
                      setPinDigits(updated)
                    }}
                    className="w-full h-11 text-center bg-black/60 border border-cyan-500/30 rounded-xl text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_30px_rgba(0,240,255,0.65)] transition-all cursor-pointer active:scale-[0.98] mt-2"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Validating Matrix Key...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Grid</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ===================================================== */}
        {/* FOOTER: Security Registry & 3D Stage Switcher         */}
        {/* ===================================================== */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KMC Central Sluice Telemetry Online</span>
          </div>

          <button
            type="button"
            onClick={() => {
              closeLoginModal();
              navigate('/login');
            }}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-[10px] bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>Open 3D Interactive AI-Unleashed Stage &rarr;</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default GorgeousLoginModal
