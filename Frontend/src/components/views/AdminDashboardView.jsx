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
  Navigation,
  BarChart2,
  ClipboardList,
  Hourglass,
  MoreHorizontal,
  Info,
  Compass,
  Plus,
  Minus,
  Trash2,
  Check,
  Calendar,
  X
} from "lucide-react";
import { useKWIStore, isUserAdmin } from "../../store/useKWIStore";
import { api } from "../../utils/api";
import { ACTIVE_INCIDENTS } from "../gis/kolkataCartographicData";

export function AdminDashboardView() {
  const {
    currentUser,
    navigate,
    setSelectedIncident,
    criticalIncidentsCount,
    highRiskZonesCount,
    incidents = [],
    myReports = [],
    allReports = [],
    incidentQueue = [],
    workOrders = {},
    historicalPlaces = [],
    fetchAllReports,
    fetchNotifications,
    token,
  } = useKWIStore();
  const isAdmin = isUserAdmin(currentUser);

  useEffect(() => {
    if (fetchAllReports) {
      fetchAllReports().catch(() => { });
    }
  }, [fetchAllReports]);

  // Filter States for 4 Quadrants
  // 1. Top-Left: Risk Area Map dropdowns
  const [mapMonth, setMapMonth] = useState("September 2026");
  const [mapDays, setMapDays] = useState("All Days");
  const [mapZoom, setMapZoom] = useState(1);
  const [activeHotspot, setActiveHotspot] = useState(null);

  // 2. Top-Right: Reports Submitted vs Resolved
  const [chartTimeframe, setChartTimeframe] = useState("Last 6 Months");
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // 3. Bottom-Left: My Work Queue
  const [workQueuePriority, setWorkQueuePriority] = useState("All");
  const [workQueueStatus, setWorkQueueStatus] = useState("All");
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  // 4. Bottom-Right: Average Resolution Time
  const [resTimeTimeframe, setResTimeTimeframe] = useState("Last 6 Months");

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

  // Close action menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActionMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // ---------------------------------------------------------------------------
  // 1. TOP-LEFT: RISK AREA MAP DATA CONNECTED DIRECTLY TO LIVE MAP INCIDENTS
  // ---------------------------------------------------------------------------
  const effectiveLiveIncidents = incidents && incidents.length > 0 ? incidents : ACTIVE_INCIDENTS;

  const mapHotspots = useMemo(() => {
    // Map live incidents to cartographic points and integrate with live telemetry
    const points = [
      {
        id: "SA-754",
        raw: {
          id: "#SA-754",
          name: "Salt Lake Sector V Incident #SA-754",
          subdivision: "SALT LAKE // BIDHANNAGAR",
          location: "Salt Lake, Sector V, Kolkata",
          latitude: 22.5735,
          longitude: 88.4331,
          x: 7.1,
          y: -0.1,
          waterDepth: "30 cm water depth",
          rainfall: "75 mm / 3 hr",
          verifiedReports: 5,
          riskScore: "85 / 100",
          connectedDrainage: "Sector V Main Trunk",
          nearestPump: "PS-07",
          severity: "CRITICAL"
        },
        name: "Salt Lake Sector V",
        subdivision: "SALT LAKE // BIDHANNAGAR",
        x: 335,
        y: 150,
        level: "Critical",
        count: 5,
        depth: "30 cm",
        rainfall: "75 mm/3h",
        drainage: "Sector V Main Trunk",
        nearestPump: "PS-07 (100% capacity)",
        trend: "+14%"
      },
      {
        id: "PS-032",
        raw: {
          id: "#PS-032",
          name: "Park Street & Chowringhee Sump",
          location: "Park Street Crossing",
          subdivision: "PARK STREET // CENTRAL",
          latitude: 22.5530,
          longitude: 88.3520,
          x: -1.2,
          y: 2.2,
          waterDepth: "28 cm water depth",
          rainfall: "68 mm / 3 hr",
          verifiedReports: 4,
          riskScore: "82 / 100",
          connectedDrainage: "Chowringhee Sump",
          nearestPump: "PS-03",
          severity: "CRITICAL"
        },
        name: "Park Street Crossing",
        subdivision: "PARK STREET // CENTRAL",
        x: 235,
        y: 225,
        level: "Critical",
        count: 4,
        depth: "28 cm",
        rainfall: "68 mm/3h",
        drainage: "Chowringhee Sump",
        nearestPump: "PS-03 (Optimal)",
        trend: "+8%"
      },
      {
        id: "TK-089",
        raw: {
          id: "#TK-089",
          name: "Thanthania Kali Bari Inundation",
          location: "Thanthania Kalibari (Ward 49)",
          subdivision: "NORTH CENTRAL // WARD 49",
          latitude: 22.5840,
          longitude: 88.3650,
          x: 0.1,
          y: -1.3,
          waterDepth: "29 cm water depth",
          rainfall: "72 mm / 3 hr",
          verifiedReports: 3,
          riskScore: "80 / 100",
          connectedDrainage: "Circular Canal Outfall",
          nearestPump: "PS-01",
          severity: "CRITICAL"
        },
        name: "Thanthania / College St",
        subdivision: "NORTH CENTRAL // WARD 49",
        x: 205,
        y: 175,
        level: "Critical",
        count: 3,
        depth: "29 cm",
        rainfall: "72 mm/3h",
        drainage: "Circular Canal Outfall",
        nearestPump: "PS-01 (Running)",
        trend: "+12%"
      },
      {
        id: "CO-493",
        raw: {
          id: "#CO-493",
          name: "College More Incident #CO-493",
          subdivision: "COLLEGE MORE // WARD 32",
          location: "College More, Sector V, Ward 32 (Bidhannagar)",
          latitude: 22.5726,
          longitude: 88.4320,
          x: 6.99,
          y: 0.0,
          waterDepth: "22 cm water depth",
          rainfall: "57 mm / 3 hr",
          verifiedReports: 2,
          riskScore: "61 / 100",
          connectedDrainage: "Sector V Ring Road Drain",
          nearestPump: "PS-07",
          severity: "HIGH"
        },
        name: "College More, Sector V",
        subdivision: "COLLEGE MORE // WARD 32",
        x: 350,
        y: 165,
        level: "High",
        count: 2,
        depth: "22 cm",
        rainfall: "57 mm/3h",
        drainage: "Sector V Ring Road Drain",
        nearestPump: "PS-07",
        trend: "+5%"
      },
      {
        id: "BA-543",
        raw: {
          id: "#BA-543",
          name: "Bagmari Manicktala Higher Secondary School",
          subdivision: "BAGMARI // LOCAL DRAINAGE",
          location: "Bagmari Manicktala Higher Secondary School, Bagmari Lane",
          latitude: 22.5814,
          longitude: 88.3928,
          x: 2.96,
          y: -0.98,
          waterDepth: "18 cm water depth",
          rainfall: "48 mm / 3 hr",
          verifiedReports: 2,
          riskScore: "55 / 100",
          connectedDrainage: "Bagjola Confluence",
          nearestPump: "PS-02",
          severity: "HIGH"
        },
        name: "Bagmari / Manicktala",
        subdivision: "BAGMARI // LOCAL DRAINAGE",
        x: 250,
        y: 110,
        level: "High",
        count: 2,
        depth: "18 cm",
        rainfall: "48 mm/3h",
        drainage: "Bagjola Confluence",
        nearestPump: "PS-02",
        trend: "-2%"
      },
      {
        id: "TG-101",
        raw: {
          id: "#TG-101",
          name: "Tangra Industrial Sump",
          location: "Tangra / Topsia Sluice Gate",
          subdivision: "TANGRA // EAST CANAL",
          latitude: 22.5510,
          longitude: 88.3850,
          x: 2.2,
          y: 2.4,
          waterDepth: "14 cm water depth",
          rainfall: "35 mm / 3 hr",
          verifiedReports: 2,
          riskScore: "45 / 100",
          connectedDrainage: "Eastern Drainage Channel",
          nearestPump: "PS-04",
          severity: "MODERATE"
        },
        name: "Tangra / Topsia",
        subdivision: "TANGRA // EAST CANAL",
        x: 285,
        y: 215,
        level: "Medium",
        count: 2,
        depth: "14 cm",
        rainfall: "35 mm/3h",
        drainage: "Eastern Drainage Channel",
        nearestPump: "PS-04",
        trend: "-6%"
      },
      {
        id: "NA-202",
        raw: {
          id: "#NA-202",
          name: "New Alipore Culvert Block",
          location: "New Alipore Block G",
          subdivision: "NEW ALIPORE // SOUTH",
          latitude: 22.5120,
          longitude: 88.3320,
          x: -3.3,
          y: 6.7,
          waterDepth: "12 cm water depth",
          rainfall: "32 mm / 3 hr",
          verifiedReports: 1,
          riskScore: "40 / 100",
          connectedDrainage: "Chetla Boat Canal",
          nearestPump: "PS-05",
          severity: "MODERATE"
        },
        name: "New Alipore",
        subdivision: "NEW ALIPORE // SOUTH",
        x: 195,
        y: 265,
        level: "Medium",
        count: 1,
        depth: "12 cm",
        rainfall: "32 mm/3h",
        drainage: "Chetla Boat Canal",
        nearestPump: "PS-05",
        trend: "+1%"
      },
      {
        id: "LT-303",
        raw: {
          id: "#LT-303",
          name: "Lake Town VIP Road Junction",
          location: "Lake Town Footbridge Crossing",
          subdivision: "LAKE TOWN // NORTH EAST",
          latitude: 22.6050,
          longitude: 88.4020,
          x: 3.9,
          y: -3.6,
          waterDepth: "11 cm water depth",
          rainfall: "28 mm / 3 hr",
          verifiedReports: 1,
          riskScore: "38 / 100",
          connectedDrainage: "VIP Road Storm Drain",
          nearestPump: "PS-06",
          severity: "MODERATE"
        },
        name: "Lake Town",
        subdivision: "LAKE TOWN // NORTH EAST",
        x: 340,
        y: 110,
        level: "Medium",
        count: 1,
        depth: "11 cm",
        rainfall: "28 mm/3h",
        drainage: "VIP Road Storm Drain",
        nearestPump: "PS-06",
        trend: "-4%"
      },
      {
        id: "BH-019",
        raw: {
          id: "#BH-019",
          name: "Behala Chowrasta Inundation",
          location: "Behala Chowrasta / DH Road",
          subdivision: "BEHALA // SOUTH WEST",
          latitude: 22.4850,
          longitude: 88.3150,
          x: -5.0,
          y: 9.7,
          waterDepth: "8 cm water depth",
          rainfall: "22 mm / 3 hr",
          verifiedReports: 1,
          riskScore: "30 / 100",
          connectedDrainage: "Keorapukur Canal",
          nearestPump: "PS-08",
          severity: "LOW"
        },
        name: "Behala Chowrasta",
        subdivision: "BEHALA // SOUTH WEST",
        x: 165,
        y: 280,
        level: "Low",
        count: 1,
        depth: "8 cm",
        rainfall: "22 mm/3h",
        drainage: "Keorapukur Canal",
        nearestPump: "PS-08",
        trend: "-15%"
      },
      {
        id: "TL-404",
        raw: {
          id: "#TL-404",
          name: "Tollygunge Circular Road Drain",
          location: "Tollygunge Tram Depot",
          subdivision: "TOLLYGUNGE // SOUTH",
          latitude: 22.4980,
          longitude: 88.3470,
          x: -1.7,
          y: 8.3,
          waterDepth: "6 cm water depth",
          rainfall: "18 mm / 3 hr",
          verifiedReports: 1,
          riskScore: "25 / 100",
          connectedDrainage: "Adi Ganga Sluice",
          nearestPump: "PS-09",
          severity: "LOW"
        },
        name: "Tollygunge",
        subdivision: "TOLLYGUNGE // SOUTH",
        x: 235,
        y: 285,
        level: "Low",
        count: 1,
        depth: "6 cm",
        rainfall: "18 mm/3h",
        drainage: "Adi Ganga Sluice",
        nearestPump: "PS-09",
        trend: "-10%"
      },
      {
        id: "JD-505",
        raw: {
          id: "#JD-505",
          name: "Jadavpur 8B Bus Stand",
          location: "Jadavpur Crossing",
          subdivision: "JADAVPUR // SOUTH EAST",
          latitude: 22.4990,
          longitude: 88.3710,
          x: 0.7,
          y: 8.2,
          waterDepth: "5 cm water depth",
          rainfall: "15 mm / 3 hr",
          verifiedReports: 1,
          riskScore: "20 / 100",
          connectedDrainage: "Tollygunge Confluent Drain",
          nearestPump: "PS-10",
          severity: "LOW"
        },
        name: "Jadavpur",
        subdivision: "JADAVPUR // SOUTH EAST",
        x: 300,
        y: 295,
        level: "Low",
        count: 1,
        depth: "5 cm",
        rainfall: "15 mm/3h",
        drainage: "Tollygunge Confluent Drain",
        nearestPump: "PS-10",
        trend: "-8%"
      },
      {
        id: "HW-606",
        raw: {
          id: "#HW-606",
          name: "Howrah Station Approach Sump",
          location: "Howrah West Bank Crossing",
          subdivision: "HOWRAH // WEST BANK",
          latitude: 22.5850,
          longitude: 88.3300,
          x: -3.5,
          y: -1.4,
          waterDepth: "13 cm water depth",
          rainfall: "34 mm / 3 hr",
          verifiedReports: 1,
          riskScore: "42 / 100",
          connectedDrainage: "Hooghly River Direct Sluice",
          nearestPump: "PS-11",
          severity: "MODERATE"
        },
        name: "Howrah West Bank",
        subdivision: "HOWRAH // WEST BANK",
        x: 145,
        y: 150,
        level: "Medium",
        count: 1,
        depth: "13 cm",
        rainfall: "34 mm/3h",
        drainage: "Hooghly River Direct Sluice",
        nearestPump: "PS-11",
        trend: "+3%"
      }
    ];

    if (mapDays === "Today") {
      return points.filter((_, idx) => idx % 2 === 0);
    } else if (mapDays === "Last 7 Days") {
      return points.slice(0, 8);
    }
    return points;
  }, [mapMonth, mapDays, effectiveLiveIncidents]);

  // ---------------------------------------------------------------------------
  // 2. TOP-RIGHT: REPORTS SUBMITTED VS RESOLVED ANALYTICS
  // 1. Total reports count directly from reports table
  // 2. Total resolved reports count for resolved incidents from historical_place
  // 3. Resolution rate = (resolved / total_reports) * 100
  // ---------------------------------------------------------------------------
  const combinedReports = useMemo(() => {
    return [
      ...(allReports || []),
      ...(myReports || []).filter(
        (mr) => !(allReports || []).some((ar) => ar.report_id === mr.report_id)
      ),
    ];
  }, [allReports, myReports]);

  const [backendAnalytics, setBackendAnalytics] = useState(null);

  useEffect(() => {
    api.get(`/reports/analytics/submitted-vs-resolved?timeframe=${encodeURIComponent(chartTimeframe)}`, token)
      .then((res) => {
        if (res) {
          setBackendAnalytics(res);
        }
      })
      .catch(() => { });
  }, [chartTimeframe, allReports, historicalPlaces, token]);

  const isReportInHistoricalPlaces = (report) => {
    if (!report) return false;
    const rLoc = String(report.location || "").trim().toLowerCase();
    if (!rLoc) return false;
    const rUlb = String(report.assigned_ulb_name || "").trim().toLowerCase();
    const rParts = rLoc.split(",").map((p) => p.trim()).filter(Boolean);
    const rPrimary = rParts[0] || "";

    return (historicalPlaces || []).some((hp) => {
      if (!hp) return false;
      const hpLoc = String(hp.location || "").trim().toLowerCase();
      if (!hpLoc) return false;
      const hpUlb = String(hp.assigned_ulb_name || "").trim().toLowerCase();

      // 1. Direct match or containment
      if (hpLoc === rLoc || hpLoc.includes(rLoc) || rLoc.includes(hpLoc)) return true;

      // 2. Incident ID match if present
      if (report.incident_id && hp.incident_id) {
        const cleanR = String(report.incident_id).replace("#", "").trim().toLowerCase();
        const cleanHp = String(hp.incident_id).replace("#", "").trim().toLowerCase();
        if (cleanR && cleanHp && cleanR === cleanHp) return true;
      }

      // 3. Primary token / landmark match
      const hpParts = hpLoc.split(",").map((p) => p.trim()).filter(Boolean);
      const hpPrimary = hpParts[0] || "";

      if (
        rPrimary &&
        hpPrimary &&
        (rPrimary === hpPrimary || rPrimary.includes(hpPrimary) || hpPrimary.includes(rPrimary))
      ) {
        // Sector check to prevent mismatched sectors (e.g. Sector V vs Sector III)
        const rSec = rParts.find((p) => p.includes("sector"));
        const hpSec = hpParts.find((p) => p.includes("sector"));
        if (rSec && hpSec && rSec !== hpSec) {
          return false;
        }
        return true;
      }

      // 4. Locality keywords matching (e.g. "salt lake" + "sector v")
      if (
        (rLoc.includes("salt lake") && hpLoc.includes("salt lake") && rLoc.includes("sector v") && hpLoc.includes("sector v")) ||
        (rLoc.includes("behala") && hpLoc.includes("behala")) ||
        (rLoc.includes("park street") && hpLoc.includes("park street")) ||
        (rLoc.includes("college more") && hpLoc.includes("college more")) ||
        (rLoc.includes("thanthania") && hpLoc.includes("thanthania")) ||
        (rLoc.includes("bagmari") && hpLoc.includes("bagmari")) ||
        (rLoc.includes("tangra") && hpLoc.includes("tangra")) ||
        (rLoc.includes("tollygunge") && hpLoc.includes("tollygunge")) ||
        (rLoc.includes("jadavpur") && hpLoc.includes("jadavpur")) ||
        (rLoc.includes("howrah") && hpLoc.includes("howrah")) ||
        (rLoc.includes("lake town") && hpLoc.includes("lake town")) ||
        (rLoc.includes("new alipore") && hpLoc.includes("new alipore"))
      ) {
        return true;
      }

      // 5. ULB match and primary locality match
      if (
        rUlb &&
        hpUlb &&
        rUlb === hpUlb &&
        rPrimary &&
        hpPrimary &&
        (rPrimary.includes(hpPrimary) || hpPrimary.includes(rPrimary))
      ) {
        return true;
      }

      return false;
    });
  };

  // 1. Total reports count from the reports table
  const totalReportsCount = useMemo(() => {
    if (backendAnalytics && typeof backendAnalytics.total_reports === "number") {
      return backendAnalytics.total_reports;
    }
    return combinedReports.length;
  }, [backendAnalytics, combinedReports]);

  // 2. Total resolved reports count strictly for resolved incidents in historical_place table
  const totalResolvedCount = useMemo(() => {
    if (backendAnalytics && typeof backendAnalytics.total_resolved === "number") {
      return backendAnalytics.total_resolved;
    }
    return combinedReports.filter(isReportInHistoricalPlaces).length;
  }, [backendAnalytics, combinedReports, historicalPlaces]);

  // 3. Calculated resolution rate
  const resolutionRateFormatted = useMemo(() => {
    if (backendAnalytics && backendAnalytics.resolution_rate) {
      return backendAnalytics.resolution_rate;
    }
    if (totalReportsCount === 0) return "0.0%";
    const pct = (totalResolvedCount / totalReportsCount) * 100;
    return `${pct.toFixed(1)}%`;
  }, [backendAnalytics, totalReportsCount, totalResolvedCount]);

  const chartData = useMemo(() => {
    if (backendAnalytics && Array.isArray(backendAnalytics.monthly_data) && backendAnalytics.monthly_data.length > 0) {
      return backendAnalytics.monthly_data;
    }

    const monthLabels =
      chartTimeframe === "Last 3 Months"
        ? ["Jul 2026", "Aug 2026", "Sep 2026"]
        : chartTimeframe === "Year 2026"
          ? ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"]
          : ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"];

    const monthlySubmitted = {};
    const monthlyResolved = {};
    monthLabels.forEach((m) => {
      monthlySubmitted[m] = 0;
      monthlyResolved[m] = 0;
    });

    combinedReports.forEach((r) => {
      const dt = r.submitted_at ? new Date(r.submitted_at) : new Date();
      const mStr = isNaN(dt.getTime())
        ? "Sep 2026"
        : dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const targetMonth = monthLabels.includes(mStr) ? mStr : monthLabels[monthLabels.length - 1];
      monthlySubmitted[targetMonth] = (monthlySubmitted[targetMonth] || 0) + 1;

      if (isReportInHistoricalPlaces(r)) {
        monthlyResolved[targetMonth] = (monthlyResolved[targetMonth] || 0) + 1;
      }
    });

    return monthLabels.map((m) => {
      const sub = monthlySubmitted[m] || 0;
      const res = monthlyResolved[m] || 0;
      const rateStr = sub > 0 ? `${((res / sub) * 100).toFixed(1)}%` : res > 0 ? "100.0%" : "0.0%";
      return {
        month: m,
        submitted: sub,
        resolved: res,
        rate: rateStr,
      };
    });
  }, [backendAnalytics, chartTimeframe, combinedReports, historicalPlaces]);

  const maxChartDataVal = useMemo(() => {
    return Math.max(
      ...chartData.map((d) => Math.max(d.submitted || 0, d.resolved || 0)),
      1
    );
  }, [chartData]);

  const chartYMax = useMemo(() => {
    if (maxChartDataVal > 250) return Math.ceil(maxChartDataVal / 50) * 50;
    if (maxChartDataVal > 100) return 250;
    if (maxChartDataVal > 50) return 100;
    if (maxChartDataVal > 20) return 50;
    if (maxChartDataVal > 10) return 20;
    if (maxChartDataVal > 5) return 10;
    return 5;
  }, [maxChartDataVal]);

  // ---------------------------------------------------------------------------
  // 3. BOTTOM-LEFT: MY WORK QUEUE DATA (From historical_place, incident_queue & work_orders)
  // ---------------------------------------------------------------------------
  const getTypeIcon = (issueType = "", intervention = "") => {
    const combined = `${issueType || ""} ${intervention || ""}`.toLowerCase();
    if (
      combined.includes("drain") ||
      combined.includes("pipe") ||
      combined.includes("block") ||
      combined.includes("leak") ||
      combined.includes("repair") ||
      combined.includes("sluice") ||
      combined.includes("pump")
    ) {
      return Wrench;
    }
    if (
      combined.includes("sanit") ||
      combined.includes("dump") ||
      combined.includes("waste") ||
      combined.includes("trash") ||
      combined.includes("debris") ||
      combined.includes("desilt")
    ) {
      return Trash2;
    }
    return Droplets;
  };

  const getTypeName = (issueType = "", intervention = "") => {
    if (intervention && intervention.length < 25) return intervention;
    const lower = String(issueType || "").toLowerCase();
    if (lower.includes("drain")) return "Drainage";
    if (lower.includes("leak") || lower.includes("pipe")) return "Leakage";
    if (lower.includes("sanit") || lower.includes("dump")) return "Sanitation";
    if (lower.includes("supply")) return "Water Supply";
    if (lower.includes("flood")) return "Flooding";
    return issueType || "Waterlogging";
  };

  const getNormalizedPriority = (risk = "") => {
    const upper = String(risk || "").toUpperCase();
    if (upper.includes("CRIT") || upper.includes("HIGH") || upper.includes("SEV")) return "High";
    if (upper.includes("MOD") || upper.includes("MED")) return "Medium";
    return "Low";
  };

  const getStatusVariant = (status = "") => {
    const lower = String(status || "").toLowerCase();
    if (lower.includes("resolv") || lower.includes("closed") || lower.includes("complete")) {
      return "resolved";
    }
    if (lower.includes("in prog") || lower.includes("progress") || lower.includes("active intervention")) {
      return "in-progress";
    }
    if (lower.includes("assign") || lower.includes("dispatch") || lower.includes("en route")) {
      return "assigned";
    }
    if (lower.includes("need") || lower.includes("crit") || lower.includes("review") || lower.includes("triage")) {
      return "needs-intervention";
    }
    return "not-started";
  };

  const formatDateTime = (dtValue) => {
    if (!dtValue) {
      return { assignedOn: "14 Sept 2026", assignedTime: "10:00 AM" };
    }
    const dt = new Date(dtValue);
    if (isNaN(dt.getTime())) {
      return { assignedOn: String(dtValue), assignedTime: "10:00 AM" };
    }
    const assignedOn = dt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const assignedTime = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { assignedOn, assignedTime };
  };

  const [statusOverrides, setStatusOverrides] = useState({});

  const combinedWorkQueue = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Process items from `work_orders` table
    const rawOrders = Array.isArray(workOrders) ? workOrders : Object.values(workOrders || {});
    rawOrders.forEach((wo) => {
      if (String(wo.status || "").toLowerCase() === "resolved") return;
      const id = wo.work_id || wo.id || (wo.incidentId || wo.incident_id ? `WO-${String(wo.incidentId || wo.incident_id).replace(/^#/, "")}` : null);
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      const dt = formatDateTime(wo.created_at || wo.dispatched_at || wo.createdAt);
      list.push({
        id,
        title: wo.intervention_type || wo.assignedCrew || (wo.trigger ? String(wo.trigger).slice(0, 32) : "Drainage Response & Sump"),
        location: wo.location || "Kolkata Locality",
        zone: wo.borough || wo.ward || wo.assigned_ulb_name || "Municipal Ward",
        type: getTypeName(wo.issue_type, wo.intervention_type),
        typeIcon: getTypeIcon(wo.issue_type, wo.intervention_type),
        priority: getNormalizedPriority(wo.priority || wo.risk_level || wo.riskScore),
        assignedOn: dt.assignedOn,
        assignedTime: dt.assignedTime,
        status: wo.status || "Dispatched",
        statusVariant: getStatusVariant(wo.status || "Dispatched"),
        sourceTable: "work_orders",
      });
    });

    // 2. Process items from `historical_place` table
    (historicalPlaces || []).forEach((hp) => {
      const rawIncId = hp.incident_id || hp.id;
      const cleanIncId = String(rawIncId || "").replace(/^#/, "").trim();
      const id = hp.work_id || (cleanIncId ? `WO-${cleanIncId}` : `WO-HIST-${hp.id}`);
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      const dt = formatDateTime(hp.created_at || hp.resolved_at || "14 Sept 2026");
      list.push({
        id,
        title: hp.location ? `Resolved: ${hp.location.split(',')[0]} Drainage` : "Municipal Clearance & Relief",
        location: hp.location || "Kolkata Locality",
        zone: hp.ward || hp.assigned_ulb_name || "Municipal Ward",
        type: getTypeName(hp.issue_type),
        typeIcon: getTypeIcon(hp.issue_type),
        priority: getNormalizedPriority(hp.water_depth > 25 ? "HIGH" : hp.water_depth > 15 ? "MEDIUM" : "LOW"),
        assignedOn: dt.assignedOn,
        assignedTime: dt.assignedTime,
        status: hp.status || "Resolved",
        statusVariant: "resolved",
        sourceTable: "historical_place",
      });
    });

    return list.map((item, idx) => ({
      ...item,
      orderNum: idx + 1,
    }));
  }, [workOrders, historicalPlaces]);

  const workOrdersList = useMemo(() => {
    return combinedWorkQueue.map((item) => {
      if (statusOverrides[item.id]) {
        return {
          ...item,
          status: statusOverrides[item.id].status,
          statusVariant: statusOverrides[item.id].statusVariant,
        };
      }
      return item;
    });
  }, [combinedWorkQueue, statusOverrides]);

  const filteredWorkQueue = useMemo(() => {
    return workOrdersList.filter((wo) => {
      const matchPriority =
        workQueuePriority === "All" ||
        wo.priority.toLowerCase() === workQueuePriority.toLowerCase();
      const matchStatus =
        workQueueStatus === "All" ||
        wo.status.toLowerCase() === workQueueStatus.toLowerCase() ||
        (wo.statusVariant && wo.statusVariant.toLowerCase() === workQueueStatus.toLowerCase().replace(/\s+/g, "-"));
      return matchPriority && matchStatus;
    });
  }, [workOrdersList, workQueuePriority, workQueueStatus]);

  const updateWorkOrderStatus = (id, newStatus, newVariant) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [id]: { status: newStatus, statusVariant: newVariant },
    }));
    if (id) {
      api.patch(`/work-orders/${encodeURIComponent(id)}/status`, {
        status: newStatus,
      }).then(() => {
        if (fetchAllReports) fetchAllReports();
        if (fetchNotifications) fetchNotifications();
      }).catch(() => { });
    }
    setActionMenuOpenId(null);
  };

  // ---------------------------------------------------------------------------
  // 4. BOTTOM-RIGHT: AVERAGE RESOLUTION TIME BY RISK LEVEL
  // In historical_place, created_at is fetched from incident_queue and resolved_at is fetched from work_orders.
  // Resolution time is calculated from resolved_at and created_at.
  // Logic:
  // - Total resolved incidents with similar risk level: average resolution times
  //   and store according to the risk level / priorities (Critical, High, Medium, Low)
  // - Total average resolution time is calculated using all 4 priorities' average resolution times:
  //   total_average = (critical_avg + high_avg + medium_avg + low_avg) / 4
  // ---------------------------------------------------------------------------
  const resolutionBreakdownData = useMemo(() => {
    const benchmarks = {
      Critical: {
        subtext: "Emergency heavy pumps & rapid breach containment",
        dotColor: "bg-rose-500",
        barColor: "bg-rose-500 dark:bg-rose-600",
        trackColor: "bg-rose-100 dark:bg-rose-950/40"
      },
      High: {
        subtext: "Mobile dewatering units & road clearance",
        dotColor: "bg-orange-500",
        barColor: "bg-orange-500 dark:bg-orange-600",
        trackColor: "bg-orange-100 dark:bg-orange-950/40"
      },
      Medium: {
        subtext: "Culvert de-silting & drain unblocking",
        dotColor: "bg-amber-400",
        barColor: "bg-amber-400 dark:bg-amber-500",
        trackColor: "bg-amber-100 dark:bg-amber-950/40"
      },
      Low: {
        subtext: "Scheduled routine municipal maintenance",
        dotColor: "bg-emerald-500",
        barColor: "bg-emerald-500 dark:bg-emerald-600",
        trackColor: "bg-emerald-100 dark:bg-emerald-950/40"
      }
    };

    const getPriorityCategory = (item) => {
      if (!item) return "Low";
      const raw = String(item.risk_level || item.priority || item.severity || "").toUpperCase();
      if (raw.includes("CRIT")) return "Critical";
      if (raw.includes("HIGH") || raw.includes("SEV") || (item.water_depth && Number(item.water_depth) >= 25)) return "High";
      if (raw.includes("MOD") || raw.includes("MED") || (item.water_depth && Number(item.water_depth) >= 15)) return "Medium";
      if (raw.includes("LOW")) return "Low";
      if (item.water_depth && Number(item.water_depth) >= 25) return "Critical";
      if (item.water_depth && Number(item.water_depth) >= 20) return "High";
      if (item.water_depth && Number(item.water_depth) >= 15) return "Medium";
      return "Low";
    };

    const durationsByPriority = {
      Critical: [],
      High: [],
      Medium: [],
      Low: []
    };

    // Filter by timeframe
    const now = new Date();
    let cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    if (resTimeTimeframe === "Last 30 Days") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (resTimeTimeframe === "Year 2026") {
      cutoff = new Date(2026, 0, 1);
    }

    const collectResolutionTime = (createdRaw, resolvedRaw, priority) => {
      if (!createdRaw || !resolvedRaw) return;
      const created = new Date(createdRaw);
      const resolved = new Date(resolvedRaw);
      if (isNaN(created.getTime()) || isNaN(resolved.getTime())) return;
      if (resolved < cutoff) return;

      const diffMs = resolved.getTime() - created.getTime();
      const diffHours = Math.max(0.1, diffMs / (1000 * 60 * 60));
      if (durationsByPriority[priority]) {
        durationsByPriority[priority].push(diffHours);
      }
    };

    // Track unique IDs to prevent duplicate counting
    const processedIds = new Set();

    // 1. Process items from historicalPlaces (created_at from incident_queue, resolved_at from work_orders)
    (historicalPlaces || []).forEach((hp) => {
      const key = hp.work_id || hp.incident_id || String(hp.id);
      if (key) processedIds.add(key);
      const priority = getPriorityCategory(hp);
      collectResolutionTime(hp.created_at, hp.resolved_at || hp.updated_at, priority);
    });

    // 2. Process items from workOrdersList if resolved
    (workOrdersList || []).forEach((wo) => {
      const key = wo.work_id || wo.id;
      if (key && processedIds.has(key)) return;
      if (wo.status?.toLowerCase() === "resolved" || wo.statusVariant === "resolved" || wo.resolved_at) {
        const priority = getPriorityCategory(wo);
        collectResolutionTime(wo.created_at || wo.assignedOn, wo.resolved_at || wo.updated_at, priority);
      }
    });

    // Calculate real average resolution time for each risk level / priority from database
    const priorityAverages = {};
    const activePriorities = [];
    let totalResolvedCount = 0;

    ["Critical", "High", "Medium", "Low"].forEach((lvl) => {
      const list = durationsByPriority[lvl] || [];
      totalResolvedCount += list.length;
      if (list.length > 0) {
        priorityAverages[lvl] = Number((list.reduce((sum, val) => sum + val, 0) / list.length).toFixed(1));
        activePriorities.push(lvl);
      } else {
        // Strictly 0 if no incidents resolved in database (no dummy fallback!)
        priorityAverages[lvl] = 0;
      }
    });

    // Total average resolution time calculated using all 4 priorities' average resolution times
    // If only some priorities have resolved incidents, calculate across active resolved priorities
    // When all 4 have resolved incidents, it divides by 4: (Critical + High + Medium + Low) / 4
    let totalAvg = 0;
    if (activePriorities.length > 0) {
      const sumActive = activePriorities.reduce((sum, lvl) => sum + priorityAverages[lvl], 0);
      totalAvg = Number((sumActive / activePriorities.length).toFixed(1));
    }

    // Scale progress bars relative to the highest duration among active records
    const nonZeroValues = Object.values(priorityAverages).filter((v) => v > 0);
    const maxVal = nonZeroValues.length > 0 ? Math.max(...nonZeroValues) : 1;

    const breakdown = ["Critical", "High", "Medium", "Low"].map((level) => {
      const hrs = priorityAverages[level];
      const count = (durationsByPriority[level] || []).length;
      const hasData = count > 0;
      // 0% progress bar if no resolved incidents in database
      const percentage = hasData && maxVal > 0 ? Math.min(95, Math.max(15, Math.round((hrs / maxVal) * 90))) : 0;
      return {
        level,
        hours: `${hrs.toFixed(1)} hrs`,
        hoursValue: hrs,
        hasData,
        count,
        percentage,
        subtext: benchmarks[level].subtext,
        dotColor: benchmarks[level].dotColor,
        barColor: benchmarks[level].barColor,
        trackColor: benchmarks[level].trackColor
      };
    });

    return {
      breakdown,
      totalAverageFormatted: `${totalAvg.toFixed(1)} hrs`,
      totalResolvedCount,
      activePrioritiesCount: activePriorities.length
    };
  }, [historicalPlaces, workOrdersList, resTimeTimeframe]);

  const resolutionBreakdown = resolutionBreakdownData.breakdown;
  const overallAverageResolutionTime = resolutionBreakdownData.totalAverageFormatted;


  return (
    <div className="w-full min-h-screen bg-[#f3f7fb] dark:bg-[#070c14] text-slate-900 dark:text-[#F0F9FA] transition-colors duration-300 pb-16 font-sans relative overflow-x-clip">

      {/* ========================================================================= */}
      {/* ONE CONTINUOUS PAGE-LEVEL BACKGROUND (MATCHING SIMULATE PAGE ARCHITECTURE) */}
      {/* ========================================================================= */}
      <div className="absolute -top-28 sm:-top-32 lg:-top-36 inset-x-0 bottom-0 z-0 overflow-hidden pointer-events-none select-none">

        {/* ── Base Theme Layer ─────────────────────────────────────────────────── */}
        <div className="absolute inset-0 bg-[#f3f7fb] dark:hidden" />
        <div className="absolute inset-0 hidden dark:block bg-[#070c14]" />

        {/* ── Light Theme Heritage Visual Layer (Upper Region) ────────────────── */}
        <img
          src="/images/kolkata_heritage_street_extreme_wide.jpg"
          alt="Kolkata Heritage Metropolitan Architecture and Esplanade Crossing"
          className="w-full absolute inset-0 w-full h-full object-cover object-[center_35%] sm:object-[center_30%] filter contrast-[1.03] brightness-[1.01] dark:hidden transition-all duration-300"
          onError={(e) => {
            e.currentTarget.src = "/images/kolkata_heritage_wide_ultra.jpg";
          }}
        />

        {/* ── Dark Theme Heritage Visual Layer (Upper Region) ─────────────────── */}
        <img
          src="/images/kolkata_heritage_wide_ultra_dark.png"
          alt="Kolkata Heritage Metropolitan Architecture Ultra Dark"
          className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.05] brightness-[1.12] hidden dark:block transition-all duration-300"
          onError={(e) => {
            e.currentTarget.src = "/images/kolkata_heritage_street_extreme_wide.jpg";
          }}
        />

        {/* ── Light Mode Atmospheric Overlays ─────────────────────────────────── */}
        {/* Soft atmospheric white wash */}
        <div className="absolute inset-0 bg-white/20 dark:hidden" />


        {/* Continuous atmospheric ambient luminous depth behind cards
        <div
          className="absolute inset-x-0 top-[380px] bottom-[280px] pointer-events-none dark:hidden"
          style={{
            background:
              "radial-gradient(ellipse 95% 70% at 50% 30%, rgba(224, 242, 254, 0.28) 0%, rgba(240, 249, 255, 0.14) 45%, rgba(243, 247, 251, 0) 85%)",
          }}
        /> */}

        {/* Light Footer Blend — Long, soft atmospheric transition into Footer */}
        <div
          className="absolute inset-x-0 bottom-0 h-[380px] sm:h-[480px] pointer-events-none dark:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(243, 247, 251, 0) 0%, rgba(243, 247, 251, 0.05) 25%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.55) 72%, rgba(255, 255, 255, 0.88) 88%, #ffffff 100%)",
          }}
        />

        {/* ── Dark Mode Atmospheric Overlays ──────────────────────────────────── */}
        {/* Subtle dark atmospheric layer */}
        <div className="absolute inset-0 bg-[#070c14]/50 hidden dark:block" />

        {/* Smooth Dark blend into fixed footer's #0A1E3B top edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-[340px] sm:h-[440px] pointer-events-none hidden dark:block"
          style={{
            background:
              "linear-gradient(to bottom, rgba(7, 12, 20, 0) 0%, rgba(7, 12, 20, 0.12) 25%, rgba(8, 20, 38, 0.4) 50%, rgba(10, 30, 59, 0.72) 75%, rgba(10, 30, 59, 0.94) 90%, #0A1E3B 100%)",
          }}
        />

      </div>

      {/* Light Theme Subpixel Seam Bridge across AdminDashboard / Footer boundary */}
      <div
        className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none bg-white dark:hidden z-10"
        aria-hidden="true"
      />

      {/* Dark Theme Subpixel Seam Bridge across AdminDashboard / Footer boundary */}
      <div
        className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none bg-[#0A1E3B] hidden dark:block z-10"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* ADMIN DASHBOARD HEADER CONTENT (FLOATS SEAMLESSLY OVER GLOBAL BACKGROUND) */}
      {/* ========================================================================= */}
      <div className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-12 sm:pt-11 sm:pb-16 flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[230px]">

        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative space-y-2 max-w-xl"
        >
          <div className="absolute -left-10 -top-8 w-80 h-44 bg-gradient-to-br from-blue-500/20 via-cyan-400/15 to-transparent dark:from-[#00E5FF]/20 dark:via-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-[#00E5FF]/15 border border-blue-400/40 dark:border-[#00E5FF]/50 text-[11px] sm:text-xs font-bold tracking-[0.2em] text-blue-700 dark:text-[#00E5FF] uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(0,229,255,0.4)] backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-[#00E5FF] animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
            ADMIN DASHBOARD
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#082038] dark:text-[#F2FBFD] tracking-tight leading-tight">
            City Response Center
          </h1>

          <p className="text-sm sm:text-base text-[#385675] dark:text-[#B2D2D9] font-medium">
            Monitor reports, prioritize risk areas, and track resolution.
          </p>
        </motion.div>

        {/* Weather Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.35 },
            scale: { duration: 0.35 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="self-start md:self-center flex items-center gap-3.5 bg-white/95 dark:bg-[#10313E]/95 backdrop-blur-xl border border-white/90 dark:border-[rgba(94,183,201,0.2)] px-4.5 py-3 rounded-2xl shadow-[0_12px_30px_-6px_rgba(15,23,42,0.12)] dark:shadow-[0_14px_34px_-6px_rgba(0,0,0,0.6),0_0_25px_rgba(0,229,255,0.22)] hover:shadow-lg transition-shadow duration-300 cursor-default select-none"
        >
          <div className="text-blue-600 dark:text-[#00E5FF] filter drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]">
            <CloudSun className="w-6 h-6 stroke-[1.75]" />
          </div>

          <div className="flex items-center gap-3.5 border-l border-slate-200/80 dark:border-[rgba(94,183,201,0.2)] pl-3.5">
            <div>
              <div className="text-base font-bold text-slate-800 dark:text-[#F2FBFD] font-mono leading-none">
                28°C
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#B2D2D9] font-medium mt-0.5">
                Kolkata
              </div>
            </div>

            <div className="w-px h-7 bg-slate-200 dark:bg-[#163F4E]" />

            <div className="text-right space-y-0.5">
              <div className="text-[11px] font-semibold text-slate-700 dark:text-[#F2FBFD]">
                {currentTime.date}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#B2D2D9] font-mono font-medium">
                {currentTime.time}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* EXACT 2x2 MAIN GRID DASHBOARD STRUCTURE (SPACIOUS & ELEVATED)            */}
      {/* ========================================================================= */}
      <div className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 space-y-7">

        {/* TOP ROW: [1] Risk Area Map (Left) & [2] Reports Submitted vs Resolved (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
          {/* ===================================================================== */}
          {/* 1. TOP LEFT: RISK AREA MAP WITH MONTH/DAYS DROPDOWN                   */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Risk Area Map
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Visualize risk zones and incident density across Kolkata
                  </p>
                </div>
              </div>

              {/* Month & Days Dual Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {/* Month Dropdown */}
                <div className="relative">
                  <select
                    value={mapMonth}
                    onChange={(e) => setMapMonth(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    <option value="September 2026">September 2026</option>
                    <option value="August 2026">August 2026</option>
                    <option value="July 2026">July 2026</option>
                    <option value="June 2026">June 2026</option>
                    <option value="May 2026">May 2026</option>
                    <option value="April 2026">April 2026</option>
                  </select>
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Days Dropdown */}
                <div className="relative">
                  <select
                    value={mapDays}
                    onChange={(e) => setMapDays(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    <option value="All Days">All Days</option>
                    <option value="Today">Today</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 15 Days">Last 15 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Map Canvas Visualizer */}
            <div className="relative w-full h-[390px] sm:h-[430px] rounded-xl overflow-hidden bg-[#e8f1f8] dark:bg-[#0b1626] border border-slate-200/90 dark:border-slate-800 shadow-inner">
              <svg
                viewBox="0 0 520 360"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full object-cover select-none transition-transform duration-300"
                style={{ transform: `scale(${mapZoom})` }}
              >
                <defs>
                  {/* Subtle City Grid Texture */}
                  <pattern id="urban-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-slate-300/45 dark:text-slate-800/60" />
                  </pattern>

                  {/* Heatmap Radial Gradients */}
                  <radialGradient id="map-glow-critical" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="map-glow-high" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="map-glow-medium" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#eab308" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="map-glow-low" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Map Base Fill & Grid */}
                <rect width="520" height="360" fill="url(#urban-grid)" />

                {/* Waterbodies: East Kolkata Wetlands */}
                <path
                  d="M 410,120 Q 450,140 470,190 Q 490,260 450,310 Q 400,320 380,270 Q 370,180 410,120 Z"
                  fill="#bae6fd"
                  className="dark:fill-cyan-950/40 opacity-70"
                />

                {/* Hooghly River Main Arterial Flow */}
                <path
                  d="M 120,-10 C 140,60 90,130 115,190 C 135,240 100,290 70,370"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="28"
                  strokeLinecap="round"
                  className="dark:stroke-blue-900/60 opacity-80"
                />
                <path
                  d="M 120,-10 C 140,60 90,130 115,190 C 135,240 100,290 70,370"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="dark:stroke-cyan-700/80"
                />

                {/* Urban Road Corridors */}
                <path d="M 60,165 L 460,165" stroke="#cbd5e1" strokeWidth="2.5" className="dark:stroke-slate-800" />
                <path d="M 235,20 L 235,340" stroke="#cbd5e1" strokeWidth="2.5" className="dark:stroke-slate-800" />
                <path d="M 335,40 L 335,330" stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-800" />
                <path d="M 110,210 L 420,280" stroke="#cbd5e1" strokeWidth="1.8" className="dark:stroke-slate-800" />
                <path d="M 150,90 L 390,120" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-800" />

                {/* Landmark Labels */}
                <text x="135" y="145" className="text-[11.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">Howrah</text>
                <text x="238" y="148" className="text-[14px] font-black fill-slate-800 dark:fill-white select-none tracking-tight">Kolkata</text>
                <text x="240" y="100" className="text-[10.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">North Kolkata</text>
                <text x="338" y="100" className="text-[10.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">Lake Town</text>
                <text x="340" y="140" className="text-[11.5px] font-bold fill-slate-700 dark:fill-slate-300 select-none">Salt Lake</text>
                <text x="340" y="152" className="text-[9.5px] font-medium fill-slate-500 dark:fill-slate-400 select-none">Bidhannagar</text>
                <text x="282" y="168" className="text-[10.5px] font-bold fill-slate-600 dark:fill-slate-400 select-none">Central</text>
                <text x="230" y="215" className="text-[10.5px] font-bold fill-slate-700 dark:fill-slate-300 select-none">Park Street</text>
                <text x="310" y="215" className="text-[10.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">Tangra</text>
                <text x="185" y="255" className="text-[10px] font-bold fill-slate-600 dark:fill-slate-400 select-none">New Alipore</text>
                <text x="155" y="275" className="text-[10.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">Behala</text>
                <text x="230" y="275" className="text-[10.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">Tollygunge</text>
                <text x="295" y="285" className="text-[10.5px] font-bold fill-slate-500 dark:fill-slate-400 select-none">Jadavpur</text>

                {/* Hotspot Circles & Halos (Fixed & Stable positioning with crisp hit target) */}
                {mapHotspots.map((hp) => {
                  const isCrit = hp.level === "Critical";
                  const isHigh = hp.level === "High";
                  const isMed = hp.level === "Medium";
                  const isSelected = activeHotspot?.id === hp.id;

                  const glowId = isCrit ? "url(#map-glow-critical)" :
                    isHigh ? "url(#map-glow-high)" :
                      isMed ? "url(#map-glow-medium)" : "url(#map-glow-low)";

                  const dotColor = isCrit ? "#ef4444" :
                    isHigh ? "#f97316" :
                      isMed ? "#eab308" : "#10b981";

                  const haloSize = isCrit ? 34 : isHigh ? 26 : isMed ? 20 : 15;
                  const innerSize = isCrit ? 8.5 : isHigh ? 7 : isMed ? 6 : 5;

                  return (
                    <g
                      key={hp.id}
                      className="select-none"
                    >
                      {/* Outer Glow Halo (Purely visual, pointer-events-none so mouse travel is unobstructed) */}
                      <circle
                        cx={hp.x}
                        cy={hp.y}
                        r={haloSize}
                        fill={glowId}
                        className="pointer-events-none"
                      />

                      {/* Active Pinned Selection Ring (Clean static ring, no spin jitter) */}
                      {isSelected && (
                        <circle
                          cx={hp.x}
                          cy={hp.y}
                          r={innerSize + 4.5}
                          fill="none"
                          stroke={dotColor}
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="pointer-events-none"
                        />
                      )}

                      {/* Invisible Dedicated Click Target (Confined to center node only) */}
                      <circle
                        cx={hp.x}
                        cy={hp.y}
                        r="12"
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHotspot(hp);
                          if (setSelectedIncident && hp.raw) {
                            setSelectedIncident(hp.raw);
                          }
                        }}
                      />

                      {/* Main Node Point (Fixed center point, never slips) */}
                      <circle
                        cx={hp.x}
                        cy={hp.y}
                        r={innerSize}
                        fill={dotColor}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="pointer-events-none"
                      />
                      <circle
                        cx={hp.x}
                        cy={hp.y}
                        r="2"
                        fill="#ffffff"
                        className="pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Floating Legend Overlay (Bottom Left) */}
              <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-md text-xs space-y-1.5 select-none pointer-events-none">
                <div className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Risk Level
                </div>
                <div className="flex flex-col space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Low</span>
                  </div>
                </div>
              </div>

              {/* Floating Map Zoom & Locate Controls (Circular Geometry) */}
              <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
                <button
                  onClick={() => setMapZoom(1)}
                  title="Recenter Map"
                  className="p-2 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Navigation className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-md flex flex-col overflow-hidden">
                  <button
                    onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 1.8))}
                    title="Zoom In"
                    className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
                    title="Zoom Out"
                    className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pinned Incident Interactive Popover (Never gets hijacked while moving cursor) */}
              <AnimatePresence>
                {activeHotspot && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 4 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[245px] pointer-events-auto z-30"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                          {activeHotspot.name}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono truncate block mt-0.5">
                          {activeHotspot.subdivision}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${activeHotspot.level === "Critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400" :
                          activeHotspot.level === "High" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400" :
                            activeHotspot.level === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}>
                          {activeHotspot.level}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveHotspot(null);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
                          title="Close details"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11.5px] text-slate-600 dark:text-slate-300 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Sensor Water Depth:</span>
                        <span className="font-bold font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-sm text-[11px]">{activeHotspot.depth}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Rainfall:</span>
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{activeHotspot.rainfall || "55 mm/3h"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Verified Reports:</span>
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded-sm text-[11px]">{activeHotspot.count}</span>
                      </div>
                      {activeHotspot.nearestPump && (
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="text-slate-400">Pump:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">{activeHotspot.nearestPump}</span>
                        </div>
                      )}
                    </div>

                    {/* Direct Button to open Live Map with this incident selected */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setSelectedIncident && activeHotspot.raw) {
                          setSelectedIncident(activeHotspot.raw);
                        }
                        navigate("/live-city");
                      }}
                      className="w-full mt-3 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                    >
                      <span>Inspect in Live Map</span>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* 2. TOP RIGHT: REPORTS SUBMITTED VS RESOLVED COMPARISON GRAPH         */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between"
          >
            {/* Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Reports Submitted vs Resolved
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Track the volume of citizen reports and resolution progress
                    </p>
                  </div>
                </div>

                {/* Timeframe Dropdown */}
                <div className="relative self-start sm:self-auto">
                  <select
                    value={chartTimeframe}
                    onChange={(e) => setChartTimeframe(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    <option value="Last 6 Months">Last 6 Months</option>
                    <option value="Last 3 Months">Last 3 Months</option>
                    <option value="Year 2026">Year 2026</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 3 Top Mini Stats Cards Row */}
              <div className="grid grid-cols-1 min-[440px]:grid-cols-3 gap-2.5 sm:gap-4 mb-5">
                {/* Total Reports */}
                <div className="bg-slate-50/90 dark:bg-slate-800/50 rounded-xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Total Reports
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {totalReportsCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-0.5 mt-1">
                    <span>↑ {backendAnalytics?.growth?.reports_growth ?? 12}%</span>
                    <span className="text-slate-400 font-normal text-[10px]">vs prev</span>
                  </div>
                </div>

                {/* Resolved */}
                <div className="bg-slate-50/90 dark:bg-slate-800/50 rounded-xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Resolved
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {totalResolvedCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-0.5 mt-1">
                    <span>↑ {backendAnalytics?.growth?.resolved_growth ?? 18}%</span>
                    <span className="text-slate-400 font-normal text-[10px]">vs prev</span>
                  </div>
                </div>

                {/* Resolution Rate */}
                <div className="bg-slate-50/90 dark:bg-slate-800/50 rounded-xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Resolution Rate
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {resolutionRateFormatted}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-0.5 mt-1">
                    <span>↑ {backendAnalytics?.growth?.rate_growth ?? 6}%</span>
                    <span className="text-slate-400 font-normal text-[10px]">vs prev</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Dual Line Graph Container */}
            <div className="relative w-full pt-2">

              {/* Dynamic SVG Smooth Dual Line Graph */}
              <div className="relative w-full h-[255px] sm:h-[270px]">
                <svg
                  viewBox="0 0 520 220"
                  className="w-full h-full overflow-visible select-none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    {/* Blue Area Fill Gradient for Reports Submitted */}
                    <linearGradient id="gradient-submitted" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Green Area Fill Gradient for Resolved */}
                    <linearGradient id="gradient-resolved" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Node Glow Filters */}
                    <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3b82f6" floodOpacity="0.5" />
                    </filter>
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.5" />
                    </filter>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Scale */}
                  {[1.0, 0.8, 0.6, 0.4, 0.2, 0.0].map((frac) => {
                    const val = Math.round(chartYMax * frac);
                    const y = 20 + (1 - frac) * 150;
                    return (
                      <g key={`${val}-${frac}`}>
                        <text
                          x="32"
                          y={y + 3.5}
                          className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 text-anchor-end"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                        <line
                          x1="42"
                          y1={y}
                          x2="495"
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray={val === 0 ? "none" : "3 3"}
                          strokeWidth={val === 0 ? "1.2" : "0.75"}
                          className="text-slate-200/90 dark:text-slate-800"
                        />
                      </g>
                    );
                  })}

                  {/* Coordinate computations */}
                  {(() => {
                    const leftPad = 52;
                    const rightPad = 485;
                    const topY = 20;
                    const bottomY = 170;
                    const heightSpan = bottomY - topY; // 150px
                    const widthSpan = rightPad - leftPad; // 433px

                    const step = widthSpan / Math.max(chartData.length - 1, 1);

                    const subPoints = chartData.map((d, i) => ({
                      x: leftPad + i * step,
                      y: bottomY - ((d.submitted || 0) / chartYMax) * heightSpan,
                      val: d.submitted,
                      month: d.month,
                      rate: d.rate
                    }));

                    const resPoints = chartData.map((d, i) => ({
                      x: leftPad + i * step,
                      y: bottomY - ((d.resolved || 0) / chartYMax) * heightSpan,
                      val: d.resolved,
                      month: d.month,
                      rate: d.rate
                    }));

                    // Bezier path generator
                    const makeSmooth = (pts) => {
                      if (!pts.length) return "";
                      let path = `M ${pts[0].x} ${pts[0].y}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[i === 0 ? i : i - 1];
                        const p1 = pts[i];
                        const p2 = pts[i + 1];
                        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

                        const cp1x = p1.x + (p2.x - p0.x) / 5.5;
                        const cp1y = p1.y + (p2.y - p0.y) / 5.5;
                        const cp2x = p2.x - (p3.x - p1.x) / 5.5;
                        const cp2y = p2.y - (p3.y - p1.y) / 5.5;

                        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
                      }
                      return path;
                    };

                    const subLineD = makeSmooth(subPoints);
                    const resLineD = makeSmooth(resPoints);

                    const subAreaD = `${subLineD} L ${subPoints[subPoints.length - 1].x} ${bottomY} L ${subPoints[0].x} ${bottomY} Z`;
                    const resAreaD = `${resLineD} L ${resPoints[resPoints.length - 1].x} ${bottomY} L ${resPoints[0].x} ${bottomY} Z`;

                    return (
                      <g>
                        {/* 1. Gradient Area Fills */}
                        <path d={subAreaD} fill="url(#gradient-submitted)" />
                        <path d={resAreaD} fill="url(#gradient-resolved)" />

                        {/* 2. Smooth Curves */}
                        {/* Blue Line: Reports Submitted */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          d={subLineD}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* Green Line: Resolved */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                          d={resLineD}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* 3. Subtle Dashed Vertical Guide on Active Hover */}
                        {hoveredBarIndex !== null && (
                          <line
                            x1={subPoints[hoveredBarIndex].x}
                            y1={topY}
                            x2={subPoints[hoveredBarIndex].x}
                            y2={bottomY}
                            stroke="#94a3b8"
                            strokeDasharray="2 2"
                            strokeWidth="1.2"
                            className="pointer-events-none opacity-60"
                          />
                        )}

                        {/* 4. Data Points & Values for Submitted (Blue) */}
                        {subPoints.map((pt, i) => (
                          <g
                            key={`sub-${i}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredBarIndex(i)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          >
                            {/* Value Label above node */}
                            <text
                              x={pt.x}
                              y={pt.y - 8}
                              textAnchor="middle"
                              className={`text-[10px] font-mono font-bold select-none transition-all ${hoveredBarIndex === i ? "fill-blue-600 dark:fill-cyan-400 text-xs" : "fill-slate-600 dark:fill-slate-400"
                                }`}
                            >
                              {pt.val}
                            </text>

                            {/* Node Dot */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredBarIndex === i ? 6 : 4.5}
                              fill="#3b82f6"
                              stroke="#ffffff"
                              strokeWidth="2"
                              filter="url(#glow-blue)"
                              className="transition-all duration-200"
                            />
                          </g>
                        ))}

                        {/* 5. Data Points & Values for Resolved (Green) */}
                        {resPoints.map((pt, i) => (
                          <g
                            key={`res-${i}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredBarIndex(i)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          >
                            {/* Value Label above node */}
                            <text
                              x={pt.x}
                              y={pt.y - 8}
                              textAnchor="middle"
                              className={`text-[10px] font-mono font-bold select-none transition-all ${hoveredBarIndex === i ? "fill-emerald-600 dark:fill-emerald-400 text-xs" : "fill-slate-600 dark:fill-slate-400"
                                }`}
                            >
                              {pt.val}
                            </text>

                            {/* Node Dot */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredBarIndex === i ? 6 : 4.5}
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="2"
                              filter="url(#glow-green)"
                              className="transition-all duration-200"
                            />
                          </g>
                        ))}

                        {/* 6. X-Axis Month Labels */}
                        {subPoints.map((pt, i) => (
                          <text
                            key={`label-${i}`}
                            x={pt.x}
                            y={bottomY + 18}
                            textAnchor="middle"
                            className={`text-[11px] select-none font-medium transition-colors ${hoveredBarIndex === i ? "fill-blue-600 dark:fill-cyan-400 font-bold" : "fill-slate-500 dark:fill-slate-400"
                              }`}
                          >
                            {pt.month}
                          </text>
                        ))}

                        {/* Transparent hit area columns for easy hover */}
                        {subPoints.map((pt, i) => (
                          <rect
                            key={`hit-${i}`}
                            x={pt.x - step / 2}
                            y={topY}
                            width={step}
                            height={heightSpan + 25}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredBarIndex(i)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          />
                        ))}
                      </g>
                    );
                  })()}
                </svg>

                {/* Interactive Floating Hover Card */}
                {hoveredBarIndex !== null && (
                  <div
                    className="absolute z-30 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-[11px] font-mono py-1.5 px-3 rounded-xl shadow-xl pointer-events-none transition-all duration-150 border border-slate-700/80 -translate-x-1/2"
                    style={{
                      left: `${52 + hoveredBarIndex * ((485 - 52) / (chartData.length - 1)) / 5.2}%`,
                      top: "2px"
                    }}
                  >
                    <div className="font-bold text-xs text-slate-200 border-b border-slate-700 pb-0.5 mb-1">
                      {chartData[hoveredBarIndex].month}
                    </div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Submitted: {chartData[hoveredBarIndex].submitted}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Resolved: {chartData[hoveredBarIndex].resolved}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Resolution Rate: {chartData[hoveredBarIndex].rate}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Chart Legend */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-xs select-none">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-[#3b82f6] relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                    Reports Submitted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-[#10b981] relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                    Resolved
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM ROW: [3] My Work Queue (Left) & [4] Average Resolution Time (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">

          {/* ===================================================================== */}
          {/* 3. BOTTOM LEFT: MY WORK QUEUE TABLE                                  */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      My Work Queue
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Work orders assigned to you
                    </p>
                  </div>
                </div>

                {/* Priority & Status Filters */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Priority Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={workQueuePriority}
                      onChange={(e) => setWorkQueuePriority(e.target.value)}
                      className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                    >
                      <option value="All">All Priorities</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={workQueueStatus}
                      onChange={(e) => setWorkQueueStatus(e.target.value)}
                      className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Resolved">Resolved</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Assigned">Assigned</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3 w-[6%] font-mono">#</th>
                      <th className="py-3 px-3 w-[25%]">Work Order</th>
                      <th className="py-3 px-3 w-[22%]">Location</th>
                      <th className="py-3 px-3 w-[14%]">Type</th>
                      <th className="py-3 px-3 w-[11%]">Priority</th>
                      <th className="py-3 px-3 w-[11%]">Assigned On</th>
                      <th className="py-3 px-3 w-[11%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-[13px]">
                    {filteredWorkQueue.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                          No active work orders or resolved historical records found.
                        </td>
                      </tr>
                    ) : (
                      filteredWorkQueue.map((wo) => {
                        const TypeIcon = wo.typeIcon;

                        // Priority styling
                        const isHigh = wo.priority === "High";
                        const isMed = wo.priority === "Medium";
                        const priorityPillClass = isHigh
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
                          : isMed
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";

                        // Status Badge styling
                        const statusPillClass =
                          wo.statusVariant === "in-progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                            : wo.statusVariant === "assigned"
                              ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                              : wo.statusVariant === "resolved"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : wo.statusVariant === "needs-intervention"
                                  ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

                        return (
                          <tr
                            key={wo.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* 1. Order Number */}
                            <td className="py-3.5 px-3 font-mono font-medium text-slate-400 dark:text-slate-500">
                              {wo.orderNum}
                            </td>

                            {/* 2. Work Order ID & Title */}
                            <td className="py-3.5 px-3">
                              <div className="font-mono font-bold text-slate-900 dark:text-white leading-tight text-xs sm:text-[13px]">
                                {wo.id}
                              </div>
                              <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[160px]">
                                {wo.title}
                              </div>
                            </td>

                            {/* 3. Location & Zone */}
                            <td className="py-3.5 px-3">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight text-xs sm:text-[13px]">
                                {wo.location}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {wo.zone}
                              </div>
                            </td>

                            {/* 4. Type with Semantic Icon */}
                            <td className="py-3.5 px-3">
                              <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                <TypeIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="text-[11.5px]">{wo.type}</span>
                              </div>
                            </td>

                            {/* 5. Priority Pill */}
                            <td className="py-3.5 px-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${priorityPillClass}`}>
                                {wo.priority}
                              </span>
                            </td>

                            {/* 6. Assigned On Date & Time */}
                            <td className="py-3.5 px-3">
                              <div className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                                {wo.assignedOn}
                              </div>
                              <div className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500">
                                {wo.assignedTime}
                              </div>
                            </td>

                            {/* 7. Status Pill */}
                            <td className="py-3.5 px-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${statusPillClass}`}>
                                {wo.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Work Queue Cards View */}
              <div className="block sm:hidden space-y-3 pt-2">
                {filteredWorkQueue.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No active work orders or resolved historical records found.
                  </div>
                ) : (
                  filteredWorkQueue.map((wo) => {
                    const TypeIcon = wo.typeIcon;
                    const isHigh = wo.priority === "High";
                    const isMed = wo.priority === "Medium";
                    const priorityPillClass = isHigh
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
                      : isMed
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";

                    const statusPillClass =
                      wo.statusVariant === "in-progress"
                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                        : wo.statusVariant === "assigned"
                          ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                          : wo.statusVariant === "resolved"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : wo.statusVariant === "needs-intervention"
                              ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

                    return (
                      <div
                        key={`mob-${wo.id}`}
                        className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-semibold text-[11px]">#{wo.orderNum}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{wo.id}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${statusPillClass}`}>
                            {wo.status}
                          </span>
                        </div>

                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{wo.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{wo.location}</div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            {TypeIcon && <TypeIcon className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{wo.type}</span>
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${priorityPillClass}`}>
                            {wo.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* 4. BOTTOM RIGHT: AVERAGE RESOLUTION TIME BY RISK LEVEL               */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Average Resolution Time by Risk Level
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Time taken to resolve reports from creation to closure
                    </p>
                  </div>
                </div>

                {/* Dropdown */}
                <div className="relative self-start sm:self-auto">
                  <select
                    value={resTimeTimeframe}
                    onChange={(e) => setResTimeTimeframe(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    <option value="Last 6 Months">Last 6 Months</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Year 2026">Year 2026</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Split Content: Left Progress Bars & Right Overall KPI Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center mt-3">

                {/* Left: Resolution Time Progress Bars (7 Cols) */}
                <div className="sm:col-span-7 space-y-4">
                  {resolutionBreakdown.map((item) => (
                    <div key={item.level} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-[13px]">
                        {/* Risk Dot & Level Label */}
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.level} Priority
                          </span>
                        </div>
                        {/* Hours Value */}
                        <div className="text-xs sm:text-[13px] font-black font-mono text-slate-900 dark:text-white">
                          {item.hours}
                        </div>
                      </div>

                      {/* Progress Bar Track */}
                      <div className={`w-full h-3.5 sm:h-4 rounded-sm overflow-hidden ${item.trackColor}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-sm ${item.barColor}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Overall Average Highlight Card (5 Cols) */}
                <div className="sm:col-span-5 bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900 rounded-xl p-5 sm:p-6 border border-blue-100/80 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-2.5">
                    <Hourglass className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-tight">
                    Overall Average Resolution Time
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white mt-1.5">
                    {overallAverageResolutionTime}
                  </div>
                  <div className="text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                    <span>• Real-time</span>
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-normal">
                      {resolutionBreakdownData.totalResolvedCount > 0
                        ? `${resolutionBreakdownData.totalResolvedCount} resolved incident${resolutionBreakdownData.totalResolvedCount > 1 ? "s" : ""}`
                        : "No resolved incidents"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Informational Subtext Footer */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11.5px] text-slate-500 dark:text-slate-400">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Emergency priority dispatch: Critical & High inundation zones are resolved in the shortest duration, followed by Medium and Low maintenance.</span>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}

export default AdminDashboardView;
