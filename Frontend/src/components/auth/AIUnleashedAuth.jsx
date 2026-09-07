import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import createGlobe from "cobe";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { api } from "../../utils/api";
import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import Footer from "../Footer";

// Pure, Seamless 3D Interactive WebGL Globe with Buttery Smooth Damping Physics
function CobeGlobeInsidePanel() {
  const canvasRef = useRef(null);
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  const rRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 4.6;
    let animId;
    const width = 450;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 4.6,
      theta: 0.35,
      dark: 1, // Deep black sphere
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 3.8,
      mapBaseBrightness: 0.05,
      baseColor: [0.65, 0.65, 0.65], // Pure grey dots
      markerColor: [0, 0, 0],
      glowColor: [0.25, 0.25, 0.25], // Subtle monochrome grey rim
      opacity: 1,
      scale: 1,
      markers: [],
      arcs: [],
    });

    const animate = () => {
      if (pointerInteracting.current === null) {
        // Smooth inertia deceleration
        velocityRef.current *= 0.94;
        rRef.current += velocityRef.current;
        // Continuous smooth idle rotation
        phi += 0.0032;
      }

      globe.update({
        phi: phi + rRef.current,
        theta: 0.35,
      });
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      globe.destroy();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center select-none bg-transparent"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          velocityRef.current = 0;
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            const stepDelta = delta - pointerInteractionMovement.current;
            pointerInteractionMovement.current = delta;
            velocityRef.current = stepDelta / 140;
            rRef.current = delta / 120;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            const stepDelta = delta - pointerInteractionMovement.current;
            pointerInteractionMovement.current = delta;
            velocityRef.current = stepDelta / 140;
            rRef.current = delta / 120;
          }
        }}
        className="w-full h-full cursor-grab opacity-100 block bg-transparent transition-opacity duration-500"
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: "1",
        }}
      />
    </motion.div>
  );
}

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
      fill="#3d4356"
    />
  </svg>
);

export default function AIUnleashedAuth() {
  const [activeTab, setActiveTab] = useState("signin"); // 'signin' | 'create'
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("officer.roy@kolkata-water.gov.in");
  const [password, setPassword] = useState("Kolkata@Water2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [authError, setAuthError] = useState("");

  const { navigate, loginUser } = useKWIStore();

  const handleTabChange = (tab) => {
    if (audioEngine) audioEngine.playUiChirp(920);
    setActiveTab(tab);
    setSuccessMessage("");
    setAuthError("");
  };

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
      let result;
      if (activeTab === "signin") {
        result = await api.post("/auth/login", { email, password });
      } else {
        result = await api.post("/auth/signup", {
          email,
          password,
          fullName: derivedName,
        });
      }

      if (audioEngine) audioEngine.playStationLock();
      // Persist JWT + normalized user into the store (also cached to localStorage).
      loginUser(result);

      const signedInName = result?.user?.name || derivedName;
      setSuccessMessage(
        activeTab === "signin"
          ? `Welcome back, ${signedInName}`
          : `Account created successfully for ${signedInName}`
      );

      setTimeout(() => {
        navigate("/live-city");
      }, 650);
    } catch (err) {
      if (audioEngine) audioEngine.playUiChirp(420);
      setSuccessMessage("");
      // Surface backend validation / auth errors to the user as a failure alert.
      setAuthError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (e) => {
    if (e) e.preventDefault();
    setEmail("officer.roy@kolkata-water.gov.in");
    setPassword("Kolkata@Water2026");
    if (audioEngine) audioEngine.playUiChirp(1040);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1220] text-[#181c2a] dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-[#0284c7]/20 selection:text-[#0284c7] overflow-x-hidden relative">
      {/* Global Navigation Bar */}
      <div className="relative z-30">
        <KWINavbar />
        <AskKolkataDrawer />
      </div>

      {/* Main Hero Container */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-7 py-6 sm:py-10 relative z-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* ========================================================= */}
          {/* LEFT COLUMN: Floating 3D Globe with Staggered Entrance   */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-center justify-center text-center lg:text-left"
          >
            {/* Pure 3D Globe with No Background Box */}
            <div className="w-full flex items-center justify-center bg-transparent">
              <CobeGlobeInsidePanel />
            </div>

            {/* Bottom Caption & Version Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="px-2 mt-4 text-center lg:text-left max-w-[560px]"
            >
              <div className="flex items-center justify-center lg:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#181c2a] dark:text-white m-0">
                  Kolkata Water Intelligence
                </h1>
                <span className="text-[11px] text-[#0284c7] bg-cyan-50 border border-cyan-200/80 dark:bg-cyan-500/15 dark:border-cyan-500/30 px-2 py-0.5 rounded-md font-semibold transition-colors duration-200">
                  v3.4
                </span>
              </div>
              <p className="text-sm text-[#6b7488] dark:text-slate-400 leading-relaxed mt-2">
                Real-time urban drainage telemetry, storm surge forecasting, and municipal command coordination for Kolkata Municipal Corporation.
              </p>
            </motion.div>
          </motion.div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Clean White Auth Card with Smooth Animation*/}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            <div className="w-full bg-white dark:bg-[#16213a] border border-[#e6e9f2] dark:border-slate-800 rounded-[20px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(40,40,90,0.08)] text-left transition-shadow duration-300">

              {/* Tabs: Sign In / Create Account with Smooth Spring Slider */}
              <div className="relative flex bg-[#f0f2f8] dark:bg-slate-800/80 rounded-xl p-1 mb-5.5">
                <button
                  type="button"
                  onClick={() => handleTabChange("signin")}
                  className={`flex-1 text-center py-2.5 text-[13.5px] font-bold border-none bg-transparent cursor-pointer relative z-10 transition-colors duration-200 ${
                    activeTab === "signin" ? "text-white" : "text-[#7b8398] dark:text-slate-400 hover:text-[#181c2a] dark:hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("create")}
                  className={`flex-1 text-center py-2.5 text-[13.5px] font-bold border-none bg-transparent cursor-pointer relative z-10 transition-colors duration-200 ${
                    activeTab === "create" ? "text-white" : "text-[#7b8398] dark:text-slate-400 hover:text-[#181c2a] dark:hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>

                {/* Sliding Gradient Indicator Pill */}
                <motion.div
                  layoutId="authTabSlider"
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[9px] bg-gradient-to-r from-[#0284c7] to-[#2563eb] shadow-sm"
                  style={{
                    left: activeTab === "signin" ? "4px" : "calc(50% + 0px)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              </div>

              {/* Badge Row */}
              <div className="flex items-center gap-1.5 text-[#0d9488] text-[11.5px] font-bold mb-2.5 uppercase tracking-wide">
                <Shield className="w-3.5 h-3.5" />
                <span>Municipal officer access</span>
              </div>

              {/* Animated Form Header & Content Transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h2 className="text-[21px] font-bold text-[#181c2a] m-0 mb-1 tracking-tight">
                    {activeTab === "signin" ? "Command authorization" : "Officer Registration"}
                  </h2>
                  <p className="text-[13px] text-[#6b7488] m-0 mb-5">
                    {activeTab === "signin"
                      ? "Verify your municipal clearance to enter the command grid."
                      : "Register your official credentials for civic telemetry access."}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field (Appears smoothly on Create Account tab) */}
                <AnimatePresence>
                  {activeTab === "create" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[12.5px] font-bold text-[#3d4356] dark:text-slate-300 mb-1.5">
                        Full name
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#0284c7]">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Officer Sourav Roy"
                          required={activeTab === "create"}
                          className="w-full bg-[#f8f9fc] dark:bg-slate-800/50 border border-[#e6e9f2] dark:border-slate-700 rounded-[11px] py-3 pl-10 pr-3.5 text-[#181c2a] dark:text-slate-100 text-[13.5px] focus:outline-none focus:border-[#0284c7] focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-[#0284c7]/15 transition-all duration-200"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Official Email */}
                <div>
                  <label className="block text-[12.5px] font-bold text-[#3d4356] dark:text-slate-300 mb-1.5">
                    Official email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#0284c7]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer.roy@kolkata-water.gov.in"
                      required
                      className="w-full bg-[#f8f9fc] dark:bg-slate-800/50 border border-[#e6e9f2] dark:border-slate-700 rounded-[11px] py-3 pl-10 pr-3.5 text-[#181c2a] dark:text-slate-100 text-[13.5px] focus:outline-none focus:border-[#0284c7] focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-[#0284c7]/15 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Security Passcode */}
                <div>
                  <label className="block text-[12.5px] font-bold text-[#3d4356] dark:text-slate-300 mb-1.5">
                    Security passcode
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#0284c7]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-[#f8f9fc] dark:bg-slate-800/50 border border-[#e6e9f2] dark:border-slate-700 rounded-[11px] py-3 pl-10 pr-10 text-[#181c2a] dark:text-slate-100 text-[13.5px] focus:outline-none focus:border-[#0284c7] focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-[#0284c7]/15 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b96ab] hover:text-[#181c2a] cursor-pointer p-1 transition-colors duration-150"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Reset Links */}
                <div className="flex items-center justify-between text-[12.5px] pt-0.5">
                  <label className="flex items-center gap-2 text-[#5b6478] cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="rounded accent-[#0284c7] cursor-pointer"
                    />
                    <span>Remember session</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(`Reset link dispatched to: ${email}`)}
                    className="text-[#0284c7] hover:underline font-semibold cursor-pointer transition-colors duration-150"
                  >
                    Reset passcode?
                  </button>
                </div>

                {/* Success Message Alert with Smooth Entrance */}
                <AnimatePresence>
                  {successMessage && (
                    <motion.div
                      key="auth-ok"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#15803d] dark:text-emerald-400 text-xs font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22c55e]" />
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
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium"
                    >
                      <Shield className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      <span>{authError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button with Smooth Micro-Interaction */}
                <motion.button
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-[12px] bg-gradient-to-r from-[#0284c7] to-[#2563eb] text-white font-bold text-[14.5px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_10px_24px_rgba(2,132,199,0.28)] hover:shadow-[0_12px_28px_rgba(2,132,199,0.36)] hover:brightness-105 transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying clearance...</span>
                    </>
                  ) : (
                    <>
                      <span>{activeTab === "signin" ? "Sign in to command" : "Create officer account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 text-[#9aa2b4] text-[11.5px] my-5">
                <span className="flex-1 h-px bg-[#e6e9f2]" />
                <span>or authenticate via</span>
                <span className="flex-1 h-px bg-[#e6e9f2]" />
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-4.5">
                <motion.button
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800/60 border border-[#e6e9f2] dark:border-slate-700 rounded-[11px] py-2.5 text-[#3d4356] dark:text-slate-200 text-[13px] font-semibold cursor-pointer hover:shadow-[0_4px_14px_rgba(30,40,80,0.08)] hover:border-[#cbd5e1] dark:hover:bg-slate-700/60 dark:hover:border-slate-600 transition-all duration-200"
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
                  className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800/60 border border-[#e6e9f2] dark:border-slate-700 rounded-[11px] py-2.5 text-[#3d4356] dark:text-slate-200 text-[13px] font-semibold cursor-pointer hover:shadow-[0_4px_14px_rgba(30,40,80,0.08)] hover:border-[#cbd5e1] dark:hover:bg-slate-700/60 dark:hover:border-slate-600 transition-all duration-200"
                >
                  <GovIdIcon />
                  <span>Gov ID token</span>
                </motion.button>
              </div>

              {/* Demo Credentials Quick Fill */}
              <div className="text-center pt-2 border-t border-[#e6e9f2]/70">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-center text-[12.5px] text-[#0284c7] hover:text-[#0369a1] font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors duration-150"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Fill demo officer credentials</span>
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
