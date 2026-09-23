import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import Footer from "../Footer";
import { useKWIStore } from "../../store/useKWIStore";

export function SubpageLayout({ children }) {
  const { currentRoute } = useKWIStore();
  const isDashboardRoute =
    currentRoute === "/dashboard" || currentRoute === "/admin-dashboard";
  const isProfileRoute =
    currentRoute === "/profile" || currentRoute === "/my-profile";
  const isReportsRoute =
    currentRoute === "/reports" ||
    currentRoute === "/report" ||
    currentRoute === "/my-reports";
  const isSimulateRoute = currentRoute === "/simulate";
  const isRespondRoute =
    currentRoute === "/action-center" || currentRoute === "/respond";
  const isNotificationsRoute =
    currentRoute === "/notifications" || currentRoute === "/alerts";
  const isFullWidth =
    isProfileRoute || isReportsRoute || isSimulateRoute || isDashboardRoute;

  return (
    <div
      className={`relative w-full min-h-screen text-slate-900 dark:text-[#F2FBFD] flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden ${
        isDashboardRoute
          ? "bg-[#f3f7fb] dark:bg-[#070c14]"
          : isProfileRoute
            ? "bg-[#eef2f6] dark:bg-[#0A1E3B]"
            : isReportsRoute
              ? "bg-[#f4f7fb] dark:bg-[#0A1E3B]"
              : isSimulateRoute
                ? "bg-[#f3f7fb] dark:bg-[#070c14]"
                : isRespondRoute
                  ? "bg-[#edf4fa] dark:bg-[#0A1E3B]"
                  : isNotificationsRoute
                    ? "bg-[#f4f7fb] dark:bg-[#070c14]"
                    : "bg-white dark:bg-[#0A1E3B]"
      }`}
    >
      {/* Ambient Top Radiant Glow & Micro-Grid for standard Subpages — hidden for simulate & respond */}
      {!isFullWidth && !isRespondRoute && !isDashboardRoute && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),rgba(59,130,246,0.06),transparent_70%)] pointer-events-none -z-10" />
          <div className="absolute top-0 inset-x-0 h-[380px] bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />
        </>
      )}

      <KWINavbar />
      <AskKolkataDrawer />

      <main
        className={`flex-1 w-full mx-auto ${
          isFullWidth
            ? "max-w-full px-0 py-0"
            : isRespondRoute || isDashboardRoute
              ? "max-w-[1400px] pt-4 pb-16 px-3 sm:px-6 lg:px-8"
              : "max-w-[1280px] pt-8 pb-16 px-4 sm:px-6 lg:px-8"
        }`}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default SubpageLayout;
