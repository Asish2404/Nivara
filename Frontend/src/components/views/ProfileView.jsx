import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  LogOut,
  Camera,
  MapPin,
  CheckCircle2,
  Key,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
  Smartphone,
  Pencil,
  Mail,
  Phone,
  Building2,
  BookOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Palette,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  Globe,
  BarChart2,
  BarChart3,
  Leaf,
  ArrowRight,
  Settings,
  Zap,
  RefreshCw,
  Image as ImageIcon,
  Shield,
  Users,
  Droplet,
  Waves,
  Compass,
  ExternalLink,
  X,
  Navigation,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import {
  formatDate,
  formatTime12Hour,
  formatDateTime12Hour,
} from "../../utils/dateTimeUtils";

/* ═══════════════════════════════════════════════════════════════
   NIVARA — PROFILE & DASHBOARD
   Polished high-contrast light theme without footer
   ═══════════════════════════════════════════════════════════════ */

export function ProfileView() {
  const {
    currentUser,
    updateUserProfile,
    logoutUser,
    navigate,
    unreadNotificationsCount = 3,
    theme,
    setTheme,
    profileActiveTab,
    setProfileActiveTab,
  } = useKWIStore();

  const fileInputRef = useRef(null);

  /* ── User Data Model (Preserves Store & Defaults) ── */
  const [profile, setProfile] = useState({
    fullName: currentUser?.name || "KWI User",
    username: currentUser?.username || "kwi.user",
    email: currentUser?.email || "user@kolkata-water.gov.in",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "Kolkata, West Bengal",
    institution: currentUser?.institution || "",
    department: currentUser?.department || "NIVARA",
    bio:
      currentUser?.bio ||
      "Write your motto here please!",
    profileImage: currentUser?.avatarUrl || null,
    createdAt: currentUser?.createdAt || null,
  });

  // Keep local profile synchronized if currentUser changes in store
  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => ({
        ...prev,
        fullName: currentUser.name || prev.fullName,
        username: currentUser.username || prev.username,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        location: currentUser.location || prev.location,
        institution: currentUser.institution || prev.institution,
        department: currentUser.department || prev.department,
        bio: currentUser.bio || prev.bio,
        profileImage: currentUser.avatarUrl || prev.profileImage,
        createdAt: currentUser.createdAt || prev.createdAt,
      }));
    }
  }, [currentUser]);

  /* ── Dynamic Statistics ── */
  const stats = useMemo(() => {
    const created = new Date(profile.createdAt || "2026-08-15");
    const now = new Date();
    const calculatedDays = Math.max(
      1,
      Math.ceil((now - created) / (1000 * 60 * 60 * 24)),
    );
    return {
      reportsSubmitted: currentUser?.reportsSubmitted ?? 8,
      alertsReceived: currentUser?.alertsReceived ?? 3,
      daysActive:
        currentUser?.daysActive ?? (calculatedDays > 1 ? calculatedDays : 24),
    };
  }, [currentUser, profile.createdAt]);

  /* ── UI Navigation & Tab State ── */
  const [activeTab, setActiveTab] = useState(profileActiveTab || "overview");

  // Keep activeTab in sync with store's profileActiveTab
  useEffect(() => {
    if (
      profileActiveTab &&
      ["overview", "personal", "preferences", "security"].includes(
        profileActiveTab,
      )
    ) {
      setActiveTab(profileActiveTab);
    }
  }, [profileActiveTab]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [contribTimeRange, setContribTimeRange] = useState("30");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /* ── Preferences State ── */
  const [preferences, setPreferences] = useState({
    theme: theme || "system",
    alertNotifications: true,
    emailNotifications: false,
    mapStyle: "satellite",
    dataViz: "charts",
    language: "en",
  });

  /* ── Security State ── */
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    mfaEnabled: true,
  });
  const [securitySuccess, setSecuritySuccess] = useState(false);

  /* ── Computed Values ── */
  const userInitials = useMemo(() => {
    const clean = (profile.fullName || currentUser?.name || "KWI User")
      .replace(/[^a-zA-Z0-9]/g, " ")
      .trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || "KU";
  }, [profile.fullName, currentUser?.name]);

  const userInitial = userInitials;

  const memberSince = useMemo(() => {
    try {
      if (!profile.createdAt) return "September 2026";
      const dateStr = formatDate(profile.createdAt);
      const timeStr = formatTime12Hour(profile.createdAt);
      return timeStr ? `${dateStr} • ${timeStr}` : dateStr;
    } catch {
      return "September 2026";
    }
  }, [profile.createdAt]);

  const accountCreatedAtFormatted = useMemo(() => {
    return formatDateTime12Hour(profile.createdAt);
  }, [profile.createdAt]);

  const timeGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning,";
    if (hr < 17) return "Good afternoon,";
    return "Good evening,";
  }, []);

  /* ── Handlers ── */
  const handleImageChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        return;
      if (file.size > 4 * 1024 * 1024) return;
      setImageUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((p) => ({ ...p, profileImage: reader.result }));
        setEditDraft((d) => ({ ...d, profileImage: reader.result }));
        updateUserProfile?.({ avatarUrl: reader.result });
        setImageUploading(false);
        audioEngine?.playUiChirp(1020);
      };
      reader.readAsDataURL(file);
    },
    [updateUserProfile],
  );

  const handleRemoveImage = useCallback(() => {
    setProfile((p) => ({ ...p, profileImage: null }));
    setEditDraft((d) => ({ ...d, profileImage: null }));
    updateUserProfile?.({ avatarUrl: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
    audioEngine?.playUiChirp(780);
  }, [updateUserProfile]);

  const openEditModal = useCallback(() => {
    setEditDraft({ ...profile });
    setIsEditModalOpen(true);
    audioEngine?.playUiChirp(920);
  }, [profile]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    audioEngine?.playUiChirp(750);
  }, []);

  const handleSaveProfile = useCallback(
    (e) => {
      if (e) e.preventDefault();
      setIsSaving(true);
      audioEngine?.playStationLock();

      setTimeout(() => {
        const updated = { ...editDraft };
        setProfile(updated);
        updateUserProfile?.({
          name: updated.fullName,
          username: updated.username,
          email: updated.email,
          phone: updated.phone,
          location: updated.location,
          institution: updated.institution,
          department: updated.department,
          bio: updated.bio,
          avatarUrl: updated.profileImage,
        });
        setIsSaving(false);
        setIsEditModalOpen(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 500);
    },
    [editDraft, updateUserProfile],
  );

  const handleSecuritySave = useCallback(
    (e) => {
      e.preventDefault();
      if (!security.currentPassword || !security.newPassword) return;
      if (security.newPassword !== security.confirmPassword) return;
      audioEngine?.playStationLock();
      setSecuritySuccess(true);
      setSecurity((s) => ({
        ...s,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setTimeout(() => setSecuritySuccess(false), 3000);
    },
    [security],
  );

  const handleSignOut = useCallback(() => {
    audioEngine?.playStationLock();
    logoutUser();
    navigate("/login");
  }, [logoutUser, navigate]);

  /* ── Tab Definitions ── */
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboardIcon size={16} />,
    },
    { id: "personal", label: "Personal Details", icon: <User size={16} /> },
    { id: "preferences", label: "Preferences", icon: <Settings size={16} /> },
    { id: "security", label: "Security", icon: <Lock size={16} /> },
  ];

  /* ── Contribution Activity Bars ── */
  const contributionBars = [
    { date: "Aug 1", val: 32, active: false },
    { date: "Aug 2", val: 45, active: false },
    { date: "Aug 3", val: 24, active: false },
    { date: "Aug 4", val: 18, active: false },
    { date: "Aug 5", val: 68, active: true },
    { date: "Aug 6", val: 40, active: false },
    { date: "Aug 7", val: 52, active: false },
    { date: "Aug 8", val: 28, active: false },
    { date: "Aug 9", val: 36, active: false },
    { date: "Aug 10", val: 78, active: true },
    { date: "Aug 11", val: 50, active: false },
    { date: "Aug 12", val: 62, active: false },
    { date: "Aug 13", val: 44, active: false },
    { date: "Aug 14", val: 70, active: false },
    { date: "Aug 15", val: 94, active: true },
    { date: "Aug 16", val: 82, active: false },
    { date: "Aug 17", val: 56, active: false },
    { date: "Aug 18", val: 40, active: false },
    { date: "Aug 19", val: 74, active: false },
    { date: "Aug 20", val: 86, active: true },
    { date: "Aug 21", val: 48, active: false },
    { date: "Aug 22", val: 64, active: false },
    { date: "Aug 23", val: 72, active: false },
    { date: "Aug 24", val: 54, active: false },
    { date: "Aug 25", val: 80, active: true },
    { date: "Aug 26", val: 60, active: false },
    { date: "Aug 27", val: 76, active: false },
    { date: "Aug 28", val: 42, active: false },
    { date: "Aug 29", val: 68, active: false },
    { date: "Aug 30", val: 52, active: true },
  ];

  return (
    <div className="w-full min-h-screen kwi-profile-container selection:bg-cyan-100 selection:text-cyan-900 pb-12">
      <style>{KWI_TARGET_STYLES}</style>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 1. LARGE CINEMATIC KOLKATA HERO IMAGE                     */}
      {/* ═════════════════════════════════════════════════════════ */}
      <section className="kwi-hero-section">
        <div className="kwi-hero-bg" />
        <div className="kwi-hero-overlay" />

        <div className="kwi-hero-content max-w-[1435px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left Side: Serif Hero Heading & Subtitle */}
          <div className="kwi-hero-left">
            <h1 className="kwi-hero-title">
              A Cleaner Kolkata
              <br />A Healthier Tomorrow
            </h1>
            <p className="kwi-hero-subtitle">Data. People. Cleaner Water.</p>
          </div>

          {/* Right Side: Elegant City Quote */}
          <div className="kwi-hero-right hidden md:flex flex-col items-end text-right">
            <blockquote className="kwi-hero-quote">
              “For a healthier city,
              <br />
              flowing with possibilities.”
            </blockquote>
            <div className="kwi-hero-quote-line" />
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 2. FLOATING PROFILE HERO CARD (Overlaps Hero Banner)      */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="kwi-profile-card-wrapper max-w-[1435px] mx-auto px-4 sm:px-8">
        <div className="kwi-profile-card">
          {/* ZONE 1: Large Circular Avatar */}
          <div className="kwi-avatar-container">
            <div className="kwi-avatar-circle">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.fullName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="kwi-avatar-initials">{userInitials}</span>
              )}
            </div>
            {/* Green Online Dot */}
            <span className="kwi-avatar-status" title="Active on NIVARA" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="kwi-avatar-cambadge"
              title="Change profile picture"
              disabled={imageUploading}
            >
              {imageUploading ? (
                <RefreshCw size={11} className="animate-spin" />
              ) : (
                <Camera size={11} />
              )}
            </button>
          </div>

          {/* ZONE 2: Middle Identity & Metadata */}
          <div className="kwi-profile-identity flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-[#596A82] dark:text-[#94a3b8] tracking-tight">
              {timeGreeting}
            </div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="kwi-profile-name">{profile.fullName}</h2>
            </div>
            <div className="text-[12px] font-bold text-[#1677ff] dark:text-[#38bdf8] mt-0.5 tracking-tight">
              {profile.department}
            </div>
            <p className="kwi-profile-bio">{profile.bio}</p>

            <div className="kwi-profile-meta-row flex items-center gap-5 mt-2.5 text-[12px] font-medium text-[#475569] dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-[#334155] dark:text-slate-200">
                <MapPin size={13} className="text-[#1677ff] dark:text-cyan-400 shrink-0" />
                {profile.location || "Kolkata, West Bengal"}
              </span>
              <span className="flex items-center gap-1.5 text-[#334155] dark:text-slate-200">
                <Clock size={13} className="text-[#1677ff] dark:text-cyan-400 shrink-0" />
                Registered: {accountCreatedAtFormatted}
              </span>
            </div>
          </div>

          {/* ZONE 3: Right Panel & Edit Profile Button */}
          <div className="kwi-profile-actions-zone flex flex-col items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={openEditModal}
              className="kwi-edit-profile-btn"
              title="Edit your operator details"
            >
              <Pencil size={13} className="text-[#1677ff]" />
              <span>Edit Profile</span>
            </button>

            {/* Soft Pale Blue Inspirational Leaf Panel */}
            <div className="kwi-quote-panel">
              <div className="kwi-quote-leaf">
                <Leaf size={15} className="text-emerald-600" />
              </div>
              <p className="kwi-quote-text">
                “Small actions
                <br />
                create a cleaner,
                <br />
                healthier Kolkata.”
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 3. PROFILE TAB NAVIGATION                                 */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="kwi-tabs-container max-w-[1435px] mx-auto px-4 sm:px-8 mt-6">
        <div className="kwi-tabs-bar flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (setProfileActiveTab) setProfileActiveTab(tab.id);
                  audioEngine?.playUiChirp(840);
                }}
                className={`kwi-tab-button ${isActive ? "active" : ""}`}
              >
                <span className="kwi-tab-icon">{tab.icon}</span>
                <span className="kwi-tab-label">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="kwi-tab-underline"
                    className="kwi-tab-underline"
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleSignOut}
            className="kwi-tab-signout ml-auto flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 4. MAIN CONTENT AREA                                      */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="kwi-main-content max-w-[1435px] mx-auto px-4 sm:px-8 pt-6">
        <AnimatePresence mode="wait">
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="kwi-save-toast mb-5 flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>
                Profile information synchronized and saved successfully!
              </span>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB A: OVERVIEW (Matches Screenshot 1 Grid)           */}
          {/* ═════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* ── 4 SUMMARY STAT CARDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Days Active */}
                <div className="kwi-stat-card">
                  <div className="kwi-stat-icon-wrap bg-[#ebf5ff] text-[#1677ff]">
                    <Droplet size={20} className="fill-[#1677ff]/20" />
                  </div>
                  <div className="kwi-stat-body">
                    <div className="kwi-stat-val-row">
                      <span className="kwi-stat-num">{stats.daysActive}</span>
                      <span className="kwi-badge-trend green">↑ 12%</span>
                    </div>
                    <div className="kwi-stat-label">Days Active</div>
                    <div className="kwi-stat-sub">from last month</div>
                  </div>
                </div>

                {/* Card 2: Reports Submitted */}
                <div className="kwi-stat-card">
                  <div className="kwi-stat-icon-wrap bg-[#ebf5ff] text-[#1677ff]">
                    <FileText size={20} />
                  </div>
                  <div className="kwi-stat-body">
                    <div className="kwi-stat-val-row">
                      <span className="kwi-stat-num">
                        {stats.reportsSubmitted}
                      </span>
                      <span className="kwi-badge-trend green">↑ 33%</span>
                    </div>
                    <div className="kwi-stat-label">Reports Submitted</div>
                    <div className="kwi-stat-sub">from last month</div>
                  </div>
                </div>

                {/* Card 3: Alerts Received */}
                <div className="kwi-stat-card">
                  <div className="kwi-stat-icon-wrap bg-[#fef2f2] text-[#ef4444]">
                    <Bell size={20} />
                  </div>
                  <div className="kwi-stat-body">
                    <div className="kwi-stat-val-row">
                      <span className="kwi-stat-num">
                        {stats.alertsReceived}
                      </span>
                      <span className="kwi-badge-trend red">↓ 25%</span>
                    </div>
                    <div className="kwi-stat-label">Alerts Received</div>
                    <div className="kwi-stat-sub">from last month</div>
                  </div>
                </div>

                {/* Card 4: System Status */}
                <div className="kwi-stat-card">
                  <div className="kwi-stat-icon-wrap bg-[#ecfdf5] text-[#10b981]">
                    <BarChart2 size={20} />
                  </div>
                  <div className="kwi-stat-body">
                    <div className="flex items-center gap-1.5 font-bold text-[#0F1F3D] dark:text-white text-base">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Online</span>
                    </div>
                    <div className="kwi-stat-label">System Status</div>
                    <div className="kwi-stat-sub">All systems operational</div>
                  </div>
                </div>
              </div>

              {/* ── THREE-COLUMN MAIN GRID (1 : 1.55 : 1) ── */}
              <div className="kwi-three-col-grid">
                {/* ════════ COLUMN 1 (LEFT): About Me ════════ */}
                <div className="kwi-col-left">
                  <div className="kwi-box-card">
                    <div className="kwi-box-header">
                      <h3 className="kwi-box-title">About Me</h3>
                      <button
                        type="button"
                        onClick={openEditModal}
                        className="kwi-box-edit-btn"
                        title="Edit About Me"
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="p-5">
                      <p className="kwi-about-text">{profile.bio}</p>

                      <div className="mt-5 space-y-3.5">
                        {/* Email */}
                        <div className="flex items-center gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-9 h-9 rounded-xl bg-[#ebf5ff] text-[#1677ff] flex items-center justify-center shrink-0">
                            <Mail size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="kwi-field-label-tag">Email</div>
                            <div className="kwi-field-val-text truncate">
                              {profile.email || "user@kolkata-water.gov.in"}
                            </div>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-9 h-9 rounded-xl bg-[#e8fff3] text-[#059669] flex items-center justify-center shrink-0">
                            <Phone size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="kwi-field-label-tag">Phone</div>
                            <div className="kwi-field-val-text">
                              {profile.phone || "Not added"}
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-9 h-9 rounded-xl bg-[#fff4e6] text-[#d97706] flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="kwi-field-label-tag">Location</div>
                            <div className="kwi-field-val-text">
                              {profile.location || "Kolkata, West Bengal"}
                            </div>
                          </div>
                        </div>

                        {/* Institution */}
                        <div className="flex items-center gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-9 h-9 rounded-xl bg-[#f3eeff] text-[#7c3aed] flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="kwi-field-label-tag">
                              Institution
                            </div>
                            <div className="kwi-field-val-text">
                              {profile.institution || "Not added"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ════════ COLUMN 2 (CENTER): My Contribution + Banner ════════ */}
                <div className="kwi-col-center space-y-5">
                  {/* Card: My Contribution with Dynamic Bar Chart */}
                  <div className="kwi-box-card">
                    <div className="kwi-box-header">
                      <h3 className="kwi-box-title">My Contribution</h3>

                      {/* Dropdown Filter */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-[#14213D] hover:text-[#0F1F3D] border border-slate-300 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Last {contribTimeRange} days</span>
                          <ChevronDown size={13} className="text-[#52627A]" />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-30">
                            {[
                              { label: "Last 7 days", val: "7" },
                              { label: "Last 30 days", val: "30" },
                              { label: "Last 90 days", val: "90" },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => {
                                  setContribTimeRange(opt.val);
                                  setIsDropdownOpen(false);
                                  audioEngine?.playUiChirp(880);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${
                                  contribTimeRange === opt.val
                                    ? "bg-blue-50 text-[#1677ff] font-semibold"
                                    : "text-[#14213D] hover:bg-slate-50"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Interactive Bar Chart */}
                      <div className="kwi-chart-container pt-2">
                        <div className="kwi-chart-bars flex items-end justify-between h-[115px] gap-1.5 sm:gap-2 px-1">
                          {contributionBars.map((item, idx) => {
                            const barHeight = `${Math.max(16, item.val)}%`;
                            return (
                              <div
                                key={idx}
                                className="group relative flex-1 flex flex-col items-center justify-end h-full"
                              >
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 px-2 py-1 bg-[#0F1F3D] text-white text-[10.5px] font-semibold rounded shadow-md whitespace-nowrap z-20">
                                  {item.date}: {Math.round(item.val / 10)}{" "}
                                  actions
                                </div>
                                <div
                                  className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110"
                                  style={{
                                    height: barHeight,
                                    background: item.active
                                      ? "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)"
                                      : "linear-gradient(180deg, #bae6fd 0%, #7dd3fc 100%)",
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* X-Axis Date Labels */}
                        <div className="flex items-center justify-between text-[11.5px] text-[#52627A] font-semibold pt-3 px-1 border-t border-slate-200 dark:border-slate-800">
                          <span>Aug 1</span>
                          <span>Aug 5</span>
                          <span>Aug 10</span>
                          <span>Aug 15</span>
                          <span>Aug 20</span>
                          <span>Aug 25</span>
                          <span>Aug 30</span>
                        </div>
                      </div>

                      {/* Bottom Metric Badges */}
                      <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 dark:bg-slate-900/50">
                          <div className="w-8 h-8 rounded-lg bg-[#ebf5ff] text-[#1677ff] flex items-center justify-center shrink-0">
                            <FileText size={15} />
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-[#0F1F3D] dark:text-white leading-tight">
                              {stats.reportsSubmitted}
                            </div>
                            <div className="text-[11px] font-semibold text-[#52627A]">
                              Reports
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 dark:bg-slate-900/50">
                          <div className="w-8 h-8 rounded-lg bg-[#fff4e6] text-[#d97706] flex items-center justify-center shrink-0">
                            <Bell size={15} />
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-[#0F1F3D] dark:text-white leading-tight">
                              {stats.alertsReceived}
                            </div>
                            <div className="text-[11px] font-semibold text-[#52627A]">
                              Alerts
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 dark:bg-slate-900/50">
                          <div className="w-8 h-8 rounded-lg bg-[#e8fff3] text-[#059669] flex items-center justify-center shrink-0">
                            <TrendingUp size={15} />
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-[#0F1F3D] dark:text-white leading-tight">
                              {stats.daysActive}
                            </div>
                            <div className="text-[11px] font-semibold text-[#52627A]">
                              Days Active
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KWI INTELLIGENCE Promotional Banner */}
                  <div className="kwi-intelligence-banner relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white shadow-[0_12px_36px_rgba(2,132,199,0.18)]">
                    {/* Background Image Layer: water_droplet_ripple.jpg */}
                    <div
                      className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none transition-transform duration-700 ease-out"
                      style={{
                        backgroundImage:
                          "url('/images/water_droplet_ripple.jpg')",
                        backgroundPosition: "72% 40%",
                      }}
                    />

                    {/* Gradient Overlay: Deep navy on text side smoothly tapering into splash clarity */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(6, 24, 56, 0.55) 0%, rgba(8, 36, 82, 0.42) 42%, rgba(10, 52, 115, 0.25) 70%, rgba(7, 28, 64, 0.12) 100%)",
                      }}
                    />

                    {/* Subtle border reflection */}
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/15 rounded-2xl" />

                    <div className="relative z-10 max-w-[350px]">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md text-white border border-white/30 mb-3 shadow-xs">
                        KWI INTELLIGENCE
                      </span>
                      <h4 className="text-[19px] sm:text-[21px] font-bold leading-snug text-white font-['Space_Grotesk'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        Your contribution
                        <br />
                        builds a cleaner, safer Kolkata.
                      </h4>
                      <p className="text-[12.5px] text-white/95 leading-relaxed mt-2 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                        Every report and alert helps us understand, monitor, and
                        improve the city's water infrastructure.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/live-city")}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/25 hover:bg-white/35 active:scale-98 backdrop-blur-md text-white border border-white/40 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      >
                        <span>View My Activity</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ════════ COLUMN 3 (RIGHT): Quick Actions + Next Contribution ════════ */}
                <div className="kwi-col-right space-y-5">
                  {/* Card 1: Quick Actions */}
                  <div className="kwi-box-card">
                    <div className="kwi-box-header">
                      <h3 className="kwi-box-title">Quick Actions</h3>
                    </div>

                    <div className="p-3 space-y-1">
                      {/* Action 1: Change Photo */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#ebf5ff] text-[#1677ff] flex items-center justify-center shrink-0">
                          <Camera size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-bold text-[#0F1F3D] dark:text-white group-hover:text-[#1677ff] transition-colors">
                            Change Photo
                          </div>
                          <div className="text-[12px] font-medium text-[#52627A] truncate">
                            Update your profile picture
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-[#596A82] group-hover:text-[#1677ff] group-hover:translate-x-0.5 transition-all"
                        />
                      </button>

                      {/* Action 2: Update Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("security");
                          if (setProfileActiveTab)
                            setProfileActiveTab("security");
                          audioEngine?.playUiChirp(860);
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#fff4e6] text-[#d97706] flex items-center justify-center shrink-0">
                          <Key size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-bold text-[#0F1F3D] dark:text-white group-hover:text-[#d97706] transition-colors">
                            Update Password
                          </div>
                          <div className="text-[12px] font-medium text-[#52627A] truncate">
                            Keep your account secure
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-[#596A82] group-hover:text-[#d97706] group-hover:translate-x-0.5 transition-all"
                        />
                      </button>

                      {/* Action 3: Manage Preferences */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("preferences");
                          if (setProfileActiveTab)
                            setProfileActiveTab("preferences");
                          audioEngine?.playUiChirp(860);
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#e8fff3] text-[#059669] flex items-center justify-center shrink-0">
                          <Settings size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-bold text-[#0F1F3D] dark:text-white group-hover:text-[#059669] transition-colors">
                            Manage Preferences
                          </div>
                          <div className="text-[12px] font-medium text-[#52627A] truncate">
                            Customize your experience
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-[#596A82] group-hover:text-[#059669] group-hover:translate-x-0.5 transition-all"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Your Next Contribution */}
                  <div className="kwi-next-contrib-card rounded-2xl p-5 border border-emerald-200 bg-[#f0faf7] dark:bg-emerald-950/30 dark:border-emerald-900/50 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[#064e3b] dark:text-emerald-300">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Leaf size={15} />
                        </div>
                        <h4 className="text-[14px] font-bold">
                          Your Next Contribution
                        </h4>
                      </div>
                      <MapPin size={16} className="text-[#1677ff] shrink-0" />
                    </div>

                    <p className="text-[12.5px] text-[#334155] dark:text-slate-200 mt-2.5 leading-relaxed font-medium">
                      There are 3 unresolved water reports near your monitored
                      areas.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/reports")}
                      className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Review Reports</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB B: PERSONAL DETAILS (Fixed High-Contrast Cards)   */}
          {/* ═════════════════════════════════════════════════════ */}
          {activeTab === "personal" && (
            <motion.div
              key="personal-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="kwi-box-card">
                <div className="kwi-box-header">
                  <h3 className="kwi-box-title">Personal Details</h3>
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="kwi-box-edit-btn"
                  >
                    <Pencil size={12} />
                    <span>Edit Profile Form</span>
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: "FULL NAME",
                        val: profile.fullName,
                        icon: <User size={15} className="text-[#1677ff]" />,
                      },
                      {
                        label: "USERNAME",
                        val: profile.username,
                        icon: <Users size={15} className="text-[#1677ff]" />,
                      },
                      {
                        label: "EMAIL ADDRESS",
                        val: profile.email,
                        icon: <Mail size={15} className="text-[#1677ff]" />,
                      },
                      {
                        label: "PHONE NUMBER",
                        val: profile.phone || "Not added",
                        icon: <Phone size={15} className="text-[#059669]" />,
                      },
                      {
                        label: "LOCATION / JURISDICTION",
                        val: profile.location,
                        icon: <MapPin size={15} className="text-[#d97706]" />,
                      },
                      {
                        label: "INSTITUTION / ORGANIZATION",
                        val: profile.institution || "Not added",
                        icon: (
                          <Building2 size={15} className="text-[#7c3aed]" />
                        ),
                      },
                      {
                        label: "DEPARTMENT",
                        val: profile.department,
                        icon: <BookOpen size={15} className="text-[#1677ff]" />,
                      },
                      {
                        label: "ACCOUNT CREATED",
                        val: accountCreatedAtFormatted,
                        icon: <Clock size={15} className="text-[#52627A]" />,
                      },
                    ].map((item, idx) => {
                      const isNotAdded = item.val === "Not added";
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-[#52627A] dark:text-slate-400 text-xs font-bold mb-1.5">
                            {item.icon}
                            <span className="tracking-wider text-[11px] uppercase">
                              {item.label}
                            </span>
                          </div>
                          <div
                            className={`text-[14.5px] font-bold ${
                              isNotAdded
                                ? "text-[#64748b] italic font-normal"
                                : "text-[#0F1F3D] dark:text-white"
                            }`}
                          >
                            {item.val}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#52627A] dark:text-slate-400 text-xs font-bold mb-2">
                      <BookOpen size={15} className="text-[#1677ff]" />
                      <span className="tracking-wider text-[11px] uppercase">
                        BIOGRAPHY
                      </span>
                    </div>
                    <p className="text-[13.5px] text-[#14213D] dark:text-slate-200 leading-relaxed font-normal">
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB C: PREFERENCES (Fixed Contrast)                   */}
          {/* ═════════════════════════════════════════════════════ */}
          {activeTab === "preferences" && (
            <motion.div
              key="preferences-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="kwi-box-card divide-y divide-slate-100 dark:divide-slate-800">
                <div className="kwi-box-header">
                  <h3 className="kwi-box-title">Preferences</h3>
                </div>

                {/* Theme Selector */}
                <div className="p-6">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#0F1F3D] dark:text-white mb-3 flex items-center gap-2">
                    <Palette size={15} className="text-[#1677ff]" />
                    Appearance Theme
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        id: "light",
                        label: "Light Mode",
                        icon: <Sun size={15} />,
                      },
                      {
                        id: "dark",
                        label: "Dark Mode",
                        icon: <Moon size={15} />,
                      },
                      {
                        id: "system",
                        label: "System Sync",
                        icon: <Monitor size={15} />,
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTheme(opt.id);
                          setPreferences((p) => ({ ...p, theme: opt.id }));
                          audioEngine?.playUiChirp(
                            opt.id === "dark" ? 720 : 960,
                          );
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                          theme === opt.id
                            ? "bg-blue-50 border-[#1677ff] text-[#1677ff] font-bold"
                            : "bg-white dark:bg-slate-800 border-slate-300 text-[#14213D] dark:text-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications Preferences */}
                <div className="p-6 space-y-4">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#0F1F3D] dark:text-white mb-3 flex items-center gap-2">
                    <Bell size={15} className="text-[#1677ff]" />
                    TELEMETRY NOTIFICATIONS
                  </h4>

                  {[
                    {
                      key: "alertNotifications",
                      title: "Real-time Flood & Drainage Alerts",
                      desc: "Instant warnings for locations when monitored water levels cross danger thresholds.",
                    },
                    {
                      key: "emailNotifications",
                      title: "Weekly Intelligence Digest",
                      desc: "Summary report of drainage activity, pump status, and community reports.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 shadow-2xs"
                    >
                      <div>
                        <div className="text-[13.5px] font-bold text-[#0F1F3D] dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-[12.5px] text-[#52627A] dark:text-slate-300 mt-1 leading-relaxed font-normal">
                          {item.desc}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-[#1677ff] rounded cursor-pointer shrink-0 accent-[#1677ff]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB D: SECURITY (Fixed Contrast)                      */}
          {/* ═════════════════════════════════════════════════════ */}
          {activeTab === "security" && (
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {securitySuccess && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-700 shrink-0"
                  />
                  <span>Security credentials updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Change Password Form */}
                <div className="kwi-box-card p-6">
                  <div className="flex items-center gap-2 text-[#0F1F3D] dark:text-white font-bold text-sm mb-4">
                    <Key size={16} className="text-[#1677ff]" />
                    <span>Update Access Password</span>
                  </div>

                  <form onSubmit={handleSecuritySave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={security.currentPassword}
                        onChange={(e) =>
                          setSecurity((s) => ({
                            ...s,
                            currentPassword: e.target.value,
                          }))
                        }
                        placeholder="Enter current password"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#0F1F3D] placeholder:text-[#64748b] border border-slate-300 bg-white focus:outline-none focus:border-[#1677ff]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={security.newPassword}
                        onChange={(e) =>
                          setSecurity((s) => ({
                            ...s,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder="Minimum 10 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#0F1F3D] placeholder:text-[#64748b] border border-slate-300 bg-white focus:outline-none focus:border-[#1677ff]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={security.confirmPassword}
                        onChange={(e) =>
                          setSecurity((s) => ({
                            ...s,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#0F1F3D] placeholder:text-[#64748b] border border-slate-300 bg-white focus:outline-none focus:border-[#1677ff]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-3 px-5 py-2.5 rounded-xl bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Two Factor Authentication & Active Sessions */}
                <div className="space-y-5">
                  <div className="kwi-box-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <div className="text-[13.5px] font-bold text-[#0F1F3D] dark:text-white">
                            Two-Factor Authentication
                          </div>
                          <div className="text-[12px] text-[#52627A] dark:text-slate-300 mt-0.5">
                            Time-based TOTP verification code
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Enabled
                      </span>
                    </div>
                  </div>

                  <div className="kwi-box-card p-5">
                    <div className="text-[13.5px] font-bold text-[#0F1F3D] dark:text-white mb-3 flex items-center gap-2">
                      <Monitor size={16} className="text-[#1677ff]" />
                      <span>Active Workstations</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="font-bold text-[#0F1F3D] dark:text-white text-[13px]">
                          Chrome · Kolkata, Sector V
                        </div>
                        <div className="text-[11.5px] text-[#52627A] dark:text-slate-300 mt-0.5">
                          Current Session · TLS 1.3
                        </div>
                      </div>
                      <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 5. EDIT PROFILE MODAL (Modal Dialog Overlay)              */}
      {/* ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-10"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closeEditModal}
                className="absolute top-5 right-5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} />
              </button>

              <div className="mb-5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase bg-cyan-50 text-cyan-800 border border-cyan-200 mb-1.5">
                  OPERATOR PROFILE
                </span>
                <h3 className="text-lg font-bold text-[#0F1F3D] dark:text-white font-['Space_Grotesk']">
                  Edit Profile Information
                </h3>
                <p className="text-xs text-[#52627A]">
                  Update your display credentials, jurisdictional ward, and
                  biography.
                </p>
              </div>

              {/* Photo Section */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 mb-5">
                <div className="w-14 h-14 rounded-full bg-[#0b3a78] flex items-center justify-center font-bold text-white text-base overflow-hidden shrink-0 shadow-sm">
                  {editDraft.profileImage ? (
                    <img
                      src={editDraft.profileImage}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#0F1F3D] dark:text-white">
                    Profile Avatar
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 text-[#14213D] dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                    >
                      Upload new
                    </button>
                    {editDraft.profileImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editDraft.fullName || ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          fullName: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#0F1F3D] border border-slate-300 focus:outline-none focus:border-[#1677ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-300 mb-1">
                      Department / Organization
                    </label>
                    <input
                      type="text"
                      value={editDraft.department || ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          department: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#0F1F3D] border border-slate-300 focus:outline-none focus:border-[#1677ff]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editDraft.email || ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, email: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#0F1F3D] border border-slate-300 focus:outline-none focus:border-[#1677ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-300 mb-1">
                      Location / Ward
                    </label>
                    <input
                      type="text"
                      value={editDraft.location || ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          location: e.target.value,
                        }))
                      }
                      placeholder="e.g. Kolkata, West Bengal"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#0F1F3D] border border-slate-300 focus:outline-none focus:border-[#1677ff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14213D] dark:text-slate-300 mb-1">
                    Bio / Responsibility
                  </label>
                  <textarea
                    rows={3}
                    value={editDraft.bio || ""}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, bio: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#0F1F3D] border border-slate-300 focus:outline-none focus:border-[#1677ff] resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-[#52627A] hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Custom SVG Helper for Layout Dashboard Icon ── */
function LayoutDashboardIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM HIGH-CONTRAST TARGET STYLESHEET
   ═══════════════════════════════════════════════════════════════ */
const KWI_TARGET_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .kwi-profile-container {
    background: #f4f7fb;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .dark .kwi-profile-container {
    background: #0A1E3B;
  }

  /* ── 1. Hero Section ── */
  .kwi-hero-section {
    position: relative;
    height: 290px;
    width: 100%;
    overflow: hidden;
  }
  .kwi-hero-bg {
    position: absolute;
    inset: 0;
    background: url('/assets/kolkata-profile-bg.jpg') center 54% / cover no-repeat;
    filter: saturate(1.08) contrast(1.04);
  }
  .kwi-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(9, 32, 64, 0.45) 0%,
      rgba(15, 23, 42, 0.25) 50%,
      rgba(244, 247, 251, 0.85) 90%,
      rgba(244, 247, 251, 1) 100%
    );
  }
  .dark .kwi-hero-overlay {
    background: linear-gradient(
      180deg,
      rgba(10, 30, 59, 0.65) 0%,
      rgba(14, 38, 72, 0.45) 50%,
      rgba(10, 30, 59, 0.9) 90%,
      rgba(10, 30, 59, 1) 100%
    );
  }

  .kwi-hero-content {
    position: relative;
    z-index: 10;
    height: 100%;
    padding-top: 36px;
    padding-bottom: 70px;
  }

  .kwi-hero-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.15;
    letter-spacing: -0.01em;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }
  @media (min-width: 768px) {
    .kwi-hero-title {
      font-size: 38px;
    }
  }
  .kwi-hero-subtitle {
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.96);
    margin-top: 8px;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .kwi-hero-quote {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 17px;
    color: #ffffff;
    line-height: 1.35;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  }
  .kwi-hero-quote-line {
    width: 68px;
    height: 1.5px;
    background: rgba(255, 255, 255, 0.7);
    margin-top: 8px;
    border-radius: 999px;
  }

  /* ── 2. Floating Profile Card (Centerpiece) ── */
  .kwi-profile-card-wrapper {
    position: relative;
    z-index: 25;
    margin-top: -82px;
  }
  .kwi-profile-card {
    display: flex;
    align-items: center;
    gap: 24px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(203, 213, 225, 0.85);
    border-radius: 20px;
    padding: 24px 28px;
    box-shadow: 0 12px 36px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
  }
  .dark .kwi-profile-card {
    background: rgba(16, 49, 62, 0.95);
    border-color: rgba(94, 183, 201, 0.16);
    box-shadow: 0 16px 40px -4px rgba(3, 15, 20, 0.65);
  }

  /* Avatar */
  .kwi-avatar-container {
    position: relative;
    shrink: 0;
  }
  .kwi-avatar-circle {
    width: 86px;
    height: 86px;
    border-radius: 50%;
    background: #0b3a78;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(11, 58, 120, 0.25);
    border: 3.5px solid #ffffff;
    overflow: hidden;
  }
  .dark .kwi-avatar-circle {
    border-color: #0A1E3B;
  }
  .kwi-avatar-initials {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.02em;
  }
  .kwi-avatar-status {
    position: absolute;
    top: 2px;
    right: 3px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #16a34a;
    border: 2.5px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .dark .kwi-avatar-status {
    border-color: #0A1E3B;
  }
  .kwi-avatar-cambadge {
    position: absolute;
    bottom: 0px;
    right: 0px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ffffff;
    border: 1.5px solid #94a3b8;
    color: #1677ff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.15s;
  }
  .kwi-avatar-cambadge:hover {
    transform: scale(1.1);
  }

  /* Identity Info */
  .kwi-profile-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 23px;
    font-weight: 700;
    color: #0F1F3D;
    line-height: 1.2;
    margin: 0;
  }
  .dark .kwi-profile-name {
    color: #F2FBFD;
  }
  .kwi-profile-bio {
    font-size: 12.5px;
    line-height: 1.55;
    color: #52627A;
    margin-top: 5px;
    max-width: 580px;
    font-weight: 450;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .dark .kwi-profile-bio {
    color: #CBD5E1;
  }
  .dark .kwi-profile-meta-row span {
    color: #CBD5E1 !important;
  }
  .dark .kwi-profile-meta-row svg {
    color: #38BDF8 !important;
  }

  /* Edit Button & Quote Box */
  .kwi-edit-profile-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 10px;
    background: #f0f7ff;
    border: 1px solid #91caff;
    color: #1677ff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .kwi-edit-profile-btn:hover {
    background: #e1effe;
    border-color: #69b1ff;
  }
  .dark .kwi-edit-profile-btn {
    background: rgba(0, 229, 255, 0.12);
    border-color: rgba(0, 229, 255, 0.45);
    color: #00E5FF;
  }

  .kwi-quote-panel {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: #f0f7fc;
    border: 1px solid #d0e4f7;
    border-radius: 14px;
    max-width: 195px;
  }
  .dark .kwi-quote-panel {
    background: rgba(16, 49, 62, 0.6);
    border-color: rgba(94, 183, 201, 0.16);
  }
  .kwi-quote-leaf {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: #e6f9f0;
    display: flex;
    align-items: center;
    justify-content: center;
    shrink: 0;
  }
  .kwi-quote-text {
    font-size: 11px;
    line-height: 1.45;
    color: #334155;
    font-weight: 600;
  }
  .dark .kwi-quote-text {
    color: #F2FBFD;
  }

  /* ── 3. Tabs Bar ── */
  .kwi-tab-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 18px;
    background: none;
    border: none;
    font-size: 13.5px;
    font-weight: 600;
    color: #52627A;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  .kwi-tab-button:hover {
    color: #0F1F3D;
  }
  .dark .kwi-tab-button {
    color: #B2D2D9;
  }
  .dark .kwi-tab-button:hover {
    color: #F2FBFD;
  }
  .kwi-tab-button.active {
    color: #1677ff;
    font-weight: 700;
  }
  .dark .kwi-tab-button.active {
    color: #00E5FF;
    font-weight: 700;
  }
  .kwi-tab-underline {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2.5px;
    background: #1677ff;
    border-radius: 2px;
  }
  .dark .kwi-tab-underline {
    background: #00E5FF;
  }

  /* ── 4. Summary Stat Cards ── */
  .kwi-stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #ffffff;
    border: 1px solid rgba(203, 213, 225, 0.85);
    border-radius: 16px;
    padding: 16px 18px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
    min-height: 88px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .kwi-stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  }
  .dark .kwi-stat-card {
    background: #10313E;
    border-color: rgba(94, 183, 201, 0.16);
  }
  .kwi-stat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    shrink: 0;
  }
  .kwi-stat-body {
    flex: 1;
    min-width: 0;
  }
  .kwi-stat-val-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .kwi-stat-num {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 23px;
    font-weight: 700;
    color: #0F1F3D;
    line-height: 1;
  }
  .dark .kwi-stat-num {
    color: #F2FBFD;
  }
  .kwi-badge-trend {
    font-size: 10.5px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 6px;
  }
  .kwi-badge-trend.green {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  .kwi-badge-trend.red {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }
  .kwi-stat-label {
    font-size: 12.5px;
    font-weight: 700;
    color: #14213D;
    margin-top: 3px;
  }
  .dark .kwi-stat-label {
    color: #F2FBFD;
  }
  .kwi-stat-sub {
    font-size: 11px;
    color: #596A82;
    font-weight: 500;
  }
  .dark .kwi-stat-sub {
    color: #6D949D;
  }

  /* ── 5. Three-Column Main Grid (Proportions 1 : 1.55 : 1) ── */
  .kwi-three-col-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  @media (min-width: 1024px) {
    .kwi-three-col-grid {
      grid-template-columns: 1fr 1.55fr 1fr;
    }
  }

  .kwi-box-card {
    background: #ffffff;
    border: 1px solid rgba(203, 213, 225, 0.85);
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    overflow: hidden;
  }
  .dark .kwi-box-card {
    background: #10313E;
    border-color: rgba(94, 183, 201, 0.16);
  }
  .kwi-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 14px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  }
  .dark .kwi-box-header {
    border-bottom-color: rgba(94, 183, 201, 0.16);
  }
  .kwi-box-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #0F1F3D;
    margin: 0;
  }
  .dark .kwi-box-title {
    color: #F2FBFD;
  }
  .kwi-box-edit-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 9px;
    border-radius: 8px;
    background: #f0f7ff;
    border: 1px solid #bae0ff;
    color: #1677ff;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .kwi-box-edit-btn:hover {
    background: #e1effe;
  }
  .dark .kwi-box-edit-btn {
    background: rgba(0, 229, 255, 0.12);
    border-color: rgba(0, 229, 255, 0.35);
    color: #00E5FF;
  }

  /* High-Contrast About Me & Field Styling */
  .kwi-about-text {
    font-size: 13px;
    line-height: 1.65;
    color: #52627A;
    font-weight: 450;
  }
  .dark .kwi-about-text {
    color: #B2D2D9;
  }
  .kwi-field-label-tag {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #596A82;
  }
  .dark .kwi-field-label-tag {
    color: #6D949D;
  }
  .kwi-field-val-text {
    font-size: 13.5px;
    font-weight: 600;
    color: #0F1F3D;
  }
  .dark .kwi-field-val-text {
    color: #F2FBFD;
  }

  /* Intelligence Promotional Banner */
  .kwi-intelligence-banner {
    background-color: #061820;
    border: 1px solid rgba(94, 183, 201, 0.16);
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .kwi-profile-card {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }
    .kwi-profile-actions-zone {
      align-items: flex-start;
      width: 100%;
    }
    .kwi-quote-panel {
      max-width: 100%;
      width: 100%;
    }
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .kwi-profile-card {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }
    .kwi-profile-actions-zone {
      align-items: flex-start;
      width: 100%;
    }
    .kwi-quote-panel {
      max-width: 100%;
      width: 100%;
    }
  }
`;

export default ProfileView;
