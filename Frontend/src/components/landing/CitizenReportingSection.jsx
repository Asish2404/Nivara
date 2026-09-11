import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  Wifi,
  Lock,
  CloudRain,
  MapPin,
  Droplets,
  AlertTriangle,
  Waves,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Sparkles,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Wind,
  Gauge,
  Eye,
  Clock,
  Activity,
  Map,
  FileCheck,
  Megaphone,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { MobileReportForm } from "../mobile/MobileReportForm";
import SplitText from "../views/SplitText";

// Ambient Floating Monsoon Water Droplets (Soft, Subtle, Organic)
const CHASSIS_SLICES = Array.from({ length: 29 }, (_, i) => i - 14);
const AMBIENT_DROPLETS = [
  { id: 1, x: "10%", y: "14%", size: 7, delay: 0, duration: 5.6 },
  { id: 2, x: "20%", y: "24%", size: 5, delay: 1.8, duration: 4.8 },
  { id: 3, x: "7%", y: "38%", size: 8, delay: 3.2, duration: 6.2 },
  { id: 4, x: "18%", y: "52%", size: 6, delay: 0.7, duration: 5.4 },
  { id: 5, x: "12%", y: "68%", size: 8, delay: 2.5, duration: 5.0 },
  { id: 6, x: "22%", y: "82%", size: 5, delay: 4.1, duration: 5.8 },
  { id: 7, x: "89%", y: "15%", size: 6, delay: 1.3, duration: 5.1 },
  { id: 8, x: "79%", y: "28%", size: 8, delay: 2.9, duration: 5.9 },
  { id: 9, x: "92%", y: "42%", size: 5, delay: 0.5, duration: 4.7 },
  { id: 10, x: "81%", y: "58%", size: 9, delay: 3.7, duration: 6.4 },
  { id: 11, x: "88%", y: "72%", size: 6, delay: 2.0, duration: 5.3 },
  { id: 12, x: "77%", y: "84%", size: 7, delay: 0.3, duration: 4.9 },
  { id: 13, x: "32%", y: "8%", size: 5, delay: 2.3, duration: 5.5 },
  { id: 14, x: "68%", y: "10%", size: 6, delay: 3.9, duration: 6.0 },
  { id: 15, x: "28%", y: "90%", size: 8, delay: 1.6, duration: 5.2 },
  { id: 16, x: "71%", y: "90%", size: 5, delay: 3.0, duration: 4.8 },
  { id: 17, x: "15%", y: "30%", size: 4, delay: 4.3, duration: 5.7 },
  { id: 18, x: "85%", y: "34%", size: 7, delay: 2.2, duration: 5.2 },
  { id: 19, x: "5%", y: "78%", size: 6, delay: 1.1, duration: 6.1 },
  { id: 20, x: "94%", y: "22%", size: 8, delay: 2.7, duration: 5.5 },
];

export function CitizenReportingSection() {
  const {
    currentUser,
    isReportSubmitted,
    resetCitizenReport,
    reportLocality,
    reportCity,
    reportCoords,
    reportDepth,
    reportDescription,
    reportPhoto,
    setSelectedIncident,
    navigate,
  } = useKWIStore();

  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const phoneWrapperRef = useRef(null);

  // 3D Turntable Rotation State (0deg -> 720deg: exactly 2 complete rotations)
  const [rotationKey, setRotationKey] = useState(0);
  const [isRotating, setIsRotating] = useState(true);

  const handleReplay3D = () => {
    if (audioEngine) audioEngine.playUiChirp(1200);
    setIsRotating(true);
    setRotationKey((prev) => prev + 1);
  };

  // Phone Internal Navigation State:
  // -1: Lock Screen (monsoon wallpaper, live clock, Rainfall Alert Notification Card)
  //  0: Welcome Screen (Kolkata water network blueprint, "GET STARTED")
  //  1: Full Multi-Step MobileReportForm (image, text, voice, GPS locations conditions)
  //  2: Rainfall Alert Detail (light mode, opened from lockscreen notification tap)
  const [phoneStep, setPhoneStep] = useState(-1);
  const [activeStep, setActiveStep] = useState(0); // 0 = idle, 1..7 = sequential validation notifications
  const [batteryLevel, setBatteryLevel] = useState(89);
  const [isCharging, setIsCharging] = useState(false);
  // Expanded notification detail view (null = list view, number = notification id being viewed)
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [islandExpanded, setIslandExpanded] = useState(false);

  // Auto-scroll and Cursor-Pulling (Drag to scroll) for Phone Notification Center
  const notifContainerRef = useRef(null);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const pullStartScroll = useRef(0);
  const isDraggingRef = useRef(false);

  const handlePointerDownPull = (e) => {
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-notif-clickable]")) return;
    if (!notifContainerRef.current) return;
    isDraggingRef.current = false;
    pullStartY.current = e.clientY;
    pullStartScroll.current = notifContainerRef.current.scrollTop;
  };

  const handlePointerMovePull = (e) => {
    if (!pullStartY.current || !notifContainerRef.current) return;
    const deltaY = e.clientY - pullStartY.current;
    if (Math.abs(deltaY) > 5) {
      isDraggingRef.current = true;
      setIsPulling(true);
      notifContainerRef.current.scrollTop = pullStartScroll.current - deltaY;
    }
  };

  const handlePointerUpPull = (e) => {
    pullStartY.current = 0;
    isDraggingRef.current = false;
    setIsPulling(false);
  };

  // 1. Live Lockscreen Real-Time Clock & Date (12-hour AM/PM)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  const [ampm, setAmpm] = useState(() => (new Date().getHours() >= 12 ? "PM" : "AM"));

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
      setAmpm(now.getHours() >= 12 ? "PM" : "AM");
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Real Web Battery API
  useEffect(() => {
    let batteryInstance = null;
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      navigator
        .getBattery()
        .then((batt) => {
          batteryInstance = batt;
          const update = () => {
            setBatteryLevel(Math.round((batt.level ?? 0.89) * 100));
            setIsCharging(Boolean(batt.charging));
          };
          update();
          batt.addEventListener("levelchange", update);
          batt.addEventListener("chargingchange", update);
        })
        .catch(() => {
          setBatteryLevel(89);
        });
    }
    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener("levelchange", () => { });
          batteryInstance.removeEventListener("chargingchange", () => { });
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // 3. Sequential Notification Timeline (TRIGGERED ONLY AFTER REPORT SUBMISSION)
  useEffect(() => {
    if (!isReportSubmitted) {
      setActiveStep(0);
      return;
    }

    // Report has been submitted! Notifications arrive directly on Lock Screen
    setActiveStep(0);
    setPhoneStep(-1);
    setExpandedNotification(null);

    const schedule = [
      { step: 1, delay: 1000 },
      { step: 2, delay: 2400 },
      { step: 3, delay: 3800 },
      { step: 4, delay: 5200 },
      { step: 5, delay: 6600 },
      { step: 6, delay: 8000 },
      { step: 7, delay: 9400 },
    ];

    const timeouts = schedule.map(({ step, delay }) =>
      setTimeout(() => {
        setActiveStep(step);
        try {
          if (audioEngine) {
            audioEngine.playUiChirp(step === 7 ? 1400 : 900 + step * 40);
          }
        } catch {
          // fallback
        }
      }, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isReportSubmitted]);

  // Derived values from actual citizen report in store
  const locality = reportLocality || "Salt Lake, Sector V";
  const city = reportCity || "Kolkata, West Bengal";
  const coords = reportCoords || { lat: 22.5735, lon: 88.4331, accuracy: 3 };
  const depth = reportDepth || "15–30 cm";
  const localityCode = (locality.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "SV").toUpperCase();
  const incidentNum = Math.floor(10 + (Math.abs(coords.lat * 1000) % 90));
  const incidentId = `#${localityCode}-${incidentNum}`;
  const sluiceStation = `PS-${Math.floor(1 + (Math.abs(coords.lon * 10) % 12)).toString().padStart(2, "0")}`;

  const depthTag =
    depth === "0–15 cm"
      ? "12 cm ± 1.5 cm"
      : depth === "30+ cm"
        ? "38 cm ± 2.5 cm"
        : "28 cm ± 2.0 cm";

  // Build notifications array using user's real submitted report details
  const NOTIFICATIONS = useMemo(
    () => [
      {
        id: 1,
        step: 1,
        type: "alert",
        icon: CloudRain,
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/20 border-amber-400/30",
        iconLightColor: "text-amber-600",
        iconLightBg: "bg-amber-100 border-amber-300",
        app: "WEATHER INTELLIGENCE",
        time: "now",
        title: "Heavy Rainfall Alert",
        desc: `74% probability of severe precipitation · ${locality.split(",")[0]} catchment`,
        tag: "74% Probability · 68–82 mm/3hr",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
        lightAccent: "bg-gradient-to-r from-amber-50/70 via-white to-white border-amber-200/90",
        accent: "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent",
      },
      {
        id: 2,
        step: 2,
        type: "info",
        icon: MapPin,
        iconColor: "text-cyan-400",
        iconBg: "bg-cyan-500/20 border-cyan-400/30",
        iconLightColor: "text-cyan-600",
        iconLightBg: "bg-cyan-100 border-cyan-300",
        app: "LOCATION ANALYSIS",
        time: "now",
        title: "Location Verified",
        desc: `GPS coordinates matched with municipal GIS boundary (±${coords.accuracy || 3}m accuracy)`,
        tag: `±${coords.accuracy || 3}m Accuracy · ${localityCode} Ward`,
        badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
        lightAccent: "bg-gradient-to-r from-cyan-50/70 via-white to-white border-cyan-200/90",
        accent: "border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent",
      },
      {
        id: 3,
        step: 3,
        type: "info",
        icon: Droplets,
        iconColor: "text-blue-400",
        iconBg: "bg-blue-500/20 border-blue-400/30",
        iconLightColor: "text-blue-600",
        iconLightBg: "bg-blue-100 border-blue-300",
        app: "IMAGE ANALYSIS",
        time: "now",
        title: "Surface Water Detected",
        desc: reportPhoto
          ? "Citizen photo verified by Hydro-Vision model (94.2% water accumulation confidence)"
          : "Hydro-Vision vision model identified active carriageway water accumulation",
        tag: "94.2% AI Confidence · Inundated",
        badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
        lightAccent: "bg-gradient-to-r from-blue-50/70 via-white to-white border-blue-200/90",
        accent: "border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-transparent",
      },
      {
        id: 4,
        step: 4,
        type: "alert",
        icon: AlertTriangle,
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/20 border-amber-400/30",
        iconLightColor: "text-orange-600",
        iconLightBg: "bg-orange-100 border-orange-300",
        app: "CONDITION ASSESSMENT",
        time: "now",
        title: "Drainage Obstruction Detected",
        desc: reportDescription
          ? `Surface inlet capacity constrained · "${reportDescription.slice(0, 36)}..."`
          : "Surface inlet capacity constrained by silt load · Flow throttled: 64%",
        tag: "Flow Throttled: 64% · Silt Load 58%",
        badgeBg: "bg-orange-50 text-orange-800 border-orange-200",
        lightAccent: "bg-gradient-to-r from-orange-50/70 via-white to-white border-orange-200/90",
        accent: "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent",
      },
      {
        id: 5,
        step: 5,
        type: "info",
        icon: Waves,
        iconColor: "text-sky-400",
        iconBg: "bg-sky-500/20 border-sky-400/30",
        iconLightColor: "text-sky-600",
        iconLightBg: "bg-sky-100 border-sky-300",
        app: "WATER DEPTH",
        time: "now",
        title: "Water Depth Estimated",
        desc: `Estimated depth: ${depthTag} · Critical threshold reached (>15cm)`,
        tag: `Depth: ${depthTag} · Inundation`,
        badgeBg: "bg-sky-50 text-sky-800 border-sky-200",
        lightAccent: "bg-gradient-to-r from-sky-50/70 via-white to-white border-sky-200/90",
        accent: "border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent",
      },
      {
        id: 6,
        step: 6,
        type: "info",
        icon: Layers,
        iconColor: "text-indigo-400",
        iconBg: "bg-indigo-500/20 border-indigo-400/30",
        iconLightColor: "text-indigo-600",
        iconLightBg: "bg-indigo-100 border-indigo-300",
        app: "DUPLICATE CHECK",
        time: "now",
        title: "Incident Correlated",
        desc: `Matched with 17 citizen and telemetry signals into unified incident ${incidentId}`,
        tag: "17 Signals · ~12,400 m² Correlated",
        badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
        lightAccent: "bg-gradient-to-r from-indigo-50/70 via-white to-white border-indigo-200/90",
        accent: "border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-transparent",
      },
      {
        id: 7,
        step: 7,
        type: "verified",
        icon: ShieldCheck,
        iconColor: "text-emerald-400",
        iconBg: "bg-emerald-500/20 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]",
        iconLightColor: "text-emerald-700",
        iconLightBg: "bg-emerald-100 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
        app: "KWI OPERATIONAL DISPATCH",
        time: "now",
        title: "Report Verified · Dispatched",
        desc: `Validated telemetry dispatched to ${locality} drainage unit & ${sluiceStation}`,
        tag: `Dispatched · Pump Station ${sluiceStation}`,
        badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        lightAccent: "bg-gradient-to-r from-emerald-50/80 via-white to-white border-emerald-300/90 shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
        accent:
          "border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent shadow-[0_4px_24px_rgba(16,185,129,0.18)]",
        isFinal: true,
      },
    ],
    [coords, depthTag, incidentId, locality, localityCode, reportDescription, reportPhoto, sluiceStation]
  );

  const visibleNotifications = useMemo(() => {
    return NOTIFICATIONS.filter((n) => activeStep >= n.step);
  }, [NOTIFICATIONS, activeStep]);

  // Auto-scroll to latest notification card as each validation step arrives
  useEffect(() => {
    if (!notifContainerRef.current) return;
    const scrollTimer = setTimeout(() => {
      if (notifContainerRef.current) {
        notifContainerRef.current.scrollTo({
          top: notifContainerRef.current.scrollHeight + 150,
          behavior: "smooth",
        });
      }
    }, 80);
    return () => clearTimeout(scrollTimer);
  }, [activeStep, visibleNotifications.length]);

  // Navigate to live city map
  const handleOpenLiveCity = (e) => {
    if (e) e.stopPropagation();
    setSelectedIncident({
      id: incidentId,
      name: `${locality} Incident ${incidentId}`,
      subdivision: locality.toUpperCase(),
      location: `${locality}, ${city}`,
      x: (coords.lon - 88.3639) * 20,
      y: (22.5726 - coords.lat) * 20,
      timestamp: "Just now",
      waterDepth: depthTag.split(" ")[0] + " cm",
      rainfall: "74 mm / 3 hr",
      verifiedReports: 18,
      affectedArea: "12,400 m²",
      riskScore: "82 / 100",
      connectedDrainage: "Municipal Canal Trunk",
      nearestPump: sluiceStation,
      probableCause: reportDescription || "Rainfall exceeding local drainage capacity.",
      severity: depth === "30+ cm" ? "CRITICAL" : "HIGH",
      severityColor: depth === "30+ cm" ? "#e11d48" : "#d64545",
      status: "Needs Intervention",
      workOrderId: `WO-${Date.now().toString().slice(-8)}`,
    });
    navigate("/live-city");
  };

  // Reset to submit another report
  const handleReset = (e) => {
    if (e) e.stopPropagation();
    try {
      if (audioEngine) audioEngine.playUiChirp(800);
    } catch {
      // ignore
    }
    resetCitizenReport();
    setActiveStep(0);
    setPhoneStep(1);
  };

  const screenTransition = {
    duration: 0.25,
    ease: "easeInOut",
  };

  // Detail content definitions for each notification step (shown when user taps a notification)
  const getNotificationDetailContent = useCallback((notifId) => {
    const details = {
      1: {
        title: "Heavy Rainfall Forecast",
        subtitle: "Weather Intelligence System",
        accentColor: "amber",
        icon: CloudRain,
        sections: [
          { label: "Precipitation Probability", value: "74%", icon: Droplets, color: "text-amber-400" },
          { label: "Expected Rainfall", value: "68–82 mm / 3hr", icon: Gauge, color: "text-blue-400" },
          { label: "Wind Speed", value: "32 km/h NW", icon: Wind, color: "text-slate-300" },
          { label: "Temperature", value: "28°C (feels 33°C)", icon: Thermometer, color: "text-orange-400" },
        ],
        alertMessage: `⚠️ Severe weather alert for ${locality}. Heavy precipitation expected within the next 2 hours. Municipal drainage systems may be overwhelmed. Check local drainage conditions and report any waterlogging immediately.`,
        actionText: !isReportSubmitted ? "Report waterlogging in your area" : "Return to Notifications",
      },
      2: {
        title: "Location Verified",
        subtitle: "GPS & GIS Boundary Analysis",
        accentColor: "cyan",
        icon: MapPin,
        sections: [
          { label: "GPS Coordinates", value: `${coords.lat?.toFixed(4)}°N, ${coords.lon?.toFixed(4)}°E`, icon: MapPin, color: "text-cyan-400" },
          { label: "Accuracy", value: `±${coords.accuracy || 3}m (High Precision)`, icon: Eye, color: "text-green-400" },
          { label: "Municipal Ward", value: locality, icon: Map, color: "text-blue-400" },
          { label: "Nearest Pump Station", value: sluiceStation, icon: Activity, color: "text-indigo-400" },
        ],
        alertMessage: `✅ Your reported location has been cross-referenced with the Kolkata Municipal Corporation GIS database. The coordinates fall within the ${locality} municipal boundary and have been matched to the nearest drainage network node.`,
        actionText: "Return to Notifications",
      },
      3: {
        title: "Surface Water Detected",
        subtitle: "Hydro-Vision AI Model v3.2",
        accentColor: "blue",
        icon: Eye,
        sections: [
          { label: "Water Detection", value: "94.2% AI Confidence", icon: Droplets, color: "text-blue-400" },
          { label: "Surface Coverage", value: "~62% of frame area", icon: Layers, color: "text-indigo-400" },
          { label: "Debris Detected", value: "Minor floating debris", icon: AlertTriangle, color: "text-amber-400" },
          { label: "Processing Time", value: "1.2 seconds", icon: Clock, color: "text-slate-300" },
        ],
        alertMessage: reportPhoto
          ? "✅ Your uploaded photo has been processed by the Hydro-Vision deep learning model. Active water accumulation detected on carriageway surfaces with high confidence. The image has been geo-tagged and stored for municipal records."
          : "✅ The Hydro-Vision AI model has analyzed available satellite and sensor imagery for the reported area. Water accumulation patterns detected matching flood conditions.",
        actionText: "Return to Notifications",
      },
      4: {
        title: "Drainage Obstruction Analysis",
        subtitle: "Infrastructure Assessment Engine",
        accentColor: "amber",
        icon: AlertTriangle,
        sections: [
          { label: "Drainage Flow Rate", value: "36% of capacity", icon: Waves, color: "text-amber-400" },
          { label: "Obstruction Level", value: "Moderate–High", icon: AlertTriangle, color: "text-red-400" },
          { label: "Silt Load", value: "Estimated 58% blockage", icon: Layers, color: "text-orange-400" },
          { label: "Flow Constraint", value: "Flow throttled: 64%", icon: Clock, color: "text-slate-300" },
        ],
        alertMessage: reportDescription
          ? `⚠️ Based on citizen description: "${reportDescription.slice(0, 60)}..." — Surface inlet capacity is significantly constrained. The drainage flow rate at the nearest inlet is operating at only 36% capacity due to accumulated silt and debris.`
          : "⚠️ Automated sensor readings indicate surface inlet capacity is constrained by accumulated silt. Flow rate is throttled to approximately 36% of designed capacity. Priority maintenance flagged.",
        actionText: "Return to Notifications",
      },
      5: {
        title: "Water Depth Assessment",
        subtitle: "Depth Estimation Module",
        accentColor: "sky",
        icon: Waves,
        sections: [
          { label: "Estimated Depth", value: depthTag, icon: Waves, color: "text-sky-400" },
          { label: "Risk Level", value: depth === "30+ cm" ? "CRITICAL" : depth === "0–15 cm" ? "MODERATE" : "HIGH", icon: AlertTriangle, color: depth === "30+ cm" ? "text-red-400" : "text-amber-400" },
          { label: "Pedestrian Safety", value: depth === "0–15 cm" ? "Caution advised" : "Unsafe for walking", icon: ShieldCheck, color: "text-orange-400" },
          { label: "Vehicle Advisory", value: depth === "30+ cm" ? "No entry" : "Low-ground vehicles at risk", icon: Activity, color: "text-red-400" },
        ],
        alertMessage: `Water depth at ${locality} has been estimated at ${depthTag} using multi-source verification (citizen report + satellite + sensor fusion). ${depth === "30+ cm" ? "This exceeds the critical threshold of 30cm. Emergency response teams have been notified." : "This exceeds the alert threshold of 15cm. The area has been flagged for priority drainage assistance."}`,
        actionText: "Return to Notifications",
      },
      6: {
        title: "Incident Correlation",
        subtitle: "Cross-Signal Intelligence",
        accentColor: "indigo",
        icon: Layers,
        sections: [
          { label: "Unified Incident ID", value: incidentId, icon: FileCheck, color: "text-indigo-400" },
          { label: "Correlated Signals", value: "17 citizen + telemetry", icon: Activity, color: "text-cyan-400" },
          { label: "Affected Area", value: "~12,400 m²", icon: Map, color: "text-blue-400" },
          { label: "First Reported", value: "42 min ago", icon: Clock, color: "text-slate-300" },
        ],
        alertMessage: `Your report has been matched with 16 other citizen signals and automated telemetry data to create unified incident ${incidentId}. The correlated incident covers approximately 12,400 m² across the ${locality} area. This multi-source validation increases the incident's priority score.`,
        actionText: "Return to Notifications",
      },
      7: {
        title: "Report Verified & Dispatched",
        subtitle: "KWI Operational Command",
        accentColor: "emerald",
        icon: ShieldCheck,
        sections: [
          { label: "Verification Status", value: "✓ FULLY VERIFIED", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Assigned Station", value: sluiceStation, icon: Megaphone, color: "text-cyan-400" },
          { label: "Response ETA", value: "~18 minutes", icon: Clock, color: "text-amber-400" },
          { label: "Priority Level", value: depth === "30+ cm" ? "P1 — CRITICAL" : "P2 — HIGH", icon: AlertTriangle, color: depth === "30+ cm" ? "text-red-400" : "text-amber-400" },
        ],
        alertMessage: `✅ All 7 verification checks have passed. Your validated report has been dispatched to the ${locality} drainage operations unit and pump station ${sluiceStation}. Municipal field crew has been mobilized with an estimated response time of 18 minutes. Thank you for helping keep Kolkata safe!`,
        actionText: "View on Live Map →",
      },
    };
    return details[notifId] || null;
  }, [coords, depthTag, depth, incidentId, isReportSubmitted, locality, reportDescription, reportPhoto, sluiceStation]);

  // Handler for tapping on a post-submission or lockscreen notification
  const handleNotificationTap = (notifId) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (audioEngine) audioEngine.playUiChirp(1000);
    setExpandedNotification(notifId);
  };

  // Handler for going back from detail view
  const handleDetailBack = () => {
    if (audioEngine) audioEngine.playUiChirp(800);
    setExpandedNotification(null);
    setPhoneStep(-1);
  };

  // Derived: is the phone currently showing a lock screen?
  const isLockScreen = phoneStep === -1 && expandedNotification === null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[920px] sm:min-h-[980px] py-16 sm:py-24 px-4 flex flex-col items-center justify-center border-t border-slate-200/60 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] select-none scroll-smooth overflow-hidden"
    >
      {/* ================================================================ */}
      {/* SOFT STUDIO LIGHTING & DIFFUSED AMBIENT BACKGROUND               */}
      {/* ================================================================ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft studio center spotlight behind phone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[640px] rounded-full bg-gradient-to-tr from-sky-100/40 via-blue-50/50 to-slate-200/40 blur-[130px]" />
        {/* Soft floor shadow anchor */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[340px] sm:w-[440px] h-[36px] rounded-[100%] bg-slate-900/12 blur-2xl pointer-events-none" />
      </div>

      {/* ================================================================ */}
      {/* SECTION HEADER: ONE-LINE BOLD PURPOSE STATEMENT                  */}
      {/* ================================================================ */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-blue-600 font-mono block mb-2">
          CITIZEN REPORTING & AI VERIFICATION
        </span>
        <SplitText
          text="Report waterlogging in real time with instant AI verification and municipal dispatch."
          className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight"
          delay={50}
          duration={1.25}
          ease="power3.out"
          splitType="words"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          tag="h2"
        />
      </div>

      {/* ================================================================ */}
      {/* THE CENTERPIECE: FLAGSHIP LUXURY 3D SMARTPHONE (TURNTABLE)      */}
      {/* ================================================================ */}
      <div
        className="relative flex flex-col items-center justify-center py-4 select-none"
        style={{
          perspective: "1500px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* ================================================================ */}
        {/* TRUE 3D TURNTABLE OBJECT - ROTATES 720° (2 FULL ROTATIONS)       */}
        {/* ================================================================ */}
        <motion.div
          key={rotationKey}
          ref={phoneWrapperRef}
          data-phone-chassis="true"
          initial={{ rotateY: 0, scale: 0.92 }}
          whileInView={{
            rotateY: 720,
            scale: [0.92, 0.92, 1.03, 1.0],
          }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{
            rotateY: {
              duration: 9.5,
              ease: [0.25, 1, 0.35, 1], // Smooth continuous turntable rotation settling front-facing
            },
            scale: {
              duration: 9.5,
              times: [0, 0.75, 0.92, 1],
              ease: [0.22, 1, 0.36, 1], // Smooth cinematic forward zoom punch-in as rotation stops
            },
          }}
          onAnimationStart={() => setIsRotating(true)}
          onAnimationComplete={() => setIsRotating(false)}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center center 0px",
            transform: "rotateX(0deg) rotateZ(0deg)",
          }}
          className="relative z-10 w-[348px] sm:w-[380px] md:w-[392px] h-[736px] sm:h-[776px] md:h-[796px] will-change-transform"
        >
          {/* ============================================================ */}
          {/* 1. FRONT FACE (Z = +14px): EXACT PRESERVED INTERACTIVE FRONT  */}
          {/* ============================================================ */}
          <div
            className="absolute inset-0 w-full h-full rounded-[56px] sm:rounded-[60px] p-[10px] sm:p-[11px] bg-gradient-to-b from-[#252b38]/95 via-[#141926]/98 to-[#0a0e16] backdrop-blur-2xl border border-white/30 shadow-[0_45px_100px_-20px_rgba(15,23,42,0.45),0_20px_45px_-10px_rgba(0,0,0,0.25),0_0_60px_-15px_rgba(56,189,248,0.22),inset_0_1px_2px_rgba(255,255,255,0.4)] flex flex-col justify-between overflow-hidden"
            style={{
              transform: "translateZ(14.5px)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Soft Diagonal Glass Light Sheen Passing Across Phone On Automatic Placement */}
            <motion.div
              key={`sheen-${rotationKey}`}
              initial={{ x: "-120%", opacity: 0 }}
              animate={{
                x: ["-120%", "180%"],
                opacity: [0, 0.4, 0.55, 0.25, 0],
              }}
              transition={{
                delay: 8.2,
                duration: 1.25,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="absolute inset-y-0 w-[55%] bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 pointer-events-none z-40"
            />

            {/* Injected phone scrollbar suppression for 100% browser compatibility */}
            <style>{`
              [data-phone-chassis] *::-webkit-scrollbar,
              [data-phone-chassis] ::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
                background: transparent !important;
              }
              [data-phone-chassis] *::-webkit-scrollbar-thumb,
              [data-phone-chassis] *::-webkit-scrollbar-track,
              [data-phone-chassis]::-webkit-scrollbar-thumb,
              [data-phone-chassis]::-webkit-scrollbar-track {
                display: none !important;
                background: transparent !important;
              }
              [data-phone-chassis],
              [data-phone-chassis] * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
            `}</style>
            {/* Subtle Outer Hardware Antenna Bands */}
            <div className="absolute -left-[1px] top-28 w-[2.5px] h-[3px] bg-[#4a5568]" />
            <div className="absolute -right-[1px] top-28 w-[2.5px] h-[3px] bg-[#4a5568]" />
            <div className="absolute -left-[1px] bottom-28 w-[2.5px] h-[3px] bg-[#4a5568]" />
            <div className="absolute -right-[1px] bottom-28 w-[2.5px] h-[3px] bg-[#4a5568]" />

            {/* Left Side Physical Buttons */}
            <div className="absolute -left-[4px] top-28 w-[3px] h-6 bg-[#3b4453] rounded-l-xs shadow-xs pointer-events-none" />
            <div className="absolute -left-[4px] top-39 w-[3px] h-12 bg-[#3b4453] rounded-l-xs shadow-xs pointer-events-none" />
            <div className="absolute -left-[4px] top-54 w-[3px] h-12 bg-[#3b4453] rounded-l-xs shadow-xs pointer-events-none" />

            {/* Right Side Physical Button: Power / Lock Button */}
            <button
              type="button"
              title={isLockScreen ? "Unlock Phone" : "Lock Phone"}
              onClick={() => {
                if (audioEngine) audioEngine.playUiChirp(isLockScreen ? 1200 : 700);
                if (expandedNotification !== null) {
                  setExpandedNotification(null);
                  setPhoneStep(-1);
                } else if (phoneStep === -1) {
                  if (!currentUser) {
                    navigate("/login");
                    return;
                  }
                  setPhoneStep(0);
                } else {
                  setPhoneStep(-1);
                }
              }}
              className="absolute -right-[4px] top-40 w-[3px] h-16 bg-[#3b4453] hover:bg-[#60a5fa] active:scale-95 rounded-r-xs shadow-xs cursor-pointer transition-colors z-40"
            />

            {/* Top Speaker Micro-slit */}
            <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-16 h-[2.5px] bg-[#0c0d12] rounded-full z-30 pointer-events-none" />

            {/* ============================================================ */}
            {/* INNER DISPLAY SURFACE                                        */}
            {/* ============================================================ */}
            <motion.div
              initial={{ opacity: 0.15, filter: "brightness(0.35) blur(1.5px)" }}
              whileInView={{ opacity: 1, filter: "brightness(1) blur(0px)" }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                delay: 1.15,
                duration: 0.75,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`w-full h-full rounded-[47px] sm:rounded-[50px] overflow-hidden flex flex-col justify-between relative border border-slate-900/90 shadow-inner transition-colors duration-300 ${isLockScreen ? "bg-slate-950" : "bg-white"
                }`}
            >
              {/* Seamless Edge-to-Edge Wallpaper (Shown strictly on Lock Screen) */}
              {isLockScreen && (
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                  <img
                    src="/textures/kolkata_monsoon_lockscreen.jpg"
                    alt="Kolkata Monsoon Lockscreen"
                    className="w-full h-full object-cover object-[48%_40%] scale-[1.38] translate-x-[4%] -translate-y-[2%] filter brightness-[0.92] contrast-[1.05]"
                  />
                  {/* Rich Apple Lock Screen Contrast Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/80" />
                </div>
              )}

              {/* Ceramic Shield Diagonal Glass Glint */}
              <div className="absolute -top-32 -left-20 w-84 h-[460px] bg-gradient-to-br from-white/14 via-white/3 to-transparent rotate-[32deg] pointer-events-none z-40" />

              {/* Subtle Screen Perimeter Highlight */}
              <div className="absolute inset-0 rounded-[47px] sm:rounded-[50px] ring-1 ring-inset ring-white/10 pointer-events-none z-30" />

              {/* ========================================================== */}
              {/* DYNAMIC ISLAND (APPLE PRO STYLE)                           */}
              {/* ========================================================== */}
              <div className="absolute top-[11px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                <motion.div
                  layout
                  onMouseEnter={() => setIslandExpanded(true)}
                  onMouseLeave={() => setIslandExpanded(false)}
                  onClick={() => {
                    if (audioEngine) audioEngine.playUiChirp(900);
                    setIslandExpanded((prev) => !prev);
                  }}
                  className="bg-black rounded-full px-3 h-[33px] flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.95)] ring-[0.5px] ring-white/20 select-none cursor-pointer transition-all hover:ring-cyan-500/40"
                  style={{
                    width:
                      islandExpanded
                        ? 200
                        : isReportSubmitted
                          ? activeStep >= 7
                            ? 176
                            : 164
                          : 124,
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                >
                  {/* Left Side: Sensor & Status Tag */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#08080c] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#030305]" />
                    </div>
                    {(isReportSubmitted || islandExpanded) && (
                      <motion.span
                        initial={{ opacity: 0, x: -3 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-[8.5px] font-mono font-bold tracking-wider uppercase pl-0.5 truncate max-w-[95px] ${activeStep >= 7 ? "text-emerald-400" : "text-cyan-400"
                          }`}
                      >
                        {activeStep >= 7 ? "VERIFIED" : "KWI GRID"}
                      </motion.span>
                    )}
                  </div>

                  {/* Center Pulse Indicator */}
                  {isReportSubmitted ? (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${activeStep >= 7
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.95)]"
                        : "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.95)] animate-pulse"
                        }`}
                    />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                  )}

                  {/* Right Side: Camera Lens with Sapphire Reflection */}
                  <div className="w-3.5 h-3.5 rounded-full bg-[#02040a] border border-[#1e293b] flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#010205]" />
                    <div className="w-1 h-1 rounded-full bg-blue-500/40 absolute top-[2px] right-[2px]" />
                    <div className="w-0.5 h-0.5 rounded-full bg-white/80 absolute top-[1.5px] right-[1.5px]" />
                  </div>
                </motion.div>
              </div>

              {/* ========================================================== */}
              {/* NATIVE STATUS BAR (FLANKING DYNAMIC ISLAND)                */}
              {/* ========================================================== */}
              <div
                className={`pt-2.5 px-6 sm:px-7 pb-1 flex items-center justify-between z-30 relative select-none shrink-0 bg-transparent transition-colors duration-300 ${isLockScreen ? "text-white" : "text-slate-900"
                  }`}
              >
                {/* Carrier or Time */}
                {isLockScreen ? (
                  <span className="text-[12px] font-semibold font-sans tracking-tight text-white/95 drop-shadow-sm flex items-center gap-1 min-w-[40px]">
                    Jio 5G
                  </span>
                ) : (
                  <span className="text-[12.5px] font-bold font-sans tracking-tight text-slate-900 min-w-[40px]">
                    {currentTime}
                  </span>
                )}

                {/* Clearance space for Dynamic Island */}
                <div className="w-[126px] h-[34px] pointer-events-none" />

                {/* Status Icons */}
                <div className="flex items-center gap-1.5">
                  {/* 4 Cellular Bars */}
                  <div className="flex items-end gap-[1.5px] h-[11px] pb-[0.5px]">
                    <span
                      className={`w-[2.5px] h-[3.5px] rounded-[0.8px] ${isLockScreen ? "bg-white shadow-xs" : "bg-slate-900"
                        }`}
                    />
                    <span
                      className={`w-[2.5px] h-[5.5px] rounded-[0.8px] ${isLockScreen ? "bg-white shadow-xs" : "bg-slate-900"
                        }`}
                    />
                    <span
                      className={`w-[2.5px] h-[7.5px] rounded-[0.8px] ${isLockScreen ? "bg-white shadow-xs" : "bg-slate-900"
                        }`}
                    />
                    <span
                      className={`w-[2.5px] h-[9.5px] rounded-[0.8px] ${isLockScreen ? "bg-white shadow-xs" : "bg-slate-900"
                        }`}
                    />
                  </div>

                  {/* Wi-Fi Icon */}
                  <Wifi
                    className={`w-[13.5px] h-[13.5px] stroke-[2.4] ${isLockScreen ? "text-white" : "text-slate-900"
                      }`}
                  />

                  {/* iOS Battery Capsule with Inner Percentage */}
                  <div className="flex items-center pl-0.5">
                    <svg width="26" height="13" viewBox="0 0 25 12" className="overflow-visible select-none">
                      <rect
                        x="0.5"
                        y="0.5"
                        width="21.5"
                        height="11"
                        rx="3.5"
                        fill="none"
                        stroke={isLockScreen ? "#ffffff" : "#0f172a"}
                        strokeWidth="1.1"
                        strokeOpacity={isLockScreen ? "0.75" : "0.4"}
                      />
                      <path
                        d="M 23 4.2 C 23.8 4.2 24.2 4.6 24.2 5.2 L 24.2 6.8 C 24.2 7.4 23.8 7.8 23 7.8 Z"
                        fill={isLockScreen ? "#ffffff" : "#0f172a"}
                        fillOpacity={isLockScreen ? "0.75" : "0.4"}
                      />
                      <rect
                        x="1.8"
                        y="1.8"
                        width={Math.max(2, 18.9 * (batteryLevel / 100))}
                        height="8.4"
                        rx="2.2"
                        fill={
                          isCharging
                            ? "#22c55e"
                            : isLockScreen
                              ? "#ffffff"
                              : "#0f172a"
                        }
                      />
                      <text
                        x="11.2"
                        y="8.2"
                        textAnchor="middle"
                        fontSize="7.5"
                        fontWeight="800"
                        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
                        fill={
                          batteryLevel > 45
                            ? isLockScreen
                              ? "#0f172a"
                              : "#ffffff"
                            : isLockScreen
                              ? "#ffffff"
                              : "#0f172a"
                        }
                        letterSpacing="-0.3px"
                      >
                        {batteryLevel}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* ========================================================== */}
              {/* INNER APP CONTENT ROUTER                                   */}
              {/* ========================================================== */}
              <div className="flex-1 overflow-hidden flex flex-col relative z-10">
                <AnimatePresence mode="wait">
                  {/* ======================================================= */}
                  {/* 1. EXPANDED NOTIFICATION DETAIL VIEW (LIGHT MODE)       */}
                  {/* Opened when tapping "Details" on ANY notification:     */}
                  {/* - Rainfall alert notification pre-submission (ID: 1)    */}
                  {/* - AI Verification notifications 1..7 post-submission   */}
                  {/* ======================================================= */}
                  {expandedNotification !== null ? (() => {
                    const detail = getNotificationDetailContent(expandedNotification);
                    const notif = NOTIFICATIONS.find((n) => n.id === expandedNotification);
                    if (!detail || !notif) return null;
                    const DetailIcon = detail.icon;

                    return (
                      <motion.div
                        key={`detail-${expandedNotification}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="flex flex-col h-full bg-white rounded-[47px] sm:rounded-[50px] absolute inset-0 z-30 p-4 pt-2"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        {/* Detail Header with Back Button */}
                        <div className="flex items-center justify-between pb-2.5 shrink-0 border-b border-slate-200">
                          <button
                            type="button"
                            onClick={handleDetailBack}
                            className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-slate-700"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-[10.5px] font-semibold">{isReportSubmitted ? "Back" : "Lock Screen"}</span>
                          </button>

                          <div className="flex items-center gap-1.5 min-w-0 px-1">
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${notif.iconLightBg}`}>
                              <DetailIcon className={`w-3 h-3 ${notif.iconLightColor}`} />
                            </div>
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 truncate max-w-[110px]">
                              {detail.subtitle}
                            </span>
                          </div>

                          <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 shrink-0">
                            {isReportSubmitted ? `CHECK ${expandedNotification}/7` : "ALERT"}
                          </span>
                        </div>

                        {/* Detail Content - Scrollable */}
                        <div
                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                          className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-3"
                        >
                          {/* Title Card */}
                          <div className="rounded-2xl p-3.5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-xs">
                            <h3 className="text-[14.5px] font-extrabold font-sans tracking-tight text-slate-900 flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${notif.iconLightBg}`}>
                                <DetailIcon className={`w-4 h-4 ${notif.iconLightColor}`} />
                              </div>
                              <span>{detail.title}</span>
                            </h3>
                            <p className="text-[10.5px] text-slate-500 mt-1 font-mono">
                              {locality} · {currentTime}
                            </p>
                          </div>

                          {/* Data Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            {detail.sections.map((section, i) => {
                              const SIcon = section.icon;
                              const lightColorMap = {
                                'text-amber-400': 'text-amber-600',
                                'text-cyan-400': 'text-cyan-600',
                                'text-blue-400': 'text-blue-600',
                                'text-sky-400': 'text-sky-600',
                                'text-indigo-400': 'text-indigo-600',
                                'text-emerald-400': 'text-emerald-600',
                                'text-green-400': 'text-green-600',
                                'text-orange-400': 'text-orange-600',
                                'text-red-400': 'text-red-600',
                                'text-slate-300': 'text-slate-600',
                              };
                              const lightColor = lightColorMap[section.color] || 'text-slate-700';
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                  className="rounded-xl p-2.5 bg-slate-50 border border-slate-200"
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <SIcon className={`w-3 h-3 ${lightColor}`} />
                                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider truncate">
                                      {section.label}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] font-bold font-sans ${lightColor}`}>
                                    {section.value}
                                  </p>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Alert Message Box */}
                          <div className="rounded-xl p-3 bg-blue-50/80 border border-blue-200">
                            <p className="text-[10.5px] text-slate-700 leading-relaxed font-sans">
                              {detail.alertMessage}
                            </p>
                          </div>

                          {/* Action Button */}
                          {detail.actionText && (
                            <button
                              type="button"
                              onClick={() => {
                                if (expandedNotification === 1 && !isReportSubmitted) {
                                  if (!currentUser) {
                                    navigate("/login");
                                    return;
                                  }
                                  if (audioEngine) audioEngine.playUiChirp(1050);
                                  setExpandedNotification(null);
                                  setPhoneStep(1);
                                } else if (expandedNotification === 7) {
                                  handleOpenLiveCity();
                                } else {
                                  handleDetailBack();
                                }
                              }}
                              className={`w-full py-2.5 rounded-xl font-bold text-[11px] font-sans tracking-wide transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${expandedNotification === 7
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                                }`}
                            >
                              <span>{detail.actionText}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Home Indicator */}
                        <div className="flex justify-center pt-2">
                          <div className="w-28 h-[4px] bg-slate-300 rounded-full" />
                        </div>
                      </motion.div>
                    );
                  })() : phoneStep === -1 ? (
                    /* ======================================================= */
                    /* 2. IPHONE LOCK SCREEN                                   */
                    /* Real notifications show on the lock screen!             */
                    /* - Before submission: Rain Forecast Notification Card    */
                    /* - After submission: Real-time Verification Notifications*/
                    /* ======================================================= */
                    <motion.div
                      key="phone-lock-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={screenTransition}
                      onClick={() => {
                        if (!isReportSubmitted) {
                          if (!currentUser) {
                            navigate("/login");
                            return;
                          }
                          if (audioEngine) audioEngine.playUiChirp(1200);
                          setPhoneStep(0);
                        }
                      }}
                      onPanEnd={(e, info) => {
                        if (!isReportSubmitted) {
                          if (info.offset.y < -20 || info.velocity.y < -100) {
                            if (!currentUser) {
                              navigate("/login");
                              return;
                            }
                            if (audioEngine) audioEngine.playUiChirp(1200);
                            setPhoneStep(0);
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full flex flex-col justify-between pt-1 pb-3 px-3 sm:px-3.5 z-10 select-none overflow-hidden cursor-pointer"
                    >
                      {/* iOS Lock Screen Header: Lock Icon, Date & Huge Clock */}
                      <div className="relative z-10 flex flex-col items-center pt-1 text-center pointer-events-none shrink-0">
                        <div className="flex items-center gap-1 text-white/95 mb-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <p className="text-[12.5px] font-medium text-white/95 tracking-tight font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                          {currentDate}
                        </p>
                        <div className="flex items-baseline justify-center gap-1.5 my-0.5 select-none">
                          <h1
                            className={`font-bold text-white tracking-tight font-sans leading-none drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] ${isReportSubmitted && visibleNotifications.length > 1
                              ? "text-[54px] sm:text-[58px]"
                              : "text-[66px] sm:text-[72px]"
                              }`}
                          >
                            {currentTime}
                          </h1>
                          <span className="text-sm sm:text-base font-bold text-white/90 drop-shadow-md uppercase tracking-wider font-mono">
                            {ampm}
                          </span>
                        </div>
                      </div>

                      {/* LOCK SCREEN NOTIFICATIONS AREA */}
                      {!isReportSubmitted ? (
                        /* ---------------------------------------------------- */
                        /* PRE-SUBMISSION: RAIN FORECAST NOTIFICATION CARD      */
                        /* ---------------------------------------------------- */
                        <div className="flex-1 flex flex-col justify-center my-auto px-0.5">
                          <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 380, damping: 26 }}
                            data-notif-clickable="true"
                            onClick={() => handleNotificationTap(1)}
                            className="w-full rounded-2xl p-3 bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.55)] text-white select-none cursor-pointer hover:bg-slate-900/90 transition-all active:scale-[0.98]"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-lg bg-amber-500/25 border border-amber-400/40 flex items-center justify-center">
                                  <CloudRain className="w-3 h-3 text-amber-400" />
                                </div>
                                <span className="text-[9px] font-bold tracking-wider uppercase font-mono text-white/80">
                                  WEATHER INTELLIGENCE
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8.5px] font-mono text-white/60">now</span>
                                <ChevronRight className="w-3 h-3 text-white/60" />
                              </div>
                            </div>

                            {/* Title & Desc */}
                            <div className="pl-6.5 text-left">
                              <h4 className="text-[12px] font-bold font-sans tracking-tight text-white leading-snug">
                                Heavy Rainfall Alert
                              </h4>
                              <p className="text-[10px] text-white/80 leading-relaxed mt-0.5 font-sans">
                                74% probability of severe precipitation · {locality.split(",")[0]} catchment
                              </p>

                              {/* Tag badge & Details CTA */}
                              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                                <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                  74% Probability · 68–82 mm/3hr
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationTap(1);
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="text-[9px] font-sans font-bold text-sky-400 hover:text-sky-300 active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                                >
                                  Details <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      ) : (
                        /* ---------------------------------------------------- */
                        /* POST-SUBMISSION: REAL-TIME VERIFICATION NOTIFICATIONS */
                        /* ---------------------------------------------------- */
                        <div className="flex-1 flex flex-col justify-end min-h-0 overflow-hidden relative my-1">
                          <div
                            ref={notifContainerRef}
                            onPointerDown={handlePointerDownPull}
                            onPointerMove={handlePointerMovePull}
                            onPointerUp={handlePointerUpPull}
                            onPointerCancel={handlePointerUpPull}
                            style={{
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                            }}
                            className={`flex flex-col gap-2 w-full max-h-[360px] sm:max-h-[380px] overflow-y-auto no-scrollbar scroll-smooth pr-0.5 pb-1 select-none ${isPulling ? "cursor-grabbing" : "cursor-grab"
                              }`}
                          >
                            <AnimatePresence initial={false}>
                              {visibleNotifications.map((notif, index) => {
                                const Icon = notif.icon;
                                const isLatest = index === visibleNotifications.length - 1;

                                return (
                                  <motion.div
                                    key={notif.id}
                                    layout
                                    initial={
                                      prefersReducedMotion
                                        ? { opacity: 0 }
                                        : {
                                          opacity: 0,
                                          y: -18,
                                          scale: 0.95,
                                          filter: "blur(4px)",
                                        }
                                    }
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      scale: 1,
                                      filter: "blur(0px)",
                                    }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 380,
                                      damping: 26,
                                      mass: 0.75,
                                    }}
                                    data-notif-clickable="true"
                                    onClick={() => handleNotificationTap(notif.id)}
                                    className={`w-full rounded-2xl p-2.5 sm:p-3 bg-slate-900/85 backdrop-blur-xl border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-white transition-all cursor-pointer hover:bg-slate-900/95 active:scale-[0.98] ${isLatest ? "ring-2 ring-sky-400/40" : "opacity-95"
                                      }`}
                                  >
                                    {/* Top Header */}
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div
                                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${notif.iconBg}`}
                                        >
                                          <Icon className={`w-3 h-3 ${notif.iconColor}`} />
                                        </div>
                                        <span className="text-[9px] font-bold tracking-wider uppercase font-mono text-white/80 truncate">
                                          {notif.app}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8.5px] font-mono text-white/60 shrink-0">{notif.time}</span>
                                        <ChevronRight className="w-3 h-3 text-white/60" />
                                      </div>
                                    </div>

                                    {/* Title & Desc */}
                                    <div className="text-left pl-6.5">
                                      <h4
                                        className={`text-[11.5px] sm:text-[12px] font-bold font-sans tracking-tight leading-snug flex items-center gap-1.5 ${notif.isFinal ? "text-emerald-400" : "text-white"
                                          }`}
                                      >
                                        {notif.title}
                                        {notif.isFinal && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                      </h4>
                                      <p className="text-[9.5px] sm:text-[10px] text-white/80 leading-relaxed mt-0.5 line-clamp-2 font-sans">
                                        {notif.desc}
                                      </p>

                                      {/* Telemetry tag & Details link */}
                                      <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                                        <span className="text-[8px] sm:text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/15 truncate max-w-[170px]">
                                          {notif.tag}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationTap(notif.id);
                                          }}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          className="text-[8.5px] font-sans font-bold text-sky-400 hover:text-sky-300 active:scale-95 transition-all flex items-center gap-0.5 shrink-0 cursor-pointer bg-transparent border-none p-0"
                                        >
                                          Details <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      </div>

                                      {/* Final Step 7 Quick Action */}
                                      {notif.isFinal && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          transition={{ delay: 0.2 }}
                                          className="pt-2 mt-1.5 border-t border-emerald-500/30 flex items-center justify-between gap-2"
                                        >
                                          <span className="text-[8.5px] font-mono text-emerald-300 font-semibold truncate">
                                            Assigned to {sluiceStation}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleOpenLiveCity(e); }}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[9.5px] transition-all flex items-center gap-1 cursor-pointer shadow-sm shrink-0"
                                          >
                                            <span>Live Map</span>
                                            <ArrowRight className="w-3 h-3" />
                                          </button>
                                        </motion.div>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* LOCK SCREEN BOTTOM BAR */}
                      {!isReportSubmitted ? (
                        /* Pre-submission unlock trigger */
                        <motion.div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!currentUser) {
                              navigate("/login");
                              return;
                            }
                            if (audioEngine) audioEngine.playUiChirp(1200);
                            setPhoneStep(0);
                          }}
                          onPanEnd={(e, info) => {
                            if (info.offset.y < -20 || info.velocity.y < -100) {
                              if (!currentUser) {
                                navigate("/login");
                                return;
                              }
                              if (audioEngine) audioEngine.playUiChirp(1200);
                              setPhoneStep(0);
                            }
                          }}
                          className="relative z-10 flex flex-col items-center gap-2 pb-1 cursor-pointer"
                        >
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-white/95 tracking-wide drop-shadow-md font-sans"
                          >
                            <span>Swipe up or tap to open</span>
                            <ChevronUp className="w-3.5 h-3.5 text-white/95" />
                          </motion.div>
                          <div className="w-36 h-[4.5px] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
                        </motion.div>
                      ) : (
                        /* Post-submission status & Submit Another */
                        <div className="pt-1.5 pb-1 flex flex-col gap-1.5 shrink-0 border-t border-white/15">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9.5px] font-mono text-white/80 font-medium">
                              {activeStep >= 7 ? "✓ All 7 Checks Passed" : `Running check ${activeStep}/7...`}
                            </span>
                            <button
                              type="button"
                              onClick={handleReset}
                              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[9.5px] font-mono text-white font-medium flex items-center gap-1 transition-colors cursor-pointer border border-white/25 backdrop-blur-md"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Submit Another</span>
                            </button>
                          </div>
                          <div className="flex justify-center pt-0.5">
                            <div className="w-28 h-[4px] bg-white/70 rounded-full" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : phoneStep === 0 ? (
                    /* ======================================================= */
                    /* 3. WELCOME SCREEN (STEP 0)                              */
                    /* ======================================================= */
                    <motion.div
                      key="phone-step-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={screenTransition}
                      className="p-4 flex flex-col justify-between h-full text-left bg-white text-slate-900 select-none"
                    >
                      <div>
                        {/* Top Brand Header */}
                        <div className="flex items-center justify-between mb-4 pt-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
                              <img
                                src="/textures/NIVARA_LOGO.png"
                                alt="NIVARA Logo"
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </div>
                            <div>
                              {/* <span className="text-[12px] font-bold text-slate-900 tracking-[0.08em] block leading-tight font-sans">
                                KWI
                              </span> */}
                              <span className="text-[10.5px] text-slate-500 font-medium block leading-tight mt-0.5">
                                NIVARA
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            title="Lock Phone"
                            onClick={() => {
                              if (audioEngine) audioEngine.playUiChirp(700);
                              setPhoneStep(-1);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Main Heading */}
                        <div className="mb-2">
                          <h2 className="text-[25px] sm:text-[27px] font-extrabold text-slate-950 tracking-tight leading-[1.15] font-sans">
                            Hello & Welcome<br />to our app
                          </h2>
                          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed max-w-[260px]">
                            Report waterlogging across Kolkata by photo, voice notes, text & GPS.
                          </p>
                        </div>
                      </div>

                      {/* Kolkata Water Network Blueprint */}
                      <div className="my-auto py-1">
                        <div className="w-full h-[178px] rounded-2xl bg-gradient-to-b from-blue-50/80 via-white to-blue-50/40 border border-blue-200/90 p-3 flex flex-col justify-between relative shadow-2xs overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f033_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f033_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                          <div className="flex items-center justify-between z-10 relative">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              <span className="text-[11px] font-extrabold font-mono tracking-[0.18em] text-blue-950 uppercase">
                                KOLKATA
                              </span>
                            </div>
                            <span className="text-[9.5px] font-mono font-semibold text-blue-600/80 tracking-wider">
                              22.57° N, 88.36° E
                            </span>
                          </div>

                          {/* Center Water Network Map */}
                          <div className="relative flex-1 flex items-center justify-center my-0.5 z-10">
                            <svg viewBox="0 0 240 100" className="w-full h-full overflow-visible select-none">
                              <defs>
                                <linearGradient id="riverGradLanding" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                  <stop offset="50%" stopColor="#2563eb" stopOpacity="0.85" />
                                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.5" />
                                </linearGradient>
                              </defs>
                              <path
                                d="M 50 10 C 70 30, 80 50, 105 60 C 130 70, 140 85, 160 95"
                                fill="none"
                                stroke="url(#riverGradLanding)"
                                strokeWidth="8"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 50 10 C 70 30, 80 50, 105 60 C 130 70, 140 85, 160 95"
                                fill="none"
                                stroke="#60a5fa"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                                strokeLinecap="round"
                              />
                              <g transform="translate(18, 24)">
                                <text
                                  x="0"
                                  y="0"
                                  fontSize="9"
                                  fontWeight="700"
                                  fontFamily="monospace"
                                  fill="#2563eb"
                                  letterSpacing="0.05em"
                                >
                                  ~~~ Hooghly
                                </text>
                              </g>
                              <line x1="45" y1="55" x2="175" y2="55" stroke="#93c5fd" strokeWidth="1.8" strokeDasharray="2 2" />
                              <circle cx="45" cy="55" r="4.5" fill="#2563eb" />
                              <circle cx="45" cy="55" r="2" fill="#ffffff" />
                              <circle cx="105" cy="60" r="5" fill="#1d4ed8" />
                              <circle cx="105" cy="60" r="2" fill="#ffffff" />
                              <circle cx="175" cy="55" r="4.5" fill="#2563eb" />
                              <circle cx="175" cy="55" r="2" fill="#ffffff" />
                            </svg>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[9px] font-mono text-slate-500 z-10">
                            <span className="flex items-center gap-1 font-semibold text-blue-700">
                              <Droplets className="w-3 h-3 text-blue-600" />
                              TELEMETRY READY
                            </span>
                            <span className="font-bold text-slate-700">32 GAUGES</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 mt-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                          <span className="text-[11px] font-bold font-mono tracking-[0.14em] text-blue-900 uppercase">
                            LIVE WATER NETWORK
                          </span>
                        </div>
                      </div>

                      {/* Bottom GET STARTED CTA */}
                      <div className="pt-1 pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser) {
                              navigate("/login");
                              return;
                            }
                            if (audioEngine) audioEngine.playUiChirp(1050);
                            setPhoneStep(1);
                          }}
                          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-[14px] transition-all cursor-pointer shadow-xs flex items-center justify-center font-sans tracking-wide"
                        >
                          GET STARTED
                        </button>
                      </div>
                    </motion.div>
                  ) : phoneStep === 1 ? (
                    /* ======================================================= */
                    /* 4. REPORT FORM (STEP 1) - ZERO NOTIFICATIONS ON SCREEN  */
                    /* (IMAGE, TEXT, VOICE, GPS LOCATIONS & CONDITIONS)        */
                    /* ======================================================= */
                    <motion.div
                      key="phone-step-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={screenTransition}
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      className="flex-1 h-full flex flex-col p-3 sm:p-4 bg-white text-slate-900 overflow-y-auto no-scrollbar overscroll-contain"
                    >
                      <MobileReportForm onBackToStep1={() => setPhoneStep(0)} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Bottom In-App Home Indicator */}
              {!isLockScreen && expandedNotification === null && (
                <div className="py-2 bg-white flex justify-center shrink-0 z-20">
                  <div className="w-28 h-1 bg-slate-300 rounded-full" />
                </div>
              )}
            </motion.div>
          </div>

          {/* ============================================================ */}
          {/* SOLID UNIBODY CHASSIS EXTRUSION (CONNECTS FRONT & BACK)       */}
          {/* ============================================================ */}
          {CHASSIS_SLICES.map((z) => (
            <div
              key={z}
              className="absolute inset-0 w-full h-full rounded-[56px] sm:rounded-[60px] bg-[#161b24] border-[1.5px] border-[#363f4e] pointer-events-none"
              style={{
                transform: `translateZ(${z}px)`,
              }}
            />
          ))}

          {/* ============================================================ */}
          {/* 2. BACK FACE (Z = -14.5px, rotateY = 180deg): 3D TITANIUM REAR */}
          {/* ============================================================ */}
          <div
            className="absolute inset-0 w-full h-full rounded-[56px] sm:rounded-[60px] bg-gradient-to-b from-[#252528] via-[#1a1a1c] to-[#121214] border border-[#3e3e44] p-5 sm:p-6 flex flex-col justify-between shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{
              transform: "rotateY(180deg) translateZ(14.5px)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Ceramic Matte Frosted Texture overlay */}
            <div className="absolute inset-0 rounded-[56px] sm:rounded-[60px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />

            {/* Elevated 3D Camera Island (Top Left) */}
            <div className="w-[146px] sm:w-[156px] h-[146px] sm:h-[156px] rounded-[34px] sm:rounded-[36px] bg-gradient-to-br from-[#2f2f34] via-[#1f1f23] to-[#161618] border border-white/15 p-3.5 sm:p-4 shadow-[0_12px_24px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.2)] relative flex flex-wrap justify-between items-center">
              {/* Camera Lens 1: Main 48MP Sapphire Lens */}
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-b from-[#111] to-[#050508] border-[3px] border-[#3a3a42] flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#030610] border border-cyan-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-900 via-blue-700 to-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-3 right-3" />
                </div>
              </div>

              {/* Camera Lens 2: Ultra-Wide Lens */}
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-b from-[#111] to-[#050508] border-[3px] border-[#3a3a42] flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#030610] border border-amber-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-emerald-900 via-teal-700 to-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-3 right-3" />
                </div>
              </div>

              {/* Camera Lens 3: Telephoto 5x Lens */}
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-b from-[#111] to-[#050508] border-[3px] border-[#3a3a42] flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#030610] border border-purple-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-900 via-violet-700 to-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-3 right-3" />
                </div>
              </div>

              {/* Right Side: True Tone Dual-LED Flash + LiDAR Sensor */}
              <div className="w-14 h-14 sm:w-15 sm:h-15 flex flex-col items-center justify-around py-1">
                {/* Dual-Tone LED Flash */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border border-white/40 shadow-inner flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
                {/* LiDAR Scanner */}
                <div className="w-4.5 h-4.5 rounded-full bg-black border border-slate-700 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                </div>
              </div>
            </div>

            {/* Apple / KWI Precision Titanium Emblem (Center of Back) */}
            <div className="self-center flex flex-col items-center opacity-60 my-auto">
              <svg
                width="38"
                height="46"
                viewBox="0 0 170 170"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <path
                  d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.74-7.94-12.14-14.58-6.19-9.35-11.03-19.78-14.52-31.29-3.48-11.51-5.22-22.38-5.22-32.61 0-14.42 3.65-26.1 10.96-35.03 7.31-8.93 16.53-13.48 27.67-13.65 4.35 0 9.4 1.18 15.15 3.53 5.75 2.35 9.4 3.59 10.96 3.73 1.96-.28 5.76-1.57 11.39-3.87 5.63-2.3 10.63-3.34 15.02-3.11 11.52.59 20.69 4.88 27.53 12.87-10.05 6.09-14.97 14.58-14.75 25.48.22 8.7 3.57 15.99 10.06 21.87 6.49 5.88 14.28 9.25 23.36 10.1-2.4 7.24-5.34 14.22-8.81 20.93zm-30.82-120.31c0 6.64-2.42 12.87-7.26 18.69-5.87 7.02-12.98 11.17-21.32 12.45-.11-.94-.17-1.88-.17-2.82 0-6.64 2.61-13.1 7.83-19.38 2.61-3.14 5.88-5.74 9.8-7.79 3.93-2.06 7.64-3.23 11.12-3.52z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-[9.5px] font-mono tracking-[0.25em] text-white/50 mt-1 uppercase">
                TITANIUM
              </span>
            </div>

            {/* Bottom Regulatory Text */}
            <div className="text-center text-[8px] font-mono text-white/30 tracking-widest pb-1">
              DESIGNED BY APPLE IN CALIFORNIA • ASSEMBLED FOR KWI
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. RIGHT SIDE RAIL (X = +174px, rotateY = +90deg): 28px DEPTH */}
          {/* ============================================================ */}
          <div
            className="absolute top-[52px] bottom-[52px] w-[28px] bg-gradient-to-b from-[#333338] via-[#222226] to-[#18181c] border-x border-[#44444c] flex flex-col justify-between items-center py-20"
            style={{
              left: "calc(100% - 14px)",
              transform: "rotateY(90deg)",
              transformOrigin: "center center",
            }}
          >
            {/* Top Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />

            {/* Power / Lock Physical Button */}
            <button
              type="button"
              title={isLockScreen ? "Unlock Phone" : "Lock Phone"}
              onClick={() => {
                if (audioEngine) audioEngine.playUiChirp(isLockScreen ? 1200 : 700);
                if (expandedNotification !== null) {
                  setExpandedNotification(null);
                  setPhoneStep(-1);
                } else if (phoneStep === -1) {
                  if (!currentUser) {
                    navigate("/login");
                    return;
                  }
                  setPhoneStep(0);
                } else {
                  setPhoneStep(-1);
                }
              }}
              className="w-[6px] h-20 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-md cursor-pointer hover:bg-slate-400 active:scale-95 transition-all"
            />

            {/* Bottom Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />
          </div>

          {/* ============================================================ */}
          {/* 4. LEFT SIDE RAIL (X = -174px, rotateY = -90deg): 28px DEPTH  */}
          {/* ============================================================ */}
          <div
            className="absolute top-[52px] bottom-[52px] w-[28px] bg-gradient-to-b from-[#333338] via-[#222226] to-[#18181c] border-x border-[#44444c] flex flex-col justify-between items-center py-16"
            style={{
              left: "-14px",
              transform: "rotateY(-90deg)",
              transformOrigin: "center center",
            }}
          >
            {/* Top Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />

            {/* Action Button & Volume Rockers */}
            <div className="flex flex-col items-center gap-5">
              {/* Action Button */}
              <div className="w-[6px] h-7 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-sm" />
              {/* Volume Up */}
              <div className="w-[6px] h-14 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-sm" />
              {/* Volume Down */}
              <div className="w-[6px] h-14 rounded-full bg-gradient-to-r from-[#444] to-[#222] border border-white/20 shadow-sm" />
            </div>

            {/* Bottom Antenna Band */}
            <div className="w-full h-[4px] bg-[#141416]" />
          </div>

          {/* ============================================================ */}
          {/* 5. TOP RAIL (Y = -top, rotateX = +90deg): 28px DEPTH          */}
          {/* ============================================================ */}
          <div
            className="absolute left-[52px] right-[52px] h-[28px] bg-gradient-to-r from-[#333338] via-[#222226] to-[#18181c] border-y border-[#44444c] flex items-center justify-center"
            style={{
              top: "-14px",
              transform: "rotateX(90deg)",
              transformOrigin: "center center",
            }}
          >
            {/* Microphone pinhole */}
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c] border border-white/10" />
          </div>

          {/* ============================================================ */}
          {/* 6. BOTTOM RAIL (Y = +bottom, rotateX = -90deg): USB-C + SPKRS */}
          {/* ============================================================ */}
          <div
            className="absolute left-[52px] right-[52px] h-[28px] bg-gradient-to-r from-[#333338] via-[#222226] to-[#18181c] border-y border-[#44444c] flex items-center justify-around px-8"
            style={{
              bottom: "-14px",
              transform: "rotateX(-90deg)",
              transformOrigin: "center center",
            }}
          >
            {/* Left Stereo Speaker Grilles (3 holes) */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
            </div>

            {/* USB-C Port */}
            <div className="w-8 h-3 rounded-full bg-[#0a0a0c] border border-white/20 flex items-center justify-center">
              <div className="w-4 h-1 rounded-sm bg-[#222]" />
            </div>

            {/* Right Stereo Speaker Grilles (5 holes) */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0c]" />
            </div>
          </div>
        </motion.div>

        {/* Dynamic Contact Floor Shadow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[340px] sm:w-[380px] h-9 bg-black/35 blur-xl rounded-full pointer-events-none" />

        {/* Replay 720° 3D View Button */}
        {!isRotating && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleReplay3D}
            className="mt-6 px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 text-[11px] font-mono font-semibold flex items-center gap-2 transition-all shadow-xs border border-slate-200/90 cursor-pointer active:scale-95"
            title="Replay 720° 3D Turntable Rotation"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Replay 720° 3D Rotation</span>
          </motion.button>
        )}
      </div>
    </section>
  );
}

export default CitizenReportingSection;
