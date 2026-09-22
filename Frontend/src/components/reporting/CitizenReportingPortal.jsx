import { useKWIStore } from "../../store/useKWIStore";
import { MobileReportForm } from "../mobile/MobileReportForm";
import { MobileReportVerification } from "../mobile/MobileReportVerification";

export function CitizenReportingPortal() {
  const { isReportSubmitted, navigate } = useKWIStore();

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[#f4f7fb] dark:bg-[#070c14] text-slate-900 dark:text-slate-100 flex flex-col justify-start relative select-none py-6 px-3 sm:px-6 font-sans">
      {/* Ambient Top Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(29,99,168,0.12),rgba(6,182,212,0.06),transparent_70%)] pointer-events-none -z-10" />

      {/* Main Reporting Workspace Canvas */}
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        <div className="w-full flex-1 bg-white dark:bg-[#0d1829] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm sm:shadow-md p-4 sm:p-5 flex flex-col justify-between transition-all">
          {isReportSubmitted ? (
            <MobileReportVerification />
          ) : (
            <MobileReportForm onBackToStep1={() => navigate("/")} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CitizenReportingPortal;
