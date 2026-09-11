import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  CheckCircle2,
  Trash2,
  User,
  Building,
  Mail,
  Shield,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

export function ProfileModal({ isOpen, onClose, isDarkMode }) {
  const { currentUser, updateUserProfile } = useKWIStore();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(currentUser?.name || "");
  const [org, setOrg] = useState(currentUser?.department || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        if (audioEngine) audioEngine.playUiChirp(1020);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (audioEngine) audioEngine.playUiChirp(780);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (updateUserProfile) {
      updateUserProfile({
        name: name.trim() || "",
        department: org.trim() || "",
        email: email.trim() || "",
        phone: phone.trim() || "",
        location: location.trim() || "",
        avatarUrl: avatarPreview,
      });
    }
    setSaveSuccess(true);
    if (audioEngine) audioEngine.playStationLock();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const userInitial = (name || "Guest")
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .charAt(0)
    .toUpperCase() || "G";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Soft Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
      />

      {/* Main Glass Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border backdrop-blur-2xl z-10 font-sans ${isDarkMode
          ? "bg-[#0b1220]/95 border-slate-700/80 text-white"
          : "bg-white/95 border-slate-200/90 text-slate-900"
          }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (audioEngine) audioEngine.playUiChirp(720);
            onClose();
          }}
          className={`absolute top-5 right-5 p-2 rounded-xl border transition-colors cursor-pointer ${isDarkMode
            ? "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
            : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-[rgba(8,145,178,0.1)] text-[#0891B2] border border-[rgba(8,145,178,0.2)] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] animate-pulse" />
            <span>Operator Profile</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
            Account settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Update your identity, personal details, and operator jurisdiction.
          </p>
        </div>

        {/* Photo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 mb-6">
          <div className="relative group shrink-0">
            {/* Spinning Conic Ring */}
            <div
              className="w-18 h-18 rounded-full flex items-center justify-center relative p-[3px] shadow-[0_0_20px_-4px_rgba(8,145,178,0.4)]"
              style={{
                background: "conic-gradient(from 0deg, #22D3EE, #2563EB, #22D3EE)",
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-['Space_Grotesk'] font-bold text-xl text-[#0891B2]">
                    {userInitial}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#0891B2] shadow-md hover:scale-105 transition-transform cursor-pointer"
              title="Upload new picture"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Profile photo
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              JPG, PNG, or GIF up to 5MB.
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-xs transition-colors"
              >
                Change photo
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0891B2]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asish Bose"
                  required
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition-all ${isDarkMode
                    ? "bg-slate-900 border-slate-700 text-white focus:border-[#0891B2]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#0891B2]"
                    }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Organization
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0891B2]" />
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="NIVARA"
                  required
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition-all ${isDarkMode
                    ? "bg-slate-900 border-slate-700 text-white focus:border-[#0891B2]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#0891B2]"
                    }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0891B2]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="asishbose313@gmail.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition-all ${isDarkMode
                    ? "bg-slate-900 border-slate-700 text-white focus:border-[#0891B2]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#0891B2]"
                    }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location / Ward
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0891B2]" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Kolkata, Sector V"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition-all ${isDarkMode
                    ? "bg-slate-900 border-slate-700 text-white focus:border-[#0891B2]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#0891B2]"
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Success Message Alert */}
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated and synchronized successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isDarkMode
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#0891B2] text-white text-xs font-semibold hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(8,145,178,0.35)] cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default ProfileModal;
