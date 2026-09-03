import { MobileReportPhone } from "../mobile/MobileReportPhone";
import { PhoneVerificationPipeline } from "../mobile/PhoneVerificationPipeline";

export function ReportsView() {
  return (
    <div className="w-full font-sans text-slate-900 pb-16">
      {/* Page Header */}
      <div className="max-w-2xl mb-12 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 block mb-1 font-mono">
          CITIZEN INCIDENT REPORTING
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Report Waterlogging
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          Help Kolkata respond faster. Citizen ground reports trigger automated
          spatial verification and direct drainage dispatch.
        </p>
      </div>

      {/* Clean Two-Column Layout: Left Phone Mockup (35–40%) / Right AI Verification (45–50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Realistic Phone Mockup (Visual Anchor) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-start">
          <MobileReportPhone />
        </div>

        {/* Right Column: AI Verification Pipeline */}
        <div className="lg:col-span-7">
          <PhoneVerificationPipeline />
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
