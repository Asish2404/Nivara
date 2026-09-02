import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  Cpu,
  Globe2,
  ShieldCheck,
  Zap,
  Bot,
  Layers,
  Terminal,
  FileText,
  Code2,
  Users,
  ExternalLink,
  Menu,
  X,
  Lock,
  Compass,
} from 'lucide-react'

// Rich Dropdown Menus Data
const PRODUCT_ITEMS = [
  {
    title: 'Neural Swarm v3.8',
    desc: 'Distributed multi-agent orchestration across edge nodes',
    icon: Bot,
    badge: 'NEW',
    badgeColor: 'cyan',
  },
  {
    title: 'Planetary Compute Engine',
    desc: 'Sub-millisecond global AI routing and inference',
    icon: Globe2,
  },
  {
    title: 'Zero-Knowledge Security',
    desc: 'Cryptographic isolation with hardware-level enclaves',
    icon: ShieldCheck,
  },
  {
    title: 'Autonomous API & Telemetry',
    desc: 'High-throughput stream processing with live metrics',
    icon: Zap,
  },
]

const SOLUTIONS_ITEMS = [
  {
    title: 'Autonomous AI Teams',
    desc: 'Deploy resilient AI agents that execute complex workflows',
    icon: Cpu,
  },
  {
    title: 'Enterprise Architecture',
    desc: 'Private VPC deployments with dedicated GPU clusters',
    icon: Layers,
    badge: 'ENTERPRISE',
    badgeColor: 'violet',
  },
  {
    title: 'Scientific & Research Labs',
    desc: 'Accelerated simulations and mathematical discovery',
    icon: Compass,
  },
]

const RESOURCES_ITEMS = [
  {
    title: 'Documentation',
    desc: 'Quickstart guides, architecture specs, and SDK docs',
    icon: FileText,
  },
  {
    title: 'API Reference',
    desc: 'Interactive REST & WebSocket endpoint playground',
    icon: Code2,
  },
  {
    title: 'Developer Community',
    desc: 'Join 14,000+ AI researchers and systems engineers',
    icon: Users,
    external: true,
  },
]

export function SaaSNavbar({ onOpenGetStarted, onOpenLogin }) {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  const navRef = useRef(null)
  const timeoutRef = useRef(null)

  // Scroll detection to adjust glass intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleMouseEnter = (menuName) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(menuName)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 180)
  }

  const toggleMobileAccordion = (section) => {
    setMobileExpandedSection(mobileExpandedSection === section ? null : section)
  }

  return (
    <>
      <header
        ref={navRef}
        role="banner"
        className="fixed top-5 left-0 w-full z-40 px-4 sm:px-6 md:px-8 pointer-events-none transition-all duration-300"
      >
        <div className="max-w-[1280px] mx-auto">
          <nav
            aria-label="AI-Unleashed SaaS Navigation"
            className={`pointer-events-auto relative flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl transition-all duration-300 ${
              scrolled
                ? 'bg-[#060b18]/85 backdrop-blur-2xl border border-cyan-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,240,255,0.12)]'
                : 'bg-[#060b18]/70 backdrop-blur-xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(0,240,255,0.06)]'
            }`}
          >
            {/* 1. LEFT: Brand & Logo Mark */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-cyan-400/40 rounded-lg p-0.5"
                title="AI-UNLEASHED // Home"
              >
                {/* Glowing Prism Mark */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/25 via-blue-600/20 to-violet-600/30 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:border-cyan-300 group-hover:shadow-[0_0_22px_rgba(0,240,255,0.7)] transition-all duration-300">
                  <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform duration-300" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 text-sm font-mono select-none">
                    AI-UNLEASHED
                  </span>
                  <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 tracking-wider">
                    v3.8
                  </span>
                </div>
              </a>
            </div>

            {/* 2. CENTER: Dropdown Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {/* Product Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('product')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'product' ? null : 'product')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                    activeDropdown === 'product'
                      ? 'text-white bg-white/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  aria-expanded={activeDropdown === 'product'}
                >
                  <span>Product</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === 'product' ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'product' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-84 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-[#080e22]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.15)]">
                      <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                        Core Platform Capabilities
                      </div>
                      <div className="space-y-1 mt-1">
                        {PRODUCT_ITEMS.map((item, idx) => (
                          <a
                            key={idx}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveDropdown(null)
                            }}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/8 text-left transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors shrink-0 mt-0.5">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('solutions')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                    activeDropdown === 'solutions'
                      ? 'text-white bg-white/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  aria-expanded={activeDropdown === 'solutions'}
                >
                  <span>Solutions</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === 'solutions' ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'solutions' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-80 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-[#080e22]/95 backdrop-blur-2xl border border-violet-500/30 rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(139,92,246,0.15)]">
                      <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-violet-400/80 uppercase">
                        Deployment Environments
                      </div>
                      <div className="space-y-1 mt-1">
                        {SOLUTIONS_ITEMS.map((item, idx) => (
                          <a
                            key={idx}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveDropdown(null)
                            }}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/8 text-left transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-black transition-colors shrink-0 mt-0.5">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('resources')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                    activeDropdown === 'resources'
                      ? 'text-white bg-white/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  aria-expanded={activeDropdown === 'resources'}
                >
                  <span>Resources</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === 'resources' ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'resources' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-80 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-[#080e22]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.15)]">
                      <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                        Knowledge & Ecosystem
                      </div>
                      <div className="space-y-1 mt-1">
                        {RESOURCES_ITEMS.map((item, idx) => (
                          <a
                            key={idx}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveDropdown(null)
                            }}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/8 text-left transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors shrink-0 mt-0.5">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                  {item.title}
                                </span>
                                {item.external && (
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Direct Link */}
              <button
                type="button"
                onClick={onOpenGetStarted}
                className="px-3.5 py-2 rounded-xl text-xs font-sans font-medium tracking-wide text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Pricing
              </button>
            </div>

            {/* 3. RIGHT: Sign In & Primary CTA */}
            <div className="flex items-center gap-3">
              {/* Sign In / Login */}
              <button
                type="button"
                onClick={onOpenLogin}
                className="hidden sm:inline-block px-3 py-1.5 text-xs font-sans font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>

              {/* Primary CTA: Get Started → with Glowing Gradient Border */}
              <button
                type="button"
                onClick={onOpenGetStarted}
                className="group relative inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 text-black font-sans font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* Subtle sheen highlight */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="relative z-10 w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Fullscreen Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#040814]/95 backdrop-blur-3xl flex flex-col justify-between p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono font-bold text-white text-sm">AI-UNLEASHED</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Accordion Menu Items */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4 font-sans text-sm">
            {/* Product Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileAccordion('product')}
                className="w-full flex items-center justify-between py-2 text-slate-200 font-semibold uppercase tracking-wider text-xs"
              >
                <span>Product</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileExpandedSection === 'product' ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>
              {mobileExpandedSection === 'product' && (
                <div className="pl-3 py-2 space-y-2 text-xs border-l border-cyan-500/30 ml-2 mt-1">
                  {PRODUCT_ITEMS.map((item, idx) => (
                    <div key={idx} className="text-slate-400 py-1">
                      <span className="text-white font-medium block">{item.title}</span>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Solutions Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileAccordion('solutions')}
                className="w-full flex items-center justify-between py-2 text-slate-200 font-semibold uppercase tracking-wider text-xs"
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileExpandedSection === 'solutions' ? 'rotate-180 text-violet-400' : ''
                  }`}
                />
              </button>
              {mobileExpandedSection === 'solutions' && (
                <div className="pl-3 py-2 space-y-2 text-xs border-l border-violet-500/30 ml-2 mt-1">
                  {SOLUTIONS_ITEMS.map((item, idx) => (
                    <div key={idx} className="text-slate-400 py-1">
                      <span className="text-white font-medium block">{item.title}</span>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resources Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileAccordion('resources')}
                className="w-full flex items-center justify-between py-2 text-slate-200 font-semibold uppercase tracking-wider text-xs"
              >
                <span>Resources</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileExpandedSection === 'resources' ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>
              {mobileExpandedSection === 'resources' && (
                <div className="pl-3 py-2 space-y-2 text-xs border-l border-cyan-500/30 ml-2 mt-1">
                  {RESOURCES_ITEMS.map((item, idx) => (
                    <div key={idx} className="text-slate-400 py-1">
                      <span className="text-white font-medium block">{item.title}</span>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenLogin()
              }}
              className="w-full py-2.5 rounded-xl border border-white/15 text-white text-xs font-semibold"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenGetStarted()
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default SaaSNavbar
