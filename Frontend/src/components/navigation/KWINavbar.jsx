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
  LayoutDashboard,
  BrainCircuit,
  MessageSquare,
} from "lucide-react";
import { useKWIStore, isUserAdmin, isUserSupervisor } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { CommandProfileDropdown } from "./CommandProfileDropdown";

export function KWINavbar() {
  const {
    currentRoute,
    navigate,
    toggleAskKolkata,
    currentUser,
    logoutUser,
    theme,
    setTheme,
  } = useKWIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const topBarRef = useRef(null);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [systemPref, setSystemPref] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  // Measure top bar row height to dynamically align layout compensation spacer
  useEffect(() => {
    if (typeof window === "undefined") return;

    const measure = () => {
      if (topBarRef.current) {
        const height = topBarRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setTopBarHeight(height);
        }
      }
    };

    measure();
    window.addEventListener("resize", measure);

    let ro;
    if (typeof ResizeObserver !== "undefined" && topBarRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(topBarRef.current);
    }

    return () => {
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
  }, [currentRoute, currentUser]);

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

  const isSupervisor = isUserSupervisor(currentUser);
  const isAdmin = !isSupervisor && isUserAdmin(currentUser);

  // Configure navigation items strictly according to authenticated role:
  // - User: Home, Field Report, My Reports
  // - Supervisor: Home, Respond, Profile
  // - Admin: Dashboard, Home, Live Map, Simulate, Respond (+ Profile section on right)
  // - Not logged in: Home, Report, Live Map, Simulate, Respond (redirects unauthenticated clicks to sign in)
  let NAV_ITEMS = [];

  if (currentUser) {
    if (isSupervisor) {
      NAV_ITEMS = [
        {
          key: "HOME",
          label: "Home",
          icon: Home,
          path: "/",
          isActive: currentRoute === "/",
        },
        {
          key: "RESPOND",
          label: "Respond",
          icon: ShieldCheck,
          path: "/action-center",
          isActive:
            currentRoute === "/action-center" ||
            currentRoute === "/respond" ||
            currentRoute.startsWith("/action-center"),
        },
      ];
    } else if (isAdmin) {
      NAV_ITEMS = [
        {
          key: "HOME",
          label: "Home",
          icon: Home,
          path: "/",
          isActive: currentRoute === "/",
        },
        {
          key: "DASHBOARD",
          label: "Dashboard",
          icon: LayoutDashboard,
          path: "/dashboard",
          isActive:
            currentRoute === "/dashboard" ||
            currentRoute === "/admin-dashboard",
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
          isActive: currentRoute === "/reports" || currentRoute === "/report",
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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full pt-2 sm:pt-3.5 pb-1.5 sm:pb-2 px-2.5 sm:px-6 pointer-events-none select-none transition-all">
        {/* ===================================================== */}
        {/* SEAMLESS LIQUID GLASS NAVBAR CONTAINER                */}
        {/* ===================================================== */}
        <div className="relative pointer-events-auto max-w-[1380px] mx-auto rounded-[24px] sm:rounded-[30px] group/nav shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.35)]">
          {/* ===================================================== */}
          {/* LIQUID GLASS MAIN CAPSULE CONTAINER                   */}
          {/* ===================================================== */}
          <div
            className={`relative rounded-[24px] sm:rounded-[30px] px-3 sm:px-6 py-2 sm:py-2.5 backdrop-blur-3xl backdrop-saturate-[180%] transition-all duration-300 ${
              isDarkMode
                ? "border border-[rgba(94,183,201,0.18)] text-[#F2FBFD]"
                : "border border-white/80 text-slate-900"
            }`}
            style={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(6, 32, 66, 0.94) 0%, rgba(4, 20, 44, 0.90) 45%, rgba(10, 42, 82, 0.94) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.65) 45%, rgba(255, 255, 255, 0.82) 100%)",
              boxShadow: isDarkMode
                ? "inset 0 1px 1.5px rgba(255, 255, 255, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.8), 0 20px 50px rgba(4, 20, 44, 0.75)"
                : "inset 0 1.5px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(0, 0, 0, 0.04), 0 20px 50px rgba(0, 180, 255, 0.08)",
            }}
          >
            {/* Internal Refractive Glass Caustic Sheen */}
            <div
              className="absolute inset-0 rounded-[24px] sm:rounded-[30px] bg-gradient-to-tr from-white/[0.12] via-transparent to-white/[0.22] pointer-events-none"
              aria-hidden="true"
            />

            <div ref={topBarRef} className="relative flex items-center justify-between gap-2 sm:gap-4 z-10">
            {/* ================================================= */}
            {/* BRAND IDENTITY (Preserving exact existing logo)  */}
            {/* ================================================= */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleNavClick("/")}
                className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer focus:outline-none"
              >
                {/* KWI Emblem Logo - Left exactly as is */}
                <div className="relative w-8 sm:w-10 h-8 sm:h-10 rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-0.5 group-hover:scale-105 group-hover:shadow-sm transition-all duration-200 shrink-0">
                  <img
                    src="/textures/NIVARA_LOGO.png"
                    alt="NIVARA Logo"
                    className="w-full h-full object-contain rounded-lg mix-blend-multiply"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`text-[14px] sm:text-[17px] font-extrabold tracking-[0.16em] sm:tracking-[0.18em] uppercase font-sans leading-none transition-all duration-300 flex items-baseline ${
                        isDarkMode ? "text-[#F2FBFD]" : "text-slate-900"
                      }`}
                    >
                      <span className="relative">
                        NIV
                        <span className="absolute -bottom-0.5 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </span>
                      <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 dark:from-[#00E5FF] dark:via-[#38BDF8] dark:to-teal-300 bg-clip-text text-transparent font-black ml-[1.5px] drop-shadow-[0_0_12px_rgba(0,229,255,0.45)]">
                        ARA
                      </span>
                    </div>

                    {/*  */}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 dark:bg-[#00E5FF]" />
                    </span>
                    <span
                      className={`inline text-[8px] min-[360px]:text-[8.5px] sm:text-[9.5px] font-semibold tracking-wide uppercase leading-tight transition-colors truncate max-w-[170px] min-[360px]:max-w-[210px] sm:max-w-none ${
                        isDarkMode
                          ? "text-[#B2D2D9] group-hover:text-[#F2FBFD]"
                          : "text-slate-600 group-hover:text-slate-900"
                      }`}
                    >
                      Predict. Prepare. Prevent.
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* ================================================= */}
            {/* CENTER NAVIGATION (Spacious Glass Tabs)           */}
            {/* ================================================= */}
            <nav
              className={`hidden md:flex items-center ${
                isSupervisor
                  ? "gap-8 lg:gap-12 xl:gap-16 2xl:gap-20"
                  : !isAdmin && currentUser
                  ? "gap-7 xl:gap-11 2xl:gap-14"
                  : "gap-3.5 xl:gap-5 2xl:gap-7"
              }`}
            >
              {NAV_ITEMS.map((item) => {
                const isItemActive = item.isActive;
                const isUserLayout = !isAdmin && currentUser;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    className={`relative rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSupervisor
                        ? "px-6 py-2.5 min-w-[104px] sm:min-w-[116px] xl:min-w-[130px]"
                        : isUserLayout
                        ? "px-5 py-2 xl:px-6 xl:py-2.5 min-w-[76px] xl:min-w-[88px]"
                        : "px-4 py-1.5 xl:px-4.5 xl:py-2 min-w-[68px] xl:min-w-[74px]"
                    } ${
                      isItemActive
                        ? isDarkMode
                          ? "bg-gradient-to-b from-[#061820] to-[#0B2430] border border-[#00E5FF]/45 text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.22)]"
                          : "bg-gradient-to-b from-[#f0f6ff] to-[#e6f0ff] border border-blue-200/90 shadow-xs text-blue-600"
                        : isDarkMode
                          ? "text-[#B2D2D9] hover:text-[#F2FBFD] hover:bg-[#10313E]/50 border border-transparent group"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/90 border border-transparent group"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 mb-0.5 transition-colors ${
                        isItemActive
                          ? isDarkMode
                            ? "text-[#00E5FF]"
                            : "text-blue-600"
                          : isDarkMode
                            ? "text-[#6D949D] group-hover:text-[#F2FBFD]"
                            : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    />
                    <span
                      className={`text-[11.5px] xl:text-[12.5px] leading-none whitespace-nowrap transition-colors ${
                        isItemActive
                          ? isDarkMode
                            ? "font-semibold text-[#00E5FF]"
                            : "font-semibold text-blue-700"
                          : isDarkMode
                            ? "font-medium text-[#B2D2D9] group-hover:text-[#F2FBFD]"
                            : "font-medium text-slate-600 group-hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Glowing Indicator Dot on Active Tab */}
                    {isItemActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* ================================================= */}
            {/* RIGHT ACTION CONTROLS                             */}
            {/* ================================================= */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* ----------------------------------------------- */}
              {/* SIGN IN ACTION BUTTON / COMMAND PROFILE DROPDOWN*/}
              {/* ----------------------------------------------- */}
              {!currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiChirp(960);
                    navigate("/signup");
                  }}
                  className={`relative px-3.5 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                    currentRoute === "/signup" ||
                    currentRoute === "/login" ||
                    currentRoute === "/auth"
                      ? isDarkMode
                        ? "bg-gradient-to-b from-[#061820] to-[#0B2430] border border-[#00E5FF]/45 text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.22)] min-w-[62px]"
                        : "bg-gradient-to-b from-[#f0f6ff] to-[#e6f0ff] border border-blue-200/90 shadow-xs text-blue-600 min-w-[62px]"
                      : isDarkMode
                        ? "text-[#B2D2D9] hover:text-[#F2FBFD] hover:bg-[#10313E]/50 border border-transparent min-w-[56px] group"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/90 border border-transparent min-w-[56px] group"
                  }`}
                >
                  <User
                    className={`w-4 h-4 mb-0.5 transition-colors ${
                      currentRoute === "/signup" ||
                      currentRoute === "/login" ||
                      currentRoute === "/auth"
                        ? isDarkMode
                          ? "text-[#00E5FF]"
                          : "text-blue-600"
                        : isDarkMode
                          ? "text-[#6D949D] group-hover:text-[#F2FBFD]"
                          : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  />
                  <span
                    className={`text-[11px] leading-none transition-colors ${
                      currentRoute === "/signup" ||
                      currentRoute === "/login" ||
                      currentRoute === "/auth"
                        ? isDarkMode
                          ? "font-semibold text-[#00E5FF]"
                          : "font-semibold text-blue-700"
                        : isDarkMode
                          ? "font-medium text-[#B2D2D9] group-hover:text-[#F2FBFD]"
                          : "font-medium text-slate-600 group-hover:text-slate-900"
                    }`}
                  >
                    Sign Up
                  </span>

                  {/* Glowing Indicator Dot when on Signup page */}
                  {(currentRoute === "/signup" ||
                    currentRoute === "/login" ||
                    currentRoute === "/auth") && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
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
                aria-label={
                  isDarkMode ? "Switch to Light mode" : "Switch to Dark mode"
                }
                className={`hidden md:flex relative w-[114px] h-[38px] rounded-full p-[3px] items-center cursor-pointer transition-all duration-500 select-none overflow-hidden group shadow-md border ${
                  isDarkMode
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
                    className={`absolute inset-[1.5px] rounded-full border pointer-events-none ${
                      isDarkMode ? "border-white/20" : "border-white/60"
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

              {/* ─── Ask Kolkata — Premium AI Entry Button ─── */}
              <motion.button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(880);
                  toggleAskKolkata();
                }}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                aria-label="Open Ask Kolkata AI assistant"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-[11.5px] font-semibold whitespace-nowrap cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 transition-shadow ${
                  isDarkMode
                    ? "text-white border border-cyan-400/35 shadow-[0_0_18px_rgba(0,229,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] hover:shadow-[0_0_28px_rgba(0,229,255,0.32),inset_0_1px_1px_rgba(255,255,255,0.14)]"
                    : "text-white border border-blue-400/30 shadow-[0_4px_18px_rgba(0,112,243,0.32),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(0,112,243,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)]"
                }`}
                style={{
                  background: isDarkMode
                    ? "linear-gradient(130deg, rgba(6,24,52,0.92) 0%, rgba(6,32,70,0.88) 40%, rgba(4,20,52,0.94) 100%)"
                    : "linear-gradient(130deg, #1d4fd8 0%, #0ea5e9 55%, #06b6d4 100%)",
                }}
              >
                {/* Animated icon */}
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full ${
                    isDarkMode
                      ? "bg-cyan-400/15 text-cyan-300"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <BrainCircuit className="w-3 h-3" />
                </span>

                <span className={isDarkMode ? "text-[#e2f6ff]" : "text-white"}>Ask Kolkata</span>

                {/* Subtle live indicator dot */}
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isDarkMode ? "bg-cyan-400" : "bg-white"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      isDarkMode ? "bg-cyan-300" : "bg-white"
                    }`}
                  />
                </span>
              </motion.button>

              {/* Mobile Menu Toggle Button with Glassmorphism & Micro-Interaction */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(mobileMenuOpen ? 720 : 960);
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className={`lg:hidden p-2 sm:p-2.5 rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-md border ${
                  mobileMenuOpen
                    ? isDarkMode
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                      : "bg-blue-50 text-blue-600 border-blue-300 shadow-sm"
                    : isDarkMode
                      ? "text-slate-300 hover:text-white bg-white/5 border-white/10 hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 bg-slate-100/80 border-slate-200/80 hover:bg-slate-200/60"
                }`}
                aria-label="Toggle navigation menu"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: mobileMenuOpen ? 90 : 0, scale: mobileMenuOpen ? 1.05 : 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.div>
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* RESPONSIVE MOBILE DRAWER (Glassmorphic Redesign)  */}
          {/* ================================================= */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={`lg:hidden pt-3 mt-3 border-t overflow-hidden ${
                  isDarkMode
                    ? "border-cyan-500/20"
                    : "border-slate-200/70"
                }`}
              >
                {/* Ambient glass glow container */}
                <div className="relative rounded-2xl p-2 sm:p-3 bg-white/75 dark:bg-[#071928]/85 backdrop-blur-2xl border border-white/50 dark:border-cyan-500/20 shadow-[0_16px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-1.5 overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none" />

                  {/* Nav Item Pills with Staggered Entrance */}
                  {NAV_ITEMS.map((item, index) => {
                    const isItemActive = item.isActive;
                    return (
                      <motion.button
                        key={item.key}
                        type="button"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.035, duration: 0.2 }}
                        onClick={() => handleNavClick(item.path)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isItemActive
                            ? isDarkMode
                              ? "text-cyan-300 font-semibold bg-cyan-500/15 border border-cyan-400/35 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                              : "text-white font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 shadow-md shadow-blue-500/20"
                            : isDarkMode
                              ? "text-[#B2D2D9] hover:text-[#F2FBFD] hover:bg-white/8 border border-transparent"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${isItemActive ? (isDarkMode ? "text-cyan-300" : "text-white") : "opacity-75"}`} />
                          <span>{item.label}</span>
                        </div>
                        {isItemActive && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"}`} />
                        )}
                      </motion.button>
                    );
                  })}

                  {/* Mobile Quick Action Buttons (Ask Kolkata & Theme Toggle) */}
                  <div
                    className={`pt-2.5 pb-1 border-t flex items-center justify-between gap-2 ${
                      isDarkMode ? "border-white/10" : "border-slate-200/80"
                    }`}
                  >
                    <motion.button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        audioEngine.playUiChirp(880);
                        toggleAskKolkata();
                      }}
                      whileTap={{ scale: 0.96 }}
                      aria-label="Open Ask Kolkata AI assistant"
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        isDarkMode
                          ? "text-white border-cyan-400/30 shadow-[0_0_14px_rgba(0,229,255,0.16)]"
                          : "text-white border-blue-400/30 shadow-[0_4px_14px_rgba(0,112,243,0.32)]"
                      }`}
                      style={{
                        background: isDarkMode
                          ? "linear-gradient(130deg, rgba(6,24,52,0.96) 0%, rgba(6,32,70,0.92) 100%)"
                          : "linear-gradient(130deg, #1d4fd8 0%, #0ea5e9 55%, #06b6d4 100%)",
                      }}
                    >
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded-full ${
                          isDarkMode ? "bg-cyan-400/15 text-cyan-300" : "bg-white/20 text-white"
                        }`}
                      >
                        <BrainCircuit className="w-3 h-3" />
                      </span>
                      <span className={isDarkMode ? "text-[#e2f6ff]" : "text-white"}>Ask Kolkata</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isDarkMode
                          ? "bg-slate-800/90 text-amber-300 border-white/10 hover:bg-slate-800"
                          : "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/70"
                      }`}
                    >
                      <span>{isDarkMode ? "☀️ Light" : "🌙 Dark"}</span>
                    </button>
                  </div>

                  {/* Mobile Login / User Profile Action */}
                  <div
                    className={`pt-1 border-t ${
                      isDarkMode ? "border-white/10" : "border-slate-200/80"
                    }`}
                  >
                    {!currentUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/signup");
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Sign Up // Join</span>
                      </button>
                    ) : (
                      <div
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          isDarkMode
                            ? "bg-white/5 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                            : "bg-slate-50/95 border-emerald-500/40 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">
                            {currentUser.avatar || "👨‍✈️"}
                          </span>
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-bold truncate ${
                                isDarkMode ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {currentUser.name}
                            </div>
                            <div
                              className={`text-[10px] font-mono font-semibold tracking-tight ${
                                isDarkMode ? "text-emerald-400" : "text-emerald-600"
                              }`}
                            >
                              {currentUser.badgeId}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            logoutUser();
                            setMobileMenuOpen(false);
                          }}
                          className={`shrink-0 ml-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                            isDarkMode
                              ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 shadow-2xs"
                          }`}
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </header>

      {/* ===================================================== */}
      {/* VIEWPORT FIXED NAVBAR LAYOUT COMPENSATION SPACER      */}
      {/* ===================================================== */}
      <div
        className="w-full pt-2 sm:pt-3.5 pb-1.5 sm:pb-2 px-2.5 sm:px-6 pointer-events-none select-none invisible"
        aria-hidden="true"
      >
        <div className="max-w-[1380px] mx-auto py-2 sm:py-2.5 px-3 sm:px-6 border border-transparent">
          <div
            className="h-[43px] sm:h-[48.5px]"
            style={topBarHeight ? { height: `${topBarHeight}px` } : undefined}
          />
        </div>
      </div>
    </>
  );
}

export default KWINavbar;
