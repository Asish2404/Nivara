import { motion } from 'framer-motion'
import { useState } from 'react'

const ArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-full h-full">
    <path d="M12 19V5" />
    <path d="M6 11l6-6 6 6" />
  </svg>
)

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-full h-full">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 .7a11.3 11.3 0 0 0-3.57 22c.57.1.78-.25.78-.55v-2.1c-3.18.69-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.8 10.8 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.23 5.64.41.35.78 1.05.78 2.12v3.13c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M5.1 3.6a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM3.3 9h3.6v11.5H3.3V9Zm5.8 0h3.4v1.57h.05c.47-.9 1.62-1.85 3.34-1.85 3.58 0 4.24 2.36 4.24 5.43v6.35h-3.55v-5.63c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.73H9.1V9Z" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
    <path d="M5 4l14 16" />
    <path d="M19 4L5 20" />
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.7" r=".8" fill="currentColor" stroke="none" />
  </svg>
)

const COLUMNS = [
  {
    title: 'PLATFORM',
    links: ['City Intelligence', 'Incidents', 'Forecast', 'Simulate'],
  },
  {
    title: 'INTELLIGENCE',
    links: ['Water Network', 'Live Systems', 'Reports', 'Data Insights'],
  },
  {
    title: 'COMMAND',
    links: ['Actions', 'Ask Kolkata', 'Admin Console', 'System Status'],
  },
]

export default function Footer() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [selectedInterest, setSelectedInterest] = useState('City Intelligence')
  const [selectedBudget, setSelectedBudget] = useState('5K - 10K')
  const [submitted, setSubmitted] = useState(false)

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <>
      <style>{`
        @keyframes kwi-footer-drift {
          from { transform: scale(1.025) translate3d(0, 0, 0); }
          to { transform: scale(1.075) translate3d(-0.7%, -0.5%, 0); }
        }
        @keyframes kwi-glow-one {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(80px, -40px, 0); }
        }
        @keyframes kwi-glow-two {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-70px, -50px, 0); }
        }
        @keyframes kwi-title-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes kwi-status-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.75); }
        }
        @keyframes kwi-location-pulse {
          0% { box-shadow: 0 0 5px #00f0d5, 0 0 15px rgba(0, 240, 213, 0.35); }
          50% { box-shadow: 0 0 10px #00f0d5, 0 0 35px rgba(0, 240, 213, 0.8); }
          100% { box-shadow: 0 0 5px #00f0d5, 0 0 15px rgba(0, 240, 213, 0.35); }
        }
        @keyframes kwi-orbit-one {
          to { transform: translate(-50%, -50%) rotate(340deg); }
        }
        @keyframes kwi-orbit-two {
          to { transform: translate(-50%, -50%) rotate(395deg); }
        }
        .animate-footer-drift {
          animation: kwi-footer-drift 18s ease-in-out infinite alternate;
        }
        .animate-glow-one {
          animation: kwi-glow-one 12s ease-in-out infinite alternate;
        }
        .animate-glow-two {
          animation: kwi-glow-two 15s ease-in-out infinite alternate;
        }
        .animate-title-shimmer {
          background-size: 200% 100%;
          animation: kwi-title-shimmer 7s ease-in-out infinite;
        }
        .animate-status-pulse {
          animation: kwi-status-pulse 2s ease-in-out infinite;
        }
        .animate-loc-pulse {
          animation: kwi-location-pulse 2s infinite;
        }
        .animate-orbit-1 {
          animation: kwi-orbit-one 4s linear infinite;
        }
        .animate-orbit-2 {
          animation: kwi-orbit-two 6s linear infinite reverse;
        }
        .kwi-grid-pattern {
          background-image:
            linear-gradient(rgba(67, 224, 220, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(67, 224, 220, 0.08) 1px, transparent 1px);
          background-size: 72px 72px;
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
        .kwi-dot-grid {
          background-image: radial-gradient(circle, rgba(173, 227, 230, 0.5) 1px, transparent 1px);
          background-size: 8px 8px;
          -webkit-mask-image: radial-gradient(ellipse, black 20%, transparent 72%);
          mask-image: radial-gradient(ellipse, black 20%, transparent 72%);
        }
      `}</style>

      <footer className="relative w-full min-h-[760px] overflow-hidden isolate text-[#f4f8fa] bg-gradient-to-b from-transparent via-[#020608]/85 to-[#020608] backdrop-blur-md select-none font-sans">
        {/* Soft ambient top edge gradient that blends with neon glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#35dcda]/40 to-transparent pointer-events-none" />

        {/* Cinematic Kolkata background image with drift animation */}
        <div
          className="absolute inset-0 -z-50 bg-cover bg-[center_48%] contrast-[1.22] saturate-[0.82] brightness-[0.55] animate-footer-drift pointer-events-none"
          style={{
            backgroundImage: "url('/textures/Footer Image.jpg')",
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
          }}
          aria-hidden="true"
        />

        {/* Deep cinematic vignette overlays */}
        <div
          className="absolute inset-0 -z-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(1, 7, 9, 0.96) 0%, rgba(1, 8, 11, 0.82) 28%, rgba(1, 8, 12, 0.64) 52%, rgba(1, 6, 10, 0.78) 100%), linear-gradient(180deg, transparent 0%, rgba(0, 5, 8, 0.15) 30%, rgba(0, 4, 7, 0.95) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Atmospheric ambient glow orbs */}
        <div
          className="absolute w-[650px] h-[650px] rounded-full pointer-events-none blur-[90px] opacity-15 -z-30 left-[-280px] top-[180px] bg-[#00f0d0] animate-glow-one"
          aria-hidden="true"
        />
        <div
          className="absolute w-[650px] h-[650px] rounded-full pointer-events-none blur-[90px] opacity-15 -z-30 right-[-300px] bottom-[-250px] bg-[#704cff] animate-glow-two"
          aria-hidden="true"
        />

        {/* Fine technical command grid */}
        <div className="absolute inset-0 -z-20 pointer-events-none opacity-15 kwi-grid-pattern" aria-hidden="true" />

        {/* Main Footer Container */}
        <motion.div
          className="w-[min(1380px,calc(100%-40px))] sm:w-[min(1380px,calc(100%-80px))] mx-auto pt-12 sm:pt-[72px] pb-6"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ================================================= */}
          {/* TOP BRAND / STATUS                               */}
          {/* ================================================= */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 sm:pb-10 border-b border-white/[0.12] gap-5">
            <div className="flex items-center gap-3.5">
              {/* Brand Holographic Mark */}
              <div className="w-11 h-11 flex items-center justify-center gap-1 rounded-xl border border-[#00ffde]/45 bg-gradient-to-br from-[#00ffde]/15 to-[#005064]/[0.05] shadow-[0_0_30px_rgba(0,255,222,0.1),inset_0_0_20px_rgba(0,255,222,0.05)] shrink-0">
                <span className="w-[3px] h-[13px] rounded-full bg-[#00f5d4] shadow-[0_0_10px_rgba(0,255,222,0.8)]" />
                <span className="w-[3px] h-[21px] rounded-full bg-[#00f5d4] shadow-[0_0_10px_rgba(0,255,222,0.8)]" />
                <span className="w-[3px] h-[16px] rounded-full bg-[#00f5d4] shadow-[0_0_10px_rgba(0,255,222,0.8)]" />
              </div>

              <div>
                <div className="text-xs sm:text-[15px] font-semibold tracking-[0.13em] uppercase text-white/70">
                  KOLKATA WATER <strong className="text-white font-extrabold">INTELLIGENCE</strong>
                </div>
                <div className="mt-1 font-mono text-[8px] tracking-[0.23em] text-[#52ccc9]/50 uppercase">
                  URBAN WATER COMMAND SYSTEM
                </div>
              </div>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#00ffcd]/10 bg-[#001e1d]/35 font-mono text-[9px] font-bold tracking-[0.15em] text-[#00e7c1] shadow-[0_0_15px_rgba(0,231,193,0.08)]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#00e6b8] shadow-[0_0_8px_#00e6b8,0_0_18px_rgba(0,230,184,0.55)] animate-status-pulse" />
              <span>SYSTEM OPERATIONAL</span>
            </div>
          </div>

          {/* ================================================= */}
          {/* MAIN CONTENT GRID                                */}
          {/* ================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,0.82fr)_minmax(500px,1.18fr)] gap-12 lg:gap-24 py-12 lg:py-16">
            {/* LEFT HERO INTRO */}
            <motion.div
              className="flex flex-col justify-between"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                {/* Eyebrow */}
                <div className="flex items-center gap-2.5 mb-5 font-mono text-[10px] font-bold tracking-[0.16em] text-[#00ead0] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ead0] shadow-[0_0_12px_#00ead0]" />
                  <span>LIVE CITY INTELLIGENCE</span>
                </div>

                {/* Shimmering Headline */}
                <h2 className="text-4xl sm:text-6xl lg:text-[76px] font-extrabold leading-[0.92] tracking-[-0.055em] m-0 text-white">
                  Water meets
                  <br />
                  <span className="bg-gradient-to-r from-white via-[#00e9d0] to-[#7d6aff] bg-clip-text text-transparent animate-title-shimmer">
                    intelligence.
                  </span>
                </h2>

                <p className="max-w-[520px] mt-7 text-xs sm:text-sm leading-[1.8] text-[#c2d5d8]/65">
                  A unified command layer for understanding, simulating and responding to Kolkata's complex urban water systems in real-time.
                </p>

                {/* Primary CTA Button */}
                <button
                  type="button"
                  onClick={scrollTop}
                  className="mt-8 inline-flex items-center gap-4 h-13 pl-5 pr-1.5 py-1 rounded-full border border-[#00eed2]/55 bg-[#000f12]/65 text-white hover:border-[#00ead0] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_12px_35px_rgba(0,236,213,0.14)] cursor-pointer group"
                >
                  <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase">EXPLORE PLATFORM</span>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center p-2.5 bg-gradient-to-br from-[#00e8d0] to-[#655cff] shadow-[0_0_25px_rgba(61,209,255,0.2)] group-hover:scale-105 transition-transform duration-200">
                    <ArrowRight />
                  </span>
                </button>
              </div>

              {/* Social Channels */}
              <div className="mt-10 sm:mt-12">
                <div className="mb-3.5 font-mono text-[9px] tracking-[0.17em] text-[#00e3ce] uppercase">
                  CONNECT WITH US
                </div>
                <div className="flex gap-2.5">
                  {[
                    { href: '#github', label: 'GitHub', icon: <GithubIcon /> },
                    { href: '#linkedin', label: 'LinkedIn', icon: <LinkedinIcon /> },
                    { href: '#x', label: 'X', icon: <XIcon /> },
                    { href: '#instagram', label: 'Instagram', icon: <InstagramIcon /> },
                  ].map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      aria-label={item.label}
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.18] bg-[#040c0f]/45 text-white/65 hover:text-[#00f0d4] hover:border-[#00f0d4]/55 hover:bg-[#00f0d4]/[0.07] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,240,212,0.15)] transition-all duration-200"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT CONTACT CARD */}
            <motion.div
              className="relative p-6 sm:p-8 rounded-3xl border border-[#aaebee]/[0.24] bg-gradient-to-br from-[#0d1d22]/[0.76] to-[#030b0f]/[0.65] backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.07)] overflow-hidden"
              initial={{ opacity: 0, x: 50, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >

            {/* Subtle reflective top sweep */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-tr from-transparent via-[#00ebd9]/[0.05] to-transparent"
              aria-hidden="true"
            />

            <div className="relative flex justify-between items-start pb-5 border-b border-white/[0.09]">
              <div>
                <div className="text-lg sm:text-xl font-bold tracking-[0.02em] text-[#36e9dd]">
                  CONTACT US
                </div>
                <div className="mt-1 text-xs text-[#dcecee]/60">
                  Let's build the future of water intelligence together.
                </div>
              </div>

              <span className="w-2 h-2 mt-1.5 rounded-full bg-[#00e6c2] shadow-[0_0_12px_#00e6c2,0_0_30px_rgba(0,230,194,0.45)]" />
            </div>

            <form onSubmit={handleSubmit} className="relative mt-6 space-y-5">
              {/* Inputs Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#d3eaed]/45">
                    ◌
                  </span>
                  <input
                    type="text"
                    placeholder="YOUR NAME"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    aria-label="Your name"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#cae2e6]/[0.18] bg-[#00070a]/40 text-white placeholder-[#cde1e4]/45 text-[11px] tracking-wider uppercase focus:outline-none focus:border-[#00ebd9]/60 focus:bg-[#001417]/60 focus:ring-1 focus:ring-[#00ebd9]/30 transition-all"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#d3eaed]/45">
                    @
                  </span>
                  <input
                    type="email"
                    placeholder="YOUR E-MAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Your email"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#cae2e6]/[0.18] bg-[#00070a]/40 text-white placeholder-[#cde1e4]/45 text-[11px] tracking-wider uppercase focus:outline-none focus:border-[#00ebd9]/60 focus:bg-[#001417]/60 focus:ring-1 focus:ring-[#00ebd9]/30 transition-all"
                  />
                </div>
              </div>

              {/* Topic of Interest */}
              <div>
                <div className="mb-2.5 font-mono text-[9px] tracking-[0.12em] text-[#d7e8ea]/70 uppercase">
                  YOU ARE INTERESTED IN
                </div>
                <div className="flex flex-wrap gap-2">
                  {['City Intelligence', 'Water Network', 'Live Systems', 'Reports', 'Other'].map((item) => {
                    const isSelected = selectedInterest === item
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setSelectedInterest(item)}
                        className={`px-3.5 py-2 rounded-full text-[10px] tracking-wider transition-all duration-150 cursor-pointer ${isSelected
                          ? 'border border-[#00ebd9] bg-[#00ebd9]/20 text-white shadow-[0_0_12px_rgba(0,235,217,0.25)]'
                          : 'border border-[#d0e4e7]/20 bg-[#00070a]/30 text-[#e3eff0]/70 hover:text-white hover:border-[#00ebd9]/45 hover:bg-[#00ebd9]/10'
                          }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Budget */}
              <div>
                <div className="mb-2.5 font-mono text-[9px] tracking-[0.12em] text-[#d7e8ea]/70 uppercase">
                  YOUR BUDGET
                </div>
                <div className="flex flex-wrap gap-2">
                  {['< 5K', '5K - 10K', '10K - 20K', '> 20K', "I DON'T KNOW YET"].map((item) => {
                    const isSelected = selectedBudget === item
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setSelectedBudget(item)}
                        className={`px-3.5 py-2 rounded-full text-[10px] tracking-wider transition-all duration-150 cursor-pointer ${isSelected
                          ? 'border border-[#00ebd9] bg-[#00ebd9]/20 text-white shadow-[0_0_12px_rgba(0,235,217,0.25)]'
                          : 'border border-[#d0e4e7]/20 bg-[#00070a]/30 text-[#e3eff0]/70 hover:text-white hover:border-[#00ebd9]/45 hover:bg-[#00ebd9]/10'
                          }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message Field */}
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-[#d1e6e9]/50 text-xs">
                  ✎
                </span>
                <textarea
                  placeholder="TELL US ABOUT YOUR PROJECT..."
                  rows="3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[85px] pl-10 pr-3.5 py-3 rounded-xl border border-[#cae2e6]/[0.18] bg-[#00070a]/40 text-white placeholder-[#cde1e4]/45 text-[11px] tracking-wider uppercase focus:outline-none focus:border-[#00ebd9]/60 focus:bg-[#001417]/60 focus:ring-1 focus:ring-[#00ebd9]/30 transition-all resize-y"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full h-12 flex items-center justify-between px-5 rounded-xl bg-gradient-to-r from-[#12d9d2] via-[#466eff] to-[#9359ed] text-white text-[10px] font-extrabold tracking-[0.14em] uppercase hover:-translate-y-0.5 transition-all duration-200 shadow-[0_10px_35px_rgba(30,182,255,0.18)] hover:shadow-[0_16px_45px_rgba(55,188,255,0.28)] cursor-pointer"
              >
                <span>{submitted ? 'TRANSMITTING COMMAND...' : 'START A JOURNEY'}</span>
                <span className="w-4 h-4">
                  <ArrowRight />
                </span>
              </button>
            </form>
        </motion.div>
      </div>

      {/* ================================================= */}
      {/* NAVIGATION NETWORK                               */}
      {/* ================================================= */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 py-9 border-y border-white/10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, delay: 0.2 }}
      >
        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col">
            <div className="mb-4 font-mono text-[9px] font-bold tracking-[0.14em] text-[#00ded0] uppercase">
              {column.title}
            </div>
            <div className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replaceAll(' ', '-')}`}
                  className="group flex items-center justify-between max-w-[170px] text-[11px] text-[#ddeaea]/65 hover:text-white hover:translate-x-1 transition-all duration-150"
                >
                  <span>{link}</span>
                  <span className="w-3 h-3 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150">
                    <ArrowRight />
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* LIVE SYSTEM STATUS CARD */}
        <div className="flex flex-col">
          <div className="mb-4 font-mono text-[9px] font-bold tracking-[0.14em] text-[#00ded0] uppercase">
            LIVE STATUS
          </div>
          <div className="p-4 rounded-xl border border-[#00e8d2]/[0.12] bg-[#001213]/35 backdrop-blur-sm">
            <div className="flex items-center gap-2 font-mono text-[8px] font-bold tracking-wider text-[#00e4ca] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e6b8] shadow-[0_0_8px_#00e6b8] animate-pulse" />
              <span>SYSTEM OPERATIONAL</span>
            </div>
            <p className="my-3 text-[10px] leading-relaxed text-[#dbe8ea]/55">
              All distributed telemetry nodes and hydrological sensors operational.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.07] font-mono text-[7px] tracking-wider text-[#d7e8ea]/40 uppercase">
              <span>LAST TELEMETRY</span>
              <strong className="text-[#00dfc8]">2 MIN AGO</strong>
            </div>
          </div>
        </div>

        {/* KOLKATA LOCATION RADAR MAP */}
        <div className="hidden lg:flex flex-col">
          <div className="mb-4 font-mono text-[9px] font-bold tracking-[0.14em] text-[#00ded0] uppercase">
            KOLKATA, INDIA
          </div>
          <div className="relative h-[120px] rounded-xl overflow-hidden bg-[radial-gradient(circle_at_52%_52%,rgba(0,226,207,0.18),transparent_25%),radial-gradient(circle_at_50%_50%,rgba(75,98,255,0.08),transparent_50%)] border border-white/5">
            {/* Dots grid */}
            <div className="absolute inset-3 opacity-50 kwi-dot-grid" aria-hidden="true" />

            {/* Animated Orbital Radar Rings */}
            <div className="absolute left-[56%] top-[54%] w-[55px] h-[24px] rounded-full border border-[#00f0d5]/20 animate-orbit-1 pointer-events-none" />
            <div className="absolute left-[56%] top-[54%] w-[80px] h-[35px] rounded-full border border-[#00f0d5]/15 animate-orbit-2 pointer-events-none" />

            {/* Center Coordinates Pulse Point */}
            <div className="absolute left-[56%] top-[54%] w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00f0d5] animate-loc-pulse" />

            {/* Surrounding City Sensor Coordinates */}
            <span className="absolute left-[24%] top-[35%] w-[2px] h-[2px] rounded-full bg-[#b9e7e8]/45" />
            <span className="absolute left-[39%] top-[25%] w-[2px] h-[2px] rounded-full bg-[#b9e7e8]/45" />
            <span className="absolute left-[68%] top-[30%] w-[2px] h-[2px] rounded-full bg-[#b9e7e8]/45" />
            <span className="absolute left-[77%] top-[57%] w-[2px] h-[2px] rounded-full bg-[#b9e7e8]/45" />
            <span className="absolute left-[43%] top-[74%] w-[2px] h-[2px] rounded-full bg-[#b9e7e8]/45" />
            <span className="absolute left-[31%] top-[62%] w-[2px] h-[2px] rounded-full bg-[#b9e7e8]/45" />
          </div>
        </div>
      </motion.div>

      {/* ================================================= */}
      {/* BOTTOM BAR                                       */}
      {/* ================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 min-h-[72px] py-6">
        {/* Copyright */}
        <div className="flex items-center gap-2.5 font-mono text-[8px] tracking-[0.12em] text-[#b6cdd0]/40 uppercase">
          <span>© 2026 KWI COMMAND</span>
          <span className="text-[#00ebd8]/50">•</span>
          <span>KOLKATA, INDIA</span>
        </div>

        {/* Legal Links */}
        <div className="flex items-center gap-6 sm:gap-7 flex-wrap font-mono text-[8px] tracking-[0.1em] text-[#cadbdd]/40 uppercase">
          <a href="#privacy" className="hover:text-[#00dfcc] transition-colors">
            PRIVACY POLICY
          </a>
          <a href="#terms" className="hover:text-[#00dfcc] transition-colors">
            TERMS OF SERVICE
          </a>
          <a href="#contact" className="hover:text-[#00dfcc] transition-colors">
            CONTACT
          </a>
        </div>

        {/* Back to Top */}
        <button
          type="button"
          onClick={scrollTop}
          aria-label="Back to top"
          className="justify-self-start md:justify-self-end flex items-center gap-3 text-[#c1d7da]/45 hover:text-[#00e6d0] font-mono text-[8px] tracking-[0.1em] uppercase transition-colors group cursor-pointer"
        >
          <span>BACK TO TOP</span>
          <span className="w-[30px] h-[30px] p-1.5 rounded-lg border border-white/15 group-hover:border-[#00e6d0]/50 group-hover:-translate-y-1 transition-all duration-200">
            <ArrowUp />
          </span>
        </button>
      </div>
    </motion.div >
      </footer >
    </>
  )
}