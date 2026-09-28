import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Truck,
  Activity,
  AlertTriangle,
  Layers,
  Cpu,
  Droplets,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  FileText,
  MoreHorizontal,
  Info,
  Volume2,
  Radio,
  Camera,
  X,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  Sun,
  MessageSquare,
  Check,
  Building2,
  Users,
} from "lucide-react";
import { useKWIStore, isUserSupervisor } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import { SupervisorVerificationGate } from "../supervisor/SupervisorVerificationGate";
import { motion, AnimatePresence } from "framer-motion";
import { KWITelemetryLoader } from "../ui/KWITelemetryLoader";
import { TRANSITION_EASE, DURATION } from "../../utils/motionVariants";



const RADIO_LOGS = [
  {
    time: "11:28 AM",
    sender: "ECO DISPATCH",
    senderColor: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    msg: "Unit 04 confirmed deployment toward College More.",
  },
  {
    time: "11:25 AM",
    sender: "UNIT-04 (CH-08)",
    senderColor: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    msg: "Transit past Nicco Park. Godwin pump primed and fueled.",
  },
  {
    time: "11:21 AM",
    sender: "STATION PS-07",
    senderColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    msg: "Main axial turbine spinning at 100% capacity (85 cusecs).",
  },
  {
    time: "11:15 AM",
    sender: "RADAR DESK",
    senderColor: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    msg: "Heavy precipitation cell over Salt Lake. 74 mm/3hr verified.",
  },
];

export function ActionsView() {
  const {
    navigate,
    workOrders,
    activeWorkOrderTicketId,
    setActiveWorkOrderTicketId,
    advanceWorkOrderStatus,
    latestSimulationOutcome,
    currentUser,
  } = useKWIStore();

  const isSupervisor = isUserSupervisor(currentUser);

  // When logged in as a supervisor, only show work orders generated for this specific supervisor
  const allWorkOrders = useMemo(() => {
    const raw = {
      ...(latestSimulationOutcome && latestSimulationOutcome.ticketKey
        ? { [latestSimulationOutcome.ticketKey]: latestSimulationOutcome }
        : {}),
      ...(workOrders || {}),
    };

    if (!isSupervisor) {
      return raw;
    }

    const supName = (currentUser?.name || currentUser?.full_name || "").trim().toLowerCase();
    const supEmail = (currentUser?.email || "").trim().toLowerCase();

    const filtered = {};
    for (const [key, wo] of Object.entries(raw)) {
      if (!wo) continue;
      const woTeamHead = (wo.team_head_name || "").trim().toLowerCase();
      const woChief = (wo.chief || "").trim().toLowerCase();
      const woCrew = (wo.assignedCrew || wo.assigned_crew || "").trim().toLowerCase();
      const woEmail = (wo.team_head_email || "").trim().toLowerCase();

      // Check if this work order was generated specifically for the logged-in supervisor
      const isDirectNameMatch = supName && (
        (woTeamHead && (woTeamHead === supName || woTeamHead.includes(supName) || supName.includes(woTeamHead))) ||
        (woChief && (woChief === supName || woChief.includes(supName) || supName.includes(woChief))) ||
        (woCrew && woCrew.includes(supName))
      );

      const isEmailMatch = supEmail && woEmail && woEmail === supEmail;

      // Demo fallback only if work order has no specific supervisor assigned
      const isDemoSupervisorMatch = !woTeamHead && !woChief && (
        supEmail === "supervisor@kolkata-water.gov.in" || supName === "supervisor"
      );

      if (isDirectNameMatch || isEmailMatch || isDemoSupervisorMatch) {
        filtered[key] = wo;
      }
    }
    return filtered;
  }, [workOrders, latestSimulationOutcome, isSupervisor, currentUser]);

  const [selectedTicketId, setSelectedTicketId] = useState(() => {
    if (activeWorkOrderTicketId && allWorkOrders[activeWorkOrderTicketId]) {
      return activeWorkOrderTicketId;
    }
    return Object.keys(allWorkOrders)[0] || null;
  });

  const activeTicket =
    (selectedTicketId && allWorkOrders[selectedTicketId]) ||
    Object.values(allWorkOrders)[0] ||
    null;

  const getTicketStage = (ticket) => {
    if (!ticket) return 1;
    if (typeof ticket.stage === "number") return ticket.stage;
    if (ticket.status === "Resolved") return 3;
    if (ticket.status === "In Progress") return 2;
    if (ticket.status === "Dispatched") return 1;
    return 0;
  };

  // Workflow stages (Dispatched is active by default as shown in exact reference pic)
  const [currentStage, setCurrentStage] = useState(() => {
    return getTicketStage(activeTicket);
  });

  // Photo resolution view state for supervisor
  const [isResolvingWithPhoto, setIsResolvingWithPhoto] = useState(false);
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [resolutionPhotoName, setResolutionPhotoName] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [attemptedWithoutPhoto, setAttemptedWithoutPhoto] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Synchronize when activeTicket stage/status changes or ticket is switched
  useEffect(() => {
    if (activeTicket) {
      setCurrentStage(getTicketStage(activeTicket));
    }
  }, [selectedTicketId, activeTicket?.stage, activeTicket?.status]);

  // Synchronize when store activeWorkOrderTicketId updates or tickets are resolved/removed
  useEffect(() => {
    if (activeWorkOrderTicketId && allWorkOrders[activeWorkOrderTicketId]) {
      setSelectedTicketId(activeWorkOrderTicketId);
    } else if (selectedTicketId && !allWorkOrders[selectedTicketId]) {
      setSelectedTicketId(Object.keys(allWorkOrders)[0] || null);
    } else if (!selectedTicketId && Object.keys(allWorkOrders).length > 0) {
      setSelectedTicketId(Object.keys(allWorkOrders)[0]);
    }
  }, [activeWorkOrderTicketId, allWorkOrders, selectedTicketId]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const STAGES = [
    { num: 1, name: "Recommended", desc: "Assessment & Hydraulic Triage" },
    { num: 2, name: "Dispatched", desc: "Field Crews En Route" },
    { num: 3, name: "In Progress", desc: "Active On-Site Intervention" },
    { num: 4, name: "Resolved", desc: "Incident Closure & Verification" },
  ];

  const processResolutionPhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === "string") {
        setResolutionPhoto(dataUrl);
        setResolutionPhotoName(file.name);
        setAttemptedWithoutPhoto(false);
        audioEngine.playUiChirp(1150);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processResolutionPhoto(file);
    }
  };

  const handleGalleryUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processResolutionPhoto(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleCameraUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processResolutionPhoto(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleStartCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    setIsCameraOpen(true);
    setIsCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch { }
      }
      setIsCameraStarting(false);
      audioEngine.playUiChirp(1200);
    } catch (err) {
      console.warn("Camera getUserMedia fallback to file input:", err);
      handleStopCamera();
      cameraInputRef.current?.click();
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraStarting(false);
  };

  const handleCaptureFromVideo = () => {
    const video = videoRef.current;
    if (!video || isCameraStarting) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setResolutionPhoto(dataUrl);
      setResolutionPhotoName(`supervisor_proof_${Date.now()}.jpg`);
      setAttemptedWithoutPhoto(false);
      audioEngine.playUiChirp(1350);
      handleStopCamera();
    } catch (e) {
      console.error("Capture error:", e);
      handleStopCamera();
    }
  };

  const handleConfirmResolution = () => {
    if (!resolutionPhoto) {
      setAttemptedWithoutPhoto(true);
      audioEngine.playUiChirp(550);
      return;
    }
    const targetKey = selectedTicketId || activeTicket.ticketKey || activeTicket.id;
    audioEngine.playUiChirp(1400);
    setIsResolvingWithPhoto(false);
    setCurrentStage(3);
    if (advanceWorkOrderStatus && targetKey) {
      advanceWorkOrderStatus(targetKey, {
        image_url: resolutionPhoto,
        reason: resolutionRemarks.trim() || "Waterlogging cleared & verified with photo proof by supervisor",
      });
    }
  };

  const handleAdvanceStage = () => {
    if (!isSupervisor) return;
    if (!activeTicket) return;
    const targetKey = selectedTicketId || activeTicket.ticketKey || activeTicket.id;

    // Moving from In Progress (stage 2) to Resolved (stage 3) opens the photo resolution screen
    if (currentStage === 2) {
      audioEngine.playUiChirp(1050);
      setIsResolvingWithPhoto(true);
      return;
    }

    const next = currentStage < 3 ? currentStage + 1 : currentStage;
    audioEngine.playUiChirp(950 + next * 120);
    setCurrentStage(next);
    if (advanceWorkOrderStatus && targetKey) {
      advanceWorkOrderStatus(targetKey);
    }
  };

  const handleViewIncidentOnMap = () => {
    audioEngine.playUiChirp(1040);
    navigate("/live-city");
  };

  const handleSelectTicket = (id) => {
    audioEngine.playUiChirp(1100);
    setSelectedTicketId(id);
    if (setActiveWorkOrderTicketId) {
      setActiveWorkOrderTicketId(id);
    }
  };

  // =========================================================================
  // DEDICATED SUPERVISOR PHOTO RESOLUTION PAGE (Matching exact reference pic)
  // =========================================================================
  if (isResolvingWithPhoto && activeTicket) {
    return (
      <SupervisorVerificationGate
        workOrder={activeTicket}
        onResolved={(updatedWo) => {
          setIsResolvingWithPhoto(false);
          setCurrentStage(3);
          const targetKey =
            selectedTicketId || activeTicket.ticketKey || activeTicket.id;

          if (advanceWorkOrderStatus && targetKey) {
            advanceWorkOrderStatus(targetKey, {
              image_url: updatedWo?.image_url,
              reason: updatedWo?.reason,
            });
          }
        }}
        onIncomplete={(updatedWo) => {
          setIsResolvingWithPhoto(false);
          if (activeTicket) {
            activeTicket.status = "Incomplete";
          }
        }}
        onCancel={() => {
          setIsResolvingWithPhoto(false);
          handleStopCamera();
        }}
      />
    );
  }

  if (false && isResolvingWithPhoto && activeTicket) {
    return (
      <div className="relative w-full min-h-screen font-sans text-slate-900 dark:text-slate-100 pb-16 pt-2 -mb-4 overflow-x-clip">
        {/* ========================================================================= */}
        {/* THEME-AWARE RESPOND BACKGROUND & FOOTER BLEND (Matching SimulateView)     */}
        {/* ========================================================================= */}
        <div className="absolute -top-4 sm:-top-8 inset-x-0 bottom-0 left-1/2 -translate-x-1/2 w-screen z-0 overflow-hidden pointer-events-none !m-0">
          {/* Light Theme Respond Wave Artwork */}
          <img
            src="/textures/Respond_bg.png"
            alt="Respond Background Light"
            className="w-full h-full object-cover object-top dark:hidden transition-all duration-300"
          />

          {/* Dark Theme Respond Atmospheric Wave Artwork */}
          <img
            src="/textures/Respond_bg_dark.png"
            alt="Respond Background Dark"
            className="w-full h-full object-cover object-top hidden dark:block transition-all duration-300"
          />

          {/* LIGHT ATMOSPHERIC LAYER */}
          <div className="absolute inset-0 bg-white/5 dark:hidden" />

          {/* Subtle dark atmospheric layer — restricted strictly to dark mode */}
          <div className="absolute inset-0 bg-[#06152B]/30 hidden dark:block" />

          {/* LIGHT FOOTER BLEND — Long, soft atmospheric transition into Footer (380-480px) */}
          <div
            className="absolute inset-x-0 bottom-0 h-[380px] sm:h-[480px] pointer-events-none dark:hidden"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.12) 45%, rgba(255, 255, 255, 0.30) 65%, rgba(255, 255, 255, 0.60) 82%, rgba(255, 255, 255, 0.88) 94%, #ffffff 100%)",
            }}
          />

          {/* DARK FOOTER BLEND — Long, progressive blend into dark footer (280-350px) */}
          <div
            className="absolute inset-x-0 bottom-0 h-[280px] sm:h-[350px] pointer-events-none hidden dark:block"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10, 30, 59, 0) 0%, rgba(10, 30, 59, 0.04) 25%, rgba(10, 30, 59, 0.12) 45%, rgba(10, 30, 59, 0.30) 65%, rgba(10, 30, 59, 0.60) 82%, rgba(10, 30, 59, 0.88) 94%, #0A1E3B 100%)",
            }}
          />
        </div>

        {/* Light Theme Subpixel Seam Bridge across page/footer boundary */}
        <div
          className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none bg-white dark:hidden z-10"
          aria-hidden="true"
        />

        {/* Dark Theme Subpixel Seam Bridge across page/footer boundary */}
        <div
          className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none bg-[#0A1E3B] hidden dark:block z-10"
          aria-hidden="true"
        />

        <div className="relative z-10">
          {/* Top Header: Back Link + Step Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            {/* Left: Back Link & Page Title */}
            <div>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900);
                  setIsResolvingWithPhoto(false);
                  handleStopCamera();
                }}
                className="text-[13px] font-bold text-[#007dfc] hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5 cursor-pointer transition-colors group mb-3"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Work Order</span>
              </button>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0f172a] dark:text-white tracking-tight leading-tight">
                Verify Resolution
              </h1>
              <p className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Add a clear photo showing that the waterlogging is cleared or mostly solved.
              </p>
            </div>

            {/* Right: 2-Step Progress Indicator */}
            <div className="flex items-center gap-2 self-start sm:self-center bg-white/90 dark:bg-[#071324] backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-[#142d54] shadow-2xs">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#007dfc] font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 text-center whitespace-nowrap">
                  Verify Details
                </span>
              </div>

              {/* Connecting Bar */}
              <div className="w-12 sm:w-16 h-0.5 bg-blue-200 dark:bg-blue-800 -mt-4 mx-1" />

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#007dfc] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  2
                </div>
                <span className="text-[11px] font-bold text-[#007dfc] mt-1 text-center whitespace-nowrap">
                  Add Photo & Resolve
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
            {/* =============================================================== */}
            {/* LEFT COLUMN (7 Cols): Photo Upload & Guidelines                  */}
            {/* =============================================================== */}
            <div className="lg:col-span-7 space-y-4">
              {/* Card 1: Add Verification Photo */}
              <div className="bg-white dark:bg-[#071324] rounded-2xl border border-slate-200/90 dark:border-[#142d54] shadow-xs p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#e8f3fe] dark:bg-blue-950/60 text-[#007dfc] flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-[#007dfc]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Add Verification Photo
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload a recent photo from the same location to confirm the issue is resolved.
                    </p>
                  </div>
                </div>

                {/* Drag & Drop Area */}
                {!resolutionPhoto ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      setAttemptedWithoutPhoto(false);
                      audioEngine.playUiChirp(1000);
                      galleryInputRef.current?.click();
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-11 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging
                      ? "border-[#007dfc] bg-blue-50/70 scale-[1.01]"
                      : attemptedWithoutPhoto
                        ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/40"
                        : "border-[#b8ddff] dark:border-[#193b6e] bg-[#f4f9ff] dark:bg-[#040c18] hover:bg-[#edf6ff] dark:hover:bg-[#061224]"
                      }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-[#badefd] dark:bg-blue-900/60 flex items-center justify-center text-[#007dfc] mb-3 shadow-inner">
                      <UploadCloud className="w-8 h-8 text-[#007dfc]" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                      Drag & drop a photo here
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      or choose an option below
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
                      Supports JPG, PNG • Max size 10 MB
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-slate-50 dark:bg-slate-900/70 shadow-sm p-3.5 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-44 h-36 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 dark:border-slate-800">
                      <img
                        src={resolutionPhoto}
                        alt="Verification proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left space-y-2 py-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolution Photo Attached</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {resolutionPhotoName || "verification_photo.jpg"}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Photo captured from site. Verified ready for municipal closure.
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionPhoto(null);
                            setResolutionPhotoName(null);
                            setAttemptedWithoutPhoto(false);
                            audioEngine.playUiChirp(850);
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove photo</span>
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="text-xs text-[#007dfc] hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Validation Error Message */}
                {attemptedWithoutPhoto && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Photo required: Please take or upload a photo showing the waterlogging relief before confirming resolution.
                    </span>
                  </div>
                )}

                {/* Take Photo & Gallery Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAttemptedWithoutPhoto(false);
                      audioEngine.playUiChirp(1100);
                      handleStartCamera();
                    }}
                    className="border border-slate-200/90 dark:border-[#142d54] bg-[#fbfdff] dark:bg-[#040c18] hover:bg-[#f0f7ff] dark:hover:bg-[#0a1c38] rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer shadow-xs transition-all active:scale-[0.99] text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e8f3fe] dark:bg-blue-950/60 text-[#007dfc] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5 text-[#007dfc]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                        Take Photo
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        Use your device camera
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttemptedWithoutPhoto(false);
                      audioEngine.playUiChirp(1100);
                      galleryInputRef.current?.click();
                    }}
                    className="border border-slate-200/90 dark:border-[#142d54] bg-[#fbfdff] dark:bg-[#040c18] hover:bg-[#f0f7ff] dark:hover:bg-[#0a1c38] rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer shadow-xs transition-all active:scale-[0.99] text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e8f3fe] dark:bg-blue-950/60 text-[#007dfc] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5 text-[#007dfc]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                        Gallery
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        Choose from gallery
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card 2: Photo Guidelines */}
              <div className="bg-[#f0f7ff] dark:bg-[#040c18] border border-[#d2e7ff] dark:border-[#142d54] rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#007dfc]" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Photo Guidelines
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-1">
                  {/* 1. Clear and focused */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#007dfc]">
                      <Sun className="w-4 h-4 shrink-0 text-[#007dfc]" />
                      <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        Clear and focused
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block pl-5.5 leading-tight">
                      No blurred images
                    </span>
                  </div>

                  {/* 2. Show the same location */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#007dfc]">
                      <MapPin className="w-4 h-4 shrink-0 text-[#007dfc]" />
                      <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        Show the same location
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block pl-5.5 leading-tight">
                      Capture from the same spot
                    </span>
                  </div>

                  {/* 3. Show road/drain area */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#007dfc]">
                      <svg className="w-4 h-4 shrink-0 text-[#007dfc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19L9 5" />
                        <path d="M20 19L15 5" />
                        <path d="M12 7v2" />
                        <path d="M12 13v2" />
                        <path d="M12 19v2" />
                      </svg>
                      <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        Show road/drain area
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block pl-5.5 leading-tight">
                      Include surrounding view
                    </span>
                  </div>

                  {/* 4. Recent photo */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#007dfc]">
                      <Clock className="w-4 h-4 shrink-0 text-[#007dfc]" />
                      <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        Recent photo
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block pl-5.5 leading-tight">
                      Take a current photo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* RIGHT COLUMN (5 Cols): Work Order Details & Remarks & Actions    */}
            {/* =============================================================== */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 3: Work Order Details */}
              <div className="bg-white dark:bg-[#071324] rounded-2xl border border-slate-200/90 dark:border-[#142d54] shadow-xs p-5 sm:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-[#007dfc]" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Work Order Details
                    </h3>
                  </div>

                  <div className="bg-[#eafaf1] dark:bg-emerald-950/60 text-[#12a150] dark:text-emerald-400 border border-[#bbf0cf] dark:border-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#12a150]" />
                    <span>Verification in Progress</span>
                  </div>
                </div>

                {/* Rows */}
                <div className="space-y-3.5 text-xs">
                  {/* 1. Work Order ID */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-32 shrink-0">
                      <Building2 className="w-4 h-4 text-[#007dfc]" />
                      <span className="font-medium">Work Order ID</span>
                    </div>
                    <span className="font-mono font-bold text-[#007dfc] text-sm sm:text-base">
                      {activeTicket.id || activeTicket.work_id || "WO-BE-177"}
                    </span>
                  </div>

                  {/* 2. Location */}
                  <div className="flex items-start">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-32 shrink-0 pt-0.5">
                      <MapPin className="w-4 h-4 text-[#007dfc]" />
                      <span className="font-medium">Location</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-[#007dfc] shrink-0" />
                        <span>{activeTicket.location || "Behala Chowrata, Ward 128"}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 pl-5 mt-0.5">
                        {activeTicket.borough ? `${activeTicket.borough}, West Bengal` : "Kolkata, West Bengal"}
                      </div>
                    </div>
                  </div>

                  {/* 3. Issue Type */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-32 shrink-0">
                      <Droplets className="w-4 h-4 text-[#007dfc]" />
                      <span className="font-medium">Issue Type</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Droplets className="w-3.5 h-3.5 text-[#007dfc] shrink-0" />
                      <span>{activeTicket.issueType || "Waterlogging"}</span>
                    </div>
                  </div>

                  {/* 4. Assigned To */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-32 shrink-0">
                      <Users className="w-4 h-4 text-[#007dfc]" />
                      <span className="font-medium">Assigned To</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Users className="w-3.5 h-3.5 text-[#007dfc] shrink-0" />
                      <span>
                        {activeTicket.team_head_name
                          ? `Supervisor: ${activeTicket.team_head_name}`
                          : (activeTicket.assignedCrew || activeTicket.assigned_crew || "Behala Drainage Team")}
                      </span>
                    </div>
                  </div>

                  {/* 5. Current Status */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-32 shrink-0">
                      <MapPin className="w-4 h-4 text-[#007dfc]" />
                      <span className="font-medium">Current Status</span>
                    </div>
                    <div className="bg-[#eafaf1] dark:bg-emerald-950/60 text-[#12a150] dark:text-emerald-400 border border-[#bbf0cf] dark:border-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12a150]" />
                      <span>Verification in Progress</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Resolution Remarks (Optional) */}
              <div className="bg-white dark:bg-[#071324] rounded-2xl border border-slate-200/90 dark:border-[#142d54] shadow-xs p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#007dfc]" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Resolution Remarks (Optional)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Add any remarks about the resolution work done.
                    </p>
                  </div>
                </div>

                <textarea
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value.slice(0, 500))}
                  rows={4}
                  placeholder="e.g. Water pumped out, drain grate cleared, road accessible now, etc."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#142d54] bg-white dark:bg-[#040c18] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007dfc]/30 focus:border-[#007dfc] resize-none"
                />
                <div className="text-right text-[11px] text-slate-400 font-medium">
                  {resolutionRemarks.length} / 500
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiChirp(900);
                    setIsResolvingWithPhoto(false);
                    handleStopCamera();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-[#142d54] bg-white dark:bg-[#040c18] hover:bg-slate-50 dark:hover:bg-[#0a1c38] text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.99]"
                >
                  <X className="w-4 h-4 text-[#007dfc]" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  className="flex-[1.5] py-3 px-4 rounded-xl bg-[#007dfc] hover:bg-[#006ee0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(0,125,252,0.35)] transition-all active:scale-[0.99]"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Confirm & Mark as Resolved</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Camera Stream Modal */}
          {isCameraOpen && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
                <div className="p-3 bg-slate-950 flex items-center justify-between text-white">
                  <span className="text-xs font-bold">Field Camera Proof</span>
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="p-1 rounded-full text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
                  {isCameraStarting ? (
                    <KWITelemetryLoader
                      inline={true}
                      badge="OPTICAL-LINK"
                      title="INITIALIZING FIELD CAMERA"
                      subtitle="CONNECTING NATIVE OPTICAL STREAM"
                      showTelemetry={false}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4 bg-slate-950 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      handleStopCamera();
                      cameraInputRef.current?.click();
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Native Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFromVideo}
                    disabled={isCameraStarting}
                    className="w-14 h-14 rounded-full bg-white border-4 border-blue-500 shadow-lg flex items-center justify-center text-slate-900 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden inputs for camera capture & gallery file picker */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryUpload}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraUpload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#f3f7fb] dark:bg-[#0A1E3B] font-sans text-slate-900 dark:text-[#F0F9FA] transition-colors duration-300 pb-20 space-y-5 -mb-4">
      {/* ========================================================================= */}
      {/* THEME-AWARE RESPOND BACKGROUND & FOOTER BLEND (Matching SimulateView)     */}
      {/* ========================================================================= */}
      <div className="absolute -top-28 sm:-top-32 lg:-top-36 inset-x-0 bottom-0 left-1/2 -translate-x-1/2 w-screen z-0 overflow-hidden pointer-events-none">
        {/* Light Theme Respond Wave Artwork */}
        <img
          src="/textures/Respond_Light_Bg.jpeg"
          alt="Respond Background Light"
          className="w-full h-full object-cover object-[center_36%] sm:object-[center_32%] brightness-[0.90] dark:hidden transition-all duration-300"
        />

        {/* Dark Theme Respond Atmospheric Wave Artwork */}
        <img
          src="/textures/Respond_Dark_Bg.jpeg"
          alt="Respond Background Dark"
          className="w-full h-full object-cover object-[center_36%] sm:object-[center_32%] hidden dark:block transition-all duration-300"
        />

        {/* LIGHT ATMOSPHERIC LAYER */}
        <div className="absolute inset-0 bg-black/15 dark:hidden" />

        {/* Subtle dark atmospheric layer — restricted strictly to dark mode */}
        <div className="absolute inset-0 bg-[#06152B]/30 hidden dark:block" />

        {/* LIGHT FOOTER BLEND — Long, soft atmospheric transition into Footer (380-480px) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[380px] sm:h-[480px] pointer-events-none dark:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.02) 30%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.20) 68%, rgba(255, 255, 255, 0.42) 82%, rgba(255, 255, 255, 0.68) 92%, rgba(255, 255, 255, 0.88) 100%)",
          }}
        />

        {/* DARK FOOTER BLEND — Long, progressive blend into dark footer (280-350px) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[280px] sm:h-[350px] pointer-events-none hidden dark:block"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10, 30, 59, 0) 0%, rgba(10, 30, 59, 0.04) 25%, rgba(10, 30, 59, 0.12) 45%, rgba(10, 30, 59, 0.30) 65%, rgba(10, 30, 59, 0.60) 82%, rgba(10, 30, 59, 0.88) 94%, #0A1E3B 100%)",
          }}
        />
      </div>



      {/* Dark Theme Subpixel Seam Bridge across page/footer boundary */}
      <div
        className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none bg-[#0A1E3B] hidden dark:block z-10"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-5">
        {/* ========================================================================= */}
        {/* 1. HORIZONTAL 4-STEP WORKFLOW STEPPER (Matching exact reference image)    */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#0b1322] backdrop-blur-xl border border-white/80 dark:border-[#162338] shadow-[0_12px_36px_rgba(0,102,204,0.07),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-2xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStage;
              const isCurrent = idx === currentStage;

              return (
                <div key={stage.name} className="flex items-center flex-1 min-w-0">
                  <div
                    onClick={() => {
                      if (isSupervisor && idx === 3 && currentStage < 3) {
                        audioEngine.playUiChirp(1050);
                        setIsResolvingWithPhoto(true);
                      }
                    }}
                    className={`flex items-center gap-3.5 text-left flex-1 min-w-0 select-none ${isSupervisor && idx === 3 && currentStage < 3
                      ? "cursor-pointer hover:opacity-90 transition-opacity"
                      : ""
                      }`}
                    title={
                      isSupervisor && idx === 3 && currentStage < 3
                        ? "Click to open image verification and mark as resolved"
                        : undefined
                    }
                  >
                    {/* Step Number Circle */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${isCompleted || isCurrent
                        ? "bg-[#007dfc] text-white shadow-[0_0_12px_rgba(0,125,252,0.45)]"
                        : "bg-[#1c2a3f] text-slate-400"
                        }`}
                    >
                      {stage.num}
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold tracking-tight truncate ${isCurrent
                          ? "text-[#007dfc] dark:text-[#00d0f5]"
                          : isCompleted
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-600 dark:text-slate-400"
                          }`}
                      >
                        {stage.name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-normal truncate">
                        {stage.desc}
                      </div>
                    </div>
                  </div>

                  {/* Connecting Arrow between steps */}
                  {idx < STAGES.length - 1 && (
                    <div className="hidden md:flex items-center px-2 lg:px-3 shrink-0">
                      <div
                        className={`h-[2px] w-8 sm:w-12 lg:w-16 rounded-full transition-all duration-300 ${idx < currentStage
                          ? "bg-[#00d0f5] shadow-[0_0_8px_rgba(0,208,245,0.7)]"
                          : "bg-[#162338]"
                          }`}
                      />
                      <ChevronRight
                        className={`w-4 h-4 -ml-1 transition-all duration-300 ${idx < currentStage
                          ? "text-[#00d0f5] drop-shadow-[0_0_6px_rgba(0,208,245,0.8)]"
                          : "text-[#162338]"
                          }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN WORKSPACE: LEFT WORK ORDER CARD + RIGHT FLEET & QUEUE             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ======================================================================= */}
          {/* LEFT: MAIN WORK ORDER CARD (Full width if supervisor, else 8 Cols)       */}
          {/* ======================================================================= */}
          <div className={`${isSupervisor ? "lg:col-span-12" : "lg:col-span-8"} space-y-5`}>
            {activeTicket ? (
              <div className="rounded-2xl bg-white/55 dark:bg-[#0b1322] backdrop-blur-xl border border-white/70 dark:border-[#162338] shadow-[0_12px_36px_rgba(0,102,204,0.10),inset_0_1px_1.5px_rgba(255,255,255,0.85)] dark:shadow-2xl p-4 sm:p-5">
                {/* Top Row: Document Icon + ID + Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#162338]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#007dfc] border border-[#007dfc] flex items-center justify-center text-white shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                        MUNICIPAL WORK ORDER | REF {activeTicket.incidentRef}
                      </span>
                      <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                        {activeTicket.id}
                      </span>
                    </div>
                  </div>

                  {isSupervisor && Object.keys(allWorkOrders).length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400 mr-1 uppercase">Your Assignments:</span>
                      {Object.entries(allWorkOrders).map(([tId]) => (
                        <button
                          key={tId}
                          type="button"
                          onClick={() => {
                            setSelectedTicketId(tId);
                            setActiveWorkOrderTicketId?.(tId);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${selectedTicketId === tId
                            ? "bg-[#007dfc] text-white shadow-xs"
                            : "bg-[#142236] text-slate-400 hover:text-white border border-[#1d2f47]"
                            }`}
                        >
                          {tId}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {activeTicket.team_head_name && (
                      <span className="text-[10.5px] font-bold px-3 py-0.5 rounded-full bg-white/75 dark:bg-[#112d42] text-[#00E5FF] border border-slate-200/80 dark:border-[#00E5FF]/40 uppercase tracking-wide">
                        Supervisor: {activeTicket.team_head_name}
                      </span>
                    )}
                    {activeTicket.admin_name && (
                      <span className="hidden sm:inline-block text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-white/75 dark:bg-slate-800 text-slate-900 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        Admin: {activeTicket.admin_name}
                      </span>
                    )}
                    <span className="text-[10.5px] font-bold px-3 py-0.5 rounded-full bg-white/75 dark:bg-[#2a131e] text-[#f43f5e] border border-rose-200/80 dark:border-[#50182c ] uppercase tracking-wide">
                      {activeTicket.priority || "CRITICAL"} PRIORITY
                    </span>
                    <span className="text-[10.5px] font-semibold px-3 py-0.5 rounded-full bg-white/75 dark:bg-[#0e213b] text-[#38bdf8] border border-slate-200/80 dark:border-[#1d4ed8]">
                      {activeTicket.status || "Dispatched"}
                    </span>
                    {isSupervisor && (
                      <button
                        type="button"
                        className="w-7 h-7 rounded-md border border-[#1d2f47] bg-[#142236] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prominent Incident Location Heading */}
                <div>
                  <div className="flex items-start gap-3 pt-3">
                    <div className="w-8 h-8 rounded-full bg-[#007dfc] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-[0_0_12px_rgba(0,125,252,0.4)]">
                      <MapPin className="w-4 h-4 fill-white text-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                          {activeTicket.location}
                        </h2>

                        <button
                          type="button"
                          onClick={handleViewIncidentOnMap}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold text-[#38bdf8] bg-white dark:bg-[#0e2340] hover:bg-slate-50 dark:hover:bg-[#132d52] border border-slate-900 dark:border-[#1d4ed8] transition-colors cursor-pointer shrink-0"
                        >
                          <span>View on GIS</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                        {(activeTicket.latitude || activeTicket.lat) && (activeTicket.longitude || activeTicket.lng) ? (
                          <span>
                            {activeTicket.latitude || activeTicket.lat}, {activeTicket.longitude || activeTicket.lng}
                            {activeTicket.borough ? " | " : ""}
                          </span>
                        ) : null}
                        <span>{activeTicket.borough}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Intelligence Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  {/* Metric 1: Severity Level */}
                  <div className="p-3.5 rounded-xl bg-white/55 dark:bg-[#22121e] backdrop-blur-md flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#331422] border border-[#f43f5e] flex items-center justify-center text-[#f43f5e] shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                        Severity Level
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#f43f5e] tracking-tight leading-none">
                        {activeTicket.priority || "CRITICAL"}
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Runoff Risk Score */}
                  <div className="p-3.5 rounded-xl bg-white/55 dark:bg-[#0d1c2f] backdrop-blur-md flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#10233a] border border-[#38bdf8] flex items-center justify-center text-[#38bdf8] shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                        Runoff Risk Score
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                        {activeTicket.riskScore}
                      </span>
                    </div>
                  </div>

                  {/* Metric 3: Projected Relief */}
                  <div className="p-3.5 rounded-xl bg-white/55 dark:bg-[#0d2226] backdrop-blur-md flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#0d2b2d] border border-[#2dd4bf] flex items-center justify-center text-[#2dd4bf] shrink-0">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium block leading-none mb-1">
                        Projected Relief
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#2dd4bf] tracking-tight leading-none">
                        {activeTicket.expectedImpact}
                      </span>
                    </div>
                  </div>

                  {/* Metric 4: Assigned Sluice */}
                  <div className="p-3.5 rounded-xl bg-white/55 dark:bg-[#0d1f2e] backdrop-blur-md flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#102b3e] border border-[#38bdf8] flex items-center justify-center text-[#38bdf8] shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
                        Assigned Sluice
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-[#38bdf8] tracking-tight leading-none truncate block">
                        {activeTicket.assignedNode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suggested Response / Drainage Unit Details */}
                <div className="mt-2 rounded-xl bg-white/55 dark:bg-[#0e192a] backdrop-blur-md p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#18283e]">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <Truck className="w-4 h-4 text-[#38bdf8]" />
                      <span>{activeTicket.assignedCrew}</span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-700 border border-emerald-600 dark:bg-[#0f2d24] dark:text-[#34d399] dark:border-[#165b45] text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
                      En Route to Site &gt;&gt;
                    </span>
                  </div>

                  {/* 3 Horizontal sub-columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Field In-Charge */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                        <span className="text-xs">👤</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                          FIELD IN-CHARGE
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white block text-xs mt-0.5">
                          {activeTicket.chief}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          Radio: {activeTicket.radio}
                        </span>
                      </div>
                    </div>

                    {/* Estimated Arrival */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
                          ESTIMATED ARRIVAL
                        </span>
                        <span className="font-bold text-[#00d0f5] block text-base leading-tight mt-0.5">
                          {activeTicket.eta}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Equipment */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                        ASSIGNED EQUIPMENT
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(activeTicket.equipment || [
                          "25 HP Godwin High-Head Unit",
                          "High-Volume Suction Desilter",
                        ]).map((eq, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#007dfc] dark:bg-[#162338] border border-[#007dfc] dark:border-[#22354f] text-[11px] font-medium text-white dark:text-slate-200"
                          >
                            <span className="text-[#38bdf8] text-[10px]">⚙</span>
                            <span className="truncate">{eq}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Rationale Strip */}
                <div className="mt-2 flex items-center gap-2.5 p-3.5 rounded-lg bg-white border border-[#007dfc] text-xs text-slate-700 dark:bg-[#0a1930] dark:border-[#142d54] dark:text-blue-200 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-[#007dfc] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Info className="w-3 h-3" />
                  </div>
                  <span>
                    <strong className="font-semibold text-white">
                      Dispatch Rationale:
                    </strong>{" "}
                    {activeTicket.trigger}
                  </span>
                </div>

                {/* Bottom Full-Width Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  {isSupervisor ? (
                    currentStage < 3 ? (
                      <button
                        type="button"
                        onClick={handleAdvanceStage}
                        className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(0,125,252,0.4)] hover:shadow-[0_0_32px_rgba(0,125,252,0.55)] bg-[#007dfc] hover:bg-[#006ee0]"
                      >
                        <span>
                          Advance Status: Mark as {STAGES[currentStage + 1].name}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#0f2d24] text-[#34d399] border border-[#165b45] font-semibold text-sm text-center shadow-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                        <span>Work Order Completed & Surface Relief Confirmed</span>
                      </div>
                    )
                  ) : currentStage >= 3 ? (
                    <div className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#0f2d24] text-[#34d399] border border-[#165b45] font-semibold text-sm text-center shadow-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                      <span>Work Order Completed & Surface Relief Confirmed</span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleViewIncidentOnMap}
                    className={`py-3.5 px-6 rounded-xl bg-[#007dfc] hover:bg-[#006fe0] text-white dark:hover:bg-[#1c2c47] dark:text-slate-200 dark:border-[#22354f] font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer shadow-xs flex items-center justify-center gap-2 shrink-0 ${!isSupervisor && currentStage < 3 ? "w-full" : "w-full sm:w-auto"}`}
                  >
                    <Layers className="w-4 h-4 text-black dark:text-slate-400" />
                    <span>Inspect on GIS Map</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/55 dark:bg-[#0b1322] backdrop-blur-xl border border-white/70 dark:border-[#162338] shadow-[0_12px_36px_rgba(0,102,204,0.10),inset_0_1px_1.5px_rgba(255,255,255,0.85)] dark:shadow-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50/80 border border-blue-100 dark:bg-[#142236] dark:border-[#1d2f47] flex items-center justify-center mx-auto text-[#00d0f5]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No Active Work Orders Dispatched
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isSupervisor
                    ? "Standing by for field intervention dispatches from Central Municipal Command."
                    : "Work orders are generated when field interventions are dispatched from the Simulate workspace. Run a hydraulic simulation to issue a work order."}
                </p>
                {!isSupervisor && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/simulate")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#007dfc] hover:bg-blue-600 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,125,252,0.35)]"
                    >
                      <span>Go to Simulate Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* RIGHT: ACTIVE MUNICIPAL FLEET & WORK ORDER QUEUE (4 Cols)                 */}
          {/* Hidden for supervisor as requested                                      */}
          {/* ======================================================================= */}
          {!isSupervisor && (
            <div className="lg:col-span-4 space-y-5">
              {/* Card 1: ACTIVE MUNICIPAL FLEET (Commented out)
          <div className="rounded-2xl bg-[#0b1322] border border-[#162338] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
              <h3 className="text-sm font-bold text-white">
                Active Municipal Fleet
              </h3>
              <button
                type="button"
                onClick={() => navigate("/live-city")}
                className="text-xs font-semibold text-[#00d0f5] hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Fleet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#162338"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#00d0f5"
                    strokeWidth="10"
                    strokeDasharray="314.15"
                    strokeDashoffset="37.7"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-white leading-none tracking-tight">
                    88%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    Mobilized
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#12243b] border border-[#1d3554] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs leading-tight">
                      14{" "}
                      <span className="font-normal text-slate-400">
                        Mobile Pumps Deployed
                      </span>
                    </div>
                    <div className="font-bold text-[#00d0f5] text-xs">
                      14 of 16 Boroughs
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#12243b] border border-[#1d3554] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm leading-none block">
                      340
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Total Discharge Cusecs
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#12243b] border border-[#1d3554] flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm leading-none block">
                      41
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Active Sluice Gates Stations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          */}

              {/* Card 2: WORK ORDER QUEUE */}
              <div className="rounded-2xl bg-white/55 dark:bg-[#0b1322] backdrop-blur-xl border border-white/70 dark:border-[#162338] shadow-[0_12px_36px_rgba(0,102,204,0.10),inset_0_1px_1.5px_rgba(255,255,255,0.85)] dark:shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Work Order Queue ({Object.keys(allWorkOrders).length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate("/my-reports")}
                    className="text-xs font-semibold text-[#00d0f5] hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Select to review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.keys(allWorkOrders).length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                      <p className="ont-semibold text-slate-700 dark:text-slate-400">Queue is empty</p>
                      <p className="ext-[11px] text-slate-600 dark:text-slate-500 leading-relaxed">
                        Dispatched work orders from simulations will queue here.
                      </p>
                    </div>
                  ) : (
                    Object.entries(allWorkOrders).map(([ticketKey, order]) => {
                      const isSelected = selectedTicketId === ticketKey;
                      const isCritical = (order.priority || "").toUpperCase() === "CRITICAL";

                      return (
                        <div
                          key={ticketKey}
                          onClick={() => handleSelectTicket(ticketKey)}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${isSelected
                            ? "border-[#007dfc] bg-white shadow-[0_0_16px_rgba(0,125,252,0.25)] ring-1 ring-[#007dfc]/50 dark:bg-[#0e213b]"
                            : "border-[#007dfc] bg-white hover:border-[#007dfc] dark:border-[#162338] dark:bg-[#0e192a] dark:hover:border-[#223552]"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${isCritical ? "bg-rose-500" : "bg-amber-500"
                                  }`}
                              />
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                {order.id}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#007dfc] text-white">
                                  CURRENTLY VIEWING
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${isCritical
                                  ? "bg-[#2d1421] text-[#f43f5e] border border-[#52182d]"
                                  : "bg-amber-50/90 text-amber-700 border border-amber-300/80 dark:bg-[#2d2212] dark:text-amber-400 dark:border-[#523e18]"
                                  }`}
                              >
                                {order.priority} &gt;
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 pl-4.5">
                            {order.location}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4.5">
                            <span className="truncate text-slate-600 dark:text-slate-400">{order.assignedCrew}</span>
                            <span className="font-medium text-slate-600 dark:text-slate-300 shrink-0">
                              {order.eta} ETA
                            </span>
                          </div>
                        </div>
                      );
                    }))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. BOTTOM SECTION: COMMS LOG + REAL-TIME UPDATES                         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 1 (Left 8 Cols): Field Communications Log */}
          <div className="lg:col-span-8 rounded-2xl bg-white/85 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Field Communications Log
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Feed
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Channel 08 — Tactical
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/action-center")}
                    className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {RADIO_LOGS.map((log, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 text-xs"
                  >
                    <span className="font-mono text-slate-400 shrink-0 w-16 text-[11px]">
                      {log.time}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${log.senderColor}`}
                    >
                      {log.sender}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2 (Right 4 Cols): Real-time field updates badge card */}
          <div className="lg:col-span-4 rounded-2xl bg-white/85 dark:bg-[#111a2e]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Radio className="w-5 h-5" />
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                Real-time field updates keep Kolkata moving.
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
                Integrated communications across field units, pumping stations,
                and control room.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionsView;
