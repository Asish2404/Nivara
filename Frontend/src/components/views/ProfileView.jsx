import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Bell, LogOut, Camera, MapPin, CheckCircle2, Key,
  ShieldCheck, AlertTriangle, Activity, Clock, TrendingUp,
  Smartphone, Pencil, Mail, Phone, Building2, BookOpen, FileText,
  ChevronRight, Eye, EyeOff, Palette, Sun, Moon, Monitor,
  MessageSquare, Globe, BarChart3, Leaf, ArrowRight, Settings,
  Zap, RefreshCw, Image as ImageIcon, Shield, Users,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

/* ═══════════════════════════════════════════════════════════════
   PROFILE VIEW — Premium Intelligence Platform
   ═══════════════════════════════════════════════════════════════ */

export function ProfileView() {
  const { currentUser, updateUserProfile, logoutUser, navigate, unreadNotificationsCount = 0, theme, setTheme } = useKWIStore();
  const fileInputRef = useRef(null);

  /* ── User Data Model ── */
  const [profile, setProfile] = useState({
    fullName: currentUser?.name || "ASISHBOSE313",
    username: currentUser?.username || "asishbose313",
    email: currentUser?.email || "asishbose313@gmail.com",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "Kolkata, West Bengal",
    institution: currentUser?.institution || "",
    department: currentUser?.department || "Kolkata Water Intelligence",
    bio: currentUser?.bio || "Computer Science student with a strong interest in technology, data-driven solutions, and building impactful applications. Currently contributing to the Kolkata Water Intelligence platform to help create a safer and smarter city.",
    profileImage: currentUser?.avatarUrl || null,
    createdAt: currentUser?.createdAt || "2026-08-15",
  });

  const [stats] = useState({
    reportsSubmitted: currentUser?.reportsSubmitted ?? 0,
    alertsReceived: currentUser?.alertsReceived ?? 0,
    daysActive: currentUser?.daysActive ?? (() => {
      const created = new Date(currentUser?.createdAt || "2026-08-15");
      const now = new Date();
      return Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
    })(),
  });

  /* ── UI State ── */
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  /* ── Preferences State ── */
  const [preferences, setPreferences] = useState({
    theme: "light",
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

  /* ── Computed ── */
  const userInitial = (profile.fullName || "A").replace(/[^a-zA-Z0-9]/g, " ").trim().charAt(0).toUpperCase() || "A";
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  /* ── Handlers ── */
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
    if (file.size > 4 * 1024 * 1024) return;
    setImageUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(p => ({ ...p, profileImage: reader.result }));
      setImageUploading(false);
      audioEngine?.playUiChirp(1020);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setProfile(p => ({ ...p, profileImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    audioEngine?.playUiChirp(780);
  }, []);

  const startEditing = useCallback(() => {
    setEditDraft({ ...profile });
    setIsEditing(true);
    audioEngine?.playUiChirp(900);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditDraft({});
    audioEngine?.playUiChirp(750);
  }, []);

  const saveProfile = useCallback(() => {
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
      setIsEditing(false);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  }, [editDraft, updateUserProfile]);

  const handleSecuritySave = useCallback((e) => {
    e.preventDefault();
    if (!security.currentPassword || !security.newPassword) return;
    if (security.newPassword !== security.confirmPassword) return;
    audioEngine?.playStationLock();
    setSecuritySuccess(true);
    setSecurity(s => ({ ...s, currentPassword: "", newPassword: "", confirmPassword: "" }));
    setTimeout(() => setSecuritySuccess(false), 3000);
  }, [security]);

  const handleSignOut = useCallback(() => {
    audioEngine?.playStationLock();
    logoutUser();
    navigate("/login");
  }, [logoutUser, navigate]);

  const tabs = [
    { id: "overview", label: "Overview", icon: <User size={15} /> },
    { id: "personal", label: "Personal Details", icon: <Pencil size={15} /> },
    { id: "preferences", label: "Preferences", icon: <Settings size={15} /> },
    { id: "security", label: "Security", icon: <Shield size={15} /> },
  ];

  return (
    <div className="w-full min-h-screen pv-root" style={{ background: "var(--pv-bg, #F5F8FC)" }}>
      <style>{PROFILE_CSS}</style>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: "none" }} />

      {/* ══════ COVER SECTION ══════ */}
      <div className="pv-cover">
        <div className="pv-cover-img" />
        <div className="pv-cover-overlay" />
        <div className="pv-cover-scanline" />
      </div>

      {/* ══════ IDENTITY CARD (overlapping cover) ══════ */}
      <div className="pv-identity-wrapper">
        <div className="pv-identity-card">
          <div className="pv-identity-left">
            {/* Profile Photo */}
            <div className="pv-photo-ring">
              <div className="pv-photo-inner">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.fullName} className="pv-photo-img" />
                ) : (
                  <span className="pv-photo-initial">{userInitial}</span>
                )}
              </div>
              <span className="pv-photo-status" title="Online" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="pv-photo-cam"
                title="Change photo"
                disabled={imageUploading}
              >
                {imageUploading ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
            </div>

            {/* User Info */}
            <div className="pv-identity-info">
              <h1 className="pv-identity-name">{profile.fullName}</h1>
              <p className="pv-identity-dept">{profile.department}</p>
              <p className="pv-identity-bio">{profile.bio}</p>
              <div className="pv-identity-meta">
                <span className="pv-meta-item">
                  <MapPin size={12} />{profile.location || "Not set"}
                </span>
                <span className="pv-meta-item">
                  <Clock size={12} />Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="pv-identity-right">
            <button type="button" onClick={startEditing} className="pv-edit-btn">
              <Pencil size={14} />
              Edit Profile
            </button>
            {profile.profileImage && (
              <button type="button" onClick={handleRemoveImage} className="pv-remove-photo-link">
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════ TAB NAVIGATION ══════ */}
      <div className="pv-tabs-bar">
        <div className="pv-tabs-inner">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTab(t.id); audioEngine?.playUiChirp(820); }}
              className={`pv-tab-btn ${activeTab === t.id ? "active" : ""}`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
          <button type="button" onClick={handleSignOut} className="pv-tab-signout">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* ══════ CONTENT AREA ══════ */}
      <div className="pv-content">
        <AnimatePresence mode="wait">
          {saveSuccess && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="pv-toast-success">
              <CheckCircle2 size={16} />Profile updated successfully
            </motion.div>
          )}

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="pv-grid">
                {/* LEFT COLUMN */}
                <div className="pv-col-left">
                  {/* About Me Card */}
                  <div className="pv-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title">About Me</h3>
                      <button type="button" onClick={startEditing} className="pv-card-edit"><Pencil size={13} />Edit</button>
                    </div>
                    <p className="pv-about-text">{profile.bio}</p>
                    <div className="pv-info-rows">
                      <div className="pv-info-row">
                        <div className="pv-info-icon" style={{ background: "#EBF5FF", color: "#1677FF" }}><Mail size={15} /></div>
                        <div><span className="pv-info-label">Email</span><span className="pv-info-value">{profile.email || "Not added"}</span></div>
                      </div>
                      <div className="pv-info-row">
                        <div className="pv-info-icon" style={{ background: "#E8FFF3", color: "#16A085" }}><Phone size={15} /></div>
                        <div><span className="pv-info-label">Phone</span><span className="pv-info-value">{profile.phone || "Not added"}</span></div>
                      </div>
                      <div className="pv-info-row">
                        <div className="pv-info-icon" style={{ background: "#FFF4E6", color: "#E07A00" }}><MapPin size={15} /></div>
                        <div><span className="pv-info-label">Location</span><span className="pv-info-value">{profile.location || "Not added"}</span></div>
                      </div>
                      <div className="pv-info-row">
                        <div className="pv-info-icon" style={{ background: "#F3EEFF", color: "#7C3AED" }}><Building2 size={15} /></div>
                        <div><span className="pv-info-label">Institution</span><span className="pv-info-value">{profile.institution || "Not added"}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Card */}
                  <div className="pv-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title">Quick Actions</h3>
                    </div>
                    <div className="pv-quick-actions">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="pv-action-item">
                        <div className="pv-action-icon" style={{ background: "linear-gradient(135deg,#EBF5FF,#DBEAFE)", color: "#1677FF" }}><Camera size={18} /></div>
                        <div className="pv-action-text">
                          <span className="pv-action-title">Change Photo</span>
                          <span className="pv-action-desc">Update your profile picture</span>
                        </div>
                        <ChevronRight size={16} className="pv-action-arrow" />
                      </button>
                      <button type="button" onClick={() => setActiveTab("security")} className="pv-action-item">
                        <div className="pv-action-icon" style={{ background: "linear-gradient(135deg,#FFF4E6,#FEF3C7)", color: "#D97706" }}><Key size={18} /></div>
                        <div className="pv-action-text">
                          <span className="pv-action-title">Update Password</span>
                          <span className="pv-action-desc">Keep your account secure</span>
                        </div>
                        <ChevronRight size={16} className="pv-action-arrow" />
                      </button>
                      <button type="button" onClick={() => setActiveTab("preferences")} className="pv-action-item">
                        <div className="pv-action-icon" style={{ background: "linear-gradient(135deg,#E8FFF3,#D1FAE5)", color: "#059669" }}><Settings size={18} /></div>
                        <div className="pv-action-text">
                          <span className="pv-action-title">Manage Preferences</span>
                          <span className="pv-action-desc">Customize your experience</span>
                        </div>
                        <ChevronRight size={16} className="pv-action-arrow" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="pv-col-right">
                  {/* My Contribution Card */}
                  <div className="pv-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title">My Contribution</h3>
                      <span className="pv-badge-live"><span className="pv-badge-dot" />Live</span>
                    </div>
                    <div className="pv-contrib-grid">
                      <div className="pv-contrib-item">
                        <div className="pv-contrib-icon" style={{ background: "#EBF5FF", color: "#1677FF" }}><FileText size={20} /></div>
                        <div className="pv-contrib-num">{stats.reportsSubmitted}</div>
                        <div className="pv-contrib-label">Reports Submitted</div>
                      </div>
                      <div className="pv-contrib-divider" />
                      <div className="pv-contrib-item">
                        <div className="pv-contrib-icon" style={{ background: "#FEF3C7", color: "#D97706" }}><Bell size={20} /></div>
                        <div className="pv-contrib-num">{stats.alertsReceived}</div>
                        <div className="pv-contrib-label">Alerts Received</div>
                      </div>
                      <div className="pv-contrib-divider" />
                      <div className="pv-contrib-item">
                        <div className="pv-contrib-icon" style={{ background: "#E8FFF3", color: "#059669" }}><TrendingUp size={20} /></div>
                        <div className="pv-contrib-num">{stats.daysActive}</div>
                        <div className="pv-contrib-label">Days Active</div>
                      </div>
                    </div>
                  </div>

                  {/* Intelligence Message Card */}
                  <div className="pv-card pv-card-featured">
                    <div className="pv-featured-bg" />
                    <div className="pv-featured-content">
                      <span className="pv-featured-tag">KWI INTELLIGENCE</span>
                      <h3 className="pv-featured-title">
                        Better Insights.<br />
                        Cleaner Water.<br />
                        Brighter Kolkata.
                      </h3>
                      <p className="pv-featured-desc">
                        Contributing to a safer, smarter, cleaner Kolkata through data-driven water intelligence.
                      </p>
                    </div>
                  </div>

                  {/* Mission Card */}
                  <div className="pv-card pv-card-mission">
                    <div className="pv-mission-content">
                      <div className="pv-mission-icon"><Leaf size={22} /></div>
                      <div>
                        <h4 className="pv-mission-title">Together for a Cleaner Tomorrow</h4>
                        <p className="pv-mission-desc">Every insight, every action, and every effort helps build a healthier and more resilient Kolkata.</p>
                      </div>
                      <ArrowRight size={18} className="pv-mission-arrow" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PERSONAL DETAILS TAB ── */}
          {activeTab === "personal" && (
            <motion.div key="personal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="pv-card pv-form-card">
                <div className="pv-card-header">
                  <h3 className="pv-card-title">Personal Details</h3>
                  {!isEditing && (
                    <button type="button" onClick={startEditing} className="pv-card-edit"><Pencil size={13} />Edit</button>
                  )}
                </div>

                <div className="pv-form-grid">
                  {[
                    { key: "fullName", label: "Full Name", icon: <User size={15} />, placeholder: "Enter your full name" },
                    { key: "username", label: "Username", icon: <Users size={15} />, placeholder: "Choose a username" },
                    { key: "email", label: "Email Address", icon: <Mail size={15} />, placeholder: "you@example.com", type: "email" },
                    { key: "phone", label: "Phone Number", icon: <Phone size={15} />, placeholder: "+91 00000 00000" },
                    { key: "location", label: "Location", icon: <MapPin size={15} />, placeholder: "City, State" },
                    { key: "institution", label: "Institution", icon: <Building2 size={15} />, placeholder: "University or Organization" },
                    { key: "department", label: "Department / Organization", icon: <BookOpen size={15} />, placeholder: "Department name" },
                  ].map(({ key, label, icon, placeholder, type }) => (
                    <div key={key} className="pv-field">
                      <label className="pv-field-label">{icon}{label}</label>
                      <input
                        className="pv-field-input"
                        type={type || "text"}
                        value={isEditing ? (editDraft[key] || "") : (profile[key] || "")}
                        onChange={(e) => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                        placeholder={placeholder}
                        disabled={!isEditing}
                      />
                    </div>
                  ))}
                  <div className="pv-field pv-field-full">
                    <label className="pv-field-label"><BookOpen size={15} />Bio</label>
                    <textarea
                      className="pv-field-textarea"
                      value={isEditing ? (editDraft.bio || "") : (profile.bio || "")}
                      onChange={(e) => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="pv-form-actions">
                    <button type="button" onClick={cancelEditing} className="pv-btn-cancel">Cancel</button>
                    <button type="button" onClick={saveProfile} className="pv-btn-save" disabled={isSaving}>
                      {isSaving ? <><RefreshCw size={14} className="animate-spin" />Saving...</> : <><CheckCircle2 size={14} />Save Changes</>}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── PREFERENCES TAB ── */}
          {activeTab === "preferences" && (
            <motion.div key="preferences" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="pv-card pv-form-card">
                <div className="pv-card-header">
                  <h3 className="pv-card-title">Preferences</h3>
                </div>

                {/* Theme */}
                <div className="pv-pref-section">
                  <h4 className="pv-pref-heading"><Palette size={15} />Theme</h4>
                  <div className="pv-theme-options">
                    {[
                      { id: "light", label: "Light", icon: <Sun size={16} /> },
                      { id: "dark", label: "Dark", icon: <Moon size={16} /> },
                      { id: "system", label: "System", icon: <Monitor size={16} /> },
                    ].map(t => (
                      <button key={t.id} type="button" onClick={() => { setTheme(t.id); audioEngine?.playUiChirp(t.id === "dark" ? 740 : 960); }} className={`pv-theme-btn ${theme === t.id ? "active" : ""}`}>
                        {t.icon}{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="pv-pref-section">
                  <h4 className="pv-pref-heading"><Bell size={15} />Notification Preferences</h4>
                  {[
                    { key: "alertNotifications", label: "Alert Notifications", desc: "Receive real-time flood, rainfall, and incident alerts", icon: <Zap size={15} /> },
                    { key: "emailNotifications", label: "Email Notifications", desc: "Weekly digest and important platform updates", icon: <Mail size={15} /> },
                  ].map(({ key, label, desc, icon }) => (
                    <div key={key} className="pv-pref-row">
                      <div className="pv-pref-info">
                        <span className="pv-pref-icon" style={{ background: "#EBF5FF", color: "#1677FF" }}>{icon}</span>
                        <div><span className="pv-pref-label">{label}</span><span className="pv-pref-desc">{desc}</span></div>
                      </div>
                      <label className="pv-toggle">
                        <input type="checkbox" checked={preferences[key]} onChange={(e) => setPreferences(p => ({ ...p, [key]: e.target.checked }))} className="sr-only peer" />
                        <div className="pv-toggle-track peer-checked:bg-[#1677FF]" />
                        <div className="pv-toggle-thumb peer-checked:translate-x-[20px] peer-checked:bg-white" />
                      </label>
                    </div>
                  ))}
                </div>

                {/* Map & Data */}
                <div className="pv-pref-section">
                  <h4 className="pv-pref-heading"><Globe size={15} />Map &amp; Data</h4>
                  <div className="pv-form-grid">
                    <div className="pv-field">
                      <label className="pv-field-label">Map Style</label>
                      <select className="pv-field-select" value={preferences.mapStyle} onChange={(e) => setPreferences(p => ({ ...p, mapStyle: e.target.value }))}>
                        <option value="satellite">Satellite</option>
                        <option value="terrain">Terrain</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    <div className="pv-field">
                      <label className="pv-field-label">Data Visualization</label>
                      <select className="pv-field-select" value={preferences.dataViz} onChange={(e) => setPreferences(p => ({ ...p, dataViz: e.target.value }))}>
                        <option value="charts">Charts &amp; Graphs</option>
                        <option value="tables">Data Tables</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    <div className="pv-field">
                      <label className="pv-field-label">Language</label>
                      <select className="pv-field-select" value={preferences.language} onChange={(e) => setPreferences(p => ({ ...p, language: e.target.value }))}>
                        <option value="en">English</option>
                        <option value="bn">বাংলা (Bengali)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <motion.div key="security" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {securitySuccess && (
                <div className="pv-toast-success"><CheckCircle2 size={16} />Security settings updated successfully</div>
              )}

              <div className="pv-grid">
                <div className="pv-col-left">
                  {/* Change Password */}
                  <div className="pv-card pv-form-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title"><Key size={15} style={{ marginRight: 8 }} />Change Password</h3>
                    </div>
                    <form onSubmit={handleSecuritySave} className="pv-sec-form">
                      <div className="pv-field">
                        <label className="pv-field-label">Current Password</label>
                        <div className="pv-field-passwrap">
                          <input
                            className="pv-field-input"
                            type={security.showCurrent ? "text" : "password"}
                            value={security.currentPassword}
                            onChange={(e) => setSecurity(s => ({ ...s, currentPassword: e.target.value }))}
                            placeholder="Enter current password"
                          />
                          <button type="button" onClick={() => setSecurity(s => ({ ...s, showCurrent: !s.showCurrent }))} className="pv-pass-toggle">
                            {security.showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <div className="pv-field">
                        <label className="pv-field-label">New Password</label>
                        <div className="pv-field-passwrap">
                          <input
                            className="pv-field-input"
                            type={security.showNew ? "text" : "password"}
                            value={security.newPassword}
                            onChange={(e) => setSecurity(s => ({ ...s, newPassword: e.target.value }))}
                            placeholder="Minimum 12 characters"
                          />
                          <button type="button" onClick={() => setSecurity(s => ({ ...s, showNew: !s.showNew }))} className="pv-pass-toggle">
                            {security.showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <div className="pv-field">
                        <label className="pv-field-label">Confirm New Password</label>
                        <input
                          className="pv-field-input"
                          type="password"
                          value={security.confirmPassword}
                          onChange={(e) => setSecurity(s => ({ ...s, confirmPassword: e.target.value }))}
                          placeholder="Re-enter new password"
                        />
                      </div>
                      <div className="pv-form-actions">
                        <button type="submit" className="pv-btn-save"><CheckCircle2 size={14} />Update Password</button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="pv-col-right">
                  {/* Two-Factor Auth */}
                  <div className="pv-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title"><ShieldCheck size={15} style={{ marginRight: 8 }} />Two-Factor Authentication</h3>
                    </div>
                    <div className="pv-pref-row">
                      <div className="pv-pref-info">
                        <span className="pv-pref-icon" style={{ background: "#E8FFF3", color: "#059669" }}><Smartphone size={15} /></span>
                        <div><span className="pv-pref-label">Authenticator App (TOTP)</span><span className="pv-pref-desc">Time-based codes via Google Authenticator</span></div>
                      </div>
                      <label className="pv-toggle">
                        <input type="checkbox" checked={security.mfaEnabled} onChange={(e) => setSecurity(s => ({ ...s, mfaEnabled: e.target.checked }))} className="sr-only peer" />
                        <div className="pv-toggle-track peer-checked:bg-[#1677FF]" />
                        <div className="pv-toggle-thumb peer-checked:translate-x-[20px] peer-checked:bg-white" />
                      </label>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="pv-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title"><Monitor size={15} style={{ marginRight: 8 }} />Active Sessions</h3>
                    </div>
                    <div className="pv-session-item">
                      <div className="pv-session-dot" />
                      <div className="pv-session-info">
                        <span className="pv-session-device">Chrome · Kolkata, West Bengal</span>
                        <span className="pv-session-detail">Current session · Secure TLS 1.3</span>
                      </div>
                      <span className="pv-session-active">Active</span>
                    </div>
                  </div>

                  {/* Login Activity */}
                  <div className="pv-card">
                    <div className="pv-card-header">
                      <h3 className="pv-card-title"><Clock size={15} style={{ marginRight: 8 }} />Login Activity</h3>
                    </div>
                    <div className="pv-session-item">
                      <div className="pv-session-icon"><Clock size={14} /></div>
                      <div className="pv-session-info">
                        <span className="pv-session-device">Last login</span>
                        <span className="pv-session-detail">Today · Kolkata, WB</span>
                      </div>
                    </div>
                    <div className="pv-session-item">
                      <div className="pv-session-icon"><Smartphone size={14} /></div>
                      <div className="pv-session-info">
                        <span className="pv-session-device">SMS Backup</span>
                        <span className="pv-session-detail">+91 983●● ●●590 · Fallback channel</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES — Premium Light Glassmorphism Theme
   ═══════════════════════════════════════════════════════════════ */
const PROFILE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  /* ── Cover ── */
  .pv-cover{position:relative;height:340px;overflow:hidden;border-radius:0 0 24px 24px;}
  .pv-cover-img{
    position:absolute;inset:0;
    background:url('/assets/kolkata-profile-bg.jpg') center 62%/cover no-repeat;
    filter:saturate(1.12) contrast(1.03);
    image-rendering:-webkit-optimize-contrast; image-rendering:crisp-edges;
    transform:scale(1.02) translateZ(0);
    backface-visibility:hidden; -webkit-backface-visibility:hidden;
    transform-origin:50% 50%;
    transition:transform 6s ease;
  }
  .pv-cover:hover .pv-cover-img{transform:scale(1.05) translateZ(0);}
  .pv-cover-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,79,163,0.08) 0%,rgba(22,119,255,0.04) 45%,rgba(245,248,252,0.55) 82%,rgba(245,248,252,1) 100%);}
  .pv-cover-scanline{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 3px);pointer-events:none;}

  /* ── Identity Card ── */
  .pv-identity-wrapper{max-width:1120px;margin:-72px auto 0;padding:0 24px;position:relative;z-index:20;}
  .pv-identity-card{
    display:flex;align-items:flex-end;justify-content:space-between;gap:24px;
    background:rgba(255,255,255,0.78);backdrop-filter:blur(24px) saturate(180%);
    border:1px solid rgba(255,255,255,0.65);border-radius:20px;
    padding:28px 32px 24px;
    box-shadow:0 8px 40px rgba(31,38,135,0.07),0 1px 3px rgba(0,0,0,0.04);
  }
  .pv-identity-left{display:flex;align-items:flex-end;gap:24px;flex:1;min-width:0;}
  .pv-identity-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;}

  .pv-photo-ring{position:relative;flex-shrink:0;}
  .pv-photo-inner{
    width:100px;height:100px;border-radius:50%;
    background:linear-gradient(135deg,#1677FF,#13B8D4);
    padding:3px;
    box-shadow:0 4px 20px rgba(22,119,255,0.22),0 0 0 4px rgba(255,255,255,0.9);
  }
  .pv-photo-inner img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;background:#f0f4f8;box-sizing:border-box;}
  .pv-photo-initial{
    width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:#fff;box-sizing:border-box;
    font-family:'Space Grotesk',sans-serif;font-size:34px;font-weight:700;
    background:linear-gradient(135deg,#1677FF,#0B4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;
  }
  .pv-photo-status{
    position:absolute;top:4px;right:2px;width:16px;height:16px;border-radius:50%;
    background:#22C55E;border:2.5px solid #fff;z-index:2;
    box-shadow:0 1px 4px rgba(0,0,0,0.15);
  }
  .pv-photo-cam{
    position:absolute;bottom:-2px;right:-4px;width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,#1677FF,#0B4FA3);border:2.5px solid #fff;
    display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;
    box-shadow:0 2px 10px rgba(22,119,255,0.3);transition:transform 0.15s,box-shadow 0.15s;z-index:3;
  }
  .pv-photo-cam:hover{transform:scale(1.1);box-shadow:0 4px 16px rgba(22,119,255,0.4);}

  .pv-identity-info{padding-bottom:4px;min-width:0;}
  .pv-identity-name{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#162033;line-height:1.2;margin:0;}
  .pv-identity-dept{font-size:13px;color:#1677FF;font-weight:600;margin-top:2px;}
  .pv-identity-bio{font-size:13px;color:#667085;margin-top:6px;line-height:1.5;max-width:520px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .pv-identity-meta{display:flex;gap:16px;margin-top:8px;}
  .pv-meta-item{display:flex;align-items:center;gap:5px;font-size:11.5px;color:#9CA3AF;font-weight:500;}

  .pv-edit-btn{
    display:flex;align-items:center;gap:7px;padding:10px 22px;border-radius:12px;
    background:linear-gradient(135deg,#1677FF,#0B4FA3);color:#fff;
    font-size:13px;font-weight:600;cursor:pointer;border:none;
    box-shadow:0 4px 16px rgba(22,119,255,0.25);transition:all 0.2s;
  }
  .pv-edit-btn:hover{box-shadow:0 6px 24px rgba(22,119,255,0.35);transform:translateY(-1px);}
  .pv-remove-photo-link{font-size:11.5px;color:#9CA3AF;cursor:pointer;background:none;border:none;padding:0;}
  .pv-remove-photo-link:hover{color:#EF4444;text-decoration:underline;}

  /* ── Tabs ── */
  .pv-tabs-bar{
    max-width:1120px;margin:20px auto 0;padding:0 24px;
    background:rgba(255,255,255,0.65);backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,0.6);border-radius:16px;
    box-shadow:0 2px 12px rgba(31,38,135,0.04);
  }
  .pv-tabs-inner{display:flex;align-items:center;gap:2px;overflow-x:auto;}
  .pv-tab-btn{
    display:flex;align-items:center;gap:6px;padding:14px 18px;border:none;background:none;
    font-size:13px;font-weight:500;color:#667085;cursor:pointer;white-space:nowrap;
    border-bottom:2.5px solid transparent;transition:all 0.2s;font-family:'Inter',sans-serif;
  }
  .pv-tab-btn:hover{color:#162033;background:rgba(22,119,255,0.03);}
  .pv-tab-btn.active{color:#1677FF;border-bottom-color:#1677FF;font-weight:600;}
  .pv-tab-signout{
    margin-left:auto;display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:10px;
    background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);color:#DC2626;
    font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;white-space:nowrap;
  }
  .pv-tab-signout:hover{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);}

  /* ── Content ── */
  .pv-content{max-width:1120px;margin:20px auto;padding:0 24px 60px;}
  .pv-toast-success{
    display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:12px;
    background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;font-size:13px;font-weight:500;
    margin-bottom:20px;box-shadow:0 2px 8px rgba(22,163,74,0.06);
  }

  /* ── Grid Layout ── */
  .pv-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  @media(max-width:768px){.pv-grid{grid-template-columns:1fr;}}
  .pv-col-left,.pv-col-right{display:flex;flex-direction:column;gap:20px;}

  /* ── Cards ── */
  .pv-card{
    background:rgba(255,255,255,0.72);backdrop-filter:blur(20px) saturate(180%);
    border:1px solid rgba(255,255,255,0.6);border-radius:18px;
    box-shadow:0 8px 32px rgba(31,38,135,0.06),0 1px 3px rgba(0,0,0,0.03);
    overflow:hidden;transition:box-shadow 0.25s,transform 0.25s;
  }
  .pv-card:hover{box-shadow:0 12px 40px rgba(31,38,135,0.1);transform:translateY(-1px);}
  .pv-card-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid rgba(0,0,0,0.04);}
  .pv-card-title{font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#162033;margin:0;display:flex;align-items:center;}
  .pv-card-edit{
    display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;
    background:rgba(22,119,255,0.06);border:1px solid rgba(22,119,255,0.12);color:#1677FF;
    font-size:11.5px;font-weight:600;cursor:pointer;transition:all 0.15s;
  }
  .pv-card-edit:hover{background:rgba(22,119,255,0.1);}

  /* ── About ── */
  .pv-about-text{padding:16px 24px;font-size:13.5px;line-height:1.65;color:#4B5563;}
  .pv-info-rows{padding:0 24px 20px;display:flex;flex-direction:column;gap:0;}
  .pv-info-row{
    display:flex;align-items:center;gap:14px;padding:14px 0;
    border-bottom:1px solid rgba(0,0,0,0.04);
  }
  .pv-info-row:last-child{border-bottom:none;}
  .pv-info-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .pv-info-label{display:block;font-size:11px;color:#9CA3AF;font-weight:500;text-transform:uppercase;letter-spacing:0.04em;font-family:'Inter',sans-serif;}
  .pv-info-value{display:block;font-size:13.5px;color:#162033;font-weight:500;margin-top:1px;}

  /* ── Quick Actions ── */
  .pv-quick-actions{padding:8px 12px 12px;display:flex;flex-direction:column;gap:2px;}
  .pv-action-item{
    display:flex;align-items:center;gap:14px;padding:14px 12px;border-radius:12px;
    background:none;border:none;cursor:pointer;transition:all 0.15s;width:100%;text-align:left;
  }
  .pv-action-item:hover{background:rgba(22,119,255,0.03);}
  .pv-action-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .pv-action-text{flex:1;min-width:0;}
  .pv-action-title{display:block;font-size:13.5px;font-weight:600;color:#162033;}
  .pv-action-desc{display:block;font-size:11.5px;color:#9CA3AF;margin-top:1px;}
  .pv-action-arrow{color:#D1D5DB;flex-shrink:0;transition:transform 0.15s;}
  .pv-action-item:hover .pv-action-arrow{transform:translateX(3px);color:#1677FF;}

  /* ── Contribution Stats ── */
  .pv-badge-live{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:#F0FDF4;border:1px solid #BBF7D0;font-size:10px;font-weight:600;color:#15803D;text-transform:uppercase;letter-spacing:0.06em;}
  .pv-badge-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:pulse-dot 1.6s ease-in-out infinite;}
  @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}
  .pv-contrib-grid{display:flex;align-items:center;padding:24px;gap:0;}
  .pv-contrib-item{flex:1;text-align:center;padding:0 12px;}
  .pv-contrib-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;}
  .pv-contrib-num{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;color:#162033;line-height:1;}
  .pv-contrib-label{font-size:11px;color:#9CA3AF;font-weight:500;margin-top:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .pv-contrib-divider{width:1px;height:48px;background:rgba(0,0,0,0.06);flex-shrink:0;}

  /* ── Featured Message Card ── */
  .pv-card-featured{position:relative;overflow:hidden;min-height:180px;}
  .pv-featured-bg{
    position:absolute;inset:0;
    background:linear-gradient(135deg,#0B4FA3 0%,#1677FF 50%,#13B8D4 100%);
  }
  .pv-featured-bg::before{
    content:'';position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .pv-featured-content{position:relative;z-index:2;padding:28px 28px;color:#fff;}
  .pv-featured-tag{
    display:inline-block;padding:4px 10px;border-radius:6px;
    background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);
    font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:14px;
  }
  .pv-featured-title{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;line-height:1.35;margin:0;}
  .pv-featured-desc{font-size:13px;color:rgba(255,255,255,0.8);margin-top:10px;line-height:1.5;}

  /* ── Mission Card ── */
  .pv-card-mission{padding:0;overflow:hidden;}
  .pv-mission-content{
    display:flex;align-items:center;gap:16px;padding:22px 24px;
    background:linear-gradient(135deg,rgba(232,255,243,0.6),rgba(219,234,254,0.4));
    border:1px solid rgba(22,163,133,0.1);
  }
  .pv-mission-icon{
    width:44px;height:44px;border-radius:12px;
    background:linear-gradient(135deg,#D1FAE5,#A7F3D0);
    display:flex;align-items:center;justify-content:center;color:#059669;flex-shrink:0;
  }
  .pv-mission-title{font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#162033;margin:0;}
  .pv-mission-desc{font-size:12px;color:#667085;margin-top:3px;line-height:1.5;}
  .pv-mission-arrow{color:#9CA3AF;flex-shrink:0;margin-left:auto;}

  /* ── Forms ── */
  .pv-form-card{padding-bottom:8px;}
  .pv-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px 24px;}
  @media(max-width:640px){.pv-form-grid{grid-template-columns:1fr;}}
  .pv-field-full{grid-column:1 / -1;}
  .pv-field{display:flex;flex-direction:column;gap:6px;}
  .pv-field-label{
    display:flex;align-items:center;gap:6px;
    font-size:11px;font-weight:600;color:#667085;text-transform:uppercase;letter-spacing:0.04em;
    font-family:'Inter',sans-serif;
  }
  .pv-field-input,.pv-field-select{
    width:100%;padding:10px 14px;border-radius:10px;
    background:#F9FAFB;border:1px solid #E5E7EB;
    color:#162033;font-size:13.5px;font-family:'Inter',sans-serif;
    outline:none;transition:all 0.2s;
  }
  .pv-field-input:focus,.pv-field-select:focus{border-color:#1677FF;box-shadow:0 0 0 3px rgba(22,119,255,0.08);background:#fff;}
  .pv-field-input:disabled{background:#F3F4F6;color:#9CA3AF;cursor:default;}
  .pv-field-textarea{
    width:100%;padding:12px 14px;border-radius:10px;
    background:#F9FAFB;border:1px solid #E5E7EB;
    color:#162033;font-size:13.5px;font-family:'Inter',sans-serif;
    outline:none;resize:vertical;min-height:80px;transition:all 0.2s;line-height:1.6;
  }
  .pv-field-textarea:focus{border-color:#1677FF;box-shadow:0 0 0 3px rgba(22,119,255,0.08);background:#fff;}
  .pv-field-textarea:disabled{background:#F3F4F6;color:#9CA3AF;cursor:default;}
  .pv-field-passwrap{position:relative;}
  .pv-pass-toggle{
    position:absolute;right:10px;top:50%;transform:translateY(-50%);
    background:none;border:none;color:#9CA3AF;cursor:pointer;padding:4px;
  }
  .pv-pass-toggle:hover{color:#667085;}
  .pv-form-actions{display:flex;justify-content:flex-end;gap:10px;padding:12px 24px 20px;border-top:1px solid rgba(0,0,0,0.04);margin-top:4px;}
  .pv-btn-cancel{
    padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;
    background:#fff;border:1px solid #E5E7EB;color:#667085;cursor:pointer;transition:all 0.15s;
  }
  .pv-btn-cancel:hover{background:#F9FAFB;border-color:#D1D5DB;}
  .pv-btn-save{
    display:flex;align-items:center;gap:6px;padding:10px 22px;border-radius:10px;
    font-size:13px;font-weight:700;background:linear-gradient(135deg,#1677FF,#0B4FA3);
    border:none;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(22,119,255,0.2);transition:all 0.2s;
  }
  .pv-btn-save:hover{box-shadow:0 6px 20px rgba(22,119,255,0.3);transform:translateY(-1px);}
  .pv-btn-save:disabled{opacity:0.6;cursor:not-allowed;transform:none;}

  /* ── Preferences ── */
  .pv-pref-section{padding:20px 24px;border-bottom:1px solid rgba(0,0,0,0.04);}
  .pv-pref-section:last-child{border-bottom:none;}
  .pv-pref-heading{
    display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#162033;
    margin-bottom:14px;font-family:'Space Grotesk',sans-serif;
  }
  .pv-theme-options{display:flex;gap:10px;}
  .pv-theme-btn{
    display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:10px;
    background:#F9FAFB;border:1.5px solid #E5E7EB;color:#667085;
    font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;
  }
  .pv-theme-btn:hover{border-color:#D1D5DB;background:#fff;}
  .pv-theme-btn.active{border-color:#1677FF;background:#EBF5FF;color:#1677FF;font-weight:600;}
  .pv-pref-row{
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.03);
  }
  .pv-pref-row:last-child{border-bottom:none;}
  .pv-pref-info{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}
  .pv-pref-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .pv-pref-label{display:block;font-size:13px;font-weight:600;color:#162033;}
  .pv-pref-desc{display:block;font-size:11.5px;color:#9CA3AF;margin-top:1px;}

  .pv-toggle{position:relative;width:44px;height:24px;flex-shrink:0;cursor:pointer;}
  .pv-toggle-track{
    position:absolute;inset:0;border-radius:999px;background:#D1D5DB;
    transition:background 0.2s;
  }
  .pv-toggle-thumb{
    position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;
    background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.15);
    transition:transform 0.2s,background 0.2s;pointer-events:none;
  }

  /* ── Security ── */
  .pv-sec-form{padding:20px 24px;display:flex;flex-direction:column;gap:16px;}
  .pv-session-item{
    display:flex;align-items:center;gap:12px;padding:14px 24px;
    border-bottom:1px solid rgba(0,0,0,0.04);
  }
  .pv-session-item:last-child{border-bottom:none;}
  .pv-session-dot{width:8px;height:8px;border-radius:50%;background:#22C55E;flex-shrink:0;}
  .pv-session-icon{width:32px;height:32px;border-radius:8px;background:#F3F4F6;display:flex;align-items:center;justify-content:center;color:#667085;flex-shrink:0;}
  .pv-session-info{flex:1;min-width:0;}
  .pv-session-device{display:block;font-size:13px;font-weight:600;color:#162033;}
  .pv-session-detail{display:block;font-size:11.5px;color:#9CA3AF;margin-top:1px;font-family:'Inter',sans-serif;}
  .pv-session-active{
    padding:4px 10px;border-radius:999px;background:#F0FDF4;border:1px solid #BBF7D0;
    font-size:10px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;
  }

  /* ── Responsive ── */
  @media(max-width:640px){
    .pv-cover{height:200px;border-radius:0 0 16px 16px;}
    .pv-identity-wrapper{margin:-48px 16px 0;padding:0;}
    .pv-identity-card{flex-direction:column;align-items:flex-start;padding:20px;gap:16px;}
    .pv-identity-left{flex-direction:column;align-items:center;text-align:center;}
    .pv-identity-meta{justify-content:center;}
    .pv-identity-info{display:flex;flex-direction:column;align-items:center;}
    .pv-identity-bio{text-align:center;}
    .pv-identity-right{width:100%;}
    .pv-edit-btn{width:100%;justify-content:center;}
    .pv-tabs-bar{margin:16px 16px 0;padding:0 8px;}
    .pv-tabs-inner{gap:0;}
    .pv-tab-btn{padding:12px 10px;font-size:11.5px;}
    .pv-tab-btn span{display:none;}
    .pv-content{padding:16px 16px 40px;}
    .pv-contrib-grid{flex-direction:column;gap:16px;}
    .pv-contrib-divider{width:100%;height:1px;}
  }

  /* ═══════════════════════════════════════════════════════════
     DARK MODE — overrides the light glassmorphism theme  (.dark on <html>)
     ═══════════════════════════════════════════════════════════ */
  .pv-root{--pv-bg:#F5F8FC;}
  .dark .pv-root{--pv-bg:#0b1220;}

  /* Cover */
  .dark .pv-cover-overlay{background:linear-gradient(180deg,rgba(11,79,163,0.10) 0%,rgba(22,119,255,0.04) 40%,rgba(11,18,32,0.55) 80%,rgba(11,18,32,1) 100%);}

  /* Identity card + photo */
  .dark .pv-identity-card{
    background:rgba(15,23,42,0.78);border-color:rgba(51,65,85,0.5);
    box-shadow:0 8px 40px rgba(0,0,0,0.35);
  }
  .dark .pv-identity-name{color:#F1F5F9;}
  .dark .pv-identity-bio{color:#94A3B8;}
  .dark .pv-remove-photo-link{color:#64748B;}
  .dark .pv-photo-inner img{background:#16213A;}

  /* Tabs */
  .dark .pv-tabs-bar{
    background:rgba(15,23,42,0.7);border-color:rgba(51,65,85,0.5);
    box-shadow:0 2px 12px rgba(0,0,0,0.3);
  }
  .dark .pv-tab-btn{color:#94A3B8;}
  .dark .pv-tab-btn:hover{color:#F1F5F9;background:rgba(22,119,255,0.06);}

  /* Cards */
  .dark .pv-card{
    background:rgba(15,23,42,0.66);border-color:rgba(51,65,85,0.5);
    box-shadow:0 8px 32px rgba(0,0,0,0.25);
  }
  .dark .pv-card:hover{box-shadow:0 12px 40px rgba(0,0,0,0.4);}
  .dark .pv-card-header{border-bottom-color:rgba(148,163,184,0.12);}
  .dark .pv-card-title{color:#F1F5F9;}
  .dark .pv-about-text{color:#C7D0DE;}

  /* Info rows */
  .dark .pv-info-row{border-bottom-color:rgba(148,163,184,0.12);}
  .dark .pv-info-label{color:#64748B;}
  .dark .pv-info-value{color:#E2E8F0;}

  /* Quick actions */
  .dark .pv-action-item:hover{background:rgba(255,255,255,0.03);}
  .dark .pv-action-title{color:#E2E8F0;}
  .dark .pv-action-desc{color:#64748B;}

  /* Contribution */
  .dark .pv-contrib-num{color:#F1F5F9;}
  .dark .pv-contrib-label{color:#64748B;}
  .dark .pv-contrib-divider{background:rgba(148,163,184,0.14);}

  /* Mission card */
  .dark .pv-mission-content{background:linear-gradient(135deg,rgba(16,32,20,0.5),rgba(20,30,50,0.4));border-color:rgba(22,163,133,0.16);}
  .dark .pv-mission-title{color:#E2E8F0;}
  .dark .pv-mission-desc{color:#94A3B8;}
  .dark .pv-mission-arrow{color:#64748B;}

  /* Forms */
  .dark .pv-field-label{color:#94A3B8;}
  .dark .pv-field-input,.dark .pv-field-select,.dark .pv-field-textarea{
    background:#0F172A;border-color:#1E293B;color:#E2E8F0;
  }
  .dark .pv-field-input:focus,.dark .pv-field-select:focus,.dark .pv-field-textarea:focus{
    background:#16213A;border-color:#1677FF;
  }
  .dark .pv-field-input:disabled,.dark .pv-field-textarea:disabled,.dark .pv-field-select:disabled{
    background:#111A2E;color:#64748B;
  }
  .dark .pv-btn-cancel{background:#16213A;border-color:#334155;color:#C7D0DE;}
  .dark .pv-btn-cancel:hover{background:#1E293B;border-color:#475569;}

  /* Preferences */
  .dark .pv-pref-section{border-bottom-color:rgba(148,163,184,0.1);}
  .dark .pv-pref-heading{color:#F1F5F9;}
  .dark .pv-pref-row{border-bottom-color:rgba(148,163,184,0.08);}
  .dark .pv-pref-label{color:#E2E8F0;}
  .dark .pv-pref-desc{color:#64748B;}
  .dark .pv-theme-btn{background:#0F172A;border-color:#1E293B;color:#94A3B8;}
  .dark .pv-theme-btn:hover{border-color:#334155;background:#16213A;color:#E2E8F0;}
  .dark .pv-theme-btn.active{background:#0D2A52;border-color:#1677FF;color:#6FB7FF;}

  /* Security */
  .dark .pv-session-item{border-bottom-color:rgba(148,163,184,0.1);}
  .dark .pv-session-icon{background:#16213A;color:#C7D0DE;}
  .dark .pv-session-device{color:#E2E8F0;}
  .dark .pv-session-detail{color:#64748B;}

  /* Toast & small accents */
  .dark .pv-toast-success{background:rgba(34,197,94,0.12);border-color:rgba(34,197,94,0.35);color:#4ADE80;}
  .dark .pv-badge-live{background:rgba(34,197,94,0.12);border-color:rgba(34,197,94,0.35);color:#4ADE80;}
  .dark .pv-meta-item{color:#64748B;}
  .dark .pv-photo-status{box-shadow:0 0 0 3px #0b1220;}
`;

export default ProfileView;
