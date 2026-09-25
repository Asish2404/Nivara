import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Clock,
  Search,
  Plus,
  Flag,
  MapPin,
  ChevronDown,
  Waves,
  Eye,
  MoreVertical,
  Droplet,
  Bot,
  Truck,
  RotateCw,
  X,
  Wrench,
  AlertTriangle,
  ExternalLink,
  Copy,
  Calendar,
  Filter,
  Leaf,
  Users,
  BarChart3,
  Heart,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { resolveApiAssetUrl } from "../../utils/api";
import {
  formatDate,
  formatTime12Hour as formatTime,
  formatDateTime12Hour,
} from "../../utils/dateTimeUtils";

const HERO_TWILIGHT_BG = "/textures/kolkata_howrah_sunset_4k.jpg";



/* Normalize report status to standard display keys */
function normalizeStatus(statusStr) {
  const s = (statusStr || "").toLowerCase().trim();
  if (s.includes("in progress") || s.includes("progress")) return "In Progress";
  if (s.includes("verif")) return "Verified";
  if (s.includes("dispatch")) return "Dispatched";
  if (s.includes("resolv")) return "Resolved";
  if (s.includes("review") || s.includes("analy") || s.includes("pending")) return "Under Review";
  return statusStr || "Under Review";
}

/* Status styling aligned with reference mockup */
const STATUS_CONFIG = {
  Verified: {
    label: "Verified",
    bg: "bg-[#eafaf0] dark:bg-emerald-500/15",
    text: "text-[#16a34a] dark:text-emerald-300",
    border: "border-[#bbf2d0] dark:border-emerald-500/30",
    icon: CheckCircle2,
    iconColor: "text-[#16a34a] dark:text-emerald-400",
    barColor: "bg-[#22c55e]",
  },
  Dispatched: {
    label: "Dispatched",
    bg: "bg-[#edf5ff] dark:bg-blue-500/15",
    text: "text-[#2563eb] dark:text-blue-300",
    border: "border-[#cce1ff] dark:border-blue-500/30",
    icon: Truck,
    iconColor: "text-[#2563eb] dark:text-blue-400",
    barColor: "bg-[#3b82f6]",
  },
  "In Progress": {
    label: "In Progress",
    bg: "bg-[#fff7ed] dark:bg-amber-500/15",
    text: "text-[#ea580c] dark:text-amber-300",
    border: "border-[#fed7aa] dark:border-amber-500/30",
    icon: Wrench,
    iconColor: "text-[#ea580c] dark:text-amber-400",
    barColor: "bg-[#f97316]",
  },
  "Under Review": {
    label: "Under Review",
    bg: "bg-[#fff8eb] dark:bg-amber-500/15",
    text: "text-[#d97706] dark:text-amber-300",
    border: "border-[#fedfa6] dark:border-amber-500/30",
    icon: Clock,
    iconColor: "text-[#d97706] dark:text-amber-400",
    barColor: "bg-[#f59e0b]",
  },
  Resolved: {
    label: "Resolved",
    bg: "bg-[#eaf8f4] dark:bg-teal-500/15",
    text: "text-[#0d9488] dark:text-teal-300",
    border: "border-[#bbf0e4] dark:border-teal-500/30",
    icon: Flag,
    iconColor: "text-[#0d9488] dark:text-teal-400",
    barColor: "bg-[#14b8a6]",
  },
};

/* Issue type styling */
const ISSUE_TYPE_CONFIG = {
  Waterlogging: {
    icon: Waves,
    bg: "bg-[#edf7ff] dark:bg-sky-500/15",
    text: "text-[#0284c7] dark:text-sky-300",
    border: "border-[#cae8ff] dark:border-sky-500/30",
    iconColor: "text-[#0284c7] dark:text-sky-400",
  },
  "Drain Blockage": {
    icon: Wrench,
    bg: "bg-[#fff7ed] dark:bg-amber-500/15",
    text: "text-[#ea580c] dark:text-amber-300",
    border: "border-[#ffedd5] dark:border-amber-500/30",
    iconColor: "text-[#ea580c] dark:text-amber-400",
  },
  Overflow: {
    icon: AlertTriangle,
    bg: "bg-[#fef2f2] dark:bg-rose-500/15",
    text: "text-[#e11d48] dark:text-rose-300",
    border: "border-[#fecdd3] dark:border-rose-500/30",
    iconColor: "text-[#e11d48] dark:text-rose-400",
  },
};

/* Verification pipeline stages for details modal */
const PIPELINE = [
  { key: "Submitted", label: "Submitted", icon: FileText },
  { key: "AI Analysis", label: "AI Analysis", icon: Bot },
  { key: "Verified", label: "Verified", icon: ShieldCheck },
  { key: "Review", label: "Review", icon: Clock },
  { key: "Dispatch", label: "Dispatch", icon: Truck },
  { key: "In Progress", label: "In Progress", icon: Wrench },
  { key: "Resolved", label: "Resolved", icon: Flag },
];

function resolveReportImage(report) {
  const url = report?.imageUrl || report?.image_url || report?.original_image;
  if (!url) return "";
  if (url.startsWith("data:") || /^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/images/") || url.startsWith("/textures/")) return url;
  return resolveApiAssetUrl(url);
}


/* ================================================================ */
/*  MAIN COMPONENT                                                  */
/* ================================================================ */
export function MySubmittedReports() {
  const { navigate, currentUser, myReports, fetchMyReports } = useKWIStore();

  const [activeTab, setActiveTab] = useState("All Reports");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Today");
  const [sortField, setSortField] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Poll backend reports from the reports database table
  useEffect(() => {
    fetchMyReports();
    const interval = setInterval(() => {
      fetchMyReports();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchMyReports]);

  // Determine active report list strictly from reports database table (no dummy fallback)
  const activeReportsList = useMemo(() => {
    return Array.isArray(myReports) ? myReports : [];
  }, [myReports]);

  // Compute live summary counts
  const summaryCounts = useMemo(() => {
    const total = activeReportsList.length;
    let verified = 0;
    let review = 0;
    let dispatched = 0;

    activeReportsList.forEach((r) => {
      const s = normalizeStatus(r.status);
      if (s === "Verified") verified++;
      else if (s === "Dispatched" || s === "In Progress") dispatched++;
      else if (s === "Under Review") review++;
    });

    return { total, verified, review, dispatched };
  }, [activeReportsList]);

  // Filter & sort
  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const daysMap = {
      "Today": 1,
      "Last 7 Days": 7,
      "Last 3 Months": 90,
      "Last 6 Months": 180,
      "Last Year": 365,
      "All Time": null,
    };
    let cutoffTs = null;
    if (dateFilter === "Today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      cutoffTs = startOfToday.getTime();
    } else if (daysMap[dateFilter] != null) {
      cutoffTs = now - daysMap[dateFilter] * 86400000;
    }

    const list = activeReportsList.filter((r) => {
      const normStatus = normalizeStatus(r.status);
      const statusMatch = activeTab === "All Reports" || normStatus === activeTab;
      const termMatch =
        !q ||
        (r.report_id || r.reportId || "").toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        (r.sub_location || "").toLowerCase().includes(q) ||
        (r.issue_type || r.issueType || "").toLowerCase().includes(q) ||
        normStatus.toLowerCase().includes(q);

      const submittedTime = r.submitted_at || r.submittedAt;
      const dateMatch =
        cutoffTs == null ||
        !submittedTime ||
        new Date(submittedTime).getTime() >= cutoffTs;

      return statusMatch && termMatch && dateMatch;
    });

    return list.sort((a, b) => {
      let valA = a[sortField] ?? a.submitted_at ?? 0;
      let valB = b[sortField] ?? b.submitted_at ?? 0;
      if (sortField === "submitted_at") {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      if (sortOrder === "asc") {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });
  }, [activeReportsList, activeTab, search, dateFilter, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (fetchMyReports) {
      await fetchMyReports();
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleNewReport = () => {
    navigate("/reports");
  };

  return (
    <div className="relative w-full bg-[#f4f7fb] dark:bg-[#0A1E3B] text-slate-800 dark:text-[#F0F9FA] font-sans min-h-screen selection:bg-cyan-100 selection:text-cyan-900 pb-20">
      {/* ============================================================ */}
      {/* 1. CINEMATIC RIVERSIDE DUSK PANORAMA HERO BANNER             */}
      {/* State-of-the-Art Frosted Glassmorphism Architecture          */}
      {/* ============================================================ */}
      <header className="relative w-full overflow-hidden bg-[#071326] min-h-0 sm:min-h-[420px] lg:min-h-[490px] flex items-center select-none isolate">
        {/* Authentic 4K Ultra-Crisp Howrah Bridge Sunset Photography */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={HERO_TWILIGHT_BG}
            alt="Kolkata Howrah Bridge 4K Sunset Photography"
            className="w-full h-full object-cover object-[center_36%] filter brightness-[0.98] contrast-[1.06]"
          />
          {/* Subtle cinematic gradient vignette for depth and text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#f4f7fb] dark:to-[#0A1E3B] h-28 bottom-0 top-auto" />
        </div>

        {/* Floating Glassmorphic Content Containers */}
        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-2.5 min-[380px]:px-3.5 sm:px-6 lg:px-8 py-5 sm:py-14 pb-8 sm:pb-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-8">
          {/* Left Column: Frosted Glass Hero Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[20px] sm:rounded-[32px] p-3.5 min-[380px]:p-4.5 sm:p-8 md:p-9 max-w-2xl bg-slate-950/75 dark:bg-[#061820]/80 backdrop-blur-2xl border border-white/20 dark:border-[rgba(94,183,201,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.45)] text-left"
          >
            {/* Ambient subtle cyan glow corner */}
            <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[9px] sm:text-[10px] font-extrabold tracking-[0.2em] sm:tracking-[0.25em] uppercase font-mono mb-2.5 sm:mb-3.5 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <span>Citizen Reporting</span>
            </div>

            {/* Main Title - Unified Modern Sans */}
            <h1 className="text-xl min-[360px]:text-2xl sm:text-4xl lg:text-[45px] font-extrabold tracking-tight text-white leading-[1.1] font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              My Submitted{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-200 to-white">
                Reports
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-1.5 sm:mt-2.5 text-[11px] min-[360px]:text-xs sm:text-sm md:text-base font-medium text-white/90 max-w-xl leading-relaxed drop-shadow-sm font-sans">
              Your reports make Kolkata cleaner, healthier and more water-resilient.
            </p>

            {/* 4 Frosted Glass Value Badges */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-[380px]:gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-xl bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="text-left min-w-0 truncate">
                  <div className="text-[9.5px] sm:text-[11px] font-bold text-white leading-tight truncate font-sans">Cleaner City</div>
                  <div className="text-[8px] sm:text-[9px] text-white/70 truncate font-sans">Report issues</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-xl bg-blue-400/25 border border-blue-300/40 flex items-center justify-center text-blue-300 shrink-0">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="text-left min-w-0 truncate">
                  <div className="text-[9.5px] sm:text-[11px] font-bold text-white leading-tight truncate font-sans">Safer Comm.</div>
                  <div className="text-[8px] sm:text-[9px] text-white/70 truncate font-sans">Faster action</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-xl bg-cyan-400/25 border border-cyan-300/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="text-left min-w-0 truncate">
                  <div className="text-[9.5px] sm:text-[11px] font-bold text-white leading-tight truncate font-sans">Governance</div>
                  <div className="text-[8px] sm:text-[9px] text-white/70 truncate font-sans">Real impact</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-xl bg-rose-400/25 border border-rose-300/40 flex items-center justify-center text-rose-300 shrink-0">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="text-left min-w-0 truncate">
                  <div className="text-[9.5px] sm:text-[11px] font-bold text-white leading-tight truncate font-sans">Tomorrow</div>
                  <div className="text-[8px] sm:text-[9px] text-white/70 truncate font-sans">Together</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Frosted Glass Quote Card (Comfortable spacing on mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-start lg:items-end shrink-0 w-full lg:w-auto mt-2 lg:mt-0"
          >
            <div className="relative rounded-2xl sm:rounded-[24px] p-3.5 min-[380px]:p-4 sm:p-6 w-full max-w-full sm:max-w-[300px] bg-slate-950/75 dark:bg-[#030F14]/[0.85] backdrop-blur-2xl border border-white/20 dark:border-[rgba(94,183,201,0.2)] shadow-[0_16px_45px_rgba(0,0,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)] text-left text-white overflow-hidden">
              <div className="text-2xl sm:text-3xl text-cyan-300 font-sans font-bold leading-none mb-1.5 sm:mb-2 select-none">
                “
              </div>
              <p className="text-[11px] min-[360px]:text-xs sm:text-[13px] text-white/95 font-medium leading-relaxed drop-shadow-sm font-sans">
                A cleaner Kolkata flows from informed citizens.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-white/20">
                <span className="w-5 sm:w-6 h-[1px] bg-white/35 inline-block" />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-white/90 uppercase font-sans">
                  KMC
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. REPORT SUMMARY CARDS (DYNAMIC 4-CARD METRIC GRID)         */}
      {/* Floating frosted glass cards with radiant gradient sparkline */}
      {/* ============================================================ */}
      <section className="relative z-10 max-w-[1360px] mx-auto px-2.5 min-[380px]:px-3.5 sm:px-6 lg:px-8 mt-4 sm:-mt-14 md:-mt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 min-[380px]:gap-2.5 sm:gap-5">
          {/* Card 1: Total Reports */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-2xl sm:rounded-[24px] bg-white dark:bg-[#10313E] backdrop-blur-xl p-3 min-[380px]:p-3.5 sm:p-5 border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#edf5ff] dark:bg-blue-500/15 border border-[#d5e6ff] dark:border-blue-500/20 flex items-center justify-center text-[#2563eb] dark:text-[#38BDF8] shrink-0 shadow-xs">
                <FileText className="w-4.5 h-4.5 min-[380px]:w-5 min-[380px]:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl min-[380px]:text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2FBFD] leading-none font-sans">
                  {summaryCounts.total}
                </div>
                <div className="text-[11px] min-[380px]:text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-0.5 sm:mt-1 truncate">
                  Total Reports
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400 dark:text-[#6D949D]">
                  Reports submitted by you
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="hidden sm:block w-16 h-9 shrink-0" fill="none">
              <defs>
                <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2,24 Q 18,12 34,20 T 68,6 L 68,32 L 2,32 Z" fill="url(#sparkBlue)" />
              <path d="M2,24 Q 18,12 34,20 T 68,6" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Card 2: Verified Reports */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="relative rounded-2xl sm:rounded-[24px] bg-white dark:bg-[#10313E] backdrop-blur-xl p-3 min-[380px]:p-3.5 sm:p-5 border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#eafaf0] dark:bg-emerald-500/15 border border-[#c4f0d3] dark:border-emerald-500/20 flex items-center justify-center text-[#16a34a] dark:text-[#35D39E] shrink-0 shadow-xs">
                <CheckCircle2 className="w-4.5 h-4.5 min-[380px]:w-5 min-[380px]:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl min-[380px]:text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2FBFD] leading-none font-sans">
                  {summaryCounts.verified}
                </div>
                <div className="text-[11px] min-[380px]:text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-0.5 sm:mt-1 truncate">
                  Verified Reports
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400 dark:text-[#6D949D]">
                  AI verification completed
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="hidden sm:block w-16 h-9 shrink-0" fill="none">
              <defs>
                <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2,26 Q 20,16 36,18 T 68,4 L 68,32 L 2,32 Z" fill="url(#sparkGreen)" />
              <path d="M2,26 Q 20,16 36,18 T 68,4" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Card 3: Under Review */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, delay: 0.16 }}
            className="relative rounded-2xl sm:rounded-[24px] bg-white dark:bg-[#10313E] backdrop-blur-xl p-3 min-[380px]:p-3.5 sm:p-5 border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#fff8eb] dark:bg-amber-500/15 border border-[#fee6b8] dark:border-amber-500/20 flex items-center justify-center text-[#d97706] dark:text-[#F6B84C] shrink-0 shadow-xs">
                <Clock className="w-4.5 h-4.5 min-[380px]:w-5 min-[380px]:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl min-[380px]:text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2FBFD] leading-none font-sans">
                  {summaryCounts.review}
                </div>
                <div className="text-[11px] min-[380px]:text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-0.5 sm:mt-1 truncate">
                  Under Review
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400 dark:text-[#6D949D]">
                  Being analyzed by AI team
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="hidden sm:block w-16 h-9 shrink-0" fill="none">
              <defs>
                <linearGradient id="sparkAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2,20 Q 20,28 38,14 T 68,8 L 68,32 L 2,32 Z" fill="url(#sparkAmber)" />
              <path d="M2,20 Q 20,28 38,14 T 68,8" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Card 4: Dispatched Action */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, delay: 0.24 }}
            className="relative rounded-2xl sm:rounded-[24px] bg-white dark:bg-[#10313E] backdrop-blur-xl p-3 min-[380px]:p-3.5 sm:p-5 border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f5f3ff] dark:bg-purple-500/15 border border-[#e4ddff] dark:border-purple-500/20 flex items-center justify-center text-[#7c3aed] dark:text-purple-400 shrink-0 shadow-xs">
                <Truck className="w-4.5 h-4.5 min-[380px]:w-5 min-[380px]:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl min-[380px]:text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2FBFD] leading-none font-sans">
                  {summaryCounts.dispatched}
                </div>
                <div className="text-[11px] min-[380px]:text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-0.5 sm:mt-1 truncate">
                  Dispatched
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400 dark:text-[#6D949D]">
                  Field teams sent to site
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="hidden sm:block w-16 h-9 shrink-0" fill="none">
              <defs>
                <linearGradient id="sparkPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2,16 Q 24,4 40,18 T 68,8 L 68,32 L 2,32 Z" fill="url(#sparkPurple)" />
              <path d="M2,16 Q 24,4 40,18 T 68,8" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. MAIN SECTION: VINTAGE ACCENT + SUBMITTED REPORTS TABLE    */}
      {/* ============================================================ */}
      <section className="relative max-w-[1360px] mx-auto px-2.5 min-[380px]:px-3.5 sm:px-6 lg:px-8 mt-5 sm:mt-8">
        <div className="flex flex-col xl:flex-row gap-5 items-stretch">
          {/* Left Decorative Kolkata Heritage Street Lamp Banner */}
          <div className="hidden xl:flex flex-col justify-between w-[96px] shrink-0 rounded-[28px] bg-gradient-to-b from-[#e3f0fc]/90 via-[#edf5fc]/85 to-[#d6eafc]/90 dark:from-[#061820] dark:via-[#0B2430] dark:to-[#030F14] p-4 shadow-sm border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] relative overflow-hidden text-center select-none">
            {/* Victorian Heritage Gas Lantern */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-7 h-2 bg-[#1e3a5f] dark:bg-slate-300 rounded-t-full shadow-sm" />
              {/* Glass Lantern Housing with warm radiant glow */}
              <div className="relative w-8 h-10 border-2 border-[#1e3a5f] dark:border-slate-300 bg-amber-50/70 dark:bg-amber-400/20 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.6)]">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#f59e0b]" />
              </div>
              <div className="w-9 h-1.5 bg-[#1e3a5f] dark:bg-slate-300 rounded-sm" />
              <div className="w-1.5 h-20 bg-gradient-to-b from-[#1e3a5f] to-[#0f2442] dark:from-slate-400 dark:to-slate-600 mt-0.5 rounded-full" />
              <div className="w-7 h-2.5 bg-[#1e3a5f] dark:bg-slate-400 rounded-b-md" />
            </div>

            {/* Vertical Script Typography */}
            <div className="py-6 flex flex-col items-center justify-center">
              <span className="text-[13px] font-sans font-bold text-[#16467f] dark:text-[#00E5FF] tracking-wider uppercase [writing-mode:vertical-rl] rotate-180 drop-shadow-sm">
                Cleaner Waters, Brighter Kolkata
              </span>
            </div>

            {/* Bottom Pillar Text */}
            <div className="text-[9px] font-extrabold tracking-[0.24em] text-[#24528a] dark:text-[#38BDF8]/70 uppercase leading-relaxed font-mono pb-2">
              PEOPLE
              <br />
              REPORT
              <br />
              CITIES
              <br />
              IMPROVE
            </div>
          </div>

          {/* Main White Dashboard Card */}
          <div className="flex-1 rounded-2xl sm:rounded-[28px] bg-white dark:bg-[#061820] border border-slate-200/80 dark:border-[rgba(94,183,201,0.16)] shadow-[0_18px_45px_-15px_rgba(15,35,65,0.08)] overflow-hidden">
            {/* Header & Controls Toolbar */}
            <div className="p-3 min-[380px]:p-4 sm:p-7 border-b border-slate-100 dark:border-[rgba(94,183,201,0.16)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-5">
              <div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-4.5 sm:h-6 rounded-full bg-[#2563eb] dark:bg-[#00E5FF]" />
                  <h2 className="text-base min-[380px]:text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-[#F2FBFD] tracking-tight">
                    Your Submitted Reports
                  </h2>
                </div>
                <p className="text-[11px] min-[380px]:text-xs sm:text-sm text-slate-500 dark:text-[#B2D2D9] mt-0.5 sm:mt-1 pl-3.5 sm:pl-4.5">
                  Track, manage and see the impact of your civic contributions.
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-48 md:w-52 lg:w-56 xl:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#6D949D] pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full rounded-xl border border-slate-200 dark:border-[rgba(94,183,201,0.16)] bg-slate-50 dark:bg-[#10313E] pl-8.5 pr-7 py-1.5 sm:py-2 text-xs text-slate-800 dark:text-[#F2FBFD] placeholder:text-slate-400 dark:placeholder:text-[#6D949D] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#F2FBFD] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Secondary Controls: Date, Filter, New Report */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  {/* Date Dropdown */}
                  <div className="relative flex-1 min-w-0 sm:flex-none">
                    <div className="w-full inline-flex items-center justify-between gap-1 rounded-xl border border-slate-200 dark:border-[rgba(94,183,201,0.16)] bg-slate-50 dark:bg-[#10313E] px-2 min-[380px]:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-[#F2FBFD]">
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-[#B2D2D9] shrink-0" />
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="bg-transparent focus:outline-none cursor-pointer appearance-none text-[11px] sm:text-xs truncate max-w-[70px] min-[360px]:max-w-[85px] sm:max-w-none"
                        >
                          {["Today", "Last 7 Days", "Last 3 Months", "Last 6 Months", "Last Year", "All Time"].map((opt) => (
                            <option key={opt} value={opt} className="dark:bg-[#061820]">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 dark:text-[#6D949D] pointer-events-none shrink-0" />
                    </div>
                  </div>

                  {/* Filter Refresh Button */}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-[rgba(94,183,201,0.16)] bg-slate-50 dark:bg-[#10313E] px-2 min-[380px]:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-[#F2FBFD] hover:bg-slate-100 dark:hover:bg-[#163F4E] transition-all cursor-pointer shrink-0"
                  >
                    <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-[#B2D2D9]" />
                    <span>Filter</span>
                    {refreshing && <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin text-blue-500 ml-0.5" />}
                  </button>

                  {/* + New Report Button */}
                  <button
                    type="button"
                    onClick={handleNewReport}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#0c2340] dark:bg-[#00E5FF] hover:bg-[#14325c] dark:hover:bg-[#2BEBFF] text-white dark:text-[#030F14] px-2.5 min-[380px]:px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>New Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 sm:px-7 pt-2.5 sm:pt-4 pb-2 border-b border-slate-100 dark:border-[rgba(94,183,201,0.16)] flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              {["All Reports", "Verified", "Dispatched", "In Progress", "Under Review", "Resolved"].map((tab) => {
                const isActive = activeTab === tab;
                const count =
                  tab === "All Reports"
                    ? activeReportsList.length
                    : activeReportsList.filter((r) => normalizeStatus(r.status) === tab).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 min-[380px]:px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                      ? "bg-[#2563eb] dark:bg-[#00E5FF] text-white dark:text-[#030F14] shadow-xs"
                      : "bg-slate-100 dark:bg-[#10313E] text-slate-600 dark:text-[#B2D2D9] hover:bg-slate-200/70 dark:hover:bg-[#163F4E]"
                      }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9.5px] sm:text-[10px] ${isActive ? "bg-white/20 dark:bg-black/20 text-white dark:text-[#030F14]" : "bg-white dark:bg-[#061820] text-slate-500 dark:text-[#6D949D]"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Data Table (Desktop / Tablet Landscape) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[rgba(94,183,201,0.16)] bg-slate-50/60 dark:bg-[#0B2430] text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#B2D2D9]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort("report_id")}
                        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-[#F2FBFD] cursor-pointer"
                      >
                        <span>Report ID</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Issue Type</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort("submitted_at")}
                        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-[#F2FBFD] cursor-pointer"
                      >
                        <span>Submitted On</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort("ai_confidence")}
                        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-[#F2FBFD] cursor-pointer"
                      >
                        <span>AI Confidence</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Dispatched To</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[rgba(94,183,201,0.16)]">
                  <AnimatePresence initial={false}>
                    {filteredReports.map((report, idx) => {
                      const reportId = report.report_id || report.reportId || `KWI-2025-${idx + 100}`;
                      const imageUrl = resolveReportImage(report);
                      const normStatus = normalizeStatus(report.status);
                      const statusInfo = STATUS_CONFIG[normStatus] || STATUS_CONFIG["Under Review"];
                      const StatusIcon = statusInfo.icon;
                      const issueInfo = ISSUE_TYPE_CONFIG[report.issue_type || report.issueType] || ISSUE_TYPE_CONFIG.Waterlogging;
                      const IssueIcon = issueInfo.icon;
                      const confidence = Math.round(Number(report.ai_confidence || report.aiConfidence || 85));

                      return (
                        <motion.tr
                          key={reportId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-blue-50/40 dark:hover:bg-[#10313E]/60 transition-colors group"
                        >
                          {/* Row Number */}
                          <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400 dark:text-[#6D949D]">
                            {idx + 1}
                          </td>

                          {/* Report ID */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(report)}
                              className="font-mono text-xs font-bold text-slate-900 dark:text-[#F2FBFD] hover:text-blue-600 dark:hover:text-[#00E5FF] transition-colors cursor-pointer text-left"
                            >
                              {reportId}
                            </button>
                          </td>

                          {/* Location with User's Original Submitted Image */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {/* Photo Thumbnail */}
                              <button
                                type="button"
                                onClick={() => setLightboxImage(imageUrl)}
                                className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-[rgba(94,183,201,0.16)] bg-slate-100 dark:bg-[#10313E] group-hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                title="Click to view original full-resolution photo"
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={report.location}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-[#6D949D]">
                                    <Droplet className="w-4 h-4" />
                                  </div>
                                )}
                              </button>

                              {/* Locality info */}
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#00E5FF] shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-[#F2FBFD]">
                                    {report.location}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-[#6D949D]">
                                    {report.sub_location || "Kolkata"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Issue Type */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${issueInfo.bg} ${issueInfo.text} ${issueInfo.border}`}
                            >
                              <IssueIcon className={`w-3 h-3 ${issueInfo.iconColor}`} />
                              <span>{report.issue_type || report.issueType || "Waterlogging"}</span>
                            </span>
                          </td>

                          {/* Submitted On */}
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-slate-700 dark:text-[#B2D2D9]">
                              {formatDate(report.submitted_at || report.submittedAt)}
                            </div>
                            <div className="text-[11px] text-blue-600 dark:text-[#00E5FF] font-semibold mt-0.5">
                              {formatTime(report.submitted_at || report.submittedAt)}
                            </div>
                            {(report.updated_at || report.updatedAt) &&
                              (report.updated_at || report.updatedAt) !== (report.submitted_at || report.submittedAt) && (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Updated {formatTime(report.updated_at || report.updatedAt)}</span>
                                </div>
                              )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                            >
                              <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.iconColor}`} />
                              <span>{normStatus}</span>
                            </span>
                          </td>

                          {/* AI Confidence */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5 min-w-[120px]">
                              <span className="text-xs font-bold text-slate-700 dark:text-[#B2D2D9] w-8">
                                {confidence}%
                              </span>
                              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${statusInfo.barColor}`}
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Dispatched To */}
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-[#B2D2D9]">
                            {report.dispatched_to ||
                              report.dispatchedTo ||
                              (normStatus === "Dispatched" || normStatus === "In Progress" || normStatus === "Resolved"
                                ? (report.assigned_ulb_name || (report.ward ? `Ward ${report.ward}` : "Municipal Rapid Response"))
                                : "—")}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(report)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#1d4ed8] dark:text-[#00E5FF] bg-[#eff6ff] dark:bg-[#00E5FF]/10 hover:bg-[#dbeafe] dark:hover:bg-[#00E5FF]/20 border border-[#bfdbfe] dark:border-[#00E5FF]/25 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              {/* 3 dots menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setMenuOpenId(menuOpenId === reportId ? null : reportId)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F2FBFD] transition-colors cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {menuOpenId === reportId && (
                                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-[#061820] border border-slate-200 dark:border-[rgba(94,183,201,0.16)] shadow-lg py-1 z-20 text-left">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLightboxImage(imageUrl);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 dark:text-[#F2FBFD] hover:bg-slate-50 dark:hover:bg-[#10313E] flex items-center gap-2 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-[#00E5FF]" />
                                      <span>Enlarge Photo</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(reportId);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 dark:text-[#F2FBFD] hover:bg-slate-50 dark:hover:bg-[#10313E] flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-[#6D949D]" />
                                      <span>Copy Report ID</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReport(report);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 dark:text-[#F2FBFD] hover:bg-slate-50 dark:hover:bg-[#10313E] flex items-center gap-2 cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-[#6D949D]" />
                                      <span>View Full Details</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>

                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-14 text-center text-slate-400 dark:text-[#6D949D]">
                        {activeReportsList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-500 mb-3">
                              <FileText className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-[#F2FBFD]">No submitted reports in database</p>
                            <p className="text-xs mt-1 text-slate-400 dark:text-[#6E9298] leading-relaxed">
                              There are currently no reports recorded in the system. Newly submitted citizen reports will automatically appear here.
                            </p>
                            <button
                              type="button"
                              onClick={handleNewReport}
                              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0c2340] dark:bg-[#00E5FF] hover:bg-[#14325c] dark:hover:bg-[#2BEBFF] text-white dark:text-[#030F14] px-4 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Submit a Report</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-semibold">No reports found matching your criteria.</p>
                            <p className="text-xs mt-1 text-slate-400 dark:text-[#6E9298]">Try adjusting your search query or filter tags.</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Native phone & portrait tablet experience) */}
            <div className="block md:hidden p-2.5 min-[380px]:p-3.5 space-y-3">
              {filteredReports.map((report, idx) => {
                const reportId = report.report_id || report.reportId || `KWI-2025-${idx + 100}`;
                const imageUrl = resolveReportImage(report);
                const normStatus = normalizeStatus(report.status);
                const statusInfo = STATUS_CONFIG[normStatus] || STATUS_CONFIG["Under Review"];
                const StatusIcon = statusInfo.icon;
                const issueInfo = ISSUE_TYPE_CONFIG[report.issue_type || report.issueType] || ISSUE_TYPE_CONFIG.Waterlogging;
                const IssueIcon = issueInfo.icon;
                const confidence = Math.round(Number(report.ai_confidence || report.aiConfidence || 85));
                const dispatchedTo = report.dispatched_to ||
                  report.dispatchedTo ||
                  (normStatus === "Dispatched" || normStatus === "In Progress" || normStatus === "Resolved"
                    ? (report.assigned_ulb_name || (report.ward ? `Ward ${report.ward}` : "Municipal Rapid Response"))
                    : "—");

                return (
                  <div
                    key={`mob-${reportId}`}
                    className="p-3 min-[380px]:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0c2330] border border-slate-200/80 dark:border-[rgba(94,183,201,0.2)] shadow-xs space-y-2.5 text-left"
                  >
                    {/* Header Row: ID + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-[#6D949D]">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="font-mono text-xs font-bold text-slate-900 dark:text-[#F2FBFD] hover:text-blue-600 dark:hover:text-[#00E5FF] transition-colors cursor-pointer"
                        >
                          {reportId}
                        </button>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        <StatusIcon className={`w-2.5 h-2.5 ${statusInfo.iconColor}`} />
                        <span>{normStatus}</span>
                      </span>
                    </div>

                    {/* Image and Locality Row */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setLightboxImage(imageUrl)}
                        className="relative w-14 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-[rgba(94,183,201,0.16)] bg-slate-100 dark:bg-[#10313E] shadow-xs"
                        title="Enlarge photo"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={report.location}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-[#6D949D]">
                            <Droplet className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-[#2563eb] dark:text-[#00E5FF] shrink-0 mt-0.5" />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 dark:text-[#F2FBFD] truncate">
                              {report.location}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-[#6D949D]">
                              {report.sub_location || "Kolkata"}
                            </div>
                          </div>
                        </div>

                        {/* Issue Type */}
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9.5px] font-semibold border ${issueInfo.bg} ${issueInfo.text} ${issueInfo.border}`}>
                            <IssueIcon className={`w-2.5 h-2.5 ${issueInfo.iconColor}`} />
                            <span>{report.issue_type || report.issueType || "Waterlogging"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta details: AI Confidence & Submitted Date */}
                    <div className="pt-2 border-t border-slate-100 dark:border-[rgba(94,183,201,0.14)] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[9.5px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">Submitted On</div>
                        <div className="font-semibold text-slate-700 dark:text-[#B2D2D9] text-[10.5px] mt-0.5">
                          {formatDate(report.submitted_at || report.submittedAt)}
                        </div>
                        <div className="text-[9.5px] text-blue-600 dark:text-[#00E5FF] font-semibold">
                          {formatTime(report.submitted_at || report.submittedAt)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9.5px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">AI Confidence</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${statusInfo.barColor}`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className="text-[10.5px] font-bold text-slate-700 dark:text-[#B2D2D9]">{confidence}%</span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 dark:text-[#6D949D] mt-0.5 truncate">
                          To: <span className="font-semibold text-slate-600 dark:text-slate-300">{dispatchedTo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-[rgba(94,183,201,0.14)]">
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-[#1d4ed8] dark:text-[#00E5FF] bg-[#eff6ff] dark:bg-[#00E5FF]/10 hover:bg-[#dbeafe] dark:hover:bg-[#00E5FF]/20 border border-[#bfdbfe] dark:border-[#00E5FF]/25 transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Details</span>
                      </button>

                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(imageUrl)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-[rgba(94,183,201,0.2)] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                          title="Enlarge Photo"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(reportId)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-[rgba(94,183,201,0.2)] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                        title="Copy Report ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="py-8 text-center text-slate-400 dark:text-[#6D949D] bg-slate-50/50 dark:bg-[#10313E]/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                  {activeReportsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-500 mb-2">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-[#F2FBFD]">No submitted reports</p>
                      <button
                        type="button"
                        onClick={handleNewReport}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#0c2340] dark:bg-[#00E5FF] hover:bg-[#14325c] dark:hover:bg-[#2BEBFF] text-white dark:text-[#030F14] px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit a Report</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                      <p className="text-xs font-semibold">No reports match your filters.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status Feed Footer */}
            <div className="px-3.5 min-[380px]:px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-[rgba(94,183,201,0.16)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-[#A8C5C9]">
              <div>
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredReports.length}</span> of{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeReportsList.length}</span> reports
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live municipal telemetry synced
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. DETAILS MODAL (ORIGINAL SUBMITTED IMAGE + TIMELINE)        */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedReport && (
          <ReportDetailsModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onEnlarge={(img) => setLightboxImage(img)}
          />
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 5. FULL RESOLUTION LIGHTBOX (EXACT ORIGINAL USER IMAGE)       */}
      {/* ============================================================ */}
      <AnimatePresence>
        {lightboxImage && (
          <ReportLightbox
            src={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================ */
/*  SUBCOMPONENT: REPORT DETAILS MODAL                              */
/* ================================================================ */
function ReportDetailsModal({ report, onClose, onEnlarge }) {
  const imageUrl = resolveReportImage(report);
  const reportId = report.report_id || report.reportId;
  const normStatus = normalizeStatus(report.status);
  const confidence = Math.round(Number(report.ai_confidence || report.aiConfidence || 85));

  const currentStageIndex = (() => {
    if (normStatus === "Resolved") return 6;
    if (normStatus === "In Progress") return 5;
    if (normStatus === "Dispatched") return 4;
    if (normStatus === "Under Review") return 3;
    if (normStatus === "Verified") return 2;
    return 1;
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#061820] border border-slate-200 dark:border-[rgba(94,183,201,0.16)] shadow-2xl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image Container showing the EXACT original photo */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-slate-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={report.location}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onEnlarge(imageUrl)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <Droplet className="w-12 h-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
            <div>
              <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {reportId}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold mt-0.5">{report.location}</h3>
            </div>
            <button
              type="button"
              onClick={() => onEnlarge(imageUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all cursor-pointer text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Full Photo</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">Submit Time</div>
              <div className="text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-1">
                {formatDate(report.submitted_at || report.submittedAt)}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-[#00E5FF] font-semibold mt-0.5">
                {formatTime(report.submitted_at || report.submittedAt)}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">Update Time</div>
              <div className="text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-1">
                {formatDate(report.updated_at || report.submitted_at || report.submittedAt)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-[#35D39E] font-semibold mt-0.5">
                {formatTime(report.updated_at || report.submitted_at || report.submittedAt)}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">Status</div>
              <div className="text-xs font-bold text-blue-600 dark:text-[#00E5FF] mt-1">
                {normStatus}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">Water Depth</div>
              <div className="text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-1">
                {report.water_depth !== undefined && report.water_depth !== null && report.water_depth !== "" && Number(report.water_depth) > 0
                  ? `${report.water_depth} cm`
                  : (report.water_depth_display || "16-40cm")}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-[#10313E] border border-slate-100 dark:border-[rgba(94,183,201,0.16)] col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#6D949D]">Dispatched To</div>
              <div className="text-xs font-bold text-slate-800 dark:text-[#F2FBFD] mt-1 truncate" title={report.dispatched_to || report.dispatchedTo || report.assigned_ulb_name || "—"}>
                {report.dispatched_to || report.dispatchedTo || report.assigned_ulb_name || "—"}
              </div>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-[#B2D2D9] uppercase tracking-wider mb-1">
                Citizen Description
              </div>
              <p className="text-sm text-slate-700 dark:text-[#F2FBFD] leading-relaxed bg-slate-50 dark:bg-[#10313E] p-3.5 rounded-xl border border-slate-100 dark:border-[rgba(94,183,201,0.16)]">
                {report.description}
              </p>
            </div>
          )}

          {/* AI Verification Section */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50/70 to-cyan-50/70 dark:from-[#0B2430] dark:to-[#10313E] border border-blue-100 dark:border-[rgba(94,183,201,0.16)] flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-white dark:bg-[#163F4E] border-4 border-cyan-500 dark:border-[#00E5FF] flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-sm font-extrabold text-slate-900 dark:text-[#F2FBFD]">
                {confidence}%
              </span>
            </div>
            <div>
              <div className="text-xs font-extrabold text-blue-900 dark:text-[#00E5FF]">
                AI Vision Verification
              </div>
              <p className="text-xs text-slate-600 dark:text-[#B2D2D9] mt-0.5 leading-snug">
                {report.ai_verification_result || "Verified – Standing water identified from citizen photo telemetry."}
              </p>
            </div>
          </div>

          {/* Verification Pipeline Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-400 dark:text-[#B2D2D9] uppercase tracking-wider">
                Verification Pipeline
              </div>
              {(report.updated_at || report.updatedAt) && (
                <div className="text-[11px] font-mono text-cyan-600 dark:text-[#00E5FF] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-[#00E5FF] animate-pulse" />
                  <span>Last Update: {formatTime(report.updated_at || report.updatedAt)}</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
              <div className="flex items-center justify-between relative min-w-[480px] sm:min-w-0">
                {PIPELINE.map((stage, i) => {
                  const isPassed = i <= currentStageIndex;
                  const StageIcon = stage.icon;
                  return (
                    <div key={stage.key} className="flex-1 flex flex-col items-center relative text-center">
                      {i !== 0 && (
                        <div
                          className={`absolute top-4 right-1/2 w-full h-[2px] ${i <= currentStageIndex ? "bg-cyan-500 dark:bg-[#00E5FF]" : "bg-slate-200 dark:bg-[rgba(94,183,201,0.16)]"
                            }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all ${isPassed
                          ? "bg-cyan-500 dark:bg-[#00E5FF] border-cyan-500 dark:border-[#00E5FF] text-white dark:text-[#030F14] shadow-sm"
                          : "bg-white dark:bg-[#10313E] border-slate-300 dark:border-[rgba(94,183,201,0.16)] text-slate-400 dark:text-[#6D949D]"
                          }`}
                      >
                        <StageIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-[#B2D2D9] mt-2">
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================ */
/*  SUBCOMPONENT: FULLSCREEN ORIGINAL IMAGE LIGHTBOX                */
/* ================================================================ */
function ReportLightbox({ src, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
      >
        <img
          src={src}
          alt="Original submitted citizen report"
          className="w-full h-full object-contain max-h-[85vh]"
        />
      </motion.div>
    </motion.div>
  );
}

export default MySubmittedReports;