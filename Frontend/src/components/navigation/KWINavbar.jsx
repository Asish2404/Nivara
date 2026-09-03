import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

const NAV_ITEMS = [
  { key: "HOME", label: "Home", path: "/" },
  { key: "LIVE_MAP", label: "Live Map", path: "/live-city" },
  { key: "REPORT", label: "Report", path: "/reports" },
  { key: "MY_REPORTS", label: "My Reports", path: "/my-reports" },
  { key: "INTELLIGENCE", label: "Intelligence", path: "/incidents" },
  { key: "PREDICT", label: "Predict", path: "/forecast" },
  { key: "SIMULATE", label: "Simulate", path: "/simulate" },
  { key: "RESPOND", label: "Respond", path: "/action-center" },
];

export function KWINavbar() {
  const { currentRoute, navigate, toggleAskKolkata } = useKWIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(false);

  useEffect(() => {
    return audioEngine.subscribe((active) => setSoundActive(active));
  }, []);

  const handleNavClick = (path) => {
    audioEngine.playUiChirp(920);
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Mark + Civic Title */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              {/* Prestigious Deep Navy Seal / Emblem */}
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-700/40 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                <span className="tracking-tighter font-serif text-sm">K</span>
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-slate-900 block font-sans">
                  KOLKATA WATER INTELLIGENCE
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-normal block">
                  Municipal Corporation & Irrigation Department
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links with Clean Linear-Style Pill */}
            <nav className="hidden xl:flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 relative">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.path === "/"
                    ? currentRoute === "/"
                    : currentRoute.startsWith(item.path);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer z-10 ${
                      isActive
                        ? "text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-pill"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200/80 -z-10"
                      />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Sound Toggle + Ask Kolkata */}
          <div className="flex items-center gap-2.5">
            {/* Ambient Sound Toggle Button */}
            <button
              type="button"
              onClick={() => {
                audioEngine.toggleMute();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs text-slate-700"
              title="Toggle ambient hydrological soundscape"
            >
              {soundActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline text-[11px] text-slate-700 font-medium">Sound Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline text-[11px] text-slate-500">Muted</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(880);
                toggleAskKolkata();
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-[0.98] border border-slate-900"
            >
              Ask Kolkata
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/"
                ? currentRoute === "/"
                : currentRoute.startsWith(item.path);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs ${
                  isActive
                    ? "text-blue-600 font-semibold bg-blue-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

export default KWINavbar;
