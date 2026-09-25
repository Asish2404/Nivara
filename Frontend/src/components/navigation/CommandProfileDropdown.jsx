import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useKWIStore, isUserAdmin, isUserSupervisor } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { ProfileModal } from "../modals/ProfileModal";

// Clean, smooth motion variants (200–250ms duration, subtle downward translation & scale)
const dropdownVariants = {
  closed: {
    opacity: 0,
    scale: 0.97,
    y: -6,
    transition: {
      duration: 0.2,
      ease: [0.2, 0, 0, 1],
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function CommandProfileDropdown({ isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const containerRef = useRef(null);

  const {
    currentUser,
    logoutUser,
    navigate,
    notifications = [],
    unreadNotificationsCount = 3,
    setProfileActiveTab,
  } = useKWIStore();

  const isAdmin = isUserAdmin(currentUser);
  const effectiveUnreadCount = useMemo(() => {
    if (isAdmin) return unreadNotificationsCount;
    return (notifications || []).filter(
      (n) =>
        (n.type === "report_submitted" ||
          n.type === "incident_in_progress" ||
          n.type === "incident_resolved" ||
          n.recipientType === "user") &&
        !n.isRead
    ).length;
  }, [notifications, unreadNotificationsCount, isAdmin]);

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

  // Compute initials from real user name — show initials or placeholder when no user is logged in
  const userName = currentUser?.name || "Guest";
  const userOrg = currentUser?.department || "NIVARA";
  const avatarUrl = currentUser?.avatarUrl || null;

  const userInitials = userName
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AB";

  const handleToggle = () => {
    if (audioEngine) audioEngine.playUiChirp(isOpen ? 780 : 940);
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (action) => {
    if (audioEngine) audioEngine.playUiChirp(920);
    setIsOpen(false);
    if (action) action();
  };

  const handleSignOut = () => {
    if (audioEngine) audioEngine.playStationLock();
    setIsOpen(false);
    logoutUser();
    navigate("/login");
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={containerRef}>
        {/* ========================================================= */}
        {/* TRIGGER BUTTON (Subtle Frosted Pill)                      */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`group relative flex items-center gap-1.5 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full cursor-pointer select-none transition-all duration-200 border ${isDarkMode
            ? "bg-[#10313E] hover:bg-[#163F4E] text-[#F2FBFD] border-[rgba(94,183,201,0.18)] shadow-[0_2px_12px_rgba(3,15,20,0.6)]"
            : "bg-white/95 hover:bg-slate-50 text-slate-900 border-slate-200/90 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
            }`}
          title={userName}
        >
          {/* Real Avatar or Initials Fallback */}
          <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#00E5FF] via-[#0284c7] to-[#0891a8] flex items-center justify-center font-bold text-[11px] text-white">
                {userInitials}
              </div>
            )}
          </div>

          {/* User Name (displayed on tablet and desktop) */}
          <span className="hidden sm:inline text-[13px] font-semibold tracking-tight truncate max-w-[130px] sm:max-w-[160px] text-slate-900 dark:text-[#F2FBFD]">
            {userName}
          </span>

          {/* Smooth Chevron */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="hidden sm:flex items-center justify-center text-slate-400 group-hover:text-[#00E5FF] transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        {/* ========================================================= */}
        {/* CLEAN PREMIUM USER PROFILE DROPDOWN MENU                  */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile Backdrop Overlay */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                variants={dropdownVariants}
                initial="closed"
                animate="open"
                exit="closed"
                style={{
                  transformOrigin: "top right",
                  boxShadow: isDarkMode
                    ? "0 20px 45px -10px rgba(3, 15, 20, 0.95), 0 0 0 1px rgba(94, 183, 201, 0.16)"
                    : "0 20px 45px -12px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.05)",
                }}
                className={`fixed inset-x-3 top-18 sm:top-full sm:absolute sm:right-0 sm:inset-x-auto mt-2 w-auto sm:w-[320px] max-w-[340px] mx-auto sm:mx-0 rounded-2xl overflow-hidden z-50 pointer-events-auto backdrop-blur-xl ${isDarkMode
                  ? "bg-[#061820]/98 border border-[rgba(94,183,201,0.18)] text-[#F2FBFD]"
                  : "bg-white/95 border border-slate-200/90 text-slate-900"
                  }`}
              >
              {/* PROFILE HEADER (Real Avatar, Name, Org) */}
              <div
                className={`p-5 flex flex-col items-center text-center border-b ${isDarkMode
                  ? "border-[rgba(94,183,201,0.16)] bg-[#0B2430]/75"
                  : "border-slate-100 bg-slate-50/50"
                  }`}
              >
                {/* Profile Image with subtle border and edit hover */}
                <button
                  type="button"
                  onClick={() => handleMenuClick(() => setIsProfileModalOpen(true))}
                  className="relative group mb-3 cursor-pointer rounded-full focus:outline-none"
                  title="Click to view or edit profile picture"
                >
                  <div className="w-[68px] h-[68px] rounded-full overflow-hidden border-2 border-[#00E5FF]/40 group-hover:border-[#00E5FF] transition-all duration-200 shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#00E5FF] via-[#0284c7] to-[#0891a8] flex items-center justify-center font-bold text-[19px] text-white">
                        {userInitials}
                      </div>
                    )}
                  </div>
                </button>

                {/* User Name */}
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-[#F2FBFD] m-0 tracking-tight leading-snug">
                  {userName}
                </h3>

                {/* Organization */}
                <p className="text-[12px] text-slate-500 dark:text-[#B2D2D9] m-0 mt-0.5 font-medium">
                  {userOrg}
                </p>
              </div>

              {/* MENU ITEMS */}
              <div className="p-2 space-y-1">
                {/* Admin Dashboard Quick Link (Admin Only) */}
                {isUserAdmin(currentUser) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleMenuClick(() => {
                        navigate("/dashboard");
                      })
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 group ${isDarkMode
                      ? "hover:bg-[#10313E] text-[#B2D2D9]"
                      : "hover:bg-blue-50/70 text-slate-800"
                      }`}
                  >
                    <div
                      className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${isDarkMode
                        ? "text-[#6D949D] group-hover:text-[#00E5FF]"
                        : "text-slate-500 group-hover:text-[#0284c7]"
                        }`}
                    >
                      <LayoutDashboard className="w-[17px] h-[17px]" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium leading-tight text-slate-900 dark:text-[#F2FBFD] flex items-center gap-1.5">
                        <span>Admin Dashboard</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-[#10313E] dark:text-[#00E5FF] border border-transparent dark:border-[rgba(0,229,255,0.3)]">
                          ADMIN
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#6D949D] truncate mt-0.5">
                        City Response Center &amp; Ops
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                )}

                {/* 1. My Profile */}
                <button
                  type="button"
                  onClick={() =>
                    handleMenuClick(() => {
                      if (setProfileActiveTab) setProfileActiveTab("overview");
                      navigate("/profile");
                    })
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 group ${isDarkMode
                    ? "hover:bg-[#10313E] text-[#B2D2D9]"
                    : "hover:bg-blue-50/70 text-slate-800"
                    }`}
                >
                  <div
                    className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${isDarkMode
                      ? "text-[#6D949D] group-hover:text-[#00E5FF]"
                      : "text-slate-500 group-hover:text-[#0284c7]"
                      }`}
                  >
                    <User className="w-[17px] h-[17px]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium leading-tight text-slate-900 dark:text-[#F2FBFD]">
                      My Profile
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6D949D] truncate mt-0.5">
                      Manage your account and profile
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all duration-150" />
                </button>

                {/* 2. Notifications (Hidden for Supervisor) */}
                {!isUserSupervisor(currentUser) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleMenuClick(() => {
                        navigate("/notifications");
                      })
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 group ${isDarkMode
                      ? "hover:bg-[#10313E] text-[#B2D2D9]"
                      : "hover:bg-blue-50/70 text-slate-800"
                      }`}
                  >
                    <div
                      className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${isDarkMode
                        ? "text-[#6D949D] group-hover:text-[#00E5FF]"
                        : "text-slate-500 group-hover:text-[#0284c7]"
                        }`}
                    >
                      <Bell className="w-[17px] h-[17px]" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium leading-tight text-slate-900 dark:text-[#F2FBFD]">
                        Notifications
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#6D949D] truncate mt-0.5">
                        Alerts and system updates
                      </div>
                    </div>
                    {/* Real Dynamic Unread Badge */}
                    {effectiveUnreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#0284c7] bg-blue-50 dark:bg-[#10313E] dark:text-[#00E5FF] border border-blue-200/80 dark:border-[rgba(0,229,255,0.35)]">
                        {effectiveUnreadCount} NEW
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                )}

                {/* 3. Settings */}
                <button
                  type="button"
                  onClick={() =>
                    handleMenuClick(() => {
                      if (setProfileActiveTab) setProfileActiveTab("preferences");
                      navigate("/profile");
                    })
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 group ${isDarkMode
                    ? "hover:bg-[#10313E] text-[#B2D2D9]"
                    : "hover:bg-blue-50/70 text-slate-800"
                    }`}
                >
                  <div
                    className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${isDarkMode
                      ? "text-[#6D949D] group-hover:text-[#00E5FF]"
                      : "text-slate-500 group-hover:text-[#0284c7]"
                      }`}
                  >
                    <Settings className="w-[17px] h-[17px]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium leading-tight text-slate-900 dark:text-[#F2FBFD]">
                      Settings
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6D949D] truncate mt-0.5">
                      Manage dashboard preferences
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all duration-150" />
                </button>

                {/* 4. Security & Privacy */}
                <button
                  type="button"
                  onClick={() =>
                    handleMenuClick(() => {
                      if (setProfileActiveTab) setProfileActiveTab("security");
                      navigate("/profile");
                    })
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 group ${isDarkMode
                    ? "hover:bg-[#10313E] text-[#B2D2D9]"
                    : "hover:bg-blue-50/70 text-slate-800"
                    }`}
                >
                  <div
                    className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${isDarkMode
                      ? "text-[#6D949D] group-hover:text-[#00E5FF]"
                      : "text-slate-500 group-hover:text-[#0284c7]"
                      }`}
                  >
                    <Shield className="w-[17px] h-[17px]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium leading-tight text-slate-900 dark:text-[#F2FBFD]">
                      Security &amp; Privacy
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6D949D] truncate mt-0.5">
                      Security and account controls
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all duration-150" />
                </button>
              </div>

              {/* SEPARATOR */}
              <div
                className={`h-px mx-2 ${isDarkMode ? "bg-[rgba(94,183,201,0.16)]" : "bg-slate-100"
                  }`}
              />

              {/* 5. SIGN OUT (Separated at bottom with subtle red accent) */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 group ${isDarkMode
                    ? "hover:bg-rose-950/30 text-rose-400"
                    : "hover:bg-rose-50/80 text-rose-600"
                    }`}
                >
                  <div
                    className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${isDarkMode
                      ? "text-rose-400 group-hover:text-rose-300"
                      : "text-rose-500 group-hover:text-rose-600"
                      }`}
                  >
                    <LogOut className="w-[17px] h-[17px]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold leading-tight text-rose-600 dark:text-rose-400">
                      Sign Out
                    </div>
                    <div className="text-[11px] text-rose-500/70 dark:text-rose-400/70 truncate mt-0.5">
                      End your current session
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>

      {/* Interactive Profile Modal to View / Change Photo & Account Info */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

export default CommandProfileDropdown;
