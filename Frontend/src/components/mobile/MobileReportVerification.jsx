import { CheckCircle2, Circle, Loader2, ArrowRight, RotateCcw } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'

export function MobileReportVerification() {
  const {
    reportVerificationStage,
    isReportVerified,
    resetCitizenReport,
    navigate,
    setSelectedIncident,
  } = useKWIStore()

  const CHECKLIST = [
    { stage: 1, label: 'Location confirmed', sub: 'Ward 31 (Bidhannagar)' },
    { stage: 2, label: 'Image analyzed', sub: 'Sector V road asphalt' },
    { stage: 3, label: 'Waterlogging detected', sub: 'Bagjola branch constrained' },
    { stage: 4, label: 'Water depth verified', sub: '28 cm over curb' },
    { stage: 5, label: 'Duplicate check passed', sub: 'Merged to #SV-024' },
  ]

  const handleOpenLiveCity = () => {
    setSelectedIncident({
      id: '#SV-024',
      name: 'Sector V Incident #SV-024',
      subdivision: 'SECTOR V // SALT LAKE',
      location: 'College More & Ring Road, Salt Lake Sector V',
      x: 6.2,
      y: -2.0,
      timestamp: '10:42 AM',
      waterDepth: '28 cm',
      rainfall: '74 mm / 3 hr',
      verifiedReports: 18,
      affectedArea: '12,400 m²',
      riskScore: '82 / 100',
      connectedDrainage: 'Sector V Main Trunk',
      nearestPump: 'PS-07',
      probableCause: 'Rainfall exceeding local drainage capacity.',
      severity: 'HIGH',
      severityColor: '#d64545',
      status: 'Needs Intervention',
      workOrderId: 'WO-2026-0323-0041',
    })
    navigate('/live-city')
  }

  return (
    <div className="flex flex-col h-full justify-between text-left select-none">
      <div>
        {/* Top Status Header */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase block">
            {isReportVerified ? 'REPORT VERIFIED' : 'REPORT RECEIVED'}
          </span>
          <h2 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
            {isReportVerified ? 'Verification Complete' : 'AI Verification Started'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isReportVerified
              ? 'Signal validated and routed to municipal dispatch.'
              : 'Cross-referencing telemetry across Kolkata grid…'}
          </p>
        </div>

        {/* Compact Verification Checklist */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              AI Verification
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-600">
              {reportVerificationStage}/5 Stages
            </span>
          </div>

          {CHECKLIST.map((item) => {
            const isDone = reportVerificationStage >= item.stage
            const isCurrent = reportVerificationStage === item.stage && !isReportVerified

            return (
              <div key={item.stage} className="flex items-start gap-2.5 text-xs">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <span
                    className={`font-medium block leading-tight ${
                      isDone
                        ? 'text-slate-900'
                        : isCurrent
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {item.sub}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Verified Outcome Card */}
        {isReportVerified && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <span className="font-bold block text-[11px]">
              Incident #SV-024 Confirmed
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Assigned to Station PS-07 and Ward 31 Drainage Desk.
            </span>
          </div>
        )}
      </div>

      {/* Action CTA Buttons */}
      <div className="pt-3 space-y-2">
        {isReportVerified ? (
          <>
            <button
              type="button"
              onClick={handleOpenLiveCity}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View on Live City Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetCitizenReport}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Submit Another Report</span>
            </button>
          </>
        ) : (
          <div className="w-full h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Validating Report…</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileReportVerification
