import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  MapPin,
  Clock,
  Droplets,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Compass,
  Check,
  ChevronRight,
  Eye,
} from "lucide-react";
import { audioEngine } from "../../utils/audioEngine";

export function SupervisorVerificationGate({
  workOrder,
  onResolved,
  onIncomplete,
  onCancel,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Mandatory warning reason field
  const [warningReason, setWarningReason] = useState("");
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const [isConfirmingResolution, setIsConfirmingResolution] = useState(false);

  // Client telemetry (for browser environment fallback)
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [showLocationSimulator, setShowLocationSimulator] = useState(false);
  const [captureTimestamp, setCaptureTimestamp] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isLiveCapture, setIsLiveCapture] = useState(false);

  // Request browser GPS position on mount (only for live camera on-site capture)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeviceCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("[KWI] Geolocation warning:", err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setVerificationResult(null);
    setErrorMsg(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      audioEngine.playUiChirp(1100);
    } catch (err) {
      console.warn("Camera access failed, falling back to file input:", err);
      stopCamera();
      fileInputRef.current?.click();
    }
  };

  const capturePhotoFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const file = new File([blob], `supervisor_verify_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          handleImageSelected(file, true);
        },
        "image/jpeg",
        0.92
      );
      stopCamera();
      audioEngine.playUiChirp(1300);
    } catch (e) {
      console.error("Camera capture error:", e);
      stopCamera();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelected(file, false);
    }
    if (e.target) e.target.value = "";
  };

  const handleImageSelected = (file, isLive = false) => {
    setSelectedFile(file);
    setVerificationResult(null);
    setErrorMsg(null);
    setWarningReason("");
    const nowIso = new Date().toISOString();
    setCaptureTimestamp(nowIso);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target?.result);
    };
    reader.readAsDataURL(file);

    // Automatically trigger verification pipeline upon image selection
    runVerification(file, nowIso, isLive);
  };

  const runVerification = async (file, timestamp, isLive = false) => {
    if (!file || !workOrder) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setErrorMsg(null);
    audioEngine.playUiChirp(1000);

    const workId = workOrder.work_id || workOrder.id || workOrder.ticketKey;
    const formData = new FormData();
    formData.append("image", file);

    // Only attach telemetry if:
    // 1) Explicitly configured via Field Location / GPS Simulator, OR
    // 2) Live camera capture on-site with active browser geolocation.
    // For gallery file uploads without simulator: DO NOT SEND mock/workOrder coordinates!
    // The photo itself must contain embedded EXIF or OCR GPS Map Camera stamp.
    if (customLat && customLon) {
      formData.append("client_lat", String(customLat).trim());
      formData.append("client_lon", String(customLon).trim());
      formData.append("client_timestamp", timestamp || new Date().toISOString());
    } else if (isLive && deviceCoords?.lat && deviceCoords?.lon) {
      formData.append("client_lat", String(deviceCoords.lat));
      formData.append("client_lon", String(deviceCoords.lon));
      formData.append("client_timestamp", timestamp || new Date().toISOString());
    }
    formData.append("gps_tolerance_meters", "1000.0");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
      const res = await fetch(`http://localhost:8000/api/v1/work-orders/${encodeURIComponent(workId)}/verify`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Verification API failed with status ${res.status}`);
      }

      const data = await res.json();
      setVerificationResult(data);

      if (data.verification_result === "accepted") {
        audioEngine.playUiChirp(1400);
      } else if (data.verification_result === "warning") {
        audioEngine.playUiChirp(800);
      } else {
        audioEngine.playUiChirp(500);
      }
    } catch (err) {
      console.error("[KWI] Verification error:", err);
      setErrorMsg(err.message || "Failed to communicate with verification engine.");
      audioEngine.playUiChirp(450);
    } finally {
      setIsVerifying(false);
    }
  };

  // Confirm Resolution (Final Database Action -> RESOLVED)
  const handleConfirmResolution = async () => {
    if (!verificationResult || verificationResult.verification_result !== "accepted") return;
    setIsConfirmingResolution(true);
    const workId = workOrder.work_id || workOrder.id || workOrder.ticketKey;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
      const res = await fetch(`http://localhost:8000/api/v1/work-orders/${encodeURIComponent(workId)}/resolve-verified`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image_url: previewUrl || "",
          reason: "Waterlogging cleared & verified via Supervisor Verification Gate",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to update work order to Resolved.");
      }

      const updatedWo = await res.json();
      audioEngine.playUiChirp(1500);
      if (onResolved) {
        onResolved(updatedWo);
      }
    } catch (err) {
      console.error("[KWI] Confirm resolution error:", err);
      setErrorMsg(err.message || "Could not complete resolution update.");
    } finally {
      setIsConfirmingResolution(false);
    }
  };

  // Submit Warning Incomplete (Sets status = INCOMPLETE with reason)
  const handleSubmitWarningReason = async () => {
    if (!warningReason.trim()) return;
    setIsSubmittingReason(true);
    const workId = workOrder.work_id || workOrder.id || workOrder.ticketKey;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
      const res = await fetch(`http://localhost:8000/api/v1/work-orders/${encodeURIComponent(workId)}/resolve-warning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: warningReason.trim(),
          image_url: previewUrl || "",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to submit warning reason.");
      }

      const updatedWo = await res.json();
      audioEngine.playUiChirp(1150);
      if (onIncomplete) {
        onIncomplete(updatedWo);
      }
    } catch (err) {
      console.error("[KWI] Submit warning reason error:", err);
      setErrorMsg(err.message || "Failed to submit incomplete status.");
    } finally {
      setIsSubmittingReason(false);
    }
  };

  // Work order metadata
  const woId = workOrder.work_id || workOrder.id || "WO-IN-101";
  const woLocation = workOrder.location || workOrder.hotspot_name || "Kolkata City Zone";
  const woTime = workOrder.created_at_formatted || (workOrder.created_at ? new Date(workOrder.created_at).toLocaleString() : "Recent");
  const woRecordedLevel = (workOrder.water_level || "KNEE").toUpperCase();
  const woDepthCm = workOrder.water_depth ? `${workOrder.water_depth} cm` : "45 cm";

  return (
    <div className="relative w-full max-w-5xl mx-auto font-sans pb-10 pt-2 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1.5 cursor-pointer mb-2 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Work Orders</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Supervisor Verification Gate
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              KWI Automated Audit
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Work order resolution requires strict GPS, capture-timestamp, surface quality, and AI water-depth validation.
          </p>
        </div>

        {/* Work Order Ticket Badge */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Incident</div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-mono">{woId}</div>
        </div>
      </div>

      {/* Target Work Order Context Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#071324] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Target Location</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-1" title={woLocation}>
            {woLocation}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#071324] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Created At</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
            {woTime}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#071324] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>Recorded Level</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 font-mono">
              {woRecordedLevel}
            </span>
            <span className="text-xs text-slate-400">({woDepthCm})</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#071324] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>GPS Radius Limit</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            &le; 1000 Meters Tolerance
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Capture & Upload (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#071324] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-500" />
              <span>Verification Photograph</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Take a live photo on-site or upload with embedded EXIF/GPS Map Camera stamp.
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Live Camera View */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black mt-4 aspect-4/3 flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhotoFromCamera}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              /* Image Preview */
              <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-4/3 flex items-center justify-center group">
                <img src={previewUrl} alt="Verification" className="w-full h-full object-contain" />
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full font-mono">
                    {selectedFile?.name || "photo.jpg"}
                  </span>
                </div>
              </div>
            ) : (
              /* Empty Placeholder */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Verification Photo
                </div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  JPEG, PNG, WebP supported with EXIF or stamped GPS Map Camera tags
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                type="button"
                onClick={startCamera}
                disabled={isVerifying}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4 text-sky-500" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isVerifying}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4 text-sky-500" />
                <span>Upload Gallery</span>
              </button>
            </div>

            {previewUrl && (
              <button
                type="button"
                onClick={() => runVerification(selectedFile, captureTimestamp, isLiveCapture)}
                disabled={isVerifying}
                className="w-full mt-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                <span>Re-verify This Image</span>
              </button>
            )}

            {/* Field Location / Geofence Simulator (For testing & development) */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowLocationSimulator(!showLocationSimulator)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>Field Location / GPS Simulator</span>
                </span>
                <span className="text-[11px] text-sky-500 font-medium">
                  {showLocationSimulator ? "Hide" : "Configure"}
                </span>
              </button>

              {showLocationSimulator && (
                <div className="mt-3 space-y-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Target Site: <strong className="text-slate-800 dark:text-slate-200">{workOrder.location || "Salt Lake, Sector V"}</strong> ({workOrder.latitude}, {workOrder.longitude})
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Latitude</label>
                      <input
                        type="text"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-100"
                        placeholder="22.5735"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Longitude</label>
                      <input
                        type="text"
                        value={customLon}
                        onChange={(e) => setCustomLon(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-100"
                        placeholder="88.4331"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (workOrder?.latitude && workOrder?.longitude) {
                          setCustomLat(String(workOrder.latitude));
                          setCustomLon(String(workOrder.longitude));
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium hover:bg-sky-500/20 cursor-pointer"
                    >
                      Use Work Order Pin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLat("");
                        setCustomLon("");
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Reset / Rely on Image EXIF
                    </button>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => runVerification(selectedFile, captureTimestamp)}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        Re-verify with Location
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 5-Stage Verification Pipeline Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#071324] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Verification Pipeline</span>
              {isVerifying && (
                <span className="text-xs text-sky-500 font-semibold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Gates...</span>
                </span>
              )}
            </h2>

            {/* Pipeline Stage Indicators */}
            <div className="mt-4 space-y-3">
              {/* Step 1: Image Quality & Relevance */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  !verificationResult
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                    : verificationResult.steps?.step1_image_validation?.passed
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {verificationResult?.steps?.step1_image_validation?.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : verificationResult ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400">1</div>
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Step 1 — Image Validation & Scene Relevance
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {verificationResult?.steps?.step1_image_validation?.passed ? "Passed" : verificationResult ? "Failed" : "Waiting"}
                  </span>
                </div>
                {verificationResult?.steps?.step1_image_validation?.details && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pl-6.5">
                    {verificationResult.steps.step1_image_validation.details}
                  </p>
                )}
              </div>

              {/* Step 2: GPS Verification */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  !verificationResult
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                    : verificationResult.steps?.step2_gps_verification?.passed
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {verificationResult?.steps?.step2_gps_verification?.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : verificationResult ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400">2</div>
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Step 2 — Location Verification
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {verificationResult?.steps?.step2_gps_verification?.passed
                      ? `${verificationResult.distance_meters}m`
                      : verificationResult ? "Failed" : "Waiting"}
                  </span>
                </div>
                {verificationResult?.detected_gps && (
                  <div className="mt-1.5 pl-6.5 text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1.5">
                    <span>📍 {verificationResult.detected_gps.latitude}, {verificationResult.detected_gps.longitude}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-sans font-medium">
                      {verificationResult.metadata_source || "EXIF"}
                    </span>
                  </div>
                )}
                {verificationResult?.steps?.step2_gps_verification?.details && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6.5">
                    {verificationResult.steps.step2_gps_verification.details}
                  </p>
                )}
              </div>

              {/* Step 3: Timestamp Verification */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  !verificationResult
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                    : verificationResult.steps?.step3_timestamp_verification?.passed
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {verificationResult?.steps?.step3_timestamp_verification?.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : verificationResult ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400">3</div>
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Step 3 — Timestamp Verification (Post-Incident)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {verificationResult?.steps?.step3_timestamp_verification?.passed ? "Passed" : verificationResult ? "Failed" : "Waiting"}
                  </span>
                </div>
                {verificationResult?.steps?.step3_timestamp_verification?.details && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pl-6.5">
                    {verificationResult.steps.step3_timestamp_verification.details}
                  </p>
                )}
              </div>

              {/* Step 4: Surface/Depth AI Analysis */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  !verificationResult
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                    : verificationResult.steps?.step4_ai_analysis?.passed
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {verificationResult?.steps?.step4_ai_analysis?.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : verificationResult ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400">4</div>
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Step 4 — Surface & Water Depth AI Model
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {verificationResult?.prediction
                      ? `${verificationResult.prediction.toUpperCase()} (${(verificationResult.confidence * 100).toFixed(0)}%)`
                      : "Waiting"}
                  </span>
                </div>
                {verificationResult?.steps?.step4_ai_analysis?.details && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pl-6.5">
                    {verificationResult.steps.step4_ai_analysis.details}
                  </p>
                )}
              </div>

              {/* Step 5: Final Comparison & Decision Gate */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  !verificationResult
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                    : verificationResult.verification_result === "accepted"
                    ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                    : verificationResult.verification_result === "warning"
                    ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                    : "bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {verificationResult?.verification_result === "accepted" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : verificationResult?.verification_result === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : verificationResult ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400">5</div>
                    )}
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                      Step 5 — Decision Gate: {verificationResult ? verificationResult.verification_result.toUpperCase() : "PENDING"}
                    </span>
                  </div>
                  {verificationResult && (
                    <span
                      className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
                        verificationResult.verification_result === "accepted"
                          ? "bg-emerald-600 text-white"
                          : verificationResult.verification_result === "warning"
                          ? "bg-amber-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {verificationResult.verification_result}
                    </span>
                  )}
                </div>
                {verificationResult?.reason && (
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2 pl-7">
                    {verificationResult.reason}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message Callout */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ======================================================= */}
            {/* OUTCOME A: VERIFICATION PASSED (ACCEPTED)               */}
            {/* ======================================================= */}
            {verificationResult?.verification_result === "accepted" && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Verification Passed — Ready for Incident Resolution</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  All GPS, timestamp, sharpness, and AI water subsiding conditions have been rigorously satisfied.
                  Click below to finalize database closure.
                </p>
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  disabled={isConfirmingResolution}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isConfirmingResolution ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Database to RESOLVED...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Resolution</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ======================================================= */}
            {/* OUTCOME B: VERIFICATION WARNING (EQUAL / GREATER DEPTH)  */}
            {/* ======================================================= */}
            {verificationResult?.verification_result === "warning" && (
              <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Verification Warning — Depth Did Not Subside</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Recorded Level</span>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {verificationResult.expected_level.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Detected Level</span>
                    <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                      {verificationResult.prediction.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Mandatory Reason Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Mandatory Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={warningReason}
                    onChange={(e) => setWarningReason(e.target.value)}
                    placeholder="Enter mandatory explanation why water level remains equal or higher (e.g. continuous rainfall, high tide obstruction, pump deployment in progress)..."
                    className="w-full text-xs p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmitWarningReason}
                  disabled={!warningReason.trim() || isSubmittingReason}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    warningReason.trim()
                      ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmittingReason ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Incomplete Status...</span>
                    </>
                  ) : (
                    <span>Submit Incomplete Report</span>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Incident will NOT be resolved. Status will be recorded as INCOMPLETE in database.
                </p>
              </div>
            )}

            {/* ======================================================= */}
            {/* OUTCOME C: VERIFICATION REJECTED                        */}
            {/* ======================================================= */}
            {verificationResult?.verification_result === "rejected" && (
              <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
                  <XCircle className="w-5 h-5" />
                  <span>Verification Failed</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {verificationResult.reason || "The uploaded image did not pass all required verification gates."}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationResult(null);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setErrorMsg(null);
                      startCamera();
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationResult(null);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setErrorMsg(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Another Image</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Work order resolution remains blocked.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
