import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { SectionHead, Card, CardHead } from '../components/ui'

function fmtDate(d) {
  try { return new Date(d).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) }
  catch { return d }
}

export default function SystemPage() {
  const { toast } = useToast()
  const [logs, setLogs]           = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [schedule, setSchedule]   = useState('Daily at 6:00 AM')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    setLoadingLogs(true)
    api.get('/analytics/audit-logs')
      .then(r => setLogs(r.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [])

  const handleImport = () => {
    setImporting(true)
    setTimeout(() => { setImporting(false); toast('Data imported successfully!', 'success') }, 1500)
  }

  return (
    <div className="animate-fade-up">
      <SectionHead title="User Activity Logs" sub="View User Activity Logs" />

      {/* User Activity Logs */}
      <Card>
        <CardHead title="User Activity Logs" sub="Recent system activity trail"
          action={<button className="btn-ghost text-[12px]" onClick={() => toast('Logs exported!','success')}>Export Logs</button>} />
        <div className="p-5 space-y-0">
          {loadingLogs && (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`sk-${idx}`} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3.5 w-[62%] bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-[34%] bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loadingLogs && logs.length === 0 && <div className="text-center py-8 text-slate-400 text-[13px]">No User Activity Logs found.</div>}
          {logs.map((log, i) => (
            <div key={log.id || i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: log.color || '#0a3d8f' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-slate-700">{log.action}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {log.actor} · {fmtDate(log.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
