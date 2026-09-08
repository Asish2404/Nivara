import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Clock,
  Send,
  Search,
  Plus,
  Flag,
  MapPin,
  ChevronDown,
  Waves,
  Eye,
  Sparkles,
  Activity,
  CalendarDays,
  Building2,
  CircleCheck,
  X,
  Droplet,
  Bot,
  Truck,
  GalleryVerticalEnd,
  Loader2,
  Check,
  RotateCw,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { api } from "../../utils/api";

/* ================================================================ */
/*  ACCENT / STATUS VISUAL TOKENS (kept from the premium design)    */
/* ================================================================ */
const ACCENT_STYLES = {
  blue: {
    tile: "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-300 border-blue-200/70 dark:border-blue-500/25",
    glow: "shadow-[0_8px_28px_rgba(59,130,246,0.22)]",
    ring: "ring-blue-500/30",
  },
  emerald: {
    tile: "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/25",
    glow: "shadow-[0_8px_28px_rgba(16,185,129,0.22)]",
    ring: "ring-emerald-500/30",
  },
  orange: {
    tile: "from-amber-500/20 to-orange-600/10 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/25",
    glow: "shadow-[0_8px_28px_rgba(245,158,11,0.22)]",
    ring: "ring-amber-500/30",
  },
  cyan: {
    tile: "from-cyan-500/20 to-sky-600/10 text-cyan-600 dark:text-cyan-300 border-cyan-200/70 dark:border-cyan-500/25",
    glow: "shadow-[0_8px_28px_rgba(6,182,212,0.22)]",
    ring: "ring-cyan-500/30",
  },
};

const STATUS_STYLES = {
  Verified: {
    label: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    icon: CircleCheck,
    iconColor: "text-emerald-600 dark:text-emerald-300",
  },
  "Under Review": {
    label: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    icon: Clock,
    iconColor: "text-amber-600 dark:text-amber-300",
  },
  Dispatched: {
    label: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
    icon: Send,
    iconColor: "text-sky-600 dark:text-sky-300",
  },
  Resolved: {
    label: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
    icon: Flag,
    iconColor: "text-teal-600 dark:text-teal-300",
  },
};

const CONF_BAR = {
  high: { bar: "bg-gradient-to-r from-emerald-500 to-emerald-400", text: "text-emerald-600 dark:text-emerald-300", dot: "bg-emerald-500" },
  mid: { bar: "bg-gradient-to-r from-blue-600 to-sky-400", text: "text-blue-600 dark:text-blue-300", dot: "bg-blue-500" },
  low: { bar: "bg-gradient-to-r from-amber-500 to-orange-400", text: "text-amber-600 dark:text-amber-300", dot: "bg-amber-500" },
};

const CONFETTI = [
  { size: 5, color: "#22d3ee", delay: 0, duration: 6, x: "8%", y: "82%", drift: 30 },
  { size: 4, color: "#60a5fa", delay: 1.2, duration: 7, x: "18%", y: "78%", drift: -24 },
  { size: 6, color: "#34d399", delay: 0.6, duration: 8, x: "30%", y: "85%", drift: 40 },
  { size: 4, color: "#fbbf24", delay: 2.1, duration: 6.5, x: "46%", y: "80%", drift: -30 },
  { size: 5, color: "#22d3ee", delay: 1.6, duration: 7.5, x: "58%", y: "84%", drift: 26 },
  { size: 4, color: "#818cf8", delay: 0.9, duration: 8.5, x: "70%", y: "78%", drift: -18 },
  { size: 6, color: "#c084fc", delay: 2.6, duration: 7, x: "82%", y: "83%", drift: 34 },
  { size: 4, color: "#38bdf8", delay: 1.8, duration: 6.8, x: "92%", y: "79%", drift: -22 },
];

/* Verification pipeline used in the details modal timeline */
const PIPELINE = [
  { key: "Submitted", icon: GalleryVerticalEnd },
  { key: "AI Analysis", icon: Bot },
  { key: "Verified", icon: CircleCheck },
  { key: "Review", icon: Activity },
  { key: "Dispatch", icon: Truck },
  { key: "Resolved", icon: Flag },
];

/* ================================================================ */
/*  AESTHETIC REUSABLE SUB-COMPONENTS                                */
/* ================================================================ */
function KolkataSkyline() {
  return (
    <svg
      viewBox="0 0 1520 300"
      preserveAspectRatio="xMidYMax slice"
      className="absolute bottom-0 left-0 w-full h-[300px] opacity-[0.5] pointer-events-none select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skBldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17315f" stopOpacity="0.0" />
          <stop offset="1" stopColor="#0d2248" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="skWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.0" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      <g fill="url(#skBldg)">
        <rect x="30" y="150" width="46" height="152" />
        <rect x="84" y="118" width="58" height="184" />
        <rect x="150" y="164" width="40" height="138" />
        <rect x="198" y="132" width="66" height="170" />
        <rect x="272" y="98" width="34" height="204" />
        <rect x="314" y="150" width="48" height="152" />
        <rect x="1200" y="120" width="54" height="182" />
        <rect x="1262" y="88" width="40" height="214" />
        <rect x="1310" y="142" width="62" height="160" />
        <rect x="1380" y="108" width="46" height="194" />
        <rect x="1434" y="158" width="52" height="144" />
        <rect x="560" y="196" width="70" height="106" />
        <rect x="640" y="176" width="52" height="126" />
        <rect x="700" y="150" width="60" height="152" />
        <rect x="1000" y="182" width="52" height="120" />
        <rect x="1060" y="204" width="64" height="98" />
      </g>

      <g fill="#7bb6ff" opacity="0.5">
        <circle cx="110" cy="140" r="1.6" />
        <circle cx="128" cy="166" r="1.4" />
        <circle cx="222" cy="156" r="1.6" />
        <circle cx="240" cy="182" r="1.4" />
        <circle cx="286" cy="122" r="1.5" />
        <circle cx="1278" cy="112" r="1.6" />
        <circle cx="1300" cy="138" r="1.4" />
        <circle cx="1332" cy="164" r="1.5" />
      </g>

      <g stroke="#cfe3ff" strokeLinecap="round" fill="none">
        <line x1="816" y1="238" x2="1136" y2="238" strokeWidth="3" />
        <line x1="840" y1="238" x2="846" y2="180" strokeWidth="2.4" />
        <line x1="1120" y1="238" x2="1114" y2="180" strokeWidth="2.4" />
        <line x1="840" y1="180" x2="1120" y2="180" strokeWidth="2" />
        <line x1="846" y1="180" x2="976" y2="238" strokeWidth="1.2" />
        <line x1="840" y1="238" x2="976" y2="180" strokeWidth="1.2" />
        <line x1="1114" y1="180" x2="984" y2="238" strokeWidth="1.2" />
        <line x1="1120" y1="238" x2="984" y2="180" strokeWidth="1.2" />
        <path d="M846 180 C 900 222, 980 222, 976 238" strokeWidth="1" />
        <path d="M1114 180 C 1060 222, 980 222, 984 238" strokeWidth="1" />
        <line x1="852" y1="196" x2="1104" y2="196" strokeWidth="1.4" opacity="0.6" />
      </g>
      <g fill="#a5d8ff" opacity="0.7">
        <circle cx="880" cy="200" r="1.4" />
        <circle cx="928" cy="216" r="1.4" />
        <circle cx="1032" cy="216" r="1.4" />
        <circle cx="1080" cy="200" r="1.4" />
      </g>

      <rect x="0" y="238" width="1520" height="62" fill="url(#skWater)" />

      <g stroke="#7cc4ff" strokeWidth="1.2" opacity="0.5" strokeLinecap="round">
        <line x1="700" y1="252" x2="760" y2="252" />
        <line x1="820" y1="262" x2="900" y2="262" />
        <line x1="980" y1="254" x2="1040" y2="254" />
        <line x1="880" y1="272" x2="930" y2="272" />
        <line x1="720" y1="282" x2="790" y2="282" />
        <line x1="1060" y1="266" x2="1110" y2="266" />
      </g>
    </svg>
  );
}

function WaveDivider() {
  return (
    <div className="absolute bottom-0 left-0 w-full pointer-events-none select-none" aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="w-full h-[50px] sm:h-[64px]">
        <path
          d="M0,46 C 240,88 420,6 720,42 C 1020,78 1200,18 1440,54 L 1440,90 L 0,90 Z"
          fill="#eef6ff"
          opacity="0.95"
        />
        <path
          d="M0,60 C 220,26 460,92 720,54 C 980,16 1220,84 1440,48 L 1440,90 L 0,90 Z"
          fill="#f8fbff"
          className="dark:fill-[#0f172a]"
        />
      </svg>
    </div>
  );
}

/* Real uploaded-photo thumbnail with a large lightbox on click */
function ReportThumb({ src, onClick, alt }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-[72px] h-[60px] shrink-0 rounded-xl overflow-hidden ring-1 ring-white/40 dark:ring-white/10 shadow-sm group-hover:scale-[1.03] transition-transform duration-300 cursor-pointer bg-[#16263f]"
      aria-label="Open report photo"
    >
      <img src={src} alt={alt || "Report photo"} className="w-full h-full object-cover" />
      <span className="absolute inset-0 ring-1 ring-inset ring-black/10 group-hover:ring-white/30 transition" />
    </button>
  );
}

const getReportImageUrl = (report) => {
  const path = report?.image_url;
  if (!path) return "";
  if (path.startsWith("/images/") || path.startsWith("/textures/")) return path;
  return api.resolveAssetUrl(path);
};

const DEMO_REPORTS = [
  { report_id: "KWI-2026-00123", image_url: "/images/kolkata_waterlog_sector_v.jpg", location: "Gariahat, Kolkata", issue_type: "Waterlogging", submitted_at: "2026-09-09T10:32:00+05:30", status: "Verified", ai_confidence: 92, dispatched_to: "", description: "Water accumulation across the main carriageway after heavy rainfall.", water_depth: 18, ai_verification_result: "Verified - High confidence waterlogging event", dispatch_status: "Awaiting municipal dispatch" },
  { report_id: "KWI-2026-00110", image_url: "/images/hotspot_park_street.jpg", location: "Park Street, Kolkata", issue_type: "Drain Blockage", submitted_at: "2026-09-07T18:15:00+05:30", status: "Dispatched", ai_confidence: 88, dispatched_to: "KMC - Ward 70", description: "Blocked roadside drain causing water to collect near the crossing.", water_depth: 12, ai_verification_result: "Verified - Drainage obstruction identified", dispatch_status: "Field team en route" },
  { report_id: "KWI-2026-00098", image_url: "/images/hotspot_thanthania.jpg", location: "Salt Lake, Kolkata", issue_type: "Waterlogging", submitted_at: "2026-09-05T13:48:00+05:30", status: "Under Review", ai_confidence: 76, dispatched_to: "", description: "Standing water visible along the service road and footpath.", water_depth: 10, ai_verification_result: "Pending Analysis", dispatch_status: "Unassigned" },
  { report_id: "KWI-2026-00087", image_url: "/images/hotspot_kalighat.jpg", location: "Belgharia, Kolkata", issue_type: "Overflow", submitted_at: "2026-09-02T11:21:00+05:30", status: "Verified", ai_confidence: 90, dispatched_to: "", description: "Overflow observed beside the road after the afternoon downpour.", water_depth: 16, ai_verification_result: "Verified - Standing water identified", dispatch_status: "Awaiting municipal dispatch" },
  { report_id: "KWI-2026-00071", image_url: "/images/hotspot_behala.jpg", location: "Tollygunge, Kolkata", issue_type: "Drain Blockage", submitted_at: "2026-08-28T16:09:00+05:30", status: "Resolved", ai_confidence: 95, dispatched_to: "KMC - Ward 108", description: "Waterlogging reported near the tram corridor and local market.", water_depth: 14, ai_verification_result: "Verified - Rainfall-linked overflow confirmed", dispatch_status: "Area returned to service" },
];

/* ================================================================ */
/*  HELPERS                                                          */
/* ================================================================ */
const toLocaleDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const toLocaleTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
const confidenceTone = (confidence) => {
  const c = Number(confidence) || 0;
  if (c >= 85) return CONF_BAR.high;
  if (c >= 70) return CONF_BAR.mid;
  return CONF_BAR.low;
};

/* ================================================================ */
/*  MAIN DASHBOARD                                                  */
/* ================================================================ */
export function MySubmittedReports() {
  const { navigate, currentUser, myReports, reportsLoaded, fetchMyReports } = useKWIStore();
  const [activeTab, setActiveTab] = useState("All Reports");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Last 6 Months");
  const [hoverFilter, setHoverFilter] = useState(false);
  const [selected, setSelected] = useState(null); // report open in details modal
  const [lightbox, setLightbox] = useState(null); // report photo enlarged
  const [refreshing, setRefreshing] = useState(false);

  const isGuest = !currentUser;
  const reports = reportsLoaded && myReports.length === 0 ? DEMO_REPORTS : myReports;

  // Load the current user's reports on mount + refresh on a light interval so
  // status progression ("last updated") stays live after submission.
  useEffect(() => {
    if (!currentUser) return;
    fetchMyReports();
    const id = setInterval(() => {
      fetchMyReports();
    }, 15000);
    return () => clearInterval(id);
  }, [currentUser, fetchMyReports]);

  // Live summary counts computed from the user's real reports.
  const summary = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter((r) => r.status === "Verified").length;
    const review = reports.filter((r) => r.status === "Under Review").length;
    const dispatched = reports.filter((r) => r.status === "Dispatched").length;
    return [
      { key: "total", icon: FileText, value: total, label: "Total Reports", hint: "Reports submitted by you", accent: "blue" },
      { key: "verified", icon: ShieldCheck, value: verified, label: "Verified Reports", hint: "AI verification completed", accent: "emerald" },
      { key: "review", icon: Clock, value: review, label: "Under Review", hint: "Currently being analyzed", accent: "orange" },
      { key: "dispatched", icon: Send, value: dispatched, label: "Dispatched", hint: "Sent to municipal department", accent: "cyan" },
    ];
  }, [reports]);

  // Status tabs (counts computed live).
  const tabs = useMemo(() => {
    const count = (key) => (key === "All Reports" ? reports.length : reports.filter((r) => r.status === key).length);
    return [
      { key: "All Reports", count: count("All Reports") },
      { key: "Verified", count: count("Verified") },
      { key: "Under Review", count: count("Under Review") },
      { key: "Dispatched", count: count("Dispatched") },
      { key: "Resolved", count: count("Resolved") },
    ];
  }, [reports]);

  // Reference "now" captured once via a lazy initializer, so the date-range filter
// stays pure during render. Refreshes align with the fetch interval.
  const [asOf] = useState(() => Date.now());
  const daysWindow = { "Last 7 Days": 7, "Last 30 Days": 30, "Last 3 Months": 90, "Last 6 Months": 180, "Last Year": 365, "All Time": null };
  const windowDays = daysWindow[dateFilter] ?? null;
  const cutoffTs = windowDays != null ? asOf - windowDays * 86400000 : null;

  // Apply search + status tab + date-range filter against the live reports.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      const tabOk = activeTab === "All Reports" || r.status === activeTab;
      const searchOk =
        !q ||
        (r.report_id || "").toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        (r.issue_type || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q);
      const dateOk = cutoffTs == null || !r.submitted_at || new Date(r.submitted_at).getTime() >= cutoffTs;
      return tabOk && searchOk && dateOk;
    });
  }, [reports, activeTab, search, cutoffTs]);

  const handleNewReport = () => navigate("/reports");

  const refreshNow = async () => {
    setRefreshing(true);
    await fetchMyReports();
    setRefreshing(false);
  };

  /* ---------- Guest / empty states render early, before the hero ---------- */
  if (isGuest) {
    return <GuestState onSignIn={() => navigate("/login")} />;
  }

  return (
    <div className="relative w-full text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-x-hidden">
      {/* ============================================================ */}
      {/* HERO / HEADER                                              */}
      {/* ============================================================ */}
      <header className="relative min-h-[248px] w-full overflow-hidden bg-[#e9f3fa] isolate">
        <div
          className="absolute inset-0 bg-cover bg-[center_43%] opacity-95"
          style={{ backgroundImage: "url('/textures/Footer_img2.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,251,255,0.98)_0%,rgba(246,251,255,0.92)_26%,rgba(246,251,255,0.30)_55%,rgba(5,24,54,0.40)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,34,70,0.58),transparent_48%)] pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none">
          {CONFETTI.map((c) => (
            <motion.span
              key={c.x}
              className="absolute rounded-full"
              style={{ left: c.x, top: c.y, width: c.size, height: c.size, background: c.color, opacity: 0.55, boxShadow: `0 0 8px ${c.color}` }}
              animate={{ y: [-6, -24, -6], x: [0, c.drift, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ repeat: Infinity, duration: c.duration, delay: c.delay, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 pt-6 pb-16 sm:pb-20 text-left">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 text-[#315a93] text-[10px] font-bold tracking-[0.3em] uppercase font-mono mb-2">
              Citizen Reporting
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-[570px] text-4xl sm:text-5xl md:text-[52px] font-serif font-extrabold tracking-tight text-[#102458] leading-[0.98]"
          >
            My Submitted{" "}
            <span className="text-[#173b80]">
              Reports
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 max-w-[390px] text-[#1c3563] text-sm sm:text-base font-semibold leading-relaxed"
          >
            Track your waterlogging reports, AI verification status, and municipal
            response updates in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-5 inline-flex items-center gap-2 border-t-2 border-[#2d7ce0] pt-2 text-xs font-semibold text-[#24467d]"
          >
            <Waves className="w-4 h-4 text-cyan-300" />
            <span>Every Report Makes Kolkata Better</span>
          </motion.div>
        </div>

        <WaveDivider />
      </header>

      {/* ============================================================ */}
      {/* SUMMARY CARDS                                              */}
      {/* ============================================================ */}
      <section className="relative z-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {summary.map((card, i) => {
            const Accent = ACCENT_STYLES[card.accent];
            const Icon = card.icon;
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-[26px] p-5 sm:p-6 overflow-hidden backdrop-blur-xl border border-slate-100 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] shadow-[0_18px_40px_-18px_rgba(15,23,42,0.18)] group ${Accent.glow}`}
              >
                <div className="absolute -top-3 -right-1 text-[64px] sm:text-[76px] font-extrabold leading-none text-slate-900/[0.045] dark:text-white/[0.05] select-none">
                  {card.value}
                </div>
                <svg viewBox="0 0 80 26" className="absolute right-3 bottom-3 w-[74px] h-[24px] opacity-70" aria-hidden="true">
                  <polyline
                    points="0,20 14,15 28,18 42,9 56,13 70,5 80,8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={Accent.tile.includes("text-") ? Accent.tile.split(" ").find((c) => c.startsWith("text-")) : "text-cyan-500"}
                    opacity="0.85"
                  />
                </svg>

                <div className={`relative inline-flex items-center justify-center w-12 h-12 rounded-2xl border bg-gradient-to-br ${Accent.tile}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="mt-4 relative">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {card.value}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {card.key === "dispatched" ? "active" : "total"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{card.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 leading-snug mt-0.5">{card.hint}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* REPORTS MANAGER                                          */}
      {/* ============================================================ */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 pb-6">
        <div className="rounded-[28px] border border-slate-100 dark:border-white/10 bg-white dark:bg-white/[0.04] backdrop-blur-sm shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="px-5 sm:px-8 py-6 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                Your Submitted Reports
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Track, manage and monitor the progress of your civic reports.
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewReport}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-[0_10px_26px_-8px_rgba(14,165,233,0.55)] transition-all active:scale-[0.97] cursor-pointer border border-white/20"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          </div>

          <div className="px-5 sm:px-8 pt-5 pb-2 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by location, report ID or keyword..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none w-full lg:w-auto rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] pl-10 pr-10 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                >
                  {["Last 7 Days", "Last 30 Days", "Last 3 Months", "Last 6 Months", "Last Year", "All Time"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={refreshNow}
                disabled={refreshing}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                  hoverFilter
                    ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600"
                }`}
                onMouseEnter={() => setHoverFilter(true)}
                onMouseLeave={() => setHoverFilter(false)}
              >
                <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "text-white bg-gradient-to-r from-blue-700 to-sky-500 shadow-[0_10px_22px_-8px_rgba(14,165,233,0.6)]"
                        : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:border-blue-300"
                    }`}
                  >
                    <span>{tab.key}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* REPORT TABLE                                               */}
          {/* ============================================================ */}
          <div className="px-5 sm:px-8 pb-7 pt-1 overflow-x-auto">
            {!reportsLoaded && myReports.length === 0 ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                <p className="font-medium">Loading your reports…</p>
              </div>
            ) : (
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Report ID</th>
                    <th className="px-3 py-3">Photo</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Submitted On</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">AI Confidence</th>
                    <th className="px-3 py-3">Dispatched To</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((r, idx) => {
                      const status = STATUS_STYLES[r.status] || STATUS_STYLES["Under Review"];
                      const StatusIcon = status.icon;
                      const conf = confidenceTone(r.ai_confidence);
                      const confidence = Math.round(Number(r.ai_confidence || 0));
                      return (
                        <motion.tr
                          key={r.report_id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.02 }}
                          className="group/cursor"
                        >
                          <td className="px-3 py-3 text-slate-400 dark:text-slate-500 text-sm font-medium">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setSelected(r)}
                              className="font-mono text-[13px] font-bold text-blue-700 dark:text-cyan-300 tracking-tight cursor-pointer"
                            >
                              {r.report_id}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            {getReportImageUrl(r) ? (
                              <ReportThumb src={getReportImageUrl(r)} onClick={() => setLightbox(r)} alt={r.location} />
                            ) : (
                              <span className="inline-flex items-center justify-center w-[72px] h-[60px] rounded-xl bg-slate-100 dark:bg-white/10 text-slate-300 dark:text-slate-600">
                                <Droplet className="w-5 h-5" />
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-0.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight max-w-[220px]">
                                  {r.location || "—"}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                  {r.issue_type || "Waterlogging"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {toLocaleDate(r.submitted_at)}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{toLocaleTime(r.submitted_at)}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${status.label}`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${status.iconColor}`} />
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5 min-w-[120px]">
                              <div className="h-1.5 w-[78px] rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${confidence}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                                  className={`h-full rounded-full ${conf.bar}`}
                                />
                              </div>
                              <span className={`text-xs font-bold ${conf.text}`}>{confidence}%</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {r.dispatched_to ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="max-w-[150px] truncate">{r.dispatched_to}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelected(r)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30 bg-blue-50/70 dark:bg-cyan-500/10 hover:bg-blue-100 dark:hover:bg-cyan-500/20 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <div className="py-16 text-center">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-400 mb-3">
                            <Search className="w-6 h-6" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">No reports match your search.</p>
                          <p className="text-sm text-slate-400 mt-1">Try a different keyword or filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-white/10 text-xs text-slate-400 dark:text-slate-500">
              <span>Showing {filtered.length} of {reports.length} reports</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live <span className="hidden sm:inline">municipal</span> feed synced
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* IMPACT SECTION                                            */}
      {/* ============================================================ */}
      <section className="relative w-full mt-6 overflow-hidden bg-gradient-to-b from-[#eef6ff] to-[#f8fbff] dark:from-[#0b1526] dark:to-[#0c1a30]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <div className="absolute top-10 right-10 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14),transparent_65%)] blur-2xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 dark:border-blue-500/25 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.22em] uppercase font-mono mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Civic Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Your Reports Create{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500">
                Real Impact
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Every report helps create cleaner streets, faster responses and a more
              water-resilient Kolkata.
            </p>
          </div>

          <CivicImpact />
        </div>
      </section>

      {/* ============================================================ */}
      {/* DETAILS MODAL + LIGHTBOX                                    */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selected && <DetailsModal report={selected} onClose={() => setSelected(null)} />}
        {lightbox && <Lightbox src={getReportImageUrl(lightbox)} alt={lightbox.location} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* Civic impact 4-step cards (extracted for readability) */
function CivicImpact() {
  const steps = [
    { icon: FileText, title: "REPORT", desc: "Your voice starts the change." },
    { icon: ShieldCheck, title: "VERIFY", desc: "AI validates the issue instantly." },
    { icon: Send, title: "RESPOND", desc: "The right municipal team gets notified." },
    { icon: Sparkles, title: "IMPACT", desc: "Together we build a cleaner Kolkata." },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-px rounded-[26px] bg-gradient-to-b from-blue-200/40 via-transparent to-transparent dark:from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative rounded-[26px] bg-white/75 dark:bg-white/[0.05] border border-slate-100 dark:border-white/10 backdrop-blur-sm p-6 text-center h-full shadow-[0_14px_34px_-20px_rgba(15,23,42,0.15)]">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/15 dark:to-cyan-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-300 shadow-inner group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                <Icon className="w-7 h-7" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-cyan-300 text-[11px] font-extrabold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
              </div>
              <p className="mt-4 text-[13px] font-extrabold tracking-[0.18em] text-slate-800 dark:text-white font-mono">{step.title}</p>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* Full-screen details modal: original image, report info, verification timeline */
function DetailsModal({ report, onClose }) {
  // Determine where the report currently stands in the pipeline.
  const stageIndex = (() => {
    const s = report.status;
    if (s === "Resolved") return 5;
    if (s === "Dispatched") return 4;
    if (s === "Verified") return 2;
    if (s === "Under Review") return 1;
    return 0;
  })();

  const confidence = Math.round(Number(report.ai_confidence || 0));
  const lastUpdated = report.updated_at || report.submitted_at;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0b1526] border border-white/10 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/20 transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#16263f]">
          {getReportImageUrl(report) ? (
            <img src={getReportImageUrl(report)} alt={report.location} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Droplet className="w-14 h-14 text-slate-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-cyan-300 font-bold uppercase tracking-wider">{report.report_id}</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{report.location}</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/15 border border-white/20 backdrop-blur rounded-full px-3 py-1">
              <MapPin className="w-3.5 h-3.5" />
              Identified Waterlogging
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* status + dispatch summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoTile label="Submitted On" value={`${toLocaleDate(report.submitted_at)} · ${toLocaleTime(report.submitted_at)}`} />
            <InfoTile label="Status" value={report.status} color />
            <InfoTile label="Water Depth" value={report.water_depth ? `${report.water_depth} cm` : "n/a"} />
            <InfoTile label="Last Updated" value={`${toLocaleDate(lastUpdated)} · ${toLocaleTime(lastUpdated)}`} />
          </div>

          {/* description */}
          {report.description ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.description}</p>
            </div>
          ) : null}

          {/* coordinates */}
          {(report.latitude || report.longitude) ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-cyan-500" />
              <span className="font-mono">
                {report.latitude.toFixed ? report.latitude.toFixed(5) : report.latitude}°, {report.longitude.toFixed ? report.longitude.toFixed(5) : report.longitude}°
              </span>
            </div>
          ) : null}

          {/* AI verification */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">AI Verification</p>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(#06b6d4 ${confidence}%, #e2e8f0 ${confidence}%)` }}>
                <div className="absolute inset-1.5 rounded-full bg-white dark:bg-[#0b1526] flex items-center justify-center">
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white">{confidence}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{report.ai_verification_result || "Pending Analysis"}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Confidence computed by the KWI monsoon-vision model against live
                  catchment imagery and rainfall telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* verification timeline */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Verification Timeline</p>
            <div className="flex items-start">
              {PIPELINE.map((step, i) => {
                const StepIcon = step.icon;
                const isDone = i < stageIndex;
                const isCurrent = i === stageIndex;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
                    {i !== 0 && (
                      <div className={`absolute top-4 right-1/2 w-full h-[2px] ${i <= stageIndex ? "bg-cyan-500/70" : "bg-slate-200 dark:bg-white/10"}`} />
                    )}
                    <div
                      className={`relative z-10 inline-flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${
                        isDone
                          ? "bg-cyan-500 border-cyan-500 text-white"
                          : isCurrent
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-500 dark:text-cyan-300 animate-pulse"
                          : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/15 text-slate-300 dark:text-slate-500"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : <StepIcon className={`w-4 h-4 ${isCurrent ? "text-cyan-500 dark:text-cyan-300" : ""}`} />}
                    </div>
                    <p className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${
                      isCurrent ? "text-cyan-600 dark:text-cyan-300" : isDone ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {step.key}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* dispatch info */}
          <div className="rounded-2xl border border-sky-200/70 dark:border-sky-500/25 bg-sky-50 dark:bg-sky-500/10 p-4">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 mb-1">
              <Truck className="w-4 h-4" />
              <p className="text-sm font-bold">Dispatch Status</p>
            </div>
            <p className="text-sm text-sky-900/80 dark:text-sky-100/80">
              {report.dispatch_status || "Unassigned"}
            </p>
            {report.dispatched_to ? (
              <p className="mt-1 text-xs text-sky-700/70 dark:text-sky-200/70">
                Assigned to {report.dispatched_to}
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoTile({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-bold ${color ? "text-cyan-600 dark:text-cyan-300" : "text-slate-800 dark:text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}

/* Large photo lightbox for the exact original image */
function Lightbox({ src, alt, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
        aria-label="Close photo"
      >
        <X className="w-5 h-5" />
      </button>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full"
      >
        <img src={src} alt={alt || "Report photo"} className="w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/20" />
        {alt ? <p className="mt-3 text-center text-white/80 text-sm">{alt}</p> : null}
      </motion.div>
    </motion.div>
  );
}

/* Premium empty state for a logged-in user with no reports yet */
function EmptyState({ onNewReport }) {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#081023] via-[#0c1c3c] to-[#12294f] text-slate-100 isolate min-h-[70vh] flex items-center justify-center px-4">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[620px] h-[340px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.18),transparent_70%)] blur-2xl pointer-events-none" />
      <KolkataSkyline />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto"
      >
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-[28px] bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-300/25 text-cyan-300 mx-auto shadow-[0_0_60px_rgba(6,182,212,0.35)]">
          <FileText className="w-12 h-12" />
          <Droplet className="w-5 h-5 absolute -bottom-2 -right-2 text-cyan-400" />
        </div>
        <h1 className="mt-7 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          No Reports Submitted{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">Yet</span>
        </h1>
        <p className="mt-4 text-slate-300 leading-relaxed">
          You haven't submitted any waterlogging reports yet. Spot standing water or a
          drainage choke? File your first report and we'll route it to the right team.
        </p>
        <button
          type="button"
          onClick={onNewReport}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-[0_14px_34px_-10px_rgba(14,165,233,0.6)] transition-all active:scale-[0.97] cursor-pointer border border-white/20"
        >
          <Plus className="w-4 h-4" />
          Submit Your First Report
        </button>
        <p className="mt-4 text-xs text-cyan-200/70 italic">Every Report Makes Kolkata Better</p>
      </motion.div>
    </div>
  );
}

/* Guest (not logged in) prompt using the existing auth flow */
function GuestState({ onSignIn }) {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#081023] via-[#0c1c3c] to-[#12294f] text-slate-100 isolate min-h-[70vh] flex items-center justify-center px-4">
      <div className="absolute -top-20 right-10 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.20),transparent_62%)] blur-3xl pointer-events-none" />
      <KolkataSkyline />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto"
      >
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-[28px] bg-gradient-to-br from-blue-500/20 to-cyan-600/10 border border-blue-300/25 text-blue-300 mx-auto shadow-[0_0_60px_rgba(59,130,246,0.3)]">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h1 className="mt-7 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Your Reports, <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">Behind You</span>
        </h1>
        <p className="mt-4 text-slate-300 leading-relaxed">
          Sign in to view, track and manage the waterlogging reports you've submitted.
          Every report stays tied to your account — secure and private.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-[0_14px_34px_-10px_rgba(14,165,233,0.6)] transition-all active:scale-[0.97] cursor-pointer border border-white/20"
        >
          Sign In to Get Started
        </button>
      </motion.div>
    </div>
  );
}

export default MySubmittedReports;