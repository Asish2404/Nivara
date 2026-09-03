import { useState } from 'react'
import { Camera, MapPin, X, Check } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'

export function MobileReportForm() {
  const {
    reportPhoto,
    setReportPhoto,
    reportDescription,
    setReportDescription,
    reportLocation,
    setReportLocation,
    reportDepth,
    setReportDepth,
    submitCitizenReport,
  } = useKWIStore()

  const DEPTH_OPTIONS = [
    '< 10 cm',
    '10–20 cm',
    '20–30 cm',
    '30+ cm',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    submitCitizenReport()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between text-left select-none">
      {/* Header Inside Phone */}
      <div>
        <div className="mb-3">
          <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase block">
            REPORT WATERLOGGING
          </span>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Report Waterlogging
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Help Kolkata respond faster.
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[440px] pr-0.5 -mr-0.5">
          {/* STEP 1: ADD A PHOTO */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Add a Photo
            </label>
            {reportPhoto ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src={reportPhoto}
                  alt="Waterlogging report"
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReportPhoto(null)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1.5 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded">
                  Sector V, Kolkata
                </div>
              </div>
            ) : (
              <div
                onClick={() => setReportPhoto('/images/kolkata_waterlog_sector_v.jpg')}
                className="h-28 rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex flex-col items-center justify-center p-3 text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center mb-1 shadow-2xs">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Add a Photo</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Capture the affected area</span>
              </div>
            )}
          </div>

          {/* STEP 2: DESCRIBE THE PROBLEM */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Describe the Problem
            </label>
            <textarea
              rows={2}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe the waterlogging..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white resize-none transition-all leading-relaxed"
            />
          </div>

          {/* STEP 3: USE CURRENT LOCATION */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Location
            </label>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    Use Current Location
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {reportLocation}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                GPS LOCK
              </span>
            </div>
          </div>

          {/* STEP 4: WATER DEPTH */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Water Depth
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {DEPTH_OPTIONS.map((opt) => {
                const isSelected = reportDepth === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setReportDepth(opt)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 5: PRIMARY CTA */}
      <div className="pt-3">
        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Submit Report</span>
        </button>
      </div>
    </form>
  )
}

export default MobileReportForm
