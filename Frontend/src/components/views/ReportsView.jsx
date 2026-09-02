import { FileText, Download, CheckCircle, Clock, Shield } from 'lucide-react'

export function ReportsView() {
  const REPORTS = [
    {
      id: 'REP-2026-M09-02',
      title: 'Daily Monsoon Drainage & Waterlogging Situation Report #14',
      date: 'Today, 08:00 IST',
      author: 'KMC Sewerage & Drainage Directorate',
      summary: 'Cumulative rainfall 112.4mm across 16 Boroughs. Palmer Bridge & Topsia pumping stations operated continuously. Sluice lock at Chitpore closed due to 3.42m Hooghly tide.',
      status: 'PUBLISHED',
      fileSize: '2.4 MB PDF',
    },
    {
      id: 'REP-2026-M09-01',
      title: 'Keorapukur Khal & Bagjola Silt Clearance Audit',
      date: 'Yesterday, 18:30 IST',
      author: 'Irrigation & Waterways Dept (Govt of WB)',
      summary: 'Desiltation of primary canals completed up to 88% cross-sectional efficiency. Three submerged excavator units deployed at EM Bypass culvert.',
      status: 'ARCHIVED',
      fileSize: '4.1 MB PDF',
    },
    {
      id: 'REP-2026-M08-28',
      title: 'Palmer Bridge Heavy Pump Station Unit #5 Overhaul Brief',
      date: '28 Aug 2026',
      author: 'KMC Mechanical & Electrical Engineering',
      summary: 'High-volume axial flow pump #5 restored to service, boosting total discharge capacity to 175 cusecs.',
      status: 'VERIFIED',
      fileSize: '1.8 MB PDF',
    },
  ]

  return (
    <div className="w-full font-sans text-white">
      <div className="pb-6 border-b border-white/10">
        <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
          MUNICIPAL BRIEFINGS & AUDITS // KMC ARCHIVE
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1 font-mono">
          OPERATIONAL WATER REPORTS
        </h1>
      </div>

      <div className="space-y-4 mt-6">
        {REPORTS.map((rep) => (
          <div
            key={rep.id}
            className="p-6 rounded-2xl bg-black/50 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-bold">
                  {rep.id}
                </span>
                <span className="text-xs font-mono text-slate-400">• {rep.date}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-semibold">
                  {rep.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{rep.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{rep.summary}</p>
              <span className="text-[11px] text-slate-500 font-medium block">
                Issuing Authority: {rep.author}
              </span>
            </div>

            <button
              type="button"
              onClick={() => alert(`Downloading ${rep.id} (${rep.fileSize})...`)}
              className="px-4 py-2.5 bg-white/5 hover:bg-cyan-950/80 border border-white/15 hover:border-cyan-400/50 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{rep.fileSize}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReportsView
