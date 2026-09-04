import { CheckCircle2, Circle, Loader2, ArrowRight, RotateCcw, MapPin, Droplets } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'

export function MobileReportVerification() {
  const {
    reportVerificationStage,
    isReportVerified,
    resetCitizenReport,
    navigate,
    setSelectedIncident,
    reportPhoto,
    reportDescription,
    reportLocation,
    reportLocality,
    reportCity,
    reportCoords,
    reportDepth,
    reportTimestamp,
  } = useKWIStore()

  // Dynamic AI Checklist reflecting the user's actual submitted details
  const CHECKLIST = [
    {
      stage: 1,
      label: 'Location confirmed',
      sub: `${reportLocality || 'Salt Lake, Sector V'} (${reportCoords?.lat?.toFixed?.(4) || '22.5735'}°N, ${reportCoords?.lon?.toFixed?.(4) || '88.4331'}°E)`,
    },
    {
      stage: 2,
      label: 'Image analyzed',
      sub: reportPhoto ? 'Device photo verified by vision model' : 'Terrain and road condition mapped',
    },
    {
      stage: 3,
      label: 'Waterlogging detected',
      sub: reportDescription ? `"${reportDescription.slice(0, 32)}..."` : 'Surface runoff constraint verified',
    },
    {
      stage: 4,
      label: 'Water depth verified',
      sub: `${reportDepth || '15–30 cm'} in roadway`,
    },
    {
      stage: 5,
      label: 'Municipal dispatch linked',
      sub: `Routed to ${reportLocality || 'Kolkata'} Drainage Desk`,
    },
  ]

  const handleOpenLiveCity = () => {
    setSelectedIncident({
      id: '#CITIZEN-' + Math.floor(100 + Math.random() * 900),
      name: `${reportLocality || 'Citizen'} Waterlogging`,
      subdivision: (reportLocality || 'KOLKATA').toUpperCase(),
      location: `${reportLocality || 'Salt Lake, Sector V'}, ${reportCity || 'Kolkata, West Bengal'}`,
      x: reportCoords ? (reportCoords.lon - 88.3639) * 20 : 6.2,
      y: reportCoords ? (22.5726 - reportCoords.lat) * 20 : -2.0,
      timestamp: reportTimestamp || 'Just now',
      waterDepth: reportDepth || '20 cm',
      rainfall: '74 mm / 3 hr',
      verifiedReports: 1,
      affectedArea: '9,400 m²',
      riskScore: '78 / 100',
      connectedDrainage: 'Municipal Canal Grid',
      nearestPump: 'PS-07',
      probableCause: reportDescription || 'Rainfall exceeding local drainage capacity.',
      severity: 'HIGH',
      severityColor: '#d64545',
      status: 'Verified by AI',
      workOrderId: 'WO-' + Date.now().toString().slice(-6),
    })
    navigate('/live-city')
  }

  return (
    <div className="flex flex-col h-full justify-between text-left select-none font-sans">
      <div>
        {/* Top Status Header */}
        <div className="mb-3">
          <span className="text-[10px] font-bold text-[#1d63a8] tracking-wider uppercase block">
            {isReportVerified ? 'REPORT VERIFIED' : 'REPORT RECEIVED'}
          </span>
          <h2 className="text-[19px] font-sans font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
            {isReportVerified ? 'Verification Complete' : 'AI Verification Started'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isReportVerified
              ? 'Signal validated and routed to municipal dispatch.'
              : 'Cross-referencing telemetry across Kolkata grid…'}
          </p>
        </div>

        {/* Compact Verification Checklist */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              AI Verification
            </span>
            <span className="text-[10px] font-mono font-bold text-[#1d63a8]">
              {reportVerificationStage}/5 Stages
            </span>
          </div>

          {CHECKLIST.map((item) => {
            const isDone = reportVerificationStage >= item.stage
            const isCurrent = reportVerificationStage === item.stage && !isReportVerified

            return (
              <div key={item.stage} className="flex items-start gap-2.5 text-xs">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#1d63a8] animate-spin shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <span
                    className={`font-medium block leading-tight text-[11px] truncate ${
                      isDone
                        ? 'text-slate-900 font-semibold'
                        : isCurrent
                        ? 'text-[#1d63a8] font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[9.5px] text-slate-500 block truncate">
                    {item.sub}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Verified Outcome Card Showing Original Report Details */}
        {isReportVerified && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 shadow-2xs animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Report Confirmed
              </span>
              <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-100/90 px-2 py-0.5 rounded-full">
                {reportTimestamp || 'Live'}
              </span>
            </div>

            {/* Original User Submitted Info Preview */}
            <div className="flex items-center gap-2.5 pt-1 border-t border-emerald-200/70">
              {reportPhoto ? (
                <img
                  src={reportPhoto}
                  alt="Reported waterlogging"
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-300 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-sm shadow-2xs">
                  📸
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[11px] text-slate-900 block truncate">
                  {reportLocality || 'Salt Lake, Sector V'}
                </span>
                <span className="text-[9.5px] text-slate-600 block truncate">
                  {reportDepth || '15–30 cm'} • {reportDescription || 'Waterlogging detected'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action CTA Buttons */}
      <div className="pt-2 pb-1 space-y-1.5">
        {isReportVerified ? (
          <>
            <button
              type="button"
              onClick={handleOpenLiveCity}
              className="w-full h-11 rounded-2xl bg-[#1d63a8] hover:bg-[#155696] active:scale-[0.98] text-white font-bold text-[12px] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View on Live City Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetCitizenReport}
              className="w-full py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Submit Another Report</span>
            </button>
          </>
        ) : (
          <div className="w-full h-11 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-medium text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1d63a8]" />
            <span>Validating Report…</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileReportVerification
