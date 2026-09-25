import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Waves,
  FileText,
  Layers,
  Search,
  X,
  CheckCheck,
  Check,
  Trash2,
  MapPin,
  Clock,
  ArrowRight,
  Radio,
  Filter,
  Sparkles,
} from "lucide-react";
import { useKWIStore, isUserAdmin } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

// Configurations for User's 4 Lifecycle & Forecast Message Types
const USER_TYPE_CONFIG = {
  report_submitted: {
    label: "1. Report Submitted",
    badgeLabel: "Report Acknowledged",
    icon: FileText,
    accentColor: "#0284c7",
    borderClass: "border-l-cyan-500 hover:border-cyan-400",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    glowClass: "from-cyan-500/10 to-transparent",
    dotClass: "bg-cyan-500",
  },
  incident_in_progress: {
    label: "2. Response In Progress",
    badgeLabel: "Field Crew Deployed",
    icon: Clock,
    accentColor: "#f59e0b",
    borderClass: "border-l-amber-500 hover:border-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    glowClass: "from-amber-500/10 to-transparent",
    dotClass: "bg-amber-500",
  },
  incident_resolved: {
    label: "3. Incident Resolved",
    badgeLabel: "Water Cleared",
    icon: ShieldCheck,
    accentColor: "#10b981",
    borderClass: "border-l-emerald-500 hover:border-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    glowClass: "from-emerald-500/10 to-transparent",
    dotClass: "bg-emerald-500",
  },
  location_forecast: {
    label: "4. Current Location Forecast",
    badgeLabel: "Device GPS 24h Forecast",
    icon: Waves,
    accentColor: "#6366f1",
    borderClass: "border-l-indigo-500 hover:border-indigo-400",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    glowClass: "from-indigo-500/10 to-transparent",
    dotClass: "bg-indigo-500",
  },
};

// Municipal Admin Broad Category Configurations
const ADMIN_CATEGORY_CONFIG = {
  urgent: {
    label: "Urgent Flooding",
    icon: AlertTriangle,
    accentColor: "#ef4444",
    borderClass: "border-l-rose-500 hover:border-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    glowClass: "from-rose-500/10 to-transparent",
    dotClass: "bg-rose-500",
  },
  pumps: {
    label: "Drainage & Pumps",
    icon: Waves,
    accentColor: "#f59e0b",
    borderClass: "border-l-amber-500 hover:border-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    glowClass: "from-amber-500/10 to-transparent",
    dotClass: "bg-amber-500",
  },
  reports: {
    label: "Citizen Reports",
    icon: FileText,
    accentColor: "#0284c7",
    borderClass: "border-l-cyan-500 hover:border-cyan-400",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    glowClass: "from-cyan-500/10 to-transparent",
    dotClass: "bg-cyan-500",
  },
  resolved: {
    label: "Operations Complete",
    icon: ShieldCheck,
    accentColor: "#10b981",
    borderClass: "border-l-emerald-500 hover:border-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    glowClass: "from-emerald-500/10 to-transparent",
    dotClass: "bg-emerald-500",
  },
};

export function NotificationsView() {
  const {
    currentUser,
    notifications = [],
    deviceLocation,
    fetchDeviceLocation,
    isLocatingDevice,
    locationPermission,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearReadNotifications,
    addReportSubmittedNotification,
    notifyIncidentStatusChange,
    navigate,
  } = useKWIStore();

  const isAdmin = isUserAdmin(currentUser);

  useEffect(() => {
    if (fetchNotifications) {
      fetchNotifications().catch(() => {});
    }
  }, [fetchNotifications]);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // For regular users, get the 4 types of messages:
  // 1. Report submitted successfully
  // 2. Incident status changed to in progress (for reported location)
  // 3. Incident status changed to resolved (for reported location)
  // 4. Location weather & flood forecast
  const userVisibleNotifications = useMemo(() => {
    if (isAdmin) {
      // Municipal Admins receive alerts across 4 categories (urgent, pumps, reports, resolved). Exclude system telemetry.
      return notifications.filter((n) => n.category !== "system" && n.type !== "system");
    }
    return notifications.filter(
      (n) =>
        n.type === "report_submitted" ||
        n.type === "incident_in_progress" ||
        n.type === "incident_resolved" ||
        n.type === "location_forecast" ||
        n.recipientType === "user"
    );
  }, [notifications, isAdmin]);

  // Tab counts for regular users
  const userCounts = useMemo(() => {
    return {
      all: userVisibleNotifications.length,
      submitted: userVisibleNotifications.filter(
        (n) => n.type === "report_submitted"
      ).length,
      inProgress: userVisibleNotifications.filter(
        (n) => n.type === "incident_in_progress"
      ).length,
      resolved: userVisibleNotifications.filter(
        (n) => n.type === "incident_resolved"
      ).length,
      forecast: userVisibleNotifications.filter(
        (n) => n.type === "location_forecast"
      ).length,
    };
  }, [userVisibleNotifications]);

  // Tab counts for admins across the 4 active categories
  const adminCounts = useMemo(() => {
    return {
      all: userVisibleNotifications.length,
      urgent: userVisibleNotifications.filter(
        (n) => n.category === "urgent" || n.severity === "critical"
      ).length,
      pumps: userVisibleNotifications.filter((n) => n.category === "pumps").length,
      reports: userVisibleNotifications.filter(
        (n) => n.category === "reports" || n.type === "report_submitted"
      ).length,
      resolved: userVisibleNotifications.filter(
        (n) => n.category === "resolved" || n.type === "incident_resolved"
      ).length,
    };
  }, [userVisibleNotifications]);

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return userVisibleNotifications.filter((notif) => {
      // Role-specific Tab filter
      if (!isAdmin) {
        if (activeTab === "submitted" && notif.type !== "report_submitted") {
          return false;
        }
        if (activeTab === "in_progress" && notif.type !== "incident_in_progress") {
          return false;
        }
        if (activeTab === "resolved" && notif.type !== "incident_resolved") {
          return false;
        }
        if (activeTab === "forecast" && notif.type !== "location_forecast") {
          return false;
        }
      } else {
        if (activeTab === "urgent" && notif.category !== "urgent" && notif.severity !== "critical") {
          return false;
        }
        if (activeTab === "pumps" && notif.category !== "pumps") {
          return false;
        }
        if (activeTab === "reports" && notif.category !== "reports" && notif.type !== "report_submitted") {
          return false;
        }
        if (activeTab === "resolved" && notif.category !== "resolved" && notif.type !== "incident_resolved") {
          return false;
        }
      }

      // Unread only toggle
      if (unreadOnly && notif.isRead) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = notif.title?.toLowerCase().includes(query);
        const matchesMsg = notif.message?.toLowerCase().includes(query);
        const matchesLoc = notif.location?.toLowerCase().includes(query);
        const matchesWard = notif.ward?.toLowerCase().includes(query);
        const matchesType = notif.type?.toLowerCase().includes(query);
        return matchesTitle || matchesMsg || matchesLoc || matchesWard || matchesType;
      }

      return true;
    });
  }, [userVisibleNotifications, activeTab, unreadOnly, searchQuery, isAdmin]);

  // Unread badge count
  const effectiveUnreadCount = useMemo(() => {
    return userVisibleNotifications.filter((n) => !n.isRead).length;
  }, [userVisibleNotifications]);

  const readCount = userVisibleNotifications.length - effectiveUnreadCount;

  // Handlers
  const handleTabClick = (tabKey) => {
    audioEngine?.playUiChirp(920);
    setActiveTab(tabKey);
  };

  const handleMarkAllRead = () => {
    audioEngine?.playNotificationChime();
    markAllNotificationsAsRead();
  };

  const handleClearRead = () => {
    audioEngine?.playUiChirp(720);
    clearReadNotifications();
  };

  const handleToggleUnreadOnly = () => {
    audioEngine?.playUiChirp(unreadOnly ? 800 : 1080);
    setUnreadOnly(!unreadOnly);
  };

  const handleMarkSingleRead = (id, e) => {
    e.stopPropagation();
    audioEngine?.playNotificationChime();
    markNotificationAsRead(id);
  };

  const handleDelete = (notifItem, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    audioEngine?.playUiChirp(680);
    const targetId =
      typeof notifItem === "object" && notifItem !== null
        ? notifItem.notification_id || notifItem.id || notifItem.dbId
        : notifItem;
    deleteNotification(targetId);
  };

  const handleActionClick = (route, e) => {
    e.stopPropagation();
    audioEngine?.playNotificationChime();
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* 1. Header Banner & Counter Badges */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-[#0b1b36] to-slate-900/95 text-white p-6 sm:p-8 border border-cyan-500/20 shadow-xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>
                {isAdmin
                  ? "Municipal Command Dispatch Stream"
                  : "Citizen Report Lifecycle Alerts"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <BellRing className="w-8 h-8 text-cyan-400 shrink-0" />
              <span>
                {isAdmin
                  ? "Notifications & Alerts Center"
                  : "My Incident & Report Notifications"}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
              {isAdmin
                ? "City-wide municipal emergency broadcasts, pumping station turbines, IoT telemetry calibration, and citizen report dispatch."
                : "Live tracking for your submitted reports & location forecasts: instant submission acknowledgments, field response dispatches, incident resolutions, and 24h weather flood forecasts."}
            </p>

            {/* Retention Policy Pill */}
            {!isAdmin ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 w-fit">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-cleared after 7 days to keep your notifications feed fresh & relevant</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Municipal Permanent Retention Archive (Admin Records)</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Total Alerts Card */}
            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-md min-w-[120px] text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {isAdmin ? "Total Alerts" : "My Messages"}
              </div>
              <div className="text-2xl font-extrabold text-white mt-0.5">
                {userVisibleNotifications.length}
              </div>
            </div>

            {/* Auto Retention Policy Card */}
            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-md min-w-[125px] text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Retention
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-1 flex items-center justify-center gap-1.5">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Permanent</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>7 Days Auto</span>
                  </>
                )}
              </div>
            </div>

            {/* Unread Action Badge Card */}
            <div
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl border backdrop-blur-md min-w-[140px] text-center transition-all ${
                effectiveUnreadCount > 0
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-200"
                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                {effectiveUnreadCount > 0 ? "Pending Action" : "Status"}
              </div>
              <div className="text-2xl font-extrabold mt-0.5 flex items-center justify-center gap-1.5">
                {effectiveUnreadCount > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>{effectiveUnreadCount} NEW</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 inline" />
                    <span className="text-lg">All Clear</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#07172B]/90 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => audioEngine?.playUiChirp(1050)}
            placeholder={
              isAdmin
                ? "Search alerts by keyword, ward (e.g. Ward 32), street..."
                : "Search your reports by location, tracking ID, or status..."
            }
            className="w-full pl-10 pr-9 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                audioEngine?.playUiChirp(820);
                setSearchQuery("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unread Only Toggle */}
          <button
            type="button"
            onClick={handleToggleUnreadOnly}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
              unreadOnly
                ? "bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Unread Only</span>
            {effectiveUnreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  unreadOnly
                    ? "bg-white text-cyan-600"
                    : "bg-rose-500 text-white"
                }`}
              >
                {effectiveUnreadCount}
              </span>
            )}
          </button>

          {/* Mark All As Read */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={effectiveUnreadCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>

          {/* Clear Read Notifications */}
          <button
            type="button"
            onClick={handleClearRead}
            disabled={readCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      {/* 3. Device Current Location Telemetry Bar (Citizens) */}
      {!isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-indigo-950/70 border border-indigo-500/30 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLocatingDevice
                    ? "bg-amber-400"
                    : deviceLocation
                    ? "bg-emerald-400"
                    : "bg-cyan-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLocatingDevice
                    ? "bg-amber-500"
                    : deviceLocation
                    ? "bg-emerald-500"
                    : "bg-cyan-500"
                }`}
              />
            </span>
            <div className="text-xs">
              <span className="text-slate-400 font-medium">Device Location: </span>
              <span className="font-bold text-white tracking-wide">
                {isLocatingDevice
                  ? "Detecting device GPS coordinates..."
                  : deviceLocation?.locality ||
                    deviceLocation?.location ||
                    "Kolkata Municipal Area"}
              </span>
              {deviceLocation?.ward && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {deviceLocation.ward}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {locationPermission === "granted"
                ? "Auto-synced from device"
                : "Permission required for local alerts"}
            </span>
            <button
              type="button"
              onClick={() => {
                audioEngine?.playUiChirp(1050);
                if (fetchDeviceLocation) {
                  fetchDeviceLocation(true);
                }
              }}
              disabled={isLocatingDevice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 transition-all disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isLocatingDevice ? "animate-pulse" : ""}`} />
              <span>{isLocatingDevice ? "Locating..." : "Refresh Location"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Filter Tabs / Pills */}
      {!isAdmin ? (
        /* Regular Citizen User Tabs: The 3 Core Message Types */
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabClick("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === "all"
                ? "bg-slate-900 text-white dark:bg-cyan-500 dark:text-black border-transparent shadow-md"
                : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Messages</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-black/30">
              {userCounts.all}
            </span>
          </button>

          {/* Type 1: Report Submitted */}
          <button
            type="button"
            onClick={() => handleTabClick("submitted")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === "submitted"
                ? "bg-slate-900 text-white dark:bg-cyan-400 dark:text-black border-transparent shadow-md"
                : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <FileText className="w-3.5 h-3.5" />
            <span>1. Report Submitted</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {userCounts.submitted}
            </span>
          </button>

          {/* Type 2: In Progress */}
          <button
            type="button"
            onClick={() => handleTabClick("in_progress")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === "in_progress"
                ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-black border-transparent shadow-md"
                : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <Clock className="w-3.5 h-3.5" />
            <span>2. Response In Progress</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {userCounts.inProgress}
            </span>
          </button>

          {/* Type 3: Resolved */}
          <button
            type="button"
            onClick={() => handleTabClick("resolved")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === "resolved"
                ? "bg-slate-900 text-white dark:bg-emerald-400 dark:text-black border-transparent shadow-md"
                : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Incident Resolved</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {userCounts.resolved}
            </span>
          </button>

          {/* Type 4: Current Location Forecast */}
          <button
            type="button"
            onClick={() => handleTabClick("forecast")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === "forecast"
                ? "bg-slate-900 text-white dark:bg-indigo-400 dark:text-black border-transparent shadow-md"
                : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <Waves className="w-3.5 h-3.5" />
            <span>4. Current Location Forecast</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {userCounts.forecast}
            </span>
          </button>
        </div>
      ) : (
        /* Municipal Admin Category Tabs */
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabClick("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === "all"
                ? "bg-slate-900 text-white dark:bg-cyan-500 dark:text-black border-transparent shadow-md"
                : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Alerts</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-black/30">
              {adminCounts.all}
            </span>
          </button>

          {Object.entries(ADMIN_CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const count = adminCounts[key] || 0;
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTabClick(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-md"
                    : "bg-white dark:bg-[#07172B]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 dark:bg-black/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Notification Cards List */}
      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              // Resolve card configuration
              const config =
                USER_TYPE_CONFIG[notif.type] ||
                ADMIN_CATEGORY_CONFIG[notif.category] ||
                USER_TYPE_CONFIG.report_submitted;
              const Icon = config.icon;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`group relative overflow-hidden rounded-xl border-l-[5px] border transition-all duration-200 ${
                    config.borderClass
                  } ${
                    !notif.isRead
                      ? "bg-white dark:bg-[#0a1e3b]/95 border-slate-200 dark:border-cyan-500/40 shadow-md ring-1 ring-cyan-500/20"
                      : "bg-white/80 dark:bg-[#07172B]/70 border-slate-200/80 dark:border-slate-800/80 opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Subtle category gradient background shimmer */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${config.glowClass} opacity-40 pointer-events-none`}
                  />

                  <div className="relative p-4 sm:p-5">
                    {/* Top Row: Category/Type, Badges, Location, Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type/Category Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${config.badgeClass}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </span>

                        {/* Unread Glow Badge */}
                        {!notif.isRead && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-500 text-white animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            NEW
                          </span>
                        )}

                        {/* Location / Ward Pill */}
                        {notif.location && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span>{notif.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium ml-auto">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{notif.timestamp}</span>
                      </div>
                    </div>

                    {/* Middle Section: Title & Content */}
                    <div className="py-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                        {notif.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        {notif.message}
                      </p>

                      {/* Telemetry Metric Pill if present */}
                      {notif.metrics && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
                          <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                          <span className="text-slate-500 dark:text-slate-400">
                            {notif.metrics.label}:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {notif.metrics.value}
                          </span>
                          {notif.metrics.status && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              {notif.metrics.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      {/* Direct Destination Route Action Button */}
                      {notif.action ? (
                        <button
                          type="button"
                          onClick={(e) => handleActionClick(notif.action.route, e)}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all group/btn"
                        >
                          <span>{notif.action.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div />
                      )}

                      {/* Per-Card Quick Actions */}
                      <div className="flex items-center gap-2">
                        {/* Toggle Read / Unread */}
                        <button
                          type="button"
                          onClick={(e) => handleMarkSingleRead(notif.id, e)}
                          title={notif.isRead ? "Alert marked as read" : "Mark as read"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                            !notif.isRead
                              ? "bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border-slate-200 dark:border-slate-700"
                              : "text-slate-400 dark:text-slate-500 border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{notif.isRead ? "Read" : "Mark as read"}</span>
                        </button>

                        {/* Delete Alert Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif, e)}
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center rounded-2xl bg-white dark:bg-[#07172B]/80 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-500 mb-4">
                <Bell className="w-8 h-8 opacity-80" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching notifications found
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                {searchQuery || unreadOnly || activeTab !== "all"
                  ? "No alerts match your current filter or search query. Try clearing your filters."
                  : "You're all caught up! You will be notified as soon as your reports receive municipal updates."}
              </p>

              {(searchQuery || unreadOnly || activeTab !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    audioEngine?.playUiChirp(880);
                    setSearchQuery("");
                    setActiveTab("all");
                    setUnreadOnly(false);
                  }}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default NotificationsView;
