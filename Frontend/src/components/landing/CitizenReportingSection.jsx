import { MobileReportPhone } from "../mobile/MobileReportPhone";
import { PhoneVerificationPipeline } from "../mobile/PhoneVerificationPipeline";

export function CitizenReportingSection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto border-t border-slate-100">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-blue-600 font-mono">
          CITIZEN REPORTING & AI VERIFICATION
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 mt-2">
          Ground truth, verified in seconds.
        </h2>
        <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
          Citizens report water conditions from their phones. Computer vision
          models validate water depth, road condition, and drainage obstruction
          before dispatch.
        </p>
      </div>

      {/* Clean Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left: Realistic Phone Mockup (35–40%) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-start">
          <MobileReportPhone />
        </div>

        {/* Right: AI Verification Pipeline (45–50%) */}
        <div className="lg:col-span-7">
          <PhoneVerificationPipeline />
        </div>
      </div>
    </section>
  );
}

export default CitizenReportingSection;
