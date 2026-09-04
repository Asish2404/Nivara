import { motion } from 'framer-motion'
import { useKWIStore } from '../store/useKWIStore'
import { audioEngine } from '../utils/audioEngine'

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]">
    <path d="M12 .7a11.3 11.3 0 0 0-3.57 22c.57.1.78-.25.78-.55v-2.1c-3.18.69-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.8 10.8 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.23 5.64.41.35.78 1.05.78 2.12v3.13c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[16px]">
    <path d="M5.1 3.6a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM3.3 9h3.6v11.5H3.3V9Zm5.8 0h3.4v1.57h.05c.47-.9 1.62-1.85 3.34-1.85 3.58 0 4.24 2.36 4.24 5.43v6.35h-3.55v-5.63c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.73H9.1V9Z" />
  </svg>
)

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-[16px] h-[16px]"
  >
    <path d="M5 4l14 16" />
    <path d="M19 4L5 20" />
  </svg>
)

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-[16px] h-[16px]"
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.7" r=".8" fill="currentColor" stroke="none" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5 text-white/35 group-hover:text-[#00f5d4] group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const NAV_COLUMNS = [
  {
    title: 'PLATFORM',
    links: [
      { label: 'City Intelligence', path: '/live-city' },
      { label: 'Incidents Grid', path: '/incidents' },
      { label: 'Forecast Nowcast', path: '/forecast' },
      { label: 'Simulate Interventions', path: '/simulate' },
    ],
  },
  {
    title: 'INTELLIGENCE',
    links: [
      { label: 'Water Network GIS', path: '/live-city' },
      { label: 'Live Systems', path: '/live-city' },
      { label: 'Citizen Reports', path: '/reports' },
      { label: 'Action Center', path: '/action-center' },
    ],
  },
  {
    title: 'COMMAND',
    links: [
      { label: 'Emergency Actions', path: '/action-center' },
      { label: 'Ask Kolkata AI', isAskKolkata: true },
      { label: 'Hydrological Twin', path: '/simulate' },
      { label: 'System Overview', path: '/' },
    ],
  },
]

export default function Footer() {
  const { navigate, toggleAskKolkata } = useKWIStore()

  const handleLinkClick = (linkItem) => {
    audioEngine.playUiChirp(920)
    if (linkItem.isAskKolkata) {
      toggleAskKolkata()
    } else if (linkItem.path) {
      navigate(linkItem.path)
    }
  }

  return (
    <footer className="relative w-full min-h-[410px] overflow-hidden isolate bg-[#020608] text-white select-none font-sans">
      {/* ===================================================== */}
      {/* BACKGROUND IMAGE - HOWRAH BRIDGE AT SUNSET            */}
      {/* ===================================================== */}
      <div
        className="absolute inset-0 -z-50 bg-cover bg-[center_30%] contrast-[1.08] saturate-[0.95] brightness-[0.58] pointer-events-none"
        style={{
          backgroundImage: "url('/textures/Footer_img2.png')",
        }}
        aria-hidden="true"
      />

      {/* Cinematic Dark Overlays for Optimal Legibility */}
      <div
        className="absolute inset-0 -z-40 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(2, 6, 9, 0.05) 0%,
              rgba(2, 6, 9, 0.18) 35%,
              rgba(1, 6, 9, 0.45) 72%,
              rgba(1, 5, 8, 0.70) 100%
            ),
            linear-gradient(
              90deg,
              rgba(1, 6, 9, 0.55) 0%,
              rgba(1, 6, 9, 0.18) 35%,
              rgba(1, 6, 9, 0.25) 70%,
              rgba(1, 6, 9, 0.75) 100%
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* Top Subtle Cyan Separator Line */}
      <div
        className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f5d4]/45 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient Top Glow Line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-12 bg-[radial-gradient(ellipse_at_top,rgba(0,245,212,0.18),transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* ===================================================== */}
      {/* MAIN FOOTER CONTENT CONTAINER                         */}
      {/* ===================================================== */}
      <div className="relative z-10 max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-8 flex flex-col justify-between min-h-[390px]">
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* ------------------------------------------------- */}
          {/* 1. BRAND + DESCRIPTION + SOCIALS                  */}
          {/* ------------------------------------------------- */}
          <div className="flex flex-col pr-0 lg:pr-4">
            {/* Brand Logo & Header */}
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(920)
                navigate('/')
              }}
              className="flex items-center gap-3.5 mb-4 text-left cursor-pointer group focus:outline-none"
            >
              {/* KWI Emblem Logo Badge */}
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white border border-[#26d0ce]/40 shadow-[0_0_20px_rgba(0,240,213,0.18)] flex items-center justify-center p-0.5 shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/textures/KWI_LOGO.jpeg"
                  alt="Kolkata Water Intelligence Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              {/* Title Text */}
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold tracking-[0.09em] text-slate-200 uppercase leading-none mb-1">
                  KOLKATA WATER
                </span>
                <span className="text-[17px] font-black tracking-[0.06em] text-white uppercase leading-none">
                  INTELLIGENCE
                </span>
                <span className="text-[8.5px] font-mono tracking-[0.2em] text-[#60d6d3]/85 uppercase leading-none mt-1">
                  URBAN WATER COMMAND SYSTEM
                </span>
              </div>
            </button>

            {/* Subtext description */}
            <p className="text-[13px] leading-[1.65] text-[#b4cbce] max-w-[315px] mb-6">
              Empowering Kolkata with real-time water intelligence, predictive
              insights, and rapid response systems for a resilient, flood-safe
              future.
            </p>

            {/* Social Channels */}
            <div className="flex items-center gap-2.5">
              {[
                {
                  href: 'https://github.com',
                  label: 'GitHub',
                  icon: <GithubIcon />,
                },
                {
                  href: 'https://linkedin.com',
                  label: 'LinkedIn',
                  icon: <LinkedinIcon />,
                },
                {
                  href: 'https://x.com',
                  label: 'X',
                  icon: <XIcon />,
                },
                {
                  href: 'https://instagram.com',
                  label: 'Instagram',
                  icon: <InstagramIcon />,
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="w-9 h-9 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-[#00f5d4] hover:border-[#00f5d4]/50 hover:bg-[#00f5d4]/10 transition-all duration-200"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------- */}
          {/* 2. NAVIGATION COLUMNS                             */}
          {/* ------------------------------------------------- */}
          {NAV_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col">
              <div className="mb-4 font-mono text-[11.5px] font-bold tracking-[0.14em] text-[#00e5bf] uppercase">
                {col.title}
              </div>

              <div className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => handleLinkClick(link)}
                    className="group flex items-center justify-between gap-3 text-[13px] text-white/75 hover:text-white transition-colors duration-150 text-left cursor-pointer w-full"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {link.label}
                    </span>
                    <ChevronRightIcon />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {/* 3. LIVE STATUS CARD                               */}
          {/* ------------------------------------------------- */}
          <div className="flex flex-col">
            <div className="mb-4 font-mono text-[11.5px] font-bold tracking-[0.14em] text-[#00e5bf] uppercase">
              LIVE STATUS
            </div>

            <div className="w-full max-w-[270px] rounded-xl border border-white/10 bg-[#001316]/60 backdrop-blur-md p-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
              {/* Operational Indicator */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f5d4] shadow-[0_0_8px_#00f5d4]" />
                </span>
                <span className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-[#00f5d4] uppercase">
                  SYSTEM OPERATIONAL
                </span>
              </div>

              {/* Status Message */}
              <p className="text-[12px] text-white/75 leading-normal mb-4">
                All systems are running smoothly.
              </p>

              {/* Last Updated Timestamp */}
              <div className="flex items-center text-[11px] font-mono">
                <span className="text-white/40">Last updated</span>
                <span className="text-[#00f5d4] font-medium ml-2">
                  2 min ago
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* DIVIDER LINE & BOTTOM COPYRIGHT / LEGAL BAR           */}
        {/* ===================================================== */}
        <div className="w-full h-[1px] bg-white/[0.12] mt-12 mb-5" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10.5px] font-mono tracking-[0.12em] text-white/40 uppercase">
          {/* Copyright */}
          <div className="flex items-center gap-2">
            <span>© 2026 KWI COMMAND</span>
            <span className="text-white/25">•</span>
            <span>ALL RIGHTS RESERVED</span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6 sm:gap-8">
            <a href="#privacy" className="hover:text-white transition-colors duration-150">
              PRIVACY POLICY
            </a>
            <a href="#terms" className="hover:text-white transition-colors duration-150">
              TERMS OF SERVICE
            </a>
            <a href="#contact" className="hover:text-white transition-colors duration-150">
              CONTACT
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}