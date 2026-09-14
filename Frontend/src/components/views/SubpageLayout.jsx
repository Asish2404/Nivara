import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import Footer from "../Footer";
import { useKWIStore } from "../../store/useKWIStore";

export function SubpageLayout({ children }) {
  const { currentRoute } = useKWIStore();
  const isProfileRoute =
    currentRoute === "/profile" || currentRoute === "/my-profile";
  const isReportsRoute =
    currentRoute === "/reports" ||
    currentRoute === "/report" ||
    currentRoute === "/my-reports";
  const isSimulateRoute = currentRoute === "/simulate";
  const isRespondRoute =
    currentRoute === "/action-center" || currentRoute === "/respond";
  const isFullWidth = isProfileRoute || isReportsRoute || isSimulateRoute;

  return (
    <div
      className={`relative w-full min-h-screen text-slate-900 flex flex-col justify-between font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-hidden ${
        isProfileRoute
          ? "bg-[#eef2f6] dark:bg-[#0b1220] dark:text-slate-100"
          : isReportsRoute
            ? "bg-white dark:bg-[#0f172a] dark:text-slate-100"
            : isSimulateRoute
              ? "bg-white dark:bg-[#0f172a] dark:text-slate-100"
              : isRespondRoute
                ? "bg-[#060d19] text-slate-100"
                : "bg-white dark:bg-[#0f172a] dark:text-slate-100"
      }`}
    >
      {/* Ambient Top Radiant Glow & Micro-Grid for standard Subpages — hidden for simulate & respond */}
      {!isFullWidth && !isRespondRoute && (
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
            : isRespondRoute
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
