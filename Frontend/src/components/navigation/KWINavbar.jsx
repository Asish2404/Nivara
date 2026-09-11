import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Map,
  FileText,
  ClipboardList,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  User,
} from "lucide-react";
import { useKWIStore, isUserAdmin } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { CommandProfileDropdown } from "./CommandProfileDropdown";

export function KWINavbar() {
  const { currentRoute, navigate, toggleAskKolkata, openLoginModal, currentUser, logoutUser, theme, setTheme } = useKWIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemPref, setSystemPref] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Keep OS preference in sync so 'system' themes follow hardware live
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemPref(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Resolve current dark state from the store (light | dark | system)
  const isDarkMode = theme === "dark" || (theme === "system" && systemPref);

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
    audioEngine.playUiChirp(isDarkMode ? 740 : 960);
  };

  const handleNavClick = (path) => {
    audioEngine.playUiChirp(920);
    setMobileMenuOpen(false);

    if (!currentUser && path !== "/") {
      navigate("/login");
      return;
    }

    navigate(path);
    if (typeof window !== "undefined" && currentRoute === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isAdmin = isUserAdmin(currentUser);

  // Configure navigation items strictly according to authenticated role:
  // - User: Home, Field Report, My Reports
  // - Admin: Home, Live Map, Simulate, Respond (+ Profile section on right)
  // - Not logged in: Home, Report, Live Map, Simulate, Respond (redirects unauthenticated clicks to sign in)
  let NAV_ITEMS = [];

  if (currentUser) {
    if (isAdmin) {
      NAV_ITEMS = [
        {
          key: "HOME",
          label: "Home",
          icon: Home,
          path: "/",
          isActive: currentRoute === "/",
        },
        {
          key: "LIVE_MAP",
          label: "Live Map",
          icon: Map,
          path: "/live-city",
          isActive: currentRoute.startsWith("/live-city"),
        },
        {
          key: "SIMULATE",
          label: "Simulate",
          icon: SlidersHorizontal,
          path: "/simulate",
          isActive: currentRoute.startsWith("/simulate"),
        },
        {
          key: "RESPOND",
          label: "Respond",
          icon: ShieldCheck,
          path: "/action-center",
          isActive: currentRoute.startsWith("/action-center"),
        },
      ];
    } else {
      // Regular User (Citizen): Home, Field Report, My Reports
      NAV_ITEMS = [
        {
          key: "HOME",
          label: "Home",
          icon: Home,
          path: "/",
          isActive: currentRoute === "/",
        },
        {
          key: "FIELD_REPORT",
          label: "Field Report",
          icon: FileText,
          path: "/reports",
          isActive:
            currentRoute === "/reports" ||
            currentRoute === "/report",
        },
        {
          key: "MY_REPORTS",
          label: "My Reports",
          icon: ClipboardList,
          path: "/my-reports",
          isActive: currentRoute.startsWith("/my-reports"),
        },
      ];
    }
  } else {
    // Visitor (Not logged in) - Overview with Report section between Home and Live Map
    NAV_ITEMS = [
      {
        key: "HOME",
        label: "Home",
        icon: Home,
        path: "/",
        isActive: currentRoute === "/",
      },
      {
        key: "REPORT",
        label: "Report",
        icon: FileText,
        path: "/reports",
        isActive: currentRoute === "/reports" || currentRoute === "/report",
      },
      {
        key: "LIVE_MAP",
        label: "Live Map",
        icon: Map,
        path: "/live-city",
        isActive: currentRoute.startsWith("/live-city"),
      },
      {
        key: "SIMULATE",
        label: "Simulate",
        icon: SlidersHorizontal,
        path: "/simulate",
        isActive: currentRoute.startsWith("/simulate"),
      },
      {
        key: "RESPOND",
        label: "Respond",
        icon: ShieldCheck,
        path: "/action-center",
        isActive: currentRoute.startsWith("/action-center"),
      },
    ];
  }

  return (
    <header className="sticky top-0 z-50 w-full pt-3.5 pb-2 px-3 sm:px-6 pointer-events-none select-none transition-all">
      {/* ===================================================== */}
      {/* REACT BITS ANIMATED BORDER GLOW WRAPPER               */}
      {/* ===================================================== */}
      <div className="relative pointer-events-auto max-w-[1380px] mx-auto p-[1.5px] rounded-[30px] group/nav shadow-[0_14px_45px_rgba(0,0,0,0.08)]">
        {/* Border Glow Beam Container - Isolated with overflow-hidden so it never clips dropdowns */}
        <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none" aria-hidden="true">
          {/* 1. Animated Outer Bloom Layer (Soft Neon Aura) */}
          <div
            className="absolute -inset-[180%] animate-[spin_7s_linear_infinite] opacity-70 blur-[15px]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 155deg, #00f0ff 172deg, #3b82f6 185deg, #a855f7 198deg, transparent 215deg, transparent 360deg)`,
            }}
          />

          {/* 2. Sharp Traveling Conic Beam (React Bits Border Glow: coneSpread=26) */}
          <div
            className="absolute -inset-[180%] animate-[spin_7s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 160deg, #00f0ff 174deg, #38bdf8 185deg, #a855f7 196deg, transparent 210deg, transparent 360deg)`,
            }}
          />
        </div>

        {/* ===================================================== */}
        {/* LIQUID GLASS MAIN CAPSULE CONTAINER                   */}
        {/* ===================================================== */}
        <div
          className={`relative rounded-[28.5px] px-4 sm:px-6 py-2.5 backdrop-blur-3xl backdrop-saturate-[180%] transition-all duration-300 ${isDarkMode
            ? "border border-white/10 text-white"
            : "border border-white/70 text-slate-900"
            }`}
          style={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(10, 15, 30, 0.78) 45%, rgba(15, 23, 42, 0.90) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.55) 45%, rgba(255, 255, 255, 0.75) 100%)",
            boxShadow: isDarkMode
              ? "inset 0 1px 1.5px rgba(255, 255, 255, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.6), 0 20px 50px rgba(0, 0, 0, 0.45)"
              : "inset 0 1.5px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(0, 0, 0, 0.04), 0 20px 50px rgba(0, 180, 255, 0.10)",
          }}
        >
          {/* Internal Refractive Glass Caustic Sheen */}
          <div
            className="absolute inset-0 rounded-[28.5px] bg-gradient-to-tr from-white/[0.12] via-transparent to-white/[0.22] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-between gap-4 z-10">
            {/* ================================================= */}
            {/* BRAND IDENTITY (Preserving exact existing logo)  */}
            {/* ================================================= */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleNavClick("/")}
                className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              >
                {/* KWI Emblem Logo - Left exactly as is */}
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-0.5 group-hover:scale-105 group-hover:shadow-sm transition-all duration-200 shrink-0">
                  <img
                    src="/textures/KWI_LOGO.jpeg"
                    alt="Kolkata Water Intelligence Logo"
                    className="w-full h-full object-contain rounded-lg mix-blend-multiply"
                  />
                </div>

                <div>
                  <div
                    className={`text-[12px] font-bold tracking-[0.14em] uppercase font-sans leading-tight transition-colors ${isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                  >
                    KOLKATA{" "}
                    <span className="text-blue-600 dark:text-cyan-400 font-extrabold">
                      WATER
                    </span>{" "}
                    INTELLIGENCE
                  </div>
                  <div
                    className={`text-[10px] font-medium tracking-normal block leading-tight mt-0.5 transition-colors ${isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                  >
                    Municipal Corporation & Irrigation Department
                  </div>
                </div>
              </button>
            </div>

            {/* ================================================= */}
            {/* CENTER NAVIGATION (Spacious Glass Tabs)           */}
            {/* ================================================= */}
            <nav className={`hidden lg:flex items-center ${!isAdmin && currentUser
              ? "gap-7 xl:gap-11 2xl:gap-14"
              : "gap-3.5 xl:gap-5 2xl:gap-7"
              }`}>
              {NAV_ITEMS.map((item) => {
                const isItemActive = item.isActive;
                const isUserLayout = !isAdmin && currentUser;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    className={`relative rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${isUserLayout
                      ? "px-5 py-2 xl:px-6 xl:py-2.5 min-w-[76px] xl:min-w-[88px]"
                      : "px-4 py-1.5 xl:px-4.5 xl:py-2 min-w-[68px] xl:min-w-[74px]"
                      } ${isItemActive
                        ? isDarkMode
                          ? "bg-gradient-to-b from-blue-950/80 to-indigo-950/70 border border-blue-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                          : "bg-gradient-to-b from-[#f0f6ff] to-[#e6f0ff] border border-blue-200/90 shadow-xs text-blue-600"
                        : isDarkMode
                          ? "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent group"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/90 border border-transparent group"
                      }`}
                  >
                    <item.icon
                      className={`w-4 h-4 mb-0.5 transition-colors ${isItemActive
                        ? isDarkMode
                          ? "text-cyan-400"
                          : "text-blue-600"
                        : isDarkMode
                          ? "text-slate-400 group-hover:text-white"
                          : "text-slate-500 group-hover:text-slate-800"
                        }`}
                    />
                    <span
                      className={`text-[11.5px] xl:text-[12px] leading-none whitespace-nowrap transition-colors ${isItemActive
                        ? isDarkMode
                          ? "font-semibold text-cyan-300"
                          : "font-semibold text-blue-700"
                        : isDarkMode
                          ? "font-medium text-slate-300 group-hover:text-white"
                          : "font-medium text-slate-600 group-hover:text-slate-900"
                        }`}
                    >
                      {item.label}
                    </span>

                    {/* Glowing Indicator Dot on Active Tab */}
                    {isItemActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* ================================================= */}
            {/* RIGHT ACTION CONTROLS                             */}
            {/* ================================================= */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* ----------------------------------------------- */}
              {/* SIGN IN ACTION BUTTON / COMMAND PROFILE DROPDOWN*/}
              {/* ----------------------------------------------- */}
              {!currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiChirp(960);
                    navigate('/signup');
                  }}
                  className={`relative px-3.5 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${currentRoute === '/signup' || currentRoute === '/login' || currentRoute === '/auth'
                    ? isDarkMode
                      ? "bg-gradient-to-b from-blue-950/80 to-indigo-950/70 border border-blue-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] min-w-[62px]"
                      : "bg-gradient-to-b from-[#f0f6ff] to-[#e6f0ff] border border-blue-200/90 shadow-xs text-blue-600 min-w-[62px]"
                    : isDarkMode
                      ? "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent min-w-[56px] group"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/90 border border-transparent min-w-[56px] group"
                    }`}
                >
                  <User
                    className={`w-4 h-4 mb-0.5 transition-colors ${currentRoute === '/signup' || currentRoute === '/login' || currentRoute === '/auth'
                      ? isDarkMode
                        ? "text-cyan-400"
                        : "text-blue-600"
                      : isDarkMode
                        ? "text-slate-400 group-hover:text-white"
                        : "text-slate-500 group-hover:text-slate-800"
                      }`}
                  />
                  <span
                    className={`text-[11px] leading-none transition-colors ${currentRoute === '/signup' || currentRoute === '/login' || currentRoute === '/auth'
                      ? isDarkMode
                        ? "font-semibold text-cyan-300"
                        : "font-semibold text-blue-700"
                      : isDarkMode
                        ? "font-medium text-slate-300 group-hover:text-white"
                        : "font-medium text-slate-600 group-hover:text-slate-900"
                      }`}
                  >
                    Sign Up
                  </span>

                  {/* Glowing Indicator Dot when on Signup page */}
                  {(currentRoute === '/signup' || currentRoute === '/login' || currentRoute === '/auth') && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  )}
                </button>
              ) : (
                /* Authenticated Command Officer Dropdown with High-End Glassmorphism */
                <CommandProfileDropdown isDarkMode={isDarkMode} />
              )}

              {/* ----------------------------------------------- */}
              {/* GLASSOMORPHISM THEME TOGGLE (Dark vs Light)     */}
              {/* ----------------------------------------------- */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDarkMode ? "Switch to Light mode" : "Switch to Dark mode"}
                className={`relative w-[114px] h-[38px] rounded-full p-[3px] flex items-center cursor-pointer transition-all duration-500 select-none overflow-hidden group shadow-md border ${isDarkMode
                  ? "justify-between border-slate-700/60"
                  : "justify-between border-slate-300/60"
                  }`}
                style={{
                  background: isDarkMode
                    ? "linear-gradient(135deg, #18191c 0%, #1f2025 50%, #18191c 100%)"
                    : "linear-gradient(135deg, rgba(161, 161, 170, 0.45) 0%, rgba(148, 163, 184, 0.55) 50%, rgba(161, 161, 170, 0.45) 100%)",
                  boxShadow: isDarkMode
                    ? "inset 0 1.5px 2px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.4)"
                    : "inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 4px 14px rgba(0, 0, 0, 0.08)",
                }}
              >
                {/* Mode Text: Dark on Left (when thumb on right) */}
                {isDarkMode && (
                  <span className="pl-3.5 text-[13px] font-medium text-[#9ca3af] tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    Dark
                  </span>
                )}

                {/* 3D Glass Sphere / Orb Thumb with Refractions */}
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
                  style={{
                    background: isDarkMode
                      ? "radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 25%, rgba(30, 32, 38, 0.8) 60%, #151619 100%)"
                      : "radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.25) 30%, rgba(200, 205, 215, 0.4) 65%, rgba(160, 165, 175, 0.75) 100%)",
                    boxShadow: isDarkMode
                      ? "0 4px 14px rgba(0, 0, 0, 0.7), inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.8)"
                      : "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {/* Glass Specular Rim Ring */}
                  <span
                    className={`absolute inset-[1.5px] rounded-full border pointer-events-none ${isDarkMode ? "border-white/20" : "border-white/60"
                      }`}
                  />

                  {/* Icon inside 3D Glass Sphere */}
                  {isDarkMode ? (
                    /* Crisp Glowing White Moon Icon for Dark Mode */
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 text-white fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ) : (
                    /* Crisp Glowing White Sun Icon with radiating rays for Light Mode */
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 text-white fill-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path
                        d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </motion.div>

                {/* Mode Text: Light on Right (when thumb on left) */}
                {!isDarkMode && (
                  <span className="pr-3.5 text-[13px] font-semibold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                    Light
                  </span>
                )}
              </button>

              {/* Glowing Ask Kolkata Gradient Button */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(880);
                  toggleAskKolkata();
                }}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,112,243,0.35)] active:scale-[0.98] border border-blue-400/25 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Ask Kolkata</span>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer ${isDarkMode
                  ? "text-slate-300 hover:text-white hover:bg-white/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* RESPONSIVE MOBILE DRAWER                          */}
          {/* ================================================= */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden pt-3 mt-3 border-t space-y-1 ${isDarkMode ? "border-white/10" : "border-slate-100"
                }`}
            >
              {NAV_ITEMS.map((item) => {
                const isItemActive = item.isActive;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${isItemActive
                      ? isDarkMode
                        ? "text-cyan-400 font-semibold bg-blue-950/60"
                        : "text-blue-600 font-semibold bg-blue-50/90"
                      : isDarkMode
                        ? "text-slate-300 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Mobile Login / User Profile Action */}
              <div className="pt-2 border-t border-white/10">
                {!currentUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Sign Up // Join</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{currentUser.avatar || "👨‍✈️"}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{currentUser.name}</div>
                        <div className="text-[10px] font-mono text-emerald-400">{currentUser.badgeId}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        setMobileMenuOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}

export default KWINavbar;
