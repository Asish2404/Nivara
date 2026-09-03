import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useKWIStore } from "../../store/useKWIStore";

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

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Mark + Title */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              {/* Small Blue Square Product Mark */}
              <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-xs">
                K
              </div>
              <span className="text-xs font-bold tracking-[0.14em] uppercase text-slate-900 font-sans">
                KOLKATA WATER INTELLIGENCE
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1">
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
                    className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isActive
                        ? "text-blue-600 font-semibold bg-blue-50/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Ask Kolkata */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAskKolkata}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
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
