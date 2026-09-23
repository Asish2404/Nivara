import { motion } from "framer-motion";
import { useKWIStore } from "../store/useKWIStore";
import { audioEngine } from "../utils/audioEngine";

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M12 .7a11.3 11.3 0 0 0-3.57 22c.57.1.78-.25.78-.55v-2.1c-3.18.69-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.8 10.8 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.23 5.64.41.35.78 1.05.78 2.12v3.13c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M5.1 3.6a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM3.3 9h3.6v11.5H3.3V9Zm5.8 0h3.4v1.57h.05c.47-.9 1.62-1.85 3.34-1.85 3.58 0 4.24 2.36 4.24 5.43v6.35h-3.55v-5.63c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.73H9.1V9Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-3.5 h-3.5"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <span className="text-white/30 text-xs group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-150 font-mono hidden sm:inline-block">
    &gt;
  </span>
);

const NAV_COLUMNS = [
  {
    title: "PLATFORM",
    links: [
      { label: "City Intelligence", path: "/live-city" },
      { label: "Incidents", path: "/incidents" },
      { label: "Simulate", path: "/simulate" },
    ],
  },
  {
    title: "INTELLIGENCE",
    links: [
      { label: "Water Network", path: "/live-city" },
      { label: "Live Systems", path: "/live-city" },
      { label: "Reports", path: "/reports" },
      { label: "Data Insights", path: "/live-city" },
    ],
  },
  {
    title: "COMMAND",
    links: [
      { label: "Actions", path: "/action-center" },
      { label: "Ask Kolkata", isAskKolkata: true },
      { label: "Sign Up / Join", path: "/signup" },
      { label: "System Status", path: "/live-city" },
    ],
  },
];

export default function Footer() {
  const { navigate, toggleAskKolkata } = useKWIStore();

  const handleLinkClick = (linkItem) => {
    if (audioEngine) audioEngine.playUiChirp(920);
    if (linkItem.isAskKolkata) {
      toggleAskKolkata();
    } else if (linkItem.isLogin) {
      navigate('/login');
    } else if (linkItem.path) {
      navigate(linkItem.path);
    }
  };

  return (
    <footer className="relative w-full overflow-hidden isolate text-white select-none font-sans">
      {/* ===================================================== */}
      {/* TOP EDGE — BLEND FOOTER INTO PAGE BACKGROUND          */}
      {/* ===================================================== */}
      {/* Light Mode Edge Blend */}
      <div
        className="absolute top-0 inset-x-0 h-24 sm:h-48 lg:h-56 z-0 pointer-events-none block dark:hidden"
        style={{
          background:
            "linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.75) 20%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.22) 60%, rgba(255,255,255,0.08) 80%, rgba(255,255,255,0.04) 90%, rgba(255,255,255,0) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Dark Mode Edge Blend */}
      <div
        className="absolute top-0 inset-x-0 h-28 sm:h-64 lg:h-72 z-0 pointer-events-none hidden dark:block"
        style={{
          background: `
      linear-gradient(
        to bottom,
        var(--nivara-bg-primary) 0%,
        rgba(10, 30, 59, 0.96) 12%,
        rgba(10, 30, 59, 0.82) 27%,
        rgba(10, 30, 59, 0.62) 42%,
        rgba(10, 30, 59, 0.42) 57%,
        rgba(10, 30, 59, 0.24) 72%,
        rgba(10, 30, 59, 0.10) 86%,
        rgba(10, 30, 59, 0.03) 94%,
        rgba(10, 30, 59, 0) 100%
      )
    `,
        }}
        aria-hidden="true"
      />
      {/* ===================================================== */}
      {/* 2. THEME-AWARE BACKGROUND PANORAMA                   */}
      {/* ===================================================== */}

      {/* LIGHT THEME BACKGROUND */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-bottom md:bg-[center_42%] bg-no-repeat contrast-[1.05] brightness-[0.82] saturate-[1.15] opacity-100 dark:opacity-0 transition-opacity duration-700 ease-in-out"
        style={{
          backgroundImage: "url('/textures/Footer_bg5.png')",
        }}
        aria-hidden="true"
      />

      {/* DARK THEME BACKGROUND */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-bottom md:bg-[center_42%] bg-no-repeat contrast-[1.05] brightness-[0.82] saturate-[1.15] opacity-0 dark:opacity-100 transition-opacity duration-700 ease-in-out"
        style={{
          backgroundImage: "url('/textures/Sample.png')",
        }}
        aria-hidden="true"
      />

      {/* Deep Rich Gradient Overlays for High-Contrast Readability */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(2, 6, 9, 0.02) 0%,
              rgba(2, 8, 12, 0.18) 25%,
              rgba(1, 6, 10, 0.50) 65%,
              rgba(1, 5, 8, 0.72) 100%
            ),
            linear-gradient(
              90deg,
              rgba(1, 6, 9, 0.40) 0%,
              rgba(1, 6, 9, 0.12) 40%,
              rgba(1, 6, 9, 0.18) 70%,
              rgba(1, 6, 9, 0.45) 100%
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* ===================================================== */}
      {/* 3. MAIN FOOTER CONTENT CONTAINER                      */}
      {/* ===================================================== */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-14 pt-10 sm:pt-20 pb-6 sm:pb-8 flex flex-col justify-between">
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-6 mb-2 pt-6 sm:pt-16 lg:pt-24 items-start">
          {/* ------------------------------------------------- */}
          {/* Column 1: BRAND + TAGLINE + SOCIALS (Span 4)     */}
          {/* ------------------------------------------------- */}
          <div className="lg:col-span-4 flex flex-col pr-0 lg:pr-6">
            {/* Brand Logo & Header */}
            <button
              type="button"
              onClick={() => {
                if (audioEngine) audioEngine.playUiChirp(920);
                navigate("/");
              }}
              className="flex items-center gap-3 sm:gap-3.5 mb-3 sm:mb-4 text-left cursor-pointer group focus:outline-none"
            >
              {/* Official KWI Emblem Logo */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center p-0.5 shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] transition-all duration-300">
                <img
                  src="/textures/NIVARA_LOGO.png"
                  alt="NIVARA Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              {/* Title Text */}
              <div className="flex flex-col justify-center">
                <div className="flex items-baseline text-[19px] sm:text-[22px] font-extrabold tracking-[0.18em] uppercase font-sans leading-none text-white transition-all duration-300">
                  <span className="relative text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    NIV
                    <span className="absolute -bottom-0.5 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </span>
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-teal-300 bg-clip-text text-transparent font-black ml-[1.5px] drop-shadow-[0_0_16px_rgba(0,240,255,0.45)]">
                    ARA
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                  </span>
                  <span className="text-[11px] sm:text-[12px] font-mono font-bold tracking-[0.18em] sm:tracking-[0.2em] text-cyan-300 uppercase leading-none group-hover:text-cyan-200 transition-colors drop-shadow-[0_0_5px_rgba(34,211,238,0.45)]">
                    Predict. Prepare. Prevent.
                  </span>
                </div>
              </div>
            </button>

            {/* Tagline Description */}
            <p className="text-[13.5px] sm:text-[15px] leading-[1.55] sm:leading-[1.6] text-slate-200/95 max-w-[340px] mb-4 sm:mb-6 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              Empowering Kolkata with real-time water intelligence, predictive
              insights, and rapid response systems for a resilient, flood-safe
              future.
            </p>

            {/* Social Pill Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {[
                {
                  href: "https://github.com",
                  label: "GitHub",
                  icon: <GithubIcon />,
                },
                {
                  href: "https://linkedin.com",
                  label: "LinkedIn",
                  icon: <LinkedinIcon />,
                },
                {
                  href: "https://x.com",
                  label: "X",
                  icon: <XIcon />,
                },
                {
                  href: "https://instagram.com",
                  label: "Instagram",
                  icon: <InstagramIcon />,
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="w-8 h-8 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-950/30 transition-all duration-200 shadow-sm"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------- */}
          {/* Columns 2, 3, 4: NAV COLUMNS (Each Span 2 on lg)  */}
          {/* Grouped in a 3-column responsive subgrid for mobile */}
          {/* ------------------------------------------------- */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:contents col-span-1 md:col-span-2 lg:col-span-6">
            {NAV_COLUMNS.map((col) => (
              <div key={col.title} className="lg:col-span-2 flex flex-col">
                <div className="mb-2.5 sm:mb-4 font-mono text-[12.5px] sm:text-[16px] lg:text-[18px] font-bold tracking-[0.16em] sm:tracking-[0.2em] text-white/90 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                  {col.title}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2.5">
                  {col.links.map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => handleLinkClick(link)}
                      className="group flex items-center justify-between gap-1 sm:gap-2 text-[12px] sm:text-[14px] text-slate-200 hover:text-white transition-colors duration-150 text-left cursor-pointer w-full max-w-[160px] py-0.5 sm:py-0"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150 font-normal">
                        {link.label}
                      </span>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ------------------------------------------------- */}
          {/* Column 5: LIVE STATUS CARD (Span 2)               */}
          {/* ------------------------------------------------- */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="mb-2.5 sm:mb-4 font-mono text-[12.5px] sm:text-[16px] lg:text-[18px] font-bold tracking-[0.16em] sm:tracking-[0.2em] text-white/90 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
              LIVE STATUS
            </div>

            <div className="w-full rounded-xl sm:rounded-2xl border border-cyan-500/25 bg-[#031518]/75 backdrop-blur-xl p-3.5 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {/* Operational Indicator */}
              <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                </span>
                <span className="font-mono text-[10.5px] sm:text-[11px] font-bold tracking-[0.16em] text-cyan-300 uppercase">
                  SYSTEM OPERATIONAL
                </span>
              </div>

              {/* Status Message */}
              <p className="text-[12px] sm:text-[12.5px] text-slate-300/90 leading-snug sm:leading-normal mb-2 sm:mb-3 font-normal">
                All systems are running smoothly.
              </p>

              {/* Last Updated Timestamp */}
              <div className="flex items-center text-[10.5px] sm:text-[11px] font-mono text-slate-400">
                <span>Last updated</span>
                <span className="text-cyan-400 font-bold ml-1.5">
                  2 min ago
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* 4. DIVIDER LINE & BOTTOM COPYRIGHT / LEGAL BAR        */}
        {/* ===================================================== */}
        <div className="w-full h-[1px] bg-white/10 mt-4 sm:mt-6 mb-4 sm:mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-[14px] font-mono tracking-[0.14em] sm:tracking-[0.16em] text-slate-400 uppercase">
          {/* Copyright */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span>© 2026 KWI COMMAND</span>
            <span className="text-slate-600">•</span>
            <span>ALL RIGHTS RESERVED</span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 sm:gap-8">
            <a
              href="#privacy"
              className="hover:text-cyan-300 transition-colors duration-150"
            >
              PRIVACY POLICY
            </a>
            <a
              href="#terms"
              className="hover:text-cyan-300 transition-colors duration-150"
            >
              TERMS OF SERVICE
            </a>
            <a
              href="#contact"
              className="hover:text-cyan-300 transition-colors duration-150"
            >
              CONTACT
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
