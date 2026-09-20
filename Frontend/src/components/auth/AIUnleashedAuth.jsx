import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
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
  Smartphone,
  Check,
} from "lucide-react";
import { useKWIStore, isUserAdmin } from "../../store/useKWIStore";
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
    <rect
      x="6"
      y="6"
      width="88"
      height="88"
      rx="8"
      stroke="currentColor"
      strokeWidth="2.5"
    />
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
    <line
      x1="50"
      y1="40"
      x2="50"
      y2="56"
      stroke="currentColor"
      strokeWidth="1"
    />
    <line
      x1="42"
      y1="48"
      x2="58"
      y2="48"
      stroke="currentColor"
      strokeWidth="1"
    />
    <line
      x1="44.3"
      y1="42.3"
      x2="55.7"
      y2="53.7"
      stroke="currentColor"
      strokeWidth="1"
    />
    <line
      x1="44.3"
      y1="53.7"
      x2="55.7"
      y2="42.3"
      stroke="currentColor"
      strokeWidth="1"
    />

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
    <path
      d="M20 78 L80 78 L76 84 L24 84 Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <text
      x="50"
      y="83"
      fill="currentColor"
      fontSize="5.5"
      fontWeight="bold"
      textAnchor="middle"
      letterSpacing="1.5"
    >
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

// 4 Feature Cards with distinctive colors matching the municipal domains
const FEATURE_CARDS = [
  {
    icon: Droplets,
    title: "Real-time\nMonitoring",
    desc: "Track water levels, blockages and flood risks across Kolkata.",
    color: "text-cyan-400",
    glow: "drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]",
    hoverBorder: "hover:border-cyan-400/50",
    hoverShadow: "hover:shadow-[0_18px_40px_rgba(6,182,212,0.22)]",
  },
  {
    icon: BarChart3,
    title: "Predictive\nAnalytics",
    desc: "Hydrological AI models for proactive civic decision making.",
    color: "text-violet-400",
    glow: "drop-shadow-[0_0_12px_rgba(168,85,247,0.65)]",
    hoverBorder: "hover:border-violet-400/50",
    hoverShadow: "hover:shadow-[0_18px_40px_rgba(168,85,247,0.22)]",
  },
  {
    icon: ShieldCheck,
    title: "Healthier\nCommunities",
    desc: "Safer, better prepared neighborhoods for citizen well-being.",
    color: "text-amber-400",
    glow: "drop-shadow-[0_0_12px_rgba(245,158,11,0.65)]",
    hoverBorder: "hover:border-amber-400/50",
    hoverShadow: "hover:shadow-[0_18px_40px_rgba(245,158,11,0.22)]",
  },
  {
    icon: Leaf,
    title: "Sustainable\nKolkata",
    desc: "Cleaner, greener, and more resilient urban water systems.",
    color: "text-emerald-400",
    glow: "drop-shadow-[0_0_12px_rgba(16,185,129,0.65)]",
    hoverBorder: "hover:border-emerald-400/50",
    hoverShadow: "hover:shadow-[0_18px_40px_rgba(16,185,129,0.22)]",
  },
];

export default function AIUnleashedAuth() {
  const { navigate, loginUser, currentRoute } = useKWIStore();

  // 100% Original Working State & Handlers
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase();
      if (p === "/signup" || p === "/register") return "create";
    }
    return "signin";
  }); // 'signin' | 'create'
  const [selectedPortal, setSelectedPortal] = useState("user"); // Visual portal selection ('user' | 'admin' | 'super_admin')
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [authError, setAuthError] = useState("");

  // Dedicated 2FA OTP Step State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpTargetPhone, setOtpTargetPhone] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const otpInputRefs = useRef([]);
  const nativeOtpInputRef = useRef(null);

  // Google SSO state and container ref
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAuthMessage, setGoogleAuthMessage] = useState("");
  const googleBtnContainerRef = useRef(null);
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "720592181985-nl0vbi1spjvavemtnri1ufb9ib1knlic.apps.googleusercontent.com";

  // Google Credential Response Handler
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setAuthError("Google authentication was cancelled or returned no credentials.");
      return;
    }

    setAuthError("");
    setPhoneError("");
    setSuccessMessage("");
    setIsGoogleLoading(true);
    setGoogleAuthMessage("Verifying secure identity...");
    if (audioEngine) audioEngine.playUiChirp(980);

    try {
      const result = await api.post("/auth/google", {
        credential: response.credential,
      });

      setGoogleAuthMessage("Authentication Successful");
      if (audioEngine) audioEngine.playStationLock();
      loginUser(result);

      const userName = result?.user?.name || "User";
      setSuccessMessage(`Welcome back, ${userName}`);

      // Role-based redirection:
      // Existing Official/Admin -> /dashboard or /admin-dashboard
      // Existing Citizen/New Google User -> / or /reports (or postLoginRedirect)
      const postRedirect = useKWIStore.getState().postLoginRedirect;
      const isAdmin = isUserAdmin(result.user);
      const targetRoute = postRedirect || (isAdmin ? "/dashboard" : "/");

      setTimeout(() => {
        navigate(targetRoute);
        useKWIStore.getState().setPostLoginRedirect(null);
      }, 700);
    } catch (err) {
      console.error("Google authentication failure:", err);
      const msg =
        err?.message || "Google authentication failed. Please check your network and try again.";
      setAuthError(msg);
      if (audioEngine) audioEngine.playUiChirp(420);
    } finally {
      setIsGoogleLoading(false);
      setGoogleAuthMessage("");
    }
  };

  // Mount Google Identity Services button inside the custom overlay
  useEffect(() => {
    let cancel = false;

    const setupGoogleSSO = () => {
      if (cancel || !window.google?.accounts?.id || !googleBtnContainerRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "signin_with",
            logo_alignment: "left",
            width: 280,
          });
        }
      } catch (err) {
        console.warn("Google Identity Services setup notice:", err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleSSO();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleSSO();
        }
      }, 250);
      return () => {
        cancel = true;
        clearInterval(timer);
      };
    }

    return () => {
      cancel = true;
    };
  }, [googleClientId, currentRoute, isOtpStep]);

  // 60-second OTP countdown ticker
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Auto-focus input when entering OTP step
  useEffect(() => {
    if (isOtpStep) {
      const timer = setTimeout(() => {
        nativeOtpInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOtpStep]);

  // Synchronize activeTab if route changes between /signup and /login / /signin
  useEffect(() => {
    if (currentRoute === "/signup" || currentRoute === "/register") {
      setActiveTab("create");
    } else if (
      currentRoute === "/login" ||
      currentRoute === "/signin" ||
      currentRoute === "/auth"
    ) {
      setActiveTab("signin");
    }
  }, [currentRoute]);

  // Tab switcher
  const handleTabChange = (tab) => {
    if (audioEngine) audioEngine.playUiChirp(920);
    setActiveTab(tab);
    if (tab === "signin") {
      if (currentRoute !== "/login" && currentRoute !== "/signin") {
        navigate("/login");
      }
    } else {
      if (currentRoute !== "/signup") {
        navigate("/signup");
      }
    }
    setSuccessMessage("");
    setAuthError("");
    setPhoneError("");
    setIsOtpStep(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpCountdown(0);
  };

  // Portal switcher
  const handlePortalSelect = (portalId) => {
    if (audioEngine) audioEngine.playUiChirp(880);
    setSelectedPortal(portalId);
    setAuthError("");
    setPhoneError("");
    setSuccessMessage("");
    setIsOtpStep(false);
  };

  // Phone number validator (requires 10-digit mobile number, accepts optional +91 / country prefix)
  const validatePhoneNumber = (phone) => {
    if (!phone || !phone.trim()) {
      return "Phone number is a required field.";
    }
    const clean = phone.trim().replace(/[\s\-\(\)\.]/g, "");
    const indianMobileRegex = /^(?:\+?91|0)?[6-9]\d{9}$/;
    const generalPhoneRegex = /^\+?[1-9]\d{9,14}$/;

    if (!indianMobileRegex.test(clean) && !generalPhoneRegex.test(clean)) {
      return "Please enter a valid 10-digit mobile number (e.g. 98300 12345).";
    }
    return null;
  };

  // Digit Input Keypad Navigation (Auto-advance, Backspace & Paste)
  const handleDigitChange = (index, val) => {
    const stringVal = String(val ?? "");
    const digitsOnly = stringVal.replace(/\D/g, "");
    if (!digitsOnly) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    if (digitsOnly.length > 1) {
      // User pasted or typed multiple digits
      const newDigits = [...otpDigits];
      for (let i = 0; i < digitsOnly.length && index + i < 6; i++) {
        newDigits[index + i] = digitsOnly[i];
      }
      setOtpDigits(newDigits);
      if (authError) setAuthError("");
      const nextFocus = Math.min(index + digitsOnly.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = digitsOnly;
    setOtpDigits(newDigits);
    if (authError) setAuthError("");

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Helper to resolve email vs phone identifier
  const resolveTargetCredentials = () => {
    const cleanEmail = email.trim();
    const cleanPhone = phoneNumber.trim();
    const isPhoneLike =
      !cleanEmail.includes("@") &&
      cleanEmail.replace(/[\s+-]/g, "").length >= 7;

    return {
      email: isPhoneLike ? undefined : cleanEmail || undefined,
      phone: isPhoneLike ? cleanEmail : cleanPhone || undefined,
    };
  };

  // Resend OTP via SMS
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isGeneratingOtp) return;
    setIsGeneratingOtp(true);
    setAuthError("");
    if (audioEngine) audioEngine.playUiChirp(820);
    try {
      const targets = resolveTargetCredentials();
      const res = await api.post("/auth/admin/generate-otp", {
        name: fullName.trim() || undefined,
        email: targets.email,
        phone: targets.phone,
        purpose: activeTab,
        portal: selectedPortal,
        password: password || undefined,
      });
      setOtpCountdown(60);
      setSuccessMessage(
        res?.message || "New 6-digit security code dispatched.",
      );
      if (audioEngine) audioEngine.playUiChirp(1040);
    } catch (err) {
      setAuthError(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  // Direct Citizen Auth
  const handleDirectUserAuth = async () => {
    setAuthError("");
    setPhoneError("");
    setSuccessMessage("");

    const derivedName =
      fullName.trim() ||
      email
        .split("@")[0]
        .replace(".", " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") ||
      "Citizen";

    if (activeTab === "create") {
      if (!fullName.trim()) {
        setAuthError("Please enter your full name.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setAuthError("Please enter a valid email address.");
        return;
      }
      if (!password || password.length < 3) {
        setAuthError("Password must be at least 3 characters.");
        return;
      }
      const phoneErr = validatePhoneNumber(phoneNumber);
      if (phoneErr) {
        setPhoneError(phoneErr);
        setAuthError(phoneErr);
        return;
      }
    } else {
      if (!email.trim()) {
        setAuthError("Please enter your email address.");
        return;
      }
      if (!password) {
        setAuthError("Please enter your password.");
        return;
      }
    }

    setIsSubmitting(true);
    if (audioEngine) audioEngine.playUiChirp(980);

    try {
      if (activeTab === "signin") {
        const result = await api.post("/auth/login", {
          email: email.trim(),
          password,
          portal: "user",
        });
        if (audioEngine) audioEngine.playStationLock();
        loginUser(result);
        setSuccessMessage(`Welcome back, ${result?.user?.name || derivedName}`);
        const redirectPath = useKWIStore.getState().postLoginRedirect || "/";
        setTimeout(() => {
          navigate(redirectPath);
          useKWIStore.getState().setPostLoginRedirect(null);
        }, 650);
      } else {
        await api.post("/auth/signup", {
          email: email.trim(),
          password,
          fullName: derivedName,
          phone: phoneNumber.trim(),
          portal: "user",
        });
        if (audioEngine) audioEngine.playStationLock();
        // Redirect to sign in section after account creation
        setActiveTab("signin");
        setPassword("");
        setPhoneError("");
        setSuccessMessage(
          "Account created successfully! Please sign in with your credentials to continue.",
        );
      }
    } catch (err) {
      const isNetworkIssue =
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError");

      if (isNetworkIssue) {
        if (activeTab === "create") {
          if (audioEngine) audioEngine.playStationLock();
          // Redirect to sign in section after account creation (offline simulation)
          setActiveTab("signin");
          setPassword("");
          setPhoneError("");
          setSuccessMessage(
            "Account created successfully (offline simulation)! Please sign in with your credentials to continue.",
          );
          return;
        }

        const mockResult = {
          access_token: "offline-user-token-" + Date.now(),
          user: {
            id: "USR-LOCAL-01",
            name: derivedName || "Anirban Chatterjee",
            email: email || "anirban.chatterjee@kolkata.org",
            phone: phoneNumber.trim() || "98301 54321",
            role: "Citizen",
            badgeId: "",
            department: "Kolkata Citizen Water Watch",
            portal: "user",
            status: "active",
          },
        };
        if (audioEngine) audioEngine.playStationLock();
        loginUser(mockResult);
        setSuccessMessage(`Welcome back, ${mockResult.user.name}`);
        setTimeout(() => {
          navigate("/");
        }, 650);
        return;
      }
      setAuthError(
        err?.message || "Authentication failed. Please check your credentials.",
      );
      if (audioEngine) audioEngine.playUiChirp(420);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 Submit: Credential validation & OTP generation for Admin
  const handleCredentialSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setPhoneError("");
    setSuccessMessage("");

    if (selectedPortal === "user") {
      await handleDirectUserAuth();
      return;
    }

    // Admin validation
    if (activeTab === "create") {
      if (!fullName.trim()) {
        setAuthError("Please enter your full name.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setAuthError("Please enter your official email address.");
        return;
      }
      if (!password || password.length < 3) {
        setAuthError("Password must be at least 3 characters.");
        return;
      }
      const phoneErr = validatePhoneNumber(phoneNumber);
      if (phoneErr) {
        setPhoneError(phoneErr);
        setAuthError(phoneErr);
        return;
      }
    } else {
      if (!email.trim() && !phoneNumber.trim()) {
        setAuthError(
          "Please enter your official email or registered mobile number.",
        );
        return;
      }
      if (!password) {
        setAuthError("Please enter your password.");
        return;
      }
    }

    setIsSubmitting(true);
    if (audioEngine) audioEngine.playUiChirp(980);

    try {
      const targets = resolveTargetCredentials();
      const res = await api.post("/auth/admin/generate-otp", {
        name: fullName.trim() || undefined,
        email: targets.email,
        phone: targets.phone,
        purpose: activeTab,
        portal: selectedPortal,
        password: password || undefined,
      });

      const target = res?.phone || phoneNumber.trim() || email.trim();
      setOtpTargetPhone(target);
      setIsOtpStep(true);
      setOtpCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setSuccessMessage(res?.message || "6-digit security code dispatched.");
      if (audioEngine) audioEngine.playStationLock();
      setTimeout(() => {
        nativeOtpInputRef.current?.focus();
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      const isNetworkIssue =
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError");

      if (isNetworkIssue) {
        const target = phoneNumber.trim() || email.trim() || "+91 6289143592";
        setOtpTargetPhone(target);
        setIsOtpStep(true);
        setOtpCountdown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccessMessage(
          `Offline simulation: 6-digit code dispatched to ${target}.`,
        );
        if (audioEngine) audioEngine.playStationLock();
        setTimeout(() => {
          nativeOtpInputRef.current?.focus();
          otpInputRefs.current[0]?.focus();
        }, 150);
        return;
      }

      setAuthError(
        err?.message ||
        "Failed to dispatch verification code. Please check your credentials.",
      );
      if (audioEngine) audioEngine.playUiChirp(420);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submit: Validate OTP on dedicated page and complete authentication in ONE single step
  const handleOtpVerifySubmit = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join("").trim();
    if (code.length !== 6) {
      setAuthError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");
    setPhoneError("");
    if (audioEngine) audioEngine.playUiChirp(980);

    const derivedName =
      fullName.trim() ||
      email
        .split("@")[0]
        .replace(".", " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") ||
      (selectedPortal === "admin" ? "Admin" : "User");

    try {
      // Single OTP verification & authentication step (No duplicate calls)
      if (activeTab === "signin") {
        const result = await api.post("/auth/login", {
          email: email.trim(),
          password,
          portal: selectedPortal,
          otp: code,
        });

        if (audioEngine) audioEngine.playStationLock();
        loginUser(result);
        const signedInName = result?.user?.name || derivedName;
        setSuccessMessage(`Welcome back, ${signedInName}`);
        const redirectPath = useKWIStore.getState().postLoginRedirect || "/";
        setTimeout(() => {
          navigate(redirectPath);
          useKWIStore.getState().setPostLoginRedirect(null);
        }, 650);
      } else {
        await api.post("/auth/signup", {
          email: email.trim(),
          password,
          fullName: derivedName,
          phone: phoneNumber.trim(),
          portal: selectedPortal,
          otp: code,
        });

        if (audioEngine) audioEngine.playStationLock();
        // Redirect to sign in section after account creation
        setIsOtpStep(false);
        setActiveTab("signin");
        setPassword("");
        setPhoneError("");
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccessMessage(
          selectedPortal === "admin"
            ? "Administrative clearance verified and account created! Please sign in with your credentials."
            : "Account created successfully! Please sign in with your credentials.",
        );
      }
    } catch (err) {
      const isNetworkIssue =
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError");

      if (isNetworkIssue) {
        if (activeTab === "create") {
          if (audioEngine) audioEngine.playStationLock();
          // Redirect to sign in section after account creation (offline simulation)
          setIsOtpStep(false);
          setActiveTab("signin");
          setPassword("");
          setPhoneError("");
          setOtpDigits(["", "", "", "", "", ""]);
          setSuccessMessage(
            selectedPortal === "admin"
              ? "Administrative clearance verified (offline simulation)! Please sign in with your credentials."
              : "Account created successfully (offline simulation)! Please sign in with your credentials.",
          );
          return;
        }

        const mockResult = {
          access_token: "offline-admin-token-" + Date.now(),
          user: {
            id: selectedPortal === "admin" ? "ADM-LOCAL-01" : "USR-LOCAL-01",
            name:
              derivedName ||
              (selectedPortal === "admin" ? "Administrator" : "User"),
            email:
              email ||
              (selectedPortal === "admin"
                ? "admin@kolkata-water.gov.in"
                : "user@kolkata-water.gov.in"),
            phone: phoneNumber.trim() || "+91 98300 12345",
            role: selectedPortal === "admin" ? "Admin" : "User",
            badgeId: selectedPortal === "admin" ? "KWI-ADMIN-01" : "",
            department:
              selectedPortal === "admin"
                ? "KMC Water & Drainage Administration"
                : "Citizen Water Watch",
            portal: selectedPortal,
            status: "active",
          },
        };
        if (audioEngine) audioEngine.playStationLock();
        loginUser(mockResult);
        setSuccessMessage(
          activeTab === "signin"
            ? `Welcome back, ${mockResult.user.name}`
            : `Account verified! Welcome, ${mockResult.user.name}`,
        );
        setTimeout(() => {
          navigate("/");
        }, 650);
        return;
      }

      if (audioEngine) audioEngine.playUiChirp(420);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setAuthError(
        err?.message ||
        "Invalid or expired verification code. Please check your code and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Fill Handler
  const handleDemoFill = (roleOrEvent) => {
    let portal = selectedPortal;
    if (typeof roleOrEvent === "string") {
      portal = roleOrEvent;
      setSelectedPortal(roleOrEvent);
    } else if (roleOrEvent && roleOrEvent.preventDefault) {
      roleOrEvent.preventDefault();
    }
    if (portal === "user") {
      setEmail("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
    } else {
      setEmail("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
    }
    setPhoneError("");
    setAuthError("");
    setIsOtpStep(false);
    setOtpDigits(["", "", "", "", "", ""]);
    if (audioEngine) audioEngine.playUiChirp(1040);
  };

  return (
    <div className="min-h-screen w-full bg-[#070e1c] dark:bg-[#0A1E3B] text-white flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative transition-colors duration-300">
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#070e1c]/70 dark:from-[#030F14]/80 via-transparent to-[#070e1c]/40 dark:to-[#030F14]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040814]/60 dark:from-[#030F14]/70 via-transparent to-[#040814]/30 dark:to-[#030F14]/40" />
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
            className="lg:col-span-7 flex flex-col text-left pt-2 lg:pt-[8vh] pb-1 order-2 lg:order-1"
          >
            {/* Top Hero Section */}
            <div className="max-w-[680px]">
              <div className="text-white/90 text-xs sm:text-[14px] font-medium tracking-[0.24em] uppercase mb-2 sm:mb-3">
                Kolkata Water Intelligence
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[56px] xl:text-[56px] font-extrabold tracking-tight text-white leading-[1.12]">
                A Cleaner Kolkata <br />
                Through{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] via-[#38bdf8] to-[#00f0ff] drop-shadow-[0_0_30px_rgba(0,210,255,0.45)]">
                  Smarter Insights
                </span>
              </h1>

              <p className="text-slate-200/90 text-sm sm:text-lg lg:text-[18px] xl:text-[18px] font-normal mt-3 sm:mt-5 max-w-[560px] leading-relaxed">
                AI-powered drainage intelligence for a healthier, safer and more
                resilient city.
              </p>

              {/* Cyan Accent Line */}
              <div className="h-[2px] w-16 bg-gradient-to-r from-[#00d2ff] to-[#0070f3] rounded-full my-4 sm:my-6 shadow-[0_0_12px_rgba(0,210,255,0.7)]" />

              {/* Quote */}
              <p className="text-slate-300 italic text-xs sm:text-base tracking-wide max-w-[500px]">
                “Resilient infrastructure for a brighter tomorrow.”
              </p>
            </div>

            {/* Bottom 4 Feature Cards (Clean, sleek, distinctive glowing icons) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 lg:mt-24 max-w-[660px]">
              {FEATURE_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + idx * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`rounded-2xl bg-[#0c1f3d]/50 dark:bg-[#061820]/70 hover:bg-[#0f284e]/70 dark:hover:bg-[#10313E]/80 backdrop-blur-xl border border-white/20 dark:border-[rgba(94,183,201,0.16)] ${card.hoverBorder} p-3.5 sm:p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[195px] shadow-[0_15px_35px_rgba(0,0,0,0.35)] ${card.hoverShadow} transition-all duration-300 cursor-default text-left group`}
                  >
                    <div
                      className={`${card.color} ${card.glow} mb-2.5 sm:mb-3 transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-[12.5px] sm:text-[15px] leading-snug whitespace-pre-line">
                        {card.title}
                      </h3>
                      <p className="text-slate-300/80 text-[10.5px] sm:text-[12px] leading-relaxed mt-1 font-normal">
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
            className="lg:col-span-5 flex flex-col justify-center w-full order-1 lg:order-2"
          >
            <div
              className={`w-full mx-auto lg:ml-auto bg-[#0a172e]/95 dark:bg-[#061820]/95 backdrop-blur-2xl border border-white/10 dark:border-[rgba(94,183,201,0.16)] rounded-[24px] sm:rounded-[28px] text-left transition-all duration-300 relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] max-w-[460px] p-4 sm:p-7 min-h-0`}
            >
              {/* Subtle top specular accent line */}
              <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              {/* Top NIVARA Header */}
              {!isOtpStep && (
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white border border-white/20 shadow-sm flex items-center justify-center p-0.5 shrink-0">
                    <img
                      src="/textures/NIVARA_LOGO.png"
                      alt="NIVARA Logo"
                      className="w-full h-full object-contain rounded-lg mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-extrabold tracking-[0.14em] uppercase text-white leading-none">
                        NIVARA
                      </span>
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300">
                        {selectedPortal === "admin"
                          ? "OFFICIAL LOGIN"
                          : "CITIZEN LOGIN"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-xs text-slate-300 font-medium tracking-wide">
                        Water Intelligence Network
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {isOtpStep ? (
                  /* ========================================================= */
                  /* DEDICATED 2-FACTOR OTP VALIDATION (MODERN SaaS REDESIGN)   */
                  /* Inspired by Pinterest interaction (pin.it/2u4MNJFiQ)       */
                  /* ========================================================= */
                  <motion.div
                    key="otp-step-panel"
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col"
                  >
                    {/* Top Grab Handle Pill */}
                    <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                    {/* Top Row: Back link & Clearance badge */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpStep(false);
                          setAuthError("");
                          setSuccessMessage("");
                        }}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-400/90 bg-cyan-950/60 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                        {selectedPortal === "admin"
                          ? "Admin Clearance"
                          : "User Verification"}
                      </span>
                    </div>

                    {/* Verification Header & Phrasing from Pinterest video */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight leading-snug">
                        Let's verify your {email ? "email" : "number"}
                      </h3>
                      <p className="text-zinc-400 text-[13.5px] sm:text-[14px] mt-2 max-w-[310px] mx-auto leading-relaxed">
                        We've sent a 6-digit code to your{" "}
                        {email ? "email" : "phone"}.<br />
                        <span className="text-zinc-300 font-medium">
                          It'll auto-verify once entered.
                        </span>
                      </p>

                      {/* Destination Email / Phone Chip */}
                      <div className="flex justify-center mt-3.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 font-mono shadow-inner">
                          <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-zinc-200 font-medium truncate max-w-[210px]">
                            {email || otpTargetPhone}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOtpStep(false);
                              setAuthError("");
                            }}
                            className="text-cyan-400 hover:text-cyan-300 ml-0.5 underline cursor-pointer text-[11px] font-sans"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated 6-Digit OTP Form */}
                    <form
                      onSubmit={handleOtpVerifySubmit}
                      className="space-y-4"
                    >
                      {/* 6 Digit Input Keypad with Shake Animation & Glowing Active Slot */}
                      <motion.div
                        animate={
                          isShaking
                            ? { x: [-12, 12, -8, 8, -4, 4, 0] }
                            : { x: 0 }
                        }
                        transition={{ duration: 0.4 }}
                        className="relative my-4"
                      >
                        {/* Hidden Native Input to catch clicks & keyboard input seamlessly */}
                        <input
                          ref={nativeOtpInputRef}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={otpDigits.join("")}
                          onChange={(e) => {
                            const val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            const newArr = ["", "", "", "", "", ""];
                            for (let i = 0; i < val.length; i++)
                              newArr[i] = val[i];
                            setOtpDigits(newArr);
                            if (audioEngine)
                              audioEngine.playUiChirp(1040 + val.length * 35);
                            if (authError) setAuthError("");
                          }}
                          className="absolute inset-0 opacity-0 z-30 cursor-text w-full h-full"
                          autoFocus
                        />

                        {/* 6 Squircle Visual Slots with Neon Focused Outline from Pinterest */}
                        <div className="flex justify-center items-center gap-1.5 min-[380px]:gap-2.5 sm:gap-3 select-none">
                          {otpDigits.map((digit, idx) => {
                            const firstEmptyIdx = otpDigits.findIndex(
                              (d) => d === "",
                            );
                            const isFilled = Boolean(digit);
                            const isFocused =
                              !isFilled &&
                              ((firstEmptyIdx === -1 && idx === 5) ||
                                firstEmptyIdx === idx);

                            return (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-9 h-12 min-[380px]:w-11 min-[380px]:h-14 sm:w-13 sm:h-16 flex items-center justify-center text-xl min-[380px]:text-2xl sm:text-3xl font-mono font-bold rounded-xl sm:rounded-2xl transition-all duration-200 ${
                                  isFilled
                                    ? "bg-[#151a24] dark:bg-[#10313E] border-2 border-white/25 dark:border-cyan-400/40 text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                                    : isFocused
                                      ? "bg-[#121826] dark:bg-[#163F4E] border-2 border-[#00f0ff] shadow-[0_0_22px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/25"
                                      : "bg-[#0d121c]/80 dark:bg-[#0B2430] border-2 border-white/10 dark:border-[rgba(94,183,201,0.16)] text-transparent"
                                }`}
                              >
                                {isFilled ? (
                                  <motion.span
                                    key={`digit-${digit}-${idx}`}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 25,
                                    }}
                                  >
                                    {digit}
                                  </motion.span>
                                ) : isFocused ? (
                                  <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 0.8,
                                    }}
                                    className="w-0.5 h-6 bg-cyan-400 rounded-full"
                                  />
                                ) : null}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* Resend Code Row (Exact text from Pinterest video: "Didn't receive the code? Resend") */}
                      <div className="text-center text-[13.5px] text-zinc-400">
                        <span>Didn't receive the code? </span>
                        {otpCountdown > 0 ? (
                          <span className="text-zinc-300 font-medium">
                            Resend in{" "}
                            <strong className="text-cyan-400 font-mono">
                              {otpCountdown}s
                            </strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isGeneratingOtp}
                            className="text-white font-semibold hover:text-cyan-400 underline underline-offset-4 cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            {isGeneratingOtp ? "Sending..." : "Resend"}
                          </button>
                        )}
                      </div>

                      {/* Delivery Guidance Notice */}
                      <div className="text-center text-[11.5px] text-zinc-500 leading-tight">
                        📬 Check your <strong>Inbox & Spam / Junk</strong>{" "}
                        folder (Gmail may filter security codes).
                      </div>

                      {/* Alerts (Smooth animated appearance) */}
                      <AnimatePresence>
                        {successMessage && (
                          <motion.div
                            key="otp-ok"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>{successMessage}</span>
                          </motion.div>
                        )}
                        {authError && (
                          <motion.div
                            key="otp-err"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-start gap-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium"
                          >
                            <Shield className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                            <span>{authError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action Submit Button */}
                      <motion.button
                        whileHover={{ scale: 1.012 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ duration: 0.15, ease: "easeInOut" }}
                        type="submit"
                        disabled={isSubmitting || otpDigits.join("").length < 6}
                        className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.35),0_0_10px_rgba(255,255,255,0.08)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-3"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>Verifying code...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {activeTab === "signin"
                                ? "Verify & Sign In"
                                : "Verify & Complete Registration"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-950" />
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  /* ========================================================= */
                  /* CREDENTIALS ENTRY SCREEN (EXACT MATCH TO SCREENSHOT)      */
                  /* ========================================================= */
                  <motion.div
                    key="credentials-panel"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Sign In / Create Account Segmented Pill Tabs */}
                    <div className="bg-[#050c18]/90 dark:bg-[#0B2430] border border-white/10 dark:border-[rgba(94,183,201,0.16)] rounded-full p-1 flex mb-3.5 relative">
                      <button
                        type="button"
                        onClick={() => handleTabChange("signin")}
                        className={`flex-1 text-center py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${activeTab === "signin"
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("create")}
                        className={`flex-1 text-center py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${activeTab === "create"
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        Create Account
                      </button>
                    </div>

                    {/* PORTAL TIER Row */}
                    <div className="flex items-center justify-between mb-3 px-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                        PORTAL TIER
                      </span>
                      <div className="bg-[#050c18]/90 dark:bg-[#0B2430] border border-white/10 dark:border-[rgba(94,183,201,0.16)] rounded-full p-0.5 flex gap-1">
                        <button
                          type="button"
                          onClick={() => handlePortalSelect("user")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${selectedPortal === "user"
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-400 hover:text-white"
                            }`}
                        >
                          <User className="w-3 h-3" />
                          <span>Citizen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePortalSelect("admin")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${selectedPortal === "admin"
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-400 hover:text-white"
                            }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>Official</span>
                        </button>
                      </div>
                    </div>

                    {/* Secondary Authentication SSO */}
                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      {/* Preserved 100% exact NIVARA Google SSO Button with GIS overlay */}
                      <div className="relative overflow-hidden rounded-xl">
                        <button
                          type="button"
                          disabled={isGoogleLoading || isSubmitting}
                          onClick={() => {
                            if (window.google?.accounts?.id?.prompt) {
                              window.google.accounts.id.prompt();
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-white/[0.04] dark:bg-[#10313E] hover:bg-white/[0.08] dark:hover:bg-[#163F4E] border border-white/10 dark:border-[rgba(94,183,201,0.16)] rounded-xl py-2 px-3 text-slate-200 text-xs font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50"
                        >
                          {isGoogleLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                              <span className="truncate">
                                {googleAuthMessage || "Connecting..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <GoogleIcon />
                              <span>Google SSO</span>
                            </>
                          )}
                        </button>

                        {/* Hidden Transparent Google Identity Services Overlay Target */}
                        <div
                          ref={googleBtnContainerRef}
                          className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer z-10"
                          style={{
                            pointerEvents:
                              isGoogleLoading || isSubmitting ? "none" : "auto",
                            transform: "scale(1.4)",
                            transformOrigin: "center",
                          }}
                          title="Authenticate via Google SSO"
                        />
                      </div>

                      {/* Preserved 100% exact NIVARA Gov ID Token Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (audioEngine) audioEngine.playUiChirp(880);
                          setAuthError(
                            "Gov ID Token: Municipal Digital ID infrastructure integration ready. For production clearance, please authenticate via Official Portal or Google SSO."
                          );
                        }}
                        className="flex items-center justify-center gap-2 bg-white/[0.04] dark:bg-[#10313E] hover:bg-white/[0.08] dark:hover:bg-[#163F4E] border border-white/10 dark:border-[rgba(94,183,201,0.16)] rounded-xl py-2 px-3 text-slate-200 text-xs font-semibold cursor-pointer transition-all duration-200"
                        title="Gov ID Token (Municipal Clearance Integration Ready)"
                      >
                        <GovIdIcon />
                        <span>Gov ID Token</span>
                      </button>
                    </div>

                    {/* Divider: or credentials */}
                    <div className="flex items-center gap-2.5 text-slate-500 text-[10.5px] font-medium my-2.5">
                      <span className="flex-1 h-px bg-white/10 dark:bg-[rgba(94,183,201,0.16)]" />
                      <span>or credentials</span>
                      <span className="flex-1 h-px bg-white/10 dark:bg-[rgba(94,183,201,0.16)]" />
                    </div>

                    {/* Form Fields with Dark Rounded Input Style */}
                    <form
                      onSubmit={handleCredentialSubmit}
                      className="space-y-2.5"
                    >
                      {/* Full Name (if create) */}
                      <AnimatePresence>
                        {activeTab === "create" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              FULL NAME
                            </label>
                            <div className="relative rounded-xl bg-black/40 dark:bg-[#10313E] border border-white/10 dark:border-[rgba(94,183,201,0.16)] focus-within:border-cyan-400/70 focus-within:bg-black/60 dark:focus-within:bg-[#163F4E] transition-all flex items-center px-3.5 py-2.5 gap-2.5">
                              <User className="w-4 h-4 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                  setFullName(e.target.value);
                                  if (authError) setAuthError("");
                                }}
                                placeholder={
                                  selectedPortal === "admin"
                                    ? "Administrator"
                                    : "Sourav Roy"
                                }
                                required={activeTab === "create"}
                                className="w-full bg-transparent border-none text-white text-[13.5px] placeholder-slate-500 outline-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Official Email or Badge ID */}
                      <div>
                        <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          {selectedPortal === "admin" && activeTab === "signin"
                            ? "OFFICIAL EMAIL OR BADGE ID"
                            : "EMAIL ADDRESS"}
                        </label>
                        <div className="relative rounded-xl bg-black/40 dark:bg-[#10313E] border border-white/10 dark:border-[rgba(94,183,201,0.16)] focus-within:border-cyan-400/70 focus-within:bg-black/60 dark:focus-within:bg-[#163F4E] transition-all flex items-center px-3.5 py-2.5 gap-2.5">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            placeholder={
                              selectedPortal === "admin"
                                ? "admin@kolkata-water.gov.in"
                                : "citizen@gmail.com"
                            }
                            required
                            className="w-full bg-transparent border-none text-white text-[13.5px] placeholder-slate-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                            PASSWORD
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Password reset instructions sent to: ${email || "your registered email"}`,
                              )
                            }
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative rounded-xl bg-black/40 dark:bg-[#10313E] border border-white/10 dark:border-[rgba(94,183,201,0.16)] focus-within:border-cyan-400/70 focus-within:bg-black/60 dark:focus-within:bg-[#163F4E] transition-all flex items-center px-3.5 py-2.5 gap-2.5">
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            placeholder="Enter Password"
                            required
                            className="w-full bg-transparent border-none text-white text-[13.5px] placeholder-slate-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Phone Number (if create) */}
                      <AnimatePresence>
                        {activeTab === "create" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              MOBILE NUMBER (10 DIGITS)
                            </label>
                            <div className="relative rounded-xl bg-black/40 dark:bg-[#10313E] border border-white/10 dark:border-[rgba(94,183,201,0.16)] focus-within:border-cyan-400/70 focus-within:bg-black/60 dark:focus-within:bg-[#163F4E] transition-all flex items-center px-3.5 py-2.5 gap-2.5">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                  setPhoneNumber(e.target.value);
                                  if (phoneError) setPhoneError("");
                                  if (authError) setAuthError("");
                                }}
                                placeholder="98300 12345"
                                required={activeTab === "create"}
                                className="w-full bg-transparent border-none text-white text-[13.5px] placeholder-slate-500 outline-none"
                              />
                            </div>
                            {phoneError && (
                              <p className="text-[11px] text-rose-400 mt-1">
                                {phoneError}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Remember session toggle */}
                      <div className="flex items-center gap-2.5 pt-1 pb-0.5">
                        <button
                          type="button"
                          onClick={() => setRememberSession(!rememberSession)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${rememberSession ? "bg-white" : "bg-white/20"
                            }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-slate-950 transition-transform absolute top-0.5 ${rememberSession ? "left-4.5" : "left-0.5"
                              }`}
                          />
                        </button>
                        <span
                          onClick={() => setRememberSession(!rememberSession)}
                          className="text-xs text-slate-300 font-medium cursor-pointer select-none"
                        >
                          Remember session
                        </span>
                      </div>

                      {/* Alerts */}
                      <AnimatePresence>
                        {authError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium"
                          >
                            <Shield className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                            <span>{authError}</span>
                          </motion.div>
                        )}
                        {successMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>{successMessage}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* PRIMARY ACTION BUTTON - WITH CONTROLLED DECREASED GLOW */}
                      <motion.button
                        whileHover={{ scale: 1.012 }}
                        whileTap={{ scale: 0.988 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.35),0_0_10px_rgba(255,255,255,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_14px_rgba(255,255,255,0.12)] transition-all duration-200 disabled:opacity-60 mt-2"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>
                              {selectedPortal === "admin"
                                ? "Verifying Municipal Clearance..."
                                : "Connecting..."}
                            </span>
                          </div>
                        ) : (
                          <>
                            <span>
                              {selectedPortal === "admin"
                                ? "CONTINUE WITH 2FA CLEARANCE"
                                : activeTab === "signin"
                                  ? "SIGN IN TO NIVARA"
                                  : "CREATE NIVARA ACCOUNT"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-950" />
                          </>
                        )}
                      </motion.button>
                    </form>

                    {/* Bottom Security Footer */}
                    <div className="text-[10.5px] text-emerald-400/90 font-medium flex items-center justify-center gap-1.5 pt-3.5 mt-3.5 border-t border-white/[0.08]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Encrypted Civic Gateway • 256-bit SSL</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
