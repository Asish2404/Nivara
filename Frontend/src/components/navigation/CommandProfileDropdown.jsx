import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sliders,
  Bell,
  BarChart3,
  KeyRound,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

// Animation Variants for Container & Cascading Items
const dropdownVariants = {
  closed: {
    opacity: 0,
    scale: 0.94,
    y: -8,
    filter: "blur(4px)",
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 28,
      mass: 0.75,
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, x: -6 },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

export function CommandProfileDropdown({ isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { currentUser, logoutUser, navigate } = useKWIStore();

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Compute initials from user name or fallback
  const userName = currentUser?.name || "Asish Bose";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AB";

  const userRole = currentUser?.role || "Command Officer";
  const userOrg = currentUser?.department || "Kolkata Water Board";
  const userEmail = currentUser?.email || "officer.roy@kolkata-water.gov.in";
  const userClearance = currentUser?.clearance || "LEVEL 4 · COMMAND ACCESS";

  const handleToggle = () => {
    if (audioEngine) audioEngine.playUiChirp(isOpen ? 780 : 940);
    setIsOpen(!isOpen);
  };

  const handleAction = (callback) => {
    if (audioEngine) audioEngine.playUiChirp(920);
    setIsOpen(false);
    if (callback) callback();
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* ========================================================= */}
      {/* TRIGGER BUTTON (Tactile Glass Pill with Spring Motion)     */}
      {/* ========================================================= */}
      <motion.button
        type="button"
        onClick={handleToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-pointer select-none backdrop-blur-2xl ${
          isDarkMode
            ? "bg-[#0b1220]/95 hover:bg-[#111a2e] text-slate-100 border border-slate-700/80 hover:border-cyan-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            : "bg-white/95 hover:bg-white text-[#0f172a] border border-slate-300/80 hover:border-blue-500/50 shadow-[0_2px_8px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)]"
        }`}
        style={{
          boxShadow: isDarkMode
            ? "inset 0 1px 1px rgba(255,255,255,0.15), 0 4px 14px rgba(0,0,0,0.5)"
            : "inset 0 1px 1.5px rgba(255,255,255,1), 0 2px 8px rgba(15,23,42,0.08)",
        }}
      >
        {/* Mini Avatar with Gradient & Online Pulse */}
        <div className="relative w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#0891a8] flex items-center justify-center font-bold text-[11px] text-white shadow-xs shrink-0 tracking-tight">
          {userInitials}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full bg-[#17a668] border-2 transition-all"
            style={{
              borderColor: isDarkMode ? "#0b1220" : "#ffffff",
              boxShadow: "0 0 6px rgba(23, 166, 104, 0.7)",
            }}
          />
        </div>

        {/* Officer Name */}
        <span className="text-[13.5px] font-semibold tracking-tight truncate max-w-[120px] sm:max-w-[150px]">
          {userName}
        </span>

        {/* Smooth Animated Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 24 }}
          className="flex items-center justify-center"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 ${
              isDarkMode ? "text-slate-400 group-hover:text-cyan-300" : "text-[#64748b] group-hover:text-[#2563eb]"
            }`}
          />
        </motion.div>
      </motion.button>

      {/* ========================================================= */}
      {/* COMMAND PROFILE GLASS PANEL WITH STAGGERED SPRING REVEAL  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              transformOrigin: "top right",
              boxShadow: isDarkMode
                ? "inset 0 1.5px 2px rgba(255, 255, 255, 0.12), 0 30px 60px -20px rgba(0, 0, 0, 0.85), 0 0 25px rgba(8, 145, 168, 0.15)"
                : "inset 0 1.5px 2px rgba(255, 255, 255, 1), 0 30px 60px -24px rgba(15, 23, 42, 0.28), 0 4px 12px -4px rgba(15, 23, 42, 0.08)",
            }}
            className={`absolute right-0 top-full mt-2.5 w-[360px] sm:w-[390px] rounded-[20px] overflow-hidden z-50 pointer-events-auto backdrop-blur-3xl backdrop-saturate-[200%] ${
              isDarkMode
                ? "bg-[#0b1220]/98 border border-slate-700/80 text-[#f8fafc]"
                : "bg-white/98 border border-slate-200/90 text-[#0f172a]"
            }`}
          >
            {/* 1. ID BLOCK (HEADER) */}
            <motion.div
              variants={itemVariants}
              className={`px-5 pt-5 pb-4.5 flex items-start gap-3.5 border-b ${
                isDarkMode
                  ? "border-slate-800 bg-gradient-to-b from-[#111c33] to-[#0b1220]"
                  : "border-slate-100 bg-gradient-to-b from-[#f8fafc] to-[#ffffff]"
              }`}
            >
              {/* Large Officer Avatar */}
              <div
                className="relative flex-none w-[52px] h-[52px] rounded-[16px] flex items-center justify-center font-bold text-[17px] text-white shadow-md"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #0891a8 100%)",
                  boxShadow: "0 8px 16px -6px rgba(37, 99, 235, 0.45)",
                }}
              >
                <span>{userInitials}</span>
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#17a668] border-[3px]"
                  style={{
                    borderColor: isDarkMode ? "#0b1220" : "#ffffff",
                    boxShadow: "0 0 8px rgba(23, 166, 104, 0.8)",
                  }}
                />
              </div>

              {/* ID Text */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold leading-snug tracking-tight m-0 mb-0.5 truncate text-[#0f172a] dark:text-white">
                  {userName}
                </h3>
                <p className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-[#0891a8] dark:text-cyan-400 uppercase m-0 mb-1">
                  {userRole}
                </p>
                <p className="text-[12.5px] text-[#64748b] dark:text-slate-400 m-0 mb-2.5 truncate">
                  {userOrg}
                </p>

                {/* Level 4 Access Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono font-semibold tracking-[0.03em] border ${
                    isDarkMode
                      ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/30"
                      : "bg-[#e5f7fa] text-[#0891a8] border-[rgba(8,145,168,0.25)]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0891a8] dark:bg-cyan-400" />
                  <span>{userClearance}</span>
                </div>
              </div>
            </motion.div>

            {/* 2. MENU ITEMS WITH STAGGERED REVEAL */}
            <div className="p-2.5 space-y-1">
              {/* My Profile */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() =>
                  handleAction(() => {
                    navigate("/reports");
                  })
                }
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[12px] text-left cursor-pointer group ${
                  isDarkMode
                    ? "hover:bg-[#152238] active:bg-[#1a2a46]"
                    : "hover:bg-[#f1f5f9] active:bg-[#e8eef5]"
                }`}
              >
                <div
                  className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-150 ${
                    isDarkMode
                      ? "bg-white/5 border-slate-700/70 text-slate-300 group-hover:bg-[#2563eb]/20 group-hover:border-[#2563eb]/40 group-hover:text-cyan-300"
                      : "bg-[#f1f5f9] border-slate-200/80 text-[#64748b] group-hover:bg-[#eaf1fd] group-hover:border-[rgba(37,99,235,0.25)] group-hover:text-[#2563eb]"
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-tight text-[#0f172a] dark:text-white">
                    My Profile
                  </div>
                  <div className="text-[11.5px] text-[#64748b] dark:text-slate-400 truncate mt-0.5">
                    View and manage operator information
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Section Header: Municipal Officer Access */}
              <motion.div variants={itemVariants} className="pt-2.5 pb-1 px-3">
                <span className="font-mono text-[10px] font-semibold tracking-[0.09em] text-[#94a3b8] dark:text-slate-500 uppercase">
                  Municipal Officer Access
                </span>
              </motion.div>

              {/* Command Settings */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() =>
                  handleAction(() => {
                    navigate("/simulate");
                  })
                }
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[12px] text-left cursor-pointer group ${
                  isDarkMode
                    ? "hover:bg-[#152238] active:bg-[#1a2a46]"
                    : "hover:bg-[#f1f5f9] active:bg-[#e8eef5]"
                }`}
              >
                <div
                  className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-150 ${
                    isDarkMode
                      ? "bg-white/5 border-slate-700/70 text-slate-300 group-hover:bg-[#2563eb]/20 group-hover:border-[#2563eb]/40 group-hover:text-cyan-300"
                      : "bg-[#f1f5f9] border-slate-200/80 text-[#64748b] group-hover:bg-[#eaf1fd] group-hover:border-[rgba(37,99,235,0.25)] group-hover:text-[#2563eb]"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-tight text-[#0f172a] dark:text-white">
                    Command Settings
                  </div>
                  <div className="text-[11.5px] text-[#64748b] dark:text-slate-400 truncate mt-0.5">
                    Authorization &amp; permission controls
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Notifications */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() =>
                  handleAction(() => {
                    navigate("/action-center");
                  })
                }
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[12px] text-left cursor-pointer group ${
                  isDarkMode
                    ? "hover:bg-[#152238] active:bg-[#1a2a46]"
                    : "hover:bg-[#f1f5f9] active:bg-[#e8eef5]"
                }`}
              >
                <div
                  className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-150 ${
                    isDarkMode
                      ? "bg-white/5 border-slate-700/70 text-slate-300 group-hover:bg-[#2563eb]/20 group-hover:border-[#2563eb]/40 group-hover:text-cyan-300"
                      : "bg-[#f1f5f9] border-slate-200/80 text-[#64748b] group-hover:bg-[#eaf1fd] group-hover:border-[rgba(37,99,235,0.25)] group-hover:text-[#2563eb]"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-tight text-[#0f172a] dark:text-white">
                    Notifications
                  </div>
                  <div className="text-[11.5px] text-[#64748b] dark:text-slate-400 truncate mt-0.5">
                    Municipal alerts and dispatch updates
                  </div>
                </div>
                <span className="font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-[#2563eb] to-[#0891a8] shadow-xs">
                  3 NEW
                </span>
              </motion.button>

              {/* Activity & Reports */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() =>
                  handleAction(() => {
                    navigate("/my-reports");
                  })
                }
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[12px] text-left cursor-pointer group ${
                  isDarkMode
                    ? "hover:bg-[#152238] active:bg-[#1a2a46]"
                    : "hover:bg-[#f1f5f9] active:bg-[#e8eef5]"
                }`}
              >
                <div
                  className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-120 ${
                    isDarkMode
                      ? "bg-white/5 border-slate-700/70 text-slate-300 group-hover:bg-[#2563eb]/20 group-hover:border-[#2563eb]/40 group-hover:text-cyan-300"
                      : "bg-[#f1f5f9] border-slate-200/80 text-[#64748b] group-hover:bg-[#eaf1fd] group-hover:border-[rgba(37,99,235,0.25)] group-hover:text-[#2563eb]"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-tight text-[#0f172a] dark:text-white">
                    Activity &amp; Reports
                  </div>
                  <div className="text-[11.5px] text-[#64748b] dark:text-slate-400 truncate mt-0.5">
                    {userEmail}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Divider */}
              <div
                className={`h-[1px] my-1 mx-2 ${
                  isDarkMode ? "bg-slate-800" : "bg-slate-100"
                }`}
              />

              {/* Section Header: Security */}
              <motion.div variants={itemVariants} className="pt-1.5 pb-1 px-3">
                <span className="font-mono text-[10px] font-semibold tracking-[0.09em] text-[#94a3b8] dark:text-slate-500 uppercase">
                  Security
                </span>
              </motion.div>

              {/* Switch Command Access */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() =>
                  handleAction(() => {
                    navigate("/signup");
                  })
                }
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[12px] text-left cursor-pointer group ${
                  isDarkMode
                    ? "hover:bg-[#152238] active:bg-[#1a2a46]"
                    : "hover:bg-[#f1f5f9] active:bg-[#e8eef5]"
                }`}
              >
                <div
                  className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-120 ${
                    isDarkMode
                      ? "bg-white/5 border-slate-700/70 text-slate-300 group-hover:bg-[#2563eb]/20 group-hover:border-[#2563eb]/40 group-hover:text-cyan-300"
                      : "bg-[#f1f5f9] border-slate-200/80 text-[#64748b] group-hover:bg-[#eaf1fd] group-hover:border-[rgba(37,99,235,0.25)] group-hover:text-[#2563eb]"
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-tight text-[#0f172a] dark:text-white">
                    Switch Command Access
                  </div>
                  <div className="text-[11.5px] text-[#64748b] dark:text-slate-400 truncate mt-0.5">
                    Update security passcode
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              {/* Privacy & Security */}
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() =>
                  handleAction(() => {
                    navigate("/action-center");
                  })
                }
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[12px] text-left cursor-pointer group ${
                  isDarkMode
                    ? "hover:bg-[#152238] active:bg-[#1a2a46]"
                    : "hover:bg-[#f1f5f9] active:bg-[#e8eef5]"
                }`}
              >
                <div
                  className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-120 ${
                    isDarkMode
                      ? "bg-white/5 border-slate-700/70 text-slate-300 group-hover:bg-[#2563eb]/20 group-hover:border-[#2563eb]/40 group-hover:text-cyan-300"
                      : "bg-[#f1f5f9] border-slate-200/80 text-[#64748b] group-hover:bg-[#eaf1fd] group-hover:border-[rgba(37,99,235,0.25)] group-hover:text-[#2563eb]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-tight text-[#0f172a] dark:text-white">
                    Privacy &amp; Security
                  </div>
                  <div className="text-[11.5px] text-[#64748b] dark:text-slate-400 truncate mt-0.5">
                    Data controls and active sessions
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </div>

            {/* Divider */}
            <div
              className={`h-[1px] ${
                isDarkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            />

            {/* 3. SIGN OUT */}
            <motion.button
              variants={itemVariants}
              type="button"
              onClick={() =>
                handleAction(() => {
                  if (audioEngine) audioEngine.playStationLock();
                  logoutUser();
                })
              }
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left cursor-pointer transition-colors duration-120 text-[#dc4b3f] ${
                isDarkMode
                  ? "hover:bg-[#fdecea]/10"
                  : "hover:bg-[#fdecea]"
              }`}
            >
              <div
                className="flex-none w-9 h-9 rounded-[10px] flex items-center justify-center border border-[rgba(220,75,63,0.2)] bg-[#fdecea] dark:bg-rose-950/40 text-[#dc4b3f]"
              >
                <LogOut className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-bold leading-tight text-[#dc4b3f]">
                  Sign Out
                </div>
                <div className="text-[11.5px] text-[#dc4b3f]/70 truncate mt-0.5">
                  End command session
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CommandProfileDropdown;
