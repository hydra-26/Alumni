import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { SectionHead, Card, CardHead } from '../components/ui'

export default function ReportsPage() {
  const { toast } = useToast()
  const [alumniOpts, setAlumniOpts] = useState({ profiles: true, employment: true, skills: false })
  const [alumniRange, setAlumniRange] = useState('All Time')
  const [projType, setProjType]   = useState('All Types')
  const [projBatch, setProjBatch] = useState('All Batches')

  const tog = (k) => setAlumniOpts(o => ({ ...o, [k]: !o[k] }))

  const actionBtn = (label, msg, type = 'success') => (
    <button onClick={() => toast(msg, type)}
      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[13px] font-medium
                 hover:border-psu hover:text-psu hover:bg-blue-50 transition-all duration-150 flex items-center gap-2 shadow-card">
      {label}
    </button>
  )

  return (
    <div className="animate-fade-up">
      <SectionHead title="Export Reports" sub="Generate printable summaries and data exports" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Alumni Report */}
        <Card>
          <CardHead title="Alumni Summary Report" sub="Employment stats, profiles, skills" />
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Date Range</label>
              <select className="field" value={alumniRange} onChange={e => setAlumniRange(e.target.value)}>
                {['All Time','2025','2024–2025','2023–2025'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Include</label>
              <div className="space-y-2">
                {[['profiles','Alumni Profiles'],['employment','Employment Statistics'],['skills','Skills Analysis']].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2.5 cursor-pointer group">
                    <div onClick={() => tog(k)}
                      className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer
                        ${alumniOpts[k] ? 'bg-psu border-psu' : 'border-slate-300 bg-white group-hover:border-psu/50'}`}>
                      {alumniOpts[k] && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                    </div>
                    <span className="text-[13px] text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => toast('PDF report generated!','success')} className="btn-primary flex items-center gap-2">📄 Export PDF</button>
              <button onClick={() => toast('Excel file downloaded!','success')} className="btn-ghost flex items-center gap-2">📊 Export Excel</button>
            </div>
          </div>
        </Card>

        {/* Project Report */}
        <Card>
          <CardHead title="Project Analytics Report" sub="Performance metrics & trends" />
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project Type</label>
              <select className="field" value={projType} onChange={e => setProjType(e.target.value)}>
                {['All Types','Web App','Mobile App','IoT System','Data Analytics','Desktop App'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Batch Year</label>
              <select className="field" value={projBatch} onChange={e => setProjBatch(e.target.value)}>
                {['All Batches','2025','2024','2023','2022','2021'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => toast('Project report exported!','success')} className="btn-primary flex items-center gap-2">📄 Export PDF</button>
              <button onClick={() => toast('Excel file downloaded!','success')} className="btn-ghost flex items-center gap-2">📊 Export Excel</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
