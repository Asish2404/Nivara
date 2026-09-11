import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  MapPin,
  ArrowUpRight,
  TrendingUp,
  Filter,
  ChevronDown,
  Wrench,
  Users,
  ShieldAlert,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CloudSun,
  Layers,
  Activity,
  Droplets,
  Radio,
  SlidersHorizontal,
  Navigation
} from "lucide-react";
import { useKWIStore, isUserAdmin } from "../../store/useKWIStore";
import { ACTIVE_INCIDENTS, HOOGHLY_RIVER } from "../gis/kolkataCartographicData";

export function AdminDashboardView() {
  const {
    currentUser,
    navigate,
    setSelectedIncident,
    criticalIncidentsCount,
    highRiskZonesCount,
    pumpsAtCapacityCount,
    rainfallDisplay,
    myReports = []
  } = useKWIStore();
  const isAdmin = isUserAdmin(currentUser);

  // Time filter for maps & telemetry
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedHotspot, setSelectedHotspot] = useState(() => ACTIVE_INCIDENTS[0] || null);
  const [workOrderStatusFilter, setWorkOrderStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Live clock display
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Real KPI metrics synchronized with platform state
  const stats = useMemo(() => {
    const totalReportsCount = 1248 + (myReports ? myReports.length : 0);
    return [
      {
        id: "total",
        label: "Total Reports",
        value: totalReportsCount.toLocaleString(),
        change: "+12%",
        trend: "up",
        subtitle: "vs last month",
        icon: FileText,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        accentBorder: "border-blue-200 dark:border-blue-900/50",
        sparklineColor: "#3b82f6",
        points: [12, 18, 15, 24, 28, 22, 35, 42, 38, 48, 55, 62]
      },
      {
        id: "solved",
        label: "Solved",
        value: "892",
        change: "+18%",
        trend: "up",
        subtitle: "vs last month",
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
        accentBorder: "border-emerald-200 dark:border-emerald-900/50",
        sparklineColor: "#10b981",
        points: [8, 12, 14, 19, 22, 30, 32, 40, 45, 52, 58, 68]
      },
      {
        id: "in_progress",
        label: "In Progress",
        value: "256",
        change: "+5%",
        trend: "up",
        subtitle: "vs last month",
        icon: Clock,
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        accentBorder: "border-amber-200 dark:border-amber-900/50",
        sparklineColor: "#f59e0b",
        points: [25, 22, 28, 24, 20, 26, 22, 25, 21, 23, 27, 24]
      },
      {
        id: "unsolved",
        label: "Critical Inundation",
        value: (criticalIncidentsCount || 3).toString(),
        change: `${highRiskZonesCount || 4} Risk Zones`,
        trend: "up",
        subtitle: "Active telemetry",
        icon: AlertTriangle,
        iconColor: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        accentBorder: "border-rose-200 dark:border-rose-900/50",
        sparklineColor: "#f43f5e",
        points: [10, 8, 12, 14, 9, 11, 15, 18, 16, 22, 20, 26]
      }
    ];
  }, [criticalIncidentsCount, highRiskZonesCount, myReports]);

  // Live Priority Risk Areas directly from ACTIVE_INCIDENTS
  const priorityAreas = useMemo(() => {
    return ACTIVE_INCIDENTS.map((inc, index) => {
      const isCrit = inc.severity === "CRITICAL";
      const isHigh = inc.severity === "HIGH";
      const isMed = inc.severity === "MODERATE";

      let severityLabel = "Low";
      let severityClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50";
      let barClass = "bg-emerald-500";

      if (isCrit) {
        severityLabel = "Critical";
        severityClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50";
        barClass = "bg-rose-500";
      } else if (isHigh) {
        severityLabel = "High";
        severityClass = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50";
        barClass = "bg-orange-500";
      } else if (isMed) {
        severityLabel = "Medium";
        severityClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50";
        barClass = "bg-amber-400";
      }

      const img = inc.image ||
        (inc.location.toLowerCase().includes("park") ? "/images/hotspot_park_street.jpg" :
         inc.location.toLowerCase().includes("behala") ? "/images/hotspot_behala.jpg" :
         inc.location.toLowerCase().includes("thanthania") ? "/images/hotspot_thanthania.jpg" :
         inc.location.toLowerCase().includes("kalighat") ? "/images/hotspot_kalighat.jpg" :
         "/images/kolkata_waterlog_sector_v.jpg");

      return {
        raw: inc,
        rank: index + 1,
        id: inc.id,
        name: inc.location.split("/")[0].split("&")[0].trim(),
        zone: inc.subdivision || "Kolkata Central",
        reports: inc.verifiedReports || (25 - index * 4),
        maxReports: 30,
        waterDepth: inc.waterDepth,
        riskScore: inc.riskScore,
        severity: severityLabel,
        severityColor: severityClass,
        barColor: barClass,
        image: img,
        coords: [inc.x, inc.y]
      };
    });
  }, []);

  // Live Active Work Orders derived from incident tickets
  const workOrders = useMemo(() => {
    return [
      {
        id: "WO-0248",
        issue: "Drainage Blockage & Sump Cleansing",
        location: "Park Street & Chowringhee",
        assignedTo: "Municipal Team A (Ward 63)",
        status: "In Progress",
        statusVariant: "in-progress",
        updated: "18 min ago",
        incidentId: "#PS-032"
      },
      {
        id: "WO-0245",
        issue: "Waterlogging Inundation Control",
        location: "Salt Lake Sector V Ring Road",
        assignedTo: "Field Unit B (NDITA / PS-07)",
        status: "Awaiting Action",
        statusVariant: "awaiting",
        updated: "1 hour ago",
        incidentId: "#SV-024"
      },
      {
        id: "WO-0241",
        issue: "High Silt Sewer Overflow",
        location: "Thanthania Kalibari (Ward 49)",
        assignedTo: "Municipal Team C (PS-01)",
        status: "In Progress",
        statusVariant: "in-progress",
        updated: "2 hours ago",
        incidentId: "#TK-089"
      },
      {
        id: "WO-0239",
        issue: "Culvert De-silting & Drain Cleaning",
        location: "Behala Chowrasta / DH Road",
        assignedTo: "Contractor D (KMC South)",
        status: "Scheduled",
        statusVariant: "scheduled",
        updated: "4 hours ago",
        incidentId: "#BH-019"
      },
      {
        id: "WO-0231",
        issue: "Sluice Pump Station Maintenance",
        location: "Kalighat / Palmer Bridge",
        assignedTo: "Hydraulic Engineering Team",
        status: "In Progress",
        statusVariant: "in-progress",
        updated: "6 hours ago",
        incidentId: "#KL-044"
      }
    ];
  }, []);

  // Recent Activity Feed linked to incidents & citizen submissions
  const recentActivities = useMemo(() => {
    return [
      {
        id: 1,
        type: "report",
        icon: FileText,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        title: "Citizen report verified",
        description: "Waterlogging reported at Sector V (28 cm depth)",
        time: "10:12 AM"
      },
      {
        id: 2,
        type: "alert",
        icon: AlertTriangle,
        iconColor: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-100 dark:bg-rose-950/60",
        title: "Risk area escalated",
        description: "Thanthania marked as Critical (28.4 cm water level)",
        time: "09:48 AM"
      },
      {
        id: 3,
        type: "work_order",
        icon: Wrench,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/60",
        title: "Work order created",
        description: "WO-0248 dispatched to Municipal Team A",
        time: "09:30 AM"
      },
      {
        id: 4,
        type: "solved",
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
        title: "Sluice pump activated",
        description: "PS-07 running at 100% capacity in Sector V",
        time: "08:15 AM"
      },
      {
        id: 5,
        type: "team",
        icon: Users,
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-950/60",
        title: "Team assigned",
        description: "Field Unit B deployed to Salt Lake Sector V",
        time: "07:50 AM"
      }
    ];
  }, []);

  // Helper to generate SVG sparkline path
  const generateSparkline = (points, width = 110, height = 36) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const step = width / (points.length - 1);

    const coords = points.map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });

    return `M ${coords.join(" L ")}`;
  };

  const getStatusBadge = (statusVariant, statusText) => {
    switch (statusVariant) {
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
            {statusText}
          </span>
        );
      case "awaiting":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
            {statusText}
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap">
            {statusText}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">
            {statusText}
          </span>
        );
    }
  };

  // Filtered work orders
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (workOrderStatusFilter !== "ALL" && wo.statusVariant !== workOrderStatusFilter) return false;
    if (
      searchQuery &&
      !wo.issue.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !wo.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !wo.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-[#e8f1f8] dark:bg-[#070c14] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-16 font-sans relative">
      
      {/* ========================================================================= */}
      {/* EXACT PANORAMIC HERITAGE HEADER BANNER (EXTREME WIDE ZOOMED OUT VIEW)     */}
      {/* ========================================================================= */}
      <div className="relative w-full overflow-hidden bg-[#e8f1f8] dark:bg-[#070c14]">
        
        {/* Full-bleed Extreme Zoomed-out Heritage Intersection Panorama with Taxis */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/kolkata_heritage_street_extreme_wide.jpg"
            alt="Kolkata Heritage Metropolitan Architecture and Esplanade Crossing"
            className="w-full h-full object-cover object-[center_35%] sm:object-[center_32%] filter contrast-[1.03] brightness-[1.01]"
            onError={(e) => {
              e.currentTarget.src = "/images/kolkata_heritage_wide_ultra.jpg";
            }}
          />

          {/* Top Atmospheric Blend (Seamlessly fades upperside into navbar) */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#e8f1f8] via-[#e8f1f8]/60 to-transparent dark:from-[#070c14] dark:via-[#070c14]/70 pointer-events-none" />

          {/* Left Atmospheric Mist Gradient (Smooth natural fade across text area with zero hard edges) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#e8f1f8] via-[#e8f1f8]/85 via-28% md:via-38% to-transparent to-72% dark:from-[#070c14] dark:via-[#070c14]/88 dark:via-28% md:dark:via-38% dark:to-transparent pointer-events-none" />
          
          {/* Bottom Ground Level Blend */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#e8f1f8] via-[#e8f1f8]/40 to-transparent dark:from-[#070c14] dark:via-[#070c14]/40 pointer-events-none" />
        </div>

        {/* Content Container (Header Text & Floating Weather Card) */}
        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-12 sm:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[225px] sm:min-h-[255px]">
          
          {/* Left Title & Subtitle with Ambient Blue Glow Aura */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative space-y-2 max-w-xl"
          >
            {/* Ambient Cyan/Blue Glow Light behind Title */}
            <div className="absolute -left-10 -top-8 w-80 h-44 bg-gradient-to-br from-blue-500/20 via-cyan-400/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Glowing Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-cyan-500/15 border border-blue-400/40 dark:border-cyan-400/50 text-[11px] sm:text-xs font-bold tracking-[0.2em] text-blue-700 dark:text-cyan-300 uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
              ADMIN DASHBOARD
            </div>

            {/* Glowing Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#082038] dark:text-white tracking-tight leading-none drop-shadow-[0_4px_24px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_4px_30px_rgba(6,182,212,0.4)]">
              City Response Center
            </h1>

            <p className="text-sm sm:text-base text-[#385675] dark:text-slate-300 font-medium pt-0.5">
              Monitor reports, prioritize risk areas, and track resolution.
            </p>
          </motion.div>

          {/* Top Right Floating Weather & Date Widget with Levitation & Blue Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -6, 0]
            }}
            transition={{ 
              opacity: { duration: 0.35, delay: 0.1 },
              scale: { duration: 0.35, delay: 0.1 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="self-start md:self-center flex items-center gap-3.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/90 dark:border-cyan-500/35 px-4 py-2.5 rounded-2xl shadow-[0_14px_34px_-6px_rgba(15,23,42,0.16),0_6px_20px_rgba(59,130,246,0.22)] dark:shadow-[0_14px_34px_-6px_rgba(0,0,0,0.5),0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_18px_40px_-6px_rgba(59,130,246,0.3)] transition-shadow duration-300 cursor-default select-none"
          >
            <div className="text-blue-600 dark:text-cyan-400 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
              <CloudSun className="w-6 h-6 stroke-[1.75]" />
            </div>

            <div className="flex items-center gap-3.5 border-l border-slate-200/80 dark:border-slate-700/80 pl-3.5">
              <div>
                <div className="text-base font-bold text-slate-800 dark:text-white font-mono leading-none">
                  28°C
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Kolkata
                </div>
              </div>

              <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />

              <div className="text-right space-y-0.5">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {currentTime.date}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                  {currentTime.time}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DASHBOARD BODY CONTENT (KPI Cards, Risk Areas, Map, Orders, Feed)         */}
      {/* ========================================================================= */}
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-5 space-y-6">

        {/* TOP KPI CARDS (4 Stats with mini sparklines) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const sparkPath = generateSparkline(stat.points);

            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="relative bg-white dark:bg-[#111827] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.18)] hover:border-blue-400/50 dark:hover:border-cyan-500/40 transition-all duration-200 group overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono mt-0.5">
                        {stat.value}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Trend Pill & Sparkline */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {stat.change}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {stat.subtitle}
                    </span>
                  </div>

                  {/* Dynamic SVG Sparkline */}
                  <div className="w-[100px] h-[30px] flex items-center justify-end">
                    <svg
                      viewBox="0 0 110 36"
                      className="w-full h-full overflow-visible"
                    >
                      <path
                        d={sparkPath}
                        fill="none"
                        stroke={stat.sparklineColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300 group-hover:stroke-width-3"
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* MIDDLE ROW: Priority Risk Areas (Left) & Risk Area Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* 1. PRIORITY RISK AREAS (6 Columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-6 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Priority Risk Areas
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Areas ranked by number of reports submitted.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/live-city")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ranked Risk Areas List */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-between">
              {priorityAreas.slice(0, 5).map((area) => (
                <div
                  key={area.rank}
                  onClick={() => {
                    setSelectedHotspot(area);
                    if (setSelectedIncident && area.raw) {
                      setSelectedIncident(area.raw);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedHotspot?.rank === area.rank
                      ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs"
                      : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Number */}
                    <span className="w-4 text-center text-sm font-bold text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">
                      {area.rank}
                    </span>

                    {/* Area Thumbnail */}
                    <div className="w-11 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700">
                      <img
                        src={area.image}
                        alt={area.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/kolkata_heritage_sketch.jpg";
                        }}
                      />
                    </div>

                    {/* Area Name & Zone */}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {area.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {area.zone}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Reports Count */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 pl-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                        {area.reports} <span className="text-[10px] font-normal text-slate-500">reports</span>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${area.barColor}`}
                          style={{ width: `${Math.min(100, (area.reports / area.maxReports) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Severity Pill */}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${area.severityColor}`}>
                      {area.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 2. RISK AREA MAP (6 Columns on desktop - Sized to fill height without empty space) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="lg:col-span-6 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Risk Area Map
                  </h2>
                </div>
              </div>

              {/* Filter Selector */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="30d">Reports (Last 30 Days)</option>
                  <option value="7d">Reports (Last 7 Days)</option>
                  <option value="24h">Live Ground Sensors</option>
                </select>
              </div>
            </div>

            {/* Map Canvas Visualizer - Flex-1 to naturally occupy the entire card without void */}
            <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[330px] rounded-xl overflow-hidden bg-[#e0f2fe]/40 dark:bg-[#0b1626] border border-slate-200 dark:border-slate-800">
              <svg
                viewBox="0 0 500 320"
                preserveAspectRatio="none"
                className="w-full h-full object-cover select-none"
              >
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300/40 dark:text-slate-800/60" />
                  </pattern>
                  <radialGradient id="hotspot-glow-red" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="hotspot-glow-amber" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width="500" height="320" fill="url(#grid)" />

                {/* Hooghly River Flow Path */}
                <path
                  d="M 120 0 C 140 70, 90 140, 110 200 C 125 245, 90 285, 70 320"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="24"
                  strokeLinecap="round"
                  className="dark:stroke-blue-900/60 opacity-80"
                />
                <path
                  d="M 120 0 C 140 70, 90 140, 110 200 C 125 245, 90 285, 70 320"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="dark:stroke-cyan-800/80"
                />

                {/* Road Network Lines */}
                <path d="M 50 150 L 450 150" stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-800" />
                <path d="M 220 30 L 220 300" stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-800" />
                <path d="M 320 50 L 320 280" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-800" />
                <path d="M 110 190 L 380 250" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-800" />

                {/* Kolkata City Label */}
                <text
                  x="210"
                  y="165"
                  className="text-xs font-bold fill-slate-700 dark:fill-slate-300 select-none tracking-wide font-sans"
                >
                  Kolkata
                </text>

                {/* Dynamic Hotspot 1: Park St (Critical) */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedHotspot(priorityAreas[0]);
                    if (setSelectedIncident && priorityAreas[0]?.raw) setSelectedIncident(priorityAreas[0].raw);
                  }}
                >
                  <circle cx="235" cy="125" r="22" fill="url(#hotspot-glow-red)" className="animate-pulse" />
                  <circle cx="235" cy="125" r="10" fill="#ef4444" />
                  <circle cx="235" cy="125" r="4" fill="#ffffff" />
                </g>

                {/* Hotspot 2: Gariahat / Sector V (High) */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedHotspot(priorityAreas[1] || priorityAreas[0]);
                    if (setSelectedIncident && priorityAreas[1]?.raw) setSelectedIncident(priorityAreas[1].raw);
                  }}
                >
                  <circle cx="345" cy="110" r="18" fill="url(#hotspot-glow-amber)" />
                  <circle cx="345" cy="110" r="8" fill="#f97316" />
                  <circle cx="345" cy="110" r="3" fill="#ffffff" />
                </g>

                {/* Hotspot 3: Salt Lake (Medium) */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedHotspot(priorityAreas[2] || priorityAreas[0]);
                    if (setSelectedIncident && priorityAreas[2]?.raw) setSelectedIncident(priorityAreas[2].raw);
                  }}
                >
                  <circle cx="170" cy="250" r="14" fill="#fbbf24" opacity="0.3" />
                  <circle cx="170" cy="250" r="7" fill="#fbbf24" />
                  <circle cx="170" cy="250" r="2.5" fill="#ffffff" />
                </g>

                {/* Hotspot 4: Tollygunge (Medium) */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedHotspot(priorityAreas[3] || priorityAreas[0]);
                    if (setSelectedIncident && priorityAreas[3]?.raw) setSelectedIncident(priorityAreas[3].raw);
                  }}
                >
                  <circle cx="205" cy="210" r="12" fill="#3b82f6" opacity="0.3" />
                  <circle cx="205" cy="210" r="6" fill="#3b82f6" />
                  <circle cx="205" cy="210" r="2" fill="#ffffff" />
                </g>

                {/* Hotspot 5: Behala (Low) */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedHotspot(priorityAreas[4] || priorityAreas[0]);
                    if (setSelectedIncident && priorityAreas[4]?.raw) setSelectedIncident(priorityAreas[4].raw);
                  }}
                >
                  <circle cx="140" cy="270" r="12" fill="#38bdf8" opacity="0.3" />
                  <circle cx="140" cy="270" r="5" fill="#38bdf8" />
                </g>

                {/* Minor peripheral indicator dots */}
                <circle cx="180" cy="100" r="4" fill="#3b82f6" opacity="0.7" />
                <circle cx="270" cy="90" r="4" fill="#3b82f6" opacity="0.7" />
                <circle cx="345" cy="180" r="4" fill="#3b82f6" opacity="0.7" />
                <circle cx="270" cy="225" r="5" fill="#fbbf24" opacity="0.8" />
                <circle cx="310" cy="255" r="5" fill="#fbbf24" opacity="0.8" />
              </svg>

              {/* Floating Top 5 Summary Panel on Map Right */}
              <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-md max-w-[170px] space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Top 5 Areas by Reports
                </div>
                <div className="space-y-1 text-xs font-mono">
                  {priorityAreas.slice(0, 5).map((area, i) => (
                    <div
                      key={area.id || i}
                      onClick={() => {
                        setSelectedHotspot(area);
                        if (setSelectedIncident && area.raw) setSelectedIncident(area.raw);
                      }}
                      className={`flex items-center justify-between cursor-pointer hover:underline ${
                        i === 0 ? "text-rose-600 dark:text-rose-400 font-bold" :
                        i === 1 ? "text-orange-600 dark:text-orange-400 font-semibold" :
                        i === 2 ? "text-amber-600 dark:text-amber-400" :
                        i === 3 ? "text-blue-600 dark:text-blue-400" :
                        "text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      <span className="truncate max-w-[105px]">{i + 1}. {area.name.split(" ")[0]}</span>
                      <span className="font-semibold">{area.reports}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Map Controls Overlay */}
              <button
                onClick={() => navigate("/live-city")}
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                Open Live Telemetry Map
              </button>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM ROW: Active Work Orders (Left) & Recent Activity (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* 1. ACTIVE WORK ORDERS TABLE (7 Cols on desktop - Fully Wrapped with NO Scrollbar) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between"
          >
            <div>
              {/* Table Header */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Active Work Orders
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ongoing and recently assigned work orders.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/action-center")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Work Orders Table - Zero Scrollbars, Clean Column Layout with Wrapping */}
              <div className="w-full overflow-hidden">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-2 w-[14%] font-mono">#</th>
                      <th className="py-2.5 px-2 w-[28%]">Issue</th>
                      <th className="py-2.5 px-2 w-[23%]">Location</th>
                      <th className="py-2.5 px-2 w-[20%]">Assigned To</th>
                      <th className="py-2.5 px-2 w-[15%] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredWorkOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => navigate("/action-center")}
                      >
                        {/* Work Order ID */}
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-900 dark:text-slate-200">
                          {wo.id}
                        </td>

                        {/* Issue (Wrapped & Clean) */}
                        <td className="py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200 break-words leading-tight">
                          {wo.issue}
                        </td>

                        {/* Location */}
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 break-words leading-tight">
                          {wo.location}
                        </td>

                        {/* Assigned To */}
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 break-words leading-tight">
                          {wo.assignedTo}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-2 text-right">
                          {getStatusBadge(wo.statusVariant, wo.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* 2. RECENT ACTIVITY FEED (5 Cols on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between"
          >
            <div>
              {/* Feed Header */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Latest updates across reports, risk areas, and work orders.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/action-center")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timeline Feed List */}
              <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="relative flex items-start justify-between gap-3 group">
                      {/* Activity Dot Icon */}
                      <div
                        className={`absolute -left-6 top-0.5 p-1 rounded-full ${act.iconBg} ${act.iconColor} ring-4 ring-white dark:ring-[#111827]`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Content */}
                      <div className="space-y-0.5 pl-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                          {act.description}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex-shrink-0 pt-0.5">
                        {act.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboardView;
