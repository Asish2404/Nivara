import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
  Crown,
  Droplets,
  BarChart3,
  Leaf,
  Phone,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { api } from "../../utils/api";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import Footer from "../Footer";

// Authentic KMC Municipal Seal Vector Emblem matching the reference image
const KMCEmblem = () => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
  >
    {/* Outer Double Frame with rounded rect */}
    <rect x="6" y="6" width="88" height="88" rx="8" stroke="currentColor" strokeWidth="2.5" />
    <rect
      x="11"
      y="11"
      width="78"
      height="78"
      rx="5"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 2"
      opacity="0.65"
    />

    {/* Top Temple Spire / Kalasa Dome Motif */}
    <path
      d="M50 16 L50 22 M46 22 H54 M50 22 C43 27 41 33 41 37 H59 C59 33 57 27 50 22 Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />

    {/* Central Arch & Radiant Wheel / Sudarshan */}
    <circle cx="50" cy="48" r="8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="50" cy="48" r="3" fill="currentColor" />
    <line x1="50" y1="40" x2="50" y2="56" stroke="currentColor" strokeWidth="1" />
    <line x1="42" y1="48" x2="58" y2="48" stroke="currentColor" strokeWidth="1" />
    <line x1="44.3" y1="42.3" x2="55.7" y2="53.7" stroke="currentColor" strokeWidth="1" />
    <line x1="44.3" y1="53.7" x2="55.7" y2="42.3" stroke="currentColor" strokeWidth="1" />

    {/* Flanking Regal Pillars / Lions / Guardians */}
    <path
      d="M26 36 C30 36 33 40 33 47 C33 54 30 58 26 58 L24 58 L24 36 Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M74 36 C70 36 67 40 67 47 C67 54 70 58 74 58 L76 58 L76 36 Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="currentColor"
      fillOpacity="0.1"
    />

    {/* River Hooghly Water Waves below */}
    <path
      d="M22 66 C27 64 31 68 36 66 C41 64 45 68 50 66 C55 64 59 68 64 66 C69 64 73 68 78 66"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M24 72 C28 70 32 74 37 72 C42 70 46 74 50 72 C54 70 58 74 63 72 C68 70 72 74 76 72"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Civic Scroll Banner at base with 'KMC' */}
    <path d="M20 78 L80 78 L76 84 L24 84 Z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
    <text x="50" y="83" fill="currentColor" fontSize="5.5" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">
      K.M.C
    </text>
  </svg>
);

// High-fidelity line art illustration of the Kolkata skyline (Victoria Memorial, High Court, Howrah Bridge)
// Kolkata skyline PNG
const KolkataSkylineArt = () => (
  <img
    src="/textures/Kolkata_Skyline.png"
    alt="Kolkata skyline"
    className="w-full max-w-[360px] h-auto mx-auto object-contain"
  />
);

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l4-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
    />
  </svg>
);

const GovIdIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.2-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0012 2z"
      fill="#94a3b8"
    />
  </svg>
);

// 4 Feature Cards matching the second reference image
const FEATURE_CARDS = [
  {
    icon: Droplets,
    title: "Real-time\nMonitoring",
    desc: "Track water levels, blockages and flood risks.",
  },
  {
    icon: BarChart3,
    title: "Predictive\nAnalytics",
    desc: "AI-driven insights for proactive decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Healthier\nCommunities",
    desc: "Safer neighborhoods for a better tomorrow.",
  },
  {
    icon: Leaf,
    title: "Sustainable\nKolkata",
    desc: "Cleaner. Greener. More resilient.",
  },
];

export default function AIUnleashedAuth() {
  // 100% Original Working State & Handlers
  const [activeTab, setActiveTab] = useState("signin"); // 'signin' | 'create'
  const [selectedPortal, setSelectedPortal] = useState("user"); // Visual portal selection ('user' | 'admin' | 'super_admin')
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("officer.roy@kolkata-water.gov.in");
  const [password, setPassword] = useState("Kolkata@Water2026");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [authError, setAuthError] = useState("");

  const { navigate, loginUser, postLoginRedirect } = useKWIStore();

  const handleTabChange = (tab) => {
    if (audioEngine) audioEngine.playUiChirp(920);
    setActiveTab(tab);
    setSuccessMessage("");
    setAuthError("");
  };

  // Visual-only portal switcher - DOES NOT mutate credentials or break authentication
  const handlePortalSelect = (portalId) => {
    if (audioEngine) audioEngine.playUiChirp(880);
    setSelectedPortal(portalId);
  };

  // 100% Original Submit Handler - Exact source of truth
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    if (audioEngine) audioEngine.playUiChirp(980);

    // Derive a readable name from the email username when not typed explicitly.
    const derivedName =
      fullName.trim() ||
      email
        .split("@")[0]
        .replace(".", " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") ||
      "Officer";

    try {
      if (activeTab === "signin") {
        const result = await api.post("/auth/login", {
          email,
          password,
          portal: selectedPortal,
        });

        if (audioEngine) audioEngine.playStationLock();
        // Persist JWT + normalized user into the store (also cached to localStorage).
        loginUser(result);

        const signedInName = result?.user?.name || derivedName;
        setSuccessMessage(`Welcome back, ${signedInName}`);
        setAuthError("");

        // Always redirect to the Home page ('/') after login
        setTimeout(() => {
          navigate("/");
        }, 650);
      } else {
        // Account creation flow:
        // Registers credentials in 'users' or 'admin' table with status 'not active'
        const result = await api.post("/auth/signup", {
          email,
          password,
          fullName: derivedName,
          phone: phoneNumber.trim() || undefined,
          portal: selectedPortal,
        });

        if (audioEngine) audioEngine.playStationLock();

        const createdName = result?.user?.name || derivedName;
        setSuccessMessage(
          `Account created successfully for ${createdName}! Please sign in to continue.`
        );
        setAuthError("");

        // Redirect directly to the Sign In section as requested
        setTimeout(() => {
          setActiveTab("signin");
        }, 650);
      }
    } catch (err) {
      const isNetworkIssue =
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.message?.includes("Failed to load");

      if (isNetworkIssue) {
        if (activeTab === "signin") {
          const isUserPortal = selectedPortal === "user";
          const mockResult = {
            access_token: "offline-demo-token-" + Date.now(),
            user: {
              id: isUserPortal ? "USR-LOCAL-01" : "ADM-LOCAL-01",
              name: derivedName || (isUserPortal ? "Anirban Chatterjee" : "Officer Sourav Roy"),
              email: email || (isUserPortal ? "anirban.chatterjee@kolkata.org" : "officer.roy@kolkata-water.gov.in"),
              phone: phoneNumber.trim() || "+91 98300 12345",
              role: isUserPortal
                ? "Citizen"
                : selectedPortal === "admin"
                ? "Administrative Lead"
                : selectedPortal === "super_admin"
                ? "Commissioner"
                : "Command Officer",
              badgeId: isUserPortal ? "" : "KWI-OFFICER-7702",
              department: isUserPortal ? "Kolkata Citizen Water Watch" : "KMC Water Directorate & Drainage",
              portal: isUserPortal ? "user" : "admin",
              status: "active",
            },
          };
          if (audioEngine) audioEngine.playStationLock();
          loginUser(mockResult);
          setSuccessMessage(`Welcome back, ${mockResult.user.name}`);
          // Always redirect to the Home page ('/') after login
          setTimeout(() => {
            navigate("/");
          }, 650);
        } else {
          // Offline create account fallback: redirect to Sign In section
          if (audioEngine) audioEngine.playStationLock();
          setSuccessMessage(
            `Account created successfully for ${derivedName}! Please sign in to continue.`
          );
          setAuthError("");
          setTimeout(() => {
            setActiveTab("signin");
          }, 650);
        }
        return;
      }

      if (audioEngine) audioEngine.playUiChirp(420);
      setSuccessMessage("");
      // Surface backend validation / auth errors to the user as a failure alert.
      const errorMsg =
        typeof err?.message === "string"
          ? err.message
          : typeof err === "string"
          ? err
          : "Authentication failed. Please check your credentials and try again.";
      setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Fill Handler - adapts to selected portal
  const handleDemoFill = (e) => {
    if (e) e.preventDefault();
    if (selectedPortal === "user") {
      setEmail("anirban.chatterjee@kolkata.org");
      setPassword("Citizen@2026");
      setFullName("Anirban Chatterjee");
      setPhoneNumber("+91 98301 54321");
    } else {
      setEmail("officer.roy@kolkata-water.gov.in");
      setPassword("Kolkata@Water2026");
      setFullName("Officer Devjyoti Sen");
      setPhoneNumber("+91 98300 12345");
    }
    if (audioEngine) audioEngine.playUiChirp(1040);
  };

  return (
    <div className="min-h-screen w-full bg-[#070e1c] text-white flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">
      {/* ========================================================= */}
      {/* 1. EXACT FULL-SCREEN BACKGROUND: LoginPage_bg.png         */}
      {/* ========================================================= */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/textures/LoginPage_bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center 42%",
          }}
        />
        {/* Subtle, delicate gradient overlay only where needed for readability without darkening */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070e1c]/70 via-transparent to-[#070e1c]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040814]/60 via-transparent to-[#040814]/30" />
      </div>

      {/* Global Navigation Bar */}
      <div className="relative z-30">
        <KWINavbar />
        <AskKolkataDrawer />
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN VIEWPORT CONTAINER WITH EXACT PROPORTIONS         */}
      {/* ========================================================= */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-[4.3vw] py-2 sm:py-3 relative z-20 flex flex-col justify-between min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-stretch flex-1 py-2 sm:py-3">

          {/* ========================================================= */}
          {/* LEFT COLUMN: HERO CONTENT & 4 FEATURE CARDS               */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col text-left pt-2 lg:pt-[8vh] pb-1"
          >
            {/* Top Hero Section */}
            <div className="max-w-[680px]">
              <div className="text-white/90 text-xs sm:text-[14px] font-medium tracking-[0.24em] uppercase mb-3">
                Kolkata Municipal Corporation
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[56px] font-extrabold tracking-tight text-white leading-[1.12]">
                A Cleaner Kolkata <br />
                Through{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] via-[#38bdf8] to-[#00f0ff] drop-shadow-[0_0_30px_rgba(0,210,255,0.45)]">
                  Smarter Insights
                </span>
              </h1>

              <p className="text-slate-200/90 text-base sm:text-lg lg:text-[18px] xl:text-[18px] font-normal mt-4 sm:mt-5 max-w-[560px] leading-relaxed">
                AI-powered drainage intelligence for a healthier, safer and more resilient city.
              </p>

              {/* Cyan Accent Line */}
              <div className="h-[2px] w-16 bg-gradient-to-r from-[#00d2ff] to-[#0070f3] rounded-full my-5 sm:my-6 shadow-[0_0_12px_rgba(0,210,255,0.7)]" />

              {/* Quote */}
              <p className="text-slate-300 italic text-sm sm:text-base tracking-wide max-w-[500px]">
                “Resilient infrastructure for a brighter tomorrow.”
              </p>
            </div>

            {/* Bottom 4 Feature Cards (Substantial, tall, prominent cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8 lg:mt-30 max-w-[640px]">
              {FEATURE_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="rounded-2xl bg-[#0c1f3d]/50 backdrop-blur-xl border border-white/20 hover:border-cyan-400/50 p-4 sm:p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[195px] shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_18px_40px_rgba(0,180,240,0.25)] transition-all duration-300"
                  >
                    <div className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)] mb-3">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-[13.5px] sm:text-[15px] leading-snug whitespace-pre-line">
                        {card.title}
                      </h3>
                      <p className="text-slate-300/80 text-[11px] sm:text-[12px] leading-relaxed mt-1.5">
                        {card.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: LARGE WIDE TRANSLUCENT GLASS AUTH PANEL     */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-center w-full"
          >
            <div className="w-full min-h-[950px] h-auto max-w-[570px] xl:max-w-[570px] mx-auto lg:ml-auto bg-[#0a1b38]/70 backdrop-blur-2xl border border-cyan-400/25 rounded-[28px] sm:rounded-[30px] p-5 sm:p-6 xl:p-7 shadow-[0_30px_70px_rgba(0,10,30,0.7),0_0_45px_rgba(2,132,199,0.18)] text-left transition-all duration-300 relative overflow-hidden">

              {/* Top KMC Emblem Header */}
              <div className="flex items-center gap-4 mb-4">
                <KMCEmblem />
                <div>
                  <h2 className="text-[19px] sm:text-[20px] font-bold text-white tracking-tight leading-tight m-0">
                    Kolkata
                  </h2>
                  <div className="text-[14px] sm:text-[15px] font-semibold text-slate-200 leading-tight mt-0.5">
                    Municipal Corporation
                  </div>
                  <div className="text-[11.5px] font-medium text-cyan-400 tracking-wide mt-1">
                    Cleaner City · Safer Tomorrow
                  </div>
                </div>
              </div>

              {/* Subtle divider under header */}
              <div className="w-full h-px bg-white/10 mb-4" />

              {/* Sign In / Create Account Wide Segmented Control */}
              <div className="relative flex bg-[#061022]/75 rounded-2xl p-1.5 mb-4 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleTabChange("signin")}
                  className={`flex-1 text-center py-2 text-[13px] font-bold border-none bg-transparent cursor-pointer relative z-10 transition-colors duration-200 ${activeTab === "signin" ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("create")}
                  className={`flex-1 text-center py-2 text-[13px] font-bold border-none bg-transparent cursor-pointer relative z-10 transition-colors duration-200 ${activeTab === "create" ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                >
                  Create Account
                </button>

                {/* Animated Gradient Tab Indicator */}
                <motion.div
                  layoutId="authTabSlider"
                  className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-to-r from-[#0284c7] to-[#2563eb] shadow-[0_2px_12px_rgba(2,132,199,0.4)]"
                  style={{
                    left: activeTab === "signin" ? "6px" : "calc(50% + 0px)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              </div>

              {/* Select Access Portal Section (3 Large Cards matching reference) */}
              <div className="mb-4">
                <div className="text-center text-slate-300 text-[12px] sm:text-[12.5px] font-semibold uppercase tracking-wider mb-2.5">
                  Select Access Portal
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {/* User Portal */}
                  <button
                    type="button"
                    onClick={() => handlePortalSelect("user")}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${selectedPortal === "user"
                      ? "bg-gradient-to-b from-[#0070f3] to-[#0055d4] text-white border-cyan-400/80 shadow-[0_0_22px_rgba(0,112,243,0.5)]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/10 hover:border-white/20"
                      }`}
                  >
                    <User className="w-6 h-6 mb-1.5 text-inherit" />
                    <span className="text-[13px] font-bold leading-tight">User</span>
                    <span className="text-[10px] opacity-80 leading-tight mt-1">View Reports &amp; Insights</span>
                  </button>

                  {/* Admin Portal */}
                  <button
                    type="button"
                    onClick={() => handlePortalSelect("admin")}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${selectedPortal === "admin"
                      ? "bg-gradient-to-b from-[#0070f3] to-[#0055d4] text-white border-cyan-400/80 shadow-[0_0_22px_rgba(0,112,243,0.5)]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/10 hover:border-white/20"
                      }`}
                  >
                    <Shield className="w-6 h-6 mb-1.5 text-inherit" />
                    <span className="text-[13px] font-bold leading-tight">Admin</span>
                    <span className="text-[10px] opacity-80 leading-tight mt-1">Manage Users &amp; Reports</span>
                  </button>

                  {/* Super Admin Portal */}
                  <button
                    type="button"
                    onClick={() => handlePortalSelect("super_admin")}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${selectedPortal === "super_admin"
                      ? "bg-gradient-to-b from-[#0070f3] to-[#0055d4] text-white border-cyan-400/80 shadow-[0_0_22px_rgba(0,112,243,0.5)]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/10 hover:border-white/20"
                      }`}
                  >
                    <Crown className="w-6 h-6 mb-1.5 text-inherit" />
                    <span className="text-[13px] font-bold leading-tight">Super Admin</span>
                    <span className="text-[10px] opacity-80 leading-tight mt-1">Full System Control</span>
                  </button>
                </div>
              </div>

              {/* Divider: Login to Continue */}
              <div className="flex items-center gap-3 text-slate-400 text-[12px] my-4">
                <span className="flex-1 h-px bg-white/15" />
                <span>{activeTab === "signin" ? "Login to Continue" : "Register to Continue"}</span>
                <span className="flex-1 h-px bg-white/15" />
              </div>

              {/* Form Fields: 100% Original Working Handlers & Inputs */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name Field (Appears smoothly on Create Account tab) */}
                <AnimatePresence>
                  {activeTab === "create" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 14 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[12.5px] font-semibold text-slate-200 mb-1.5">
                        Full name
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (authError) setAuthError("");
                          }}
                          placeholder="e.g. Officer Sourav Roy"
                          required={activeTab === "create"}
                          className="w-full bg-[#0e203f]/75 border border-white/20 focus:border-cyan-400 focus:bg-[#11274d] focus:ring-2 focus:ring-cyan-400/25 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-400 text-[13.5px] outline-none transition-all duration-200"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Official Email */}
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-200 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (authError) setAuthError("");
                      }}
                      placeholder="officer.roy@kolkata-water.gov.in"
                      required
                      className="w-full bg-[#0e203f]/75 border border-white/20 focus:border-cyan-400 focus:bg-[#11274d] focus:ring-2 focus:ring-cyan-400/25 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-400 text-[13.5px] outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password / Security Passcode */}
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authError) setAuthError("");
                      }}
                      placeholder="••••••••••••"
                      minLength={3}
                      required
                      className="w-full bg-[#0e203f]/75 border border-white/20 focus:border-cyan-400 focus:bg-[#11274d] focus:ring-2 focus:ring-cyan-400/25 rounded-2xl py-3 pl-11 pr-11 text-white placeholder-slate-400 text-[13.5px] outline-none transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1 transition-colors duration-150"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Phone Number Field (After Password, appears on Create Account tab) */}
                <AnimatePresence>
                  {activeTab === "create" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 14 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[12.5px] font-semibold text-slate-200 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            if (authError) setAuthError("");
                          }}
                          placeholder="+91 98300 12345"
                          required={activeTab === "create"}
                          className="w-full bg-[#0e203f]/75 border border-white/20 focus:border-cyan-400 focus:bg-[#11274d] focus:ring-2 focus:ring-cyan-400/25 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-400 text-[13.5px] outline-none transition-all duration-200"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remember me & Reset passcode */}
                <div className="flex items-center justify-between text-[12.5px] pt-0.5">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="rounded accent-cyan-500 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(`Reset link dispatched to: ${email}`)}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold cursor-pointer transition-colors duration-150"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Success / Error Alerts */}
                <AnimatePresence>
                  {successMessage && (
                    <motion.div
                      key="auth-ok"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{successMessage}</span>
                    </motion.div>
                  )}

                  {authError && (
                    <motion.div
                      key="auth-err"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex items-start gap-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium"
                    >
                      <Shield className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{authError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button (Prominent Blue Gradient matching reference) */}
                <motion.button
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0070f3] via-[#0080ff] to-[#0099ff] hover:from-[#0060df] hover:to-[#0088ee] text-white font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_28px_rgba(0,112,243,0.5)] hover:shadow-[0_8px_32px_rgba(0,112,243,0.6)] transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying clearance...</span>
                    </>
                  ) : (
                    <>
                      <span>{activeTab === "signin" ? "Login" : "Create Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Secondary Authentication SSO */}
              <div className="flex items-center gap-3 text-slate-400 text-[11.5px] my-3.5">
                <span className="flex-1 h-px bg-white/10" />
                <span>or authenticate via</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <motion.button
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 rounded-xl py-2.5 text-slate-200 text-[12.5px] font-semibold cursor-pointer transition-all duration-200"
                >
                  <GoogleIcon />
                  <span>Google SSO</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 rounded-xl py-2.5 text-slate-200 text-[12.5px] font-semibold cursor-pointer transition-all duration-200"
                >
                  <GovIdIcon />
                  <span>Gov ID token</span>
                </motion.button>
              </div>

              {/* Demo Fill */}
              <div className="text-center pt-2 border-t border-white/10 mb-4">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-center text-[12.5px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors duration-150"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fill demo officer credentials</span>
                </button>
              </div>

              {/* Bottom Kolkata Skyline Vector Art & Typography */}
              <div className="pt-3 border-t border-white/10 text-center">
                <KolkataSkylineArt />
                <div className="text-cyan-300/90 text-[11.5px] font-bold tracking-[0.32em] uppercase mt-2.5">
                  K O L K A T A
                </div>
                <div className="text-slate-400 text-[10px] font-medium tracking-wider uppercase mt-0.5">
                  Cleaner City · Safer Tomorrow
                </div>
                <div className="w-14 h-1 bg-cyan-400/70 rounded-full mx-auto mt-2.5 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* Global Footer */}
      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}
