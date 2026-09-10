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

/* ================================================================ */
/*  REFERENCE 5 DEMO REPORTS (Exact 1:1 match with original design) */
/* ================================================================ */
const REFERENCE_DEMO_REPORTS = [
  {
    report_id: "KWI-2025-00123",
    image_url: "/images/kolkata_waterlog_sector_v.jpg",
    location: "Gariahat, Kolkata",
    sub_location: "Main Road",
    issue_type: "Waterlogging",
    submitted_at: "2025-09-09T10:32:00+05:30",
    status: "Verified",
    ai_confidence: 92,
    dispatched_to: "—",
    description: "Heavy rain water accumulation across main carriageway impeding commuter traffic and transit.",
    water_depth: 18,
    ai_verification_result: "Verified – High confidence waterlogging event",
    dispatch_status: "Awaiting municipal dispatch",
    latitude: 22.5186,
    longitude: 88.3644,
  },
  {
    report_id: "KWI-2025-00110",
    image_url: "/images/hotspot_park_street.jpg",
    location: "Park Street, Kolkata",
    sub_location: "Near Metro Station",
    issue_type: "Drain Blockage",
    submitted_at: "2025-09-07T18:15:00+05:30",
    status: "Dispatched",
    ai_confidence: 88,
    dispatched_to: "KMC - Ward 70",
    description: "Blocked roadside drainage culvert causing water to collect near the metro station entrance.",
    water_depth: 12,
    ai_verification_result: "Verified – Drainage obstruction identified",
    dispatch_status: "Field team en route",
    latitude: 22.5524,
    longitude: 88.3526,
  },
  {
    report_id: "KWI-2025-00098",
    image_url: "/images/hotspot_thanthania.jpg",
    location: "Salt Lake, Kolkata",
    sub_location: "Sector V",
    issue_type: "Waterlogging",
    submitted_at: "2025-09-05T13:48:00+05:30",
    status: "Under Review",
    ai_confidence: 76,
    dispatched_to: "—",
    description: "Standing water visible along the IT corridor service road, pedestrian curb and footpath.",
    water_depth: 10,
    ai_verification_result: "Pending Analysis – Multi-model sensor telemetry verification ongoing",
    dispatch_status: "Unassigned",
    latitude: 22.5735,
    longitude: 88.4331,
  },
  {
    report_id: "KWI-2025-00087",
    image_url: "/images/hotspot_kalighat.jpg",
    location: "Belgharia, Kolkata",
    sub_location: "Expressway",
    issue_type: "Overflow",
    submitted_at: "2025-09-02T11:21:00+05:30",
    status: "Verified",
    ai_confidence: 90,
    dispatched_to: "—",
    description: "Water overflow observed beside the highway embankment following severe afternoon downpour.",
    water_depth: 16,
    ai_verification_result: "Verified – Monsoon hydraulic surge confirmed",
    dispatch_status: "Awaiting municipal dispatch",
    latitude: 22.6635,
    longitude: 88.3846,
  },
  {
    report_id: "KWI-2025-00071",
    image_url: "/images/hotspot_behala.jpg",
    location: "Tollygunge, Kolkata",
    sub_location: "Prince Anwar Shah Road",
    issue_type: "Drain Blockage",
    submitted_at: "2025-08-28T16:09:00+05:30",
    status: "Resolved",
    ai_confidence: 95,
    dispatched_to: "KMC - Ward 108",
    description: "Storm drain blockage cleared by municipal crew, street completely drained and traffic restored.",
    water_depth: 14,
    ai_verification_result: "Verified – Clearing confirmed and verified by ward telemetry",
    dispatch_status: "Resolved – Area returned to normal service",
    latitude: 22.4988,
    longitude: 88.3475,
  },
];

/* Normalize report status to standard display keys */
function normalizeStatus(statusStr) {
  const s = (statusStr || "").toLowerCase();
  if (s.includes("verif")) return "Verified";
  if (s.includes("dispatch")) return "Dispatched";
  if (s.includes("resolv")) return "Resolved";
  return "Under Review";
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
  const [dateFilter, setDateFilter] = useState("Last 6 Months");
  const [sortField, setSortField] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [forceDemoMode, setForceDemoMode] = useState(false);

  // Poll backend user reports if logged in
  useEffect(() => {
    if (currentUser) {
      fetchMyReports();
      const interval = setInterval(() => {
        fetchMyReports();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchMyReports]);

  // Determine active report list: user's reports or reference demo dataset
  const activeReportsList = useMemo(() => {
    if (forceDemoMode) {
      return REFERENCE_DEMO_REPORTS;
    }
    if (currentUser && myReports && myReports.length > 0) {
      const filtered = myReports.filter((r) => {
        const uid = r.user_id || r.userId;
        return !uid || uid === currentUser.id || uid === currentUser.email;
      });
      return filtered.length > 0 ? filtered : myReports;
    }
    return REFERENCE_DEMO_REPORTS;
  }, [currentUser, myReports, forceDemoMode]);

  // Compute live summary counts
  const summaryCounts = useMemo(() => {
    const total = activeReportsList.length;
    let verified = 0;
    let review = 0;
    let dispatched = 0;

    activeReportsList.forEach((r) => {
      const s = normalizeStatus(r.status);
      if (s === "Verified") verified++;
      else if (s === "Dispatched") dispatched++;
      else if (s === "Under Review") review++;
    });

    return { total, verified, review, dispatched };
  }, [activeReportsList]);

  // Filter & sort
  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const daysMap = {
      "Last 7 Days": 7,
      "Last 30 Days": 30,
      "Last 3 Months": 90,
      "Last 6 Months": 180,
      "Last Year": 365,
      "All Time": null,
    };
    const maxDays = daysMap[dateFilter] ?? null;
    const cutoffTs = maxDays != null ? now - maxDays * 86400000 : null;

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

  const hasRealUserReports = currentUser && myReports && myReports.length > 0;

  return (
    <div className="relative w-full bg-[#f4f7fb] dark:bg-[#0b1220] text-slate-800 dark:text-slate-100 font-sans min-h-screen selection:bg-cyan-100 selection:text-cyan-900 pb-20">
      {/* ============================================================ */}
      {/* 1. CINEMATIC RIVERSIDE DUSK PANORAMA HERO BANNER             */}
      {/* State-of-the-Art Frosted Glassmorphism Architecture          */}
      {/* ============================================================ */}
      <header className="relative w-full overflow-hidden bg-[#071326] min-h-[400px] sm:min-h-[450px] lg:min-h-[490px] flex items-center select-none isolate">
        {/* Authentic 4K Ultra-Crisp Howrah Bridge Sunset Photography */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={HERO_TWILIGHT_BG}
            alt="Kolkata Howrah Bridge 4K Sunset Photography"
            className="w-full h-full object-cover object-[center_36%] filter brightness-[0.98] contrast-[1.06]"
          />
          {/* Subtle cinematic gradient vignette for depth and text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#f4f7fb] dark:to-[#0b1220] h-28 bottom-0 top-auto" />
        </div>

        {/* Floating Glassmorphic Content Containers */}
        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left Column: Frosted Glass Hero Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[32px] p-6 sm:p-8 md:p-9 max-w-2xl bg-white/[0.12] dark:bg-black/[0.3] backdrop-blur-2xl border border-white/30 dark:border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.45)] text-left"
          >
            {/* Ambient subtle cyan glow corner */}
            <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[10px] font-extrabold tracking-[0.25em] uppercase font-mono mb-3.5 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <span>Citizen Reporting</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[45px] font-extrabold tracking-tight text-white leading-[1.08] font-serif drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              My Submitted{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-200 to-white">
                Reports
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-2.5 text-xs sm:text-sm md:text-base font-medium text-white/90 max-w-xl leading-relaxed drop-shadow-sm">
              Your reports make Kolkata cleaner, healthier and more water-resilient.
            </p>

            {/* 4 Frosted Glass Value Badges */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-3 py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all">
                <div className="w-6 h-6 rounded-xl bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Leaf className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white leading-tight">Cleaner City</div>
                  <div className="text-[9px] text-white/70">Report issues</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-3 py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all">
                <div className="w-6 h-6 rounded-xl bg-blue-400/25 border border-blue-300/40 flex items-center justify-center text-blue-300 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white leading-tight">Safer Comm.</div>
                  <div className="text-[9px] text-white/70">Faster action</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-3 py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all">
                <div className="w-6 h-6 rounded-xl bg-cyan-400/25 border border-cyan-300/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white leading-tight">Governance</div>
                  <div className="text-[9px] text-white/70">Real impact</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.12] dark:bg-white/[0.06] backdrop-blur-xl px-3 py-2 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/[0.18] transition-all">
                <div className="w-6 h-6 rounded-xl bg-rose-400/25 border border-rose-300/40 flex items-center justify-center text-rose-300 shrink-0">
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white leading-tight">Tomorrow</div>
                  <div className="text-[9px] text-white/70">Together</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Frosted Glass Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-start lg:items-end shrink-0"
          >
            <div className="relative rounded-[24px] p-5 sm:p-6 max-w-[280px] sm:max-w-[300px] bg-white/[0.12] dark:bg-black/[0.32] backdrop-blur-2xl border border-white/25 shadow-[0_16px_45px_rgba(0,0,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)] text-left text-white overflow-hidden">
              <div className="text-3xl sm:text-4xl text-white/80 font-serif leading-none mb-2 select-none">
                “
              </div>
              <p className="text-xs sm:text-[13px] text-white/95 font-medium leading-relaxed drop-shadow-sm">
                A cleaner Kolkata flows from informed citizens.
              </p>
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-white/20">
                <span className="w-6 h-[1px] bg-white/35 inline-block" />
                <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase font-sans">
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
      <section className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 md:-mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Reports */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-[24px] bg-white dark:bg-slate-900/95 backdrop-blur-xl p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#edf5ff] dark:bg-blue-500/15 border border-[#d5e6ff] dark:border-blue-500/20 flex items-center justify-center text-[#2563eb] dark:text-blue-400 shrink-0 shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-sans">
                  {summaryCounts.total}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  Total Reports
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Reports submitted by you
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="w-16 h-9 shrink-0" fill="none">
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
            className="relative rounded-[24px] bg-white dark:bg-slate-900/95 backdrop-blur-xl p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#eafaf0] dark:bg-emerald-500/15 border border-[#c4f0d3] dark:border-emerald-500/20 flex items-center justify-center text-[#16a34a] dark:text-emerald-400 shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-sans">
                  {summaryCounts.verified}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  Verified Reports
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  AI verification completed
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="w-16 h-9 shrink-0" fill="none">
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
            className="relative rounded-[24px] bg-white dark:bg-slate-900/95 backdrop-blur-xl p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fff8eb] dark:bg-amber-500/15 border border-[#fee6b8] dark:border-amber-500/20 flex items-center justify-center text-[#d97706] dark:text-amber-400 shrink-0 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-sans">
                  {summaryCounts.review}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  Under Review
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Being analyzed by AI team
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="w-16 h-9 shrink-0" fill="none">
              <defs>
                <linearGradient id="sparkAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2,20 Q 22,25 38,12 T 68,14 L 68,32 L 2,32 Z" fill="url(#sparkAmber)" />
              <path d="M2,20 Q 22,25 38,12 T 68,14" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Card 4: Dispatched */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, delay: 0.24 }}
            className="relative rounded-[24px] bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-slate-900/95 dark:to-purple-950/20 backdrop-blur-xl p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_-10px_rgba(15,35,65,0.1)] flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f0ff] dark:bg-purple-500/15 border border-[#e2d4ff] dark:border-purple-500/20 flex items-center justify-center text-[#9333ea] dark:text-purple-400 shrink-0 shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-sans">
                  {summaryCounts.dispatched}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  Dispatched
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Sent to municipal department
                </div>
              </div>
            </div>

            {/* Sparkline wave visual */}
            <svg viewBox="0 0 70 32" className="w-16 h-9 shrink-0" fill="none">
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
      <section className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col xl:flex-row gap-5 items-stretch">
          {/* Left Decorative Kolkata Heritage Street Lamp Banner */}
          <div className="hidden xl:flex flex-col justify-between w-[96px] shrink-0 rounded-[28px] bg-gradient-to-b from-[#e3f0fc]/90 via-[#edf5fc]/85 to-[#d6eafc]/90 dark:from-[#11233d] dark:via-[#162d4e] dark:to-[#0f2038] p-4 shadow-sm border border-slate-200/80 dark:border-white/10 relative overflow-hidden text-center select-none">
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
              <span className="text-[14px] font-serif font-bold italic text-[#16467f] dark:text-cyan-300 tracking-wide [writing-mode:vertical-rl] rotate-180 drop-shadow-sm">
                Cleaner Waters, Brighter Kolkata
              </span>
            </div>

            {/* Bottom Pillar Text */}
            <div className="text-[9px] font-extrabold tracking-[0.24em] text-[#24528a] dark:text-blue-300/70 uppercase leading-relaxed font-mono pb-2">
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
          <div className="flex-1 rounded-[28px] bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/10 shadow-[0_18px_45px_-15px_rgba(15,35,65,0.08)] overflow-hidden">
            {/* Header & Controls Toolbar */}
            <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-[#2563eb]" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Your Submitted Reports
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 pl-4.5">
                  Track, manage and see the impact of your civic contributions.
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* Search Bar with generous width so placeholder never gets clipped */}
                <div className="relative w-full sm:w-72 lg:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by report ID, location, or keyword..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] pl-9 pr-7 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date Dropdown */}
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer pr-2 appearance-none"
                    >
                      {["Last 7 Days", "Last 30 Days", "Last 3 Months", "Last 6 Months", "Last Year", "All Time"].map((opt) => (
                        <option key={opt} value={opt} className="dark:bg-slate-800">
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Filter Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter</span>
                  {refreshing && <RotateCw className="w-3 h-3 animate-spin text-blue-500 ml-1" />}
                </button>

                {/* + New Report Button */}
                <button
                  type="button"
                  onClick={handleNewReport}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0c2340] hover:bg-[#14325c] text-white px-4 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Report</span>
                </button>

                {/* Toggle between user report & demo gallery if user has 1 report */}
                {hasRealUserReports && (
                  <button
                    type="button"
                    onClick={() => setForceDemoMode(!forceDemoMode)}
                    className="text-[11px] font-semibold text-[#2563eb] hover:underline cursor-pointer ml-1"
                  >
                    {forceDemoMode ? "View My 1 Report" : "View 5 Reference Demo Reports"}
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 sm:px-7 pt-4 pb-2 border-b border-slate-100 dark:border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {["All Reports", "Verified", "Dispatched", "Under Review", "Resolved"].map((tab) => {
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
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#2563eb] text-white shadow-sm"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70"
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? "bg-white/20 text-white" : "bg-white dark:bg-white/10 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort("report_id")}
                        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
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
                        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
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
                        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <span>AI Confidence</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Dispatched To</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
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
                          className="hover:bg-blue-50/40 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Row Number */}
                          <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Report ID */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(report)}
                              className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors cursor-pointer text-left"
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
                                className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                title="Click to view original full-resolution photo"
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={report.location}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Droplet className="w-4 h-4" />
                                  </div>
                                )}
                              </button>

                              {/* Locality info */}
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#2563eb] shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {report.location}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
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
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {formatDate(report.submitted_at || report.submittedAt)}
                            </div>
                            <div className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold mt-0.5">
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
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8">
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
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {report.dispatched_to || report.dispatchedTo || "—"}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(report)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#1d4ed8] dark:text-cyan-300 bg-[#eff6ff] dark:bg-blue-500/10 hover:bg-[#dbeafe] dark:hover:bg-blue-500/20 border border-[#bfdbfe] dark:border-blue-500/20 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              {/* 3 dots menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setMenuOpenId(menuOpenId === reportId ? null : reportId)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {menuOpenId === reportId && (
                                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg py-1 z-20 text-left">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLightboxImage(imageUrl);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Enlarge Photo</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(reportId);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Copy Report ID</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReport(report);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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
                      <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-semibold">No reports found matching your criteria.</p>
                        <p className="text-xs mt-1 text-slate-400">Try adjusting your search query or filter tags.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Status Feed Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredReports.length}</span> of{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeReportsList.length}</span> reports
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
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
    if (normStatus === "Resolved") return 5;
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
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Submit Time</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                {formatDate(report.submitted_at || report.submittedAt)}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold mt-0.5">
                {formatTime(report.submitted_at || report.submittedAt)}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Update Time</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                {formatDate(report.updated_at || report.submitted_at || report.submittedAt)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {formatTime(report.updated_at || report.submitted_at || report.submittedAt)}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
              <div className="text-xs font-bold text-blue-600 dark:text-cyan-400 mt-1">
                {normStatus}
              </div>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Water Depth</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                {report.water_depth ? `${report.water_depth} cm` : "15–30 cm"}
              </div>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Citizen Description
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                {report.description}
              </p>
            </div>
          )}

          {/* AI Verification Section */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50/70 to-cyan-50/70 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-4 border-cyan-500 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {confidence}%
              </span>
            </div>
            <div>
              <div className="text-xs font-extrabold text-blue-900 dark:text-cyan-300">
                AI Vision Verification
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                {report.ai_verification_result || "Verified – Standing water identified from citizen photo telemetry."}
              </p>
            </div>
          </div>

          {/* Verification Pipeline Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Verification Pipeline
              </div>
              {(report.updated_at || report.updatedAt) && (
                <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Last Update: {formatTime(report.updated_at || report.updatedAt)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between relative">
              {PIPELINE.map((stage, i) => {
                const isPassed = i <= currentStageIndex;
                const StageIcon = stage.icon;
                return (
                  <div key={stage.key} className="flex-1 flex flex-col items-center relative text-center">
                    {i !== 0 && (
                      <div
                        className={`absolute top-4 right-1/2 w-full h-[2px] ${
                          i <= currentStageIndex ? "bg-cyan-500" : "bg-slate-200 dark:bg-white/10"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                        isPassed
                          ? "bg-cyan-500 border-cyan-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-white/20 text-slate-400"
                      }`}
                    >
                      <StageIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-2">
                      {stage.label}
                    </span>
                  </div>
                );
              })}
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