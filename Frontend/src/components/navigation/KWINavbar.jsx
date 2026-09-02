import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUpRight, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'CITY', label: 'CITY' },
  { key: 'INCIDENTS', label: 'INCIDENTS' },
  { key: 'FORECAST', label: 'FORECAST' },
  { key: 'SIMULATE', label: 'SIMULATE' },
  { key: 'REPORTS', label: 'REPORTS' },
  { key: 'ACTIONS', label: 'ACTIONS' },
]

export function KWINavbar() {
  const [activeSection, setActiveSection] = useState('CITY')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (key) => {
    setActiveSection(key)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <style>{`
        @keyframes kwi-shift-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .kwi-gradient-line {
          background: linear-gradient(
            90deg,
            rgba(244,63,94,0) 0%,
            rgba(244,63,94,0.45) 15%,
            rgba(245,158,11,0.4) 35%,
            rgba(16,185,129,0.45) 55%,
            rgba(6,182,212,0.5) 75%,
            rgba(99,102,241,0.45) 90%,
            rgba(99,102,241,0) 100%
          );
          background-size: 200% 100%;
          animation: kwi-shift-gradient 10s ease infinite;
        }
        .kwi-btn-gradient-border {
          background: linear-gradient(135deg, rgba(244,63,94,0.5), rgba(245,158,11,0.4), rgba(16,185,129,0.45), rgba(6,182,212,0.55));
          background-size: 200% 200%;
          animation: kwi-shift-gradient 8s ease infinite;
        }
      `}</style>

      {/* Floating Precision Command Navigation Bar */}
      <header
        role="banner"
        className={`fixed left-0 w-full z-40 px-3 sm:px-5 md:px-8 pointer-events-none transition-all duration-300 ${
          scrolled ? 'top-2.5 sm:top-3' : 'top-3 sm:top-5'
        }`}
      >
        <div className="max-w-[1280px] mx-auto">
          <nav
            aria-label="Kolkata Water Intelligence Navigation"
            className="pointer-events-auto relative flex items-center justify-between px-4 sm:px-6 lg:px-7 py-2.5 sm:py-3 rounded-2xl bg-[#070a10]/70 backdrop-blur-xl text-white transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.08] overflow-hidden"
          >
            {/* 1. LEFT: Pure Typography Brand Identity (Zero logos/icons) */}
            <div className="flex items-center gap-3 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => handleNavClick('CITY')}
                className="flex flex-col text-left group focus:outline-none focus:ring-1 focus:ring-cyan-400/40 p-1 rounded-lg transition-colors cursor-pointer select-none"
                title="Kolkata Water Intelligence"
              >
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-400 font-sans group-hover:text-neutral-300 transition-colors">
                    KOLKATA WATER
                  </span>
                  <span className="text-xs sm:text-sm font-bold tracking-[0.12em] uppercase text-neutral-100 font-sans">
                    INTELLIGENCE
                  </span>
                </div>

                {/* Clean Editorial Subtitle */}
                <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                  <span className="text-[9px] font-mono font-semibold tracking-wider text-emerald-400 uppercase">
                    LIVE CITY
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500 hidden xl:inline">
                    // KMC-GIS COMMAND
                  </span>
                </div>
              </button>
            </div>

            {/* 2. CENTER: Clean Editorial Navigation */}
            <div className="hidden lg:flex flex-col items-center relative px-2 z-10">
              <ul className="flex items-center gap-1 xl:gap-2 relative z-10 m-0 p-0 list-none">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.key
                  return (
                    <li key={item.key} className="relative">
                      <button
                        type="button"
                        onClick={() => handleNavClick(item.key)}
                        className={`relative px-3.5 py-1.5 text-xs tracking-[0.12em] uppercase font-sans transition-all duration-150 rounded-lg cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-cyan-400/30 ${
                          isActive
                            ? 'text-neutral-100 font-semibold bg-white/[0.06]'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03] font-medium'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="relative z-10">{item.label}</span>

                        {/* Active Accent Indicator (Soft Cyan Glow Underline) */}
                        {isActive && (
                          <motion.div
                            layoutId="kwi-signature-indicator"
                            className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400/90 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.18 }}
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* 3. RIGHT: Ask Kolkata & Admin Status */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
              {/* ASK KOLKATA Gradient Border Button */}
              <div className="hidden sm:block relative p-[1px] rounded-lg kwi-btn-gradient-border group">
                <button
                  type="button"
                  className="relative flex items-center gap-1.5 px-3.5 py-1.5 bg-[#070a10]/90 hover:bg-[#070a10]/60 text-neutral-200 hover:text-white rounded-[7px] text-xs font-sans font-semibold tracking-wider transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
                  aria-label="Ask Kolkata Action"
                >
                  <span>ASK KOLKATA</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                </button>
              </div>

              {/* ADMIN ONLINE with Semantic Green Dot & Halo Glow */}
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-mono font-medium tracking-wider text-neutral-400">
                    ADMIN
                  </span>
                  <span className="text-[8px] font-mono font-semibold text-emerald-400 tracking-wider mt-0.5">
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Mobile/Tablet Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            {/* Bottom Animated Gradient Edge Sampling Artwork Hues */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[1.5px] kwi-gradient-line pointer-events-none"
              aria-hidden="true"
            />
          </nav>
        </div>
      </header>

      {/* Mobile Drawer (Clean Dark Translucent Panel) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex flex-col justify-end p-3 sm:p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.18 }}
              className="w-full max-w-lg mx-auto bg-[#070a10]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden"
              role="dialog"
              aria-label="Mobile Navigation"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider uppercase text-neutral-100 font-sans">
                    KOLKATA WATER INTELLIGENCE
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] font-mono text-emerald-400">
                      LIVE CITY // ADMIN ONLINE
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleNavClick(item.key)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-sans tracking-wider uppercase font-semibold transition-all ${
                        isActive
                          ? 'bg-white/[0.08] border border-cyan-400/30 text-white shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                          : 'bg-white/[0.03] border border-white/[0.07] text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 sm:hidden">
                <div className="relative p-[1px] rounded-xl kwi-btn-gradient-border">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 bg-[#070a10]/90 hover:bg-[#070a10]/60 text-white rounded-[11px] text-xs font-sans font-semibold tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>ASK KOLKATA</span>
                    <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Drawer Bottom Accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[1.5px] kwi-gradient-line pointer-events-none"
                aria-hidden="true"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default KWINavbar


