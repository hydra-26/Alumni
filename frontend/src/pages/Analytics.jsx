import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import api from '../utils/api'
import { logAudit } from '../utils/audit'
import { Card, CardHead, SectionHead, StatBox, Sel, Modal } from '../components/ui'
import { useToast } from '../context/ToastContext'

Chart.register(...registerables)
Chart.defaults.font.family = "'Lexend', 'Noto Sans', 'Segoe UI', sans-serif"
Chart.defaults.color = '#7a93bb'

const PSU = '#0a3d8f'
const GOLD = '#d4a800'
const GRID = 'rgba(214,224,245,0.45)'

export default function Analytics() {
  const { toast } = useToast()
  const [batchFilter, setBatchFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [alumni, setAlumni] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({ total_alumni: 0, total_projects: 0, employment_rate: 0, award_winning: 0, implemented_rate: 0 })
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportSel, setExportSel] = useState({ metrics: true, radar: true, trend: true, awards: true, program: true })

  const radarRef = useRef(null)
  const trendRef = useRef(null)
  const awardsRef = useRef(null)
  const programRef = useRef(null)
  const instances = useRef({})

  // Export capture refs
  const refMetricsCard = useRef(null)
  const refRadarCard = useRef(null)
  const refTrendCard = useRef(null)
  const refAwardsCard = useRef(null)
  const refProgramCard = useRef(null)

  const exportItems = [
    { key: 'metrics', label: 'Key Metrics', ref: refMetricsCard },
    { key: 'radar', label: 'Batch Radar Comparison', ref: refRadarCard },
    { key: 'trend', label: 'Implementation Rate Trend', ref: refTrendCard },
    { key: 'awards', label: 'Awards by Project Category', ref: refAwardsCard },
    { key: 'program', label: 'Employment by Program', ref: refProgramCard },
  ]

  useEffect(() => {
    Promise.all([
      api.get('/alumni/').catch(() => ({ data: [] })),
      api.get('/projects/').catch(() => ({ data: [] })),
      api.get('/analytics/kpis').catch(() => ({ data: { total_alumni: 0, total_projects: 0, employment_rate: 0, award_winning: 0, implemented_rate: 0 } })),
    ]).then(([a, p, k]) => {
      setAlumni(a.data || [])
      setProjects(p.data || [])
      setKpis(k.data || { total_alumni: 0, total_projects: 0, employment_rate: 0, award_winning: 0, implemented_rate: 0 })
    }).finally(() => setLoading(false))
  }, [])

  const filteredAlumni = useMemo(() => alumni.filter(a => {
    const passYear = batchFilter === 'all' || a.batch_year === batchFilter
    const passProgram = programFilter === 'all' || a.course === programFilter
    return passYear && passProgram
  }), [alumni, batchFilter, programFilter])

  const filteredProjects = useMemo(() => projects.filter(p => {
    return batchFilter === 'all' || p.year === batchFilter
  }), [projects, batchFilter])

  const availableYears = useMemo(() => {
    const set = new Set()
    for (const p of projects) if (p.year) set.add(p.year)
    for (const a of alumni) if (a.batch_year) set.add(a.batch_year)
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
  }, [projects, alumni])

  const batchYears = useMemo(() => {
    const set = new Set()
    for (const p of filteredProjects) if (p.year) set.add(p.year)
    for (const a of filteredAlumni) if (a.batch_year) set.add(a.batch_year)
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
  }, [filteredProjects, filteredAlumni])

  const perYear = useMemo(() => {
    const out = {}
    for (const y of batchYears) {
      const yearProjects = filteredProjects.filter(p => p.year === y)
      const yearAlumni = filteredAlumni.filter(a => a.batch_year === y)
      const projectTotal = yearProjects.length
      const implemented = yearProjects.filter(p => p.status === 'Implemented').length
      const awarded = yearProjects.filter(p => p.status === 'Awarded').length
      const employed = yearAlumni.filter(a => a.employment_status === 'Employed').length
      const selfEmp = yearAlumni.filter(a => a.employment_status === 'Self-Employed').length
      const alumniTotal = yearAlumni.length

      out[y] = {
        projectTotal,
        implementedPct: projectTotal ? Math.round((implemented / projectTotal) * 100) : 0,
        awardedPct: projectTotal ? Math.round((awarded / projectTotal) * 100) : 0,
        employedPct: alumniTotal ? Math.round((employed / alumniTotal) * 100) : 0,
        selfEmpPct: alumniTotal ? Math.round((selfEmp / alumniTotal) * 100) : 0,
      }
    }
    return out
  }, [batchYears, filteredProjects, filteredAlumni])

  const selectedYears = batchFilter === 'all' ? batchYears : [batchFilter]

  const stats = useMemo(() => {
    const alumniTotal = filteredAlumni.length
    const projectsTotal = filteredProjects.length
    const employed = filteredAlumni.filter(a => a.employment_status === 'Employed').length
    const implemented = filteredProjects.filter(p => p.status === 'Implemented').length
    const awarded = filteredProjects.filter(p => p.status === 'Awarded').length

    return {
      alumni: alumniTotal,
      projects: projectsTotal,
      employedPct: alumniTotal ? Math.round((employed / alumniTotal) * 100) : 0,
      implementedPct: projectsTotal ? Math.round((implemented / projectsTotal) * 100) : 0,
      awarded,
    }
  }, [filteredAlumni, filteredProjects])

  const trendYears = useMemo(() => {
    const set = new Set()
    for (const p of filteredProjects) if (p.year) set.add(p.year)
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
  }, [filteredProjects])

  const trendValues = trendYears.map(y => perYear[y]?.implementedPct || 0)

  const awardByCategory = useMemo(() => {
    const counts = {}
    for (const p of filteredProjects) {
      if (p.status !== 'Awarded') continue
      const cat = p.category || 'Other'
      counts[cat] = (counts[cat] || 0) + 1
    }
    const labels = Object.keys(counts)
    return {
      labels,
      values: labels.map(l => counts[l]),
    }
  }, [filteredProjects])

  const employedByProgram = useMemo(() => {
    const counts = {}
    for (const a of filteredAlumni) {
      if (a.employment_status !== 'Employed') continue
      const course = a.course || 'Other'
      counts[course] = (counts[course] || 0) + 1
    }
    const labels = Object.keys(counts)
    return {
      labels,
      values: labels.map(l => counts[l]),
    }
  }, [filteredAlumni])

  useEffect(() => {
    const destroy = (key) => {
      if (instances.current[key]) {
        instances.current[key].destroy()
        delete instances.current[key]
      }
    }

    if (radarRef.current) {
      destroy('radar')
      instances.current.radar = new Chart(radarRef.current, {
        type: 'radar',
        data: {
          labels: ['Employed %', 'Self-Employed %', 'Implemented %', 'Awarded %', 'Project Volume'],
          datasets: selectedYears.map((y, idx) => ({
            label: y,
            data: [
              perYear[y]?.employedPct || 0,
              perYear[y]?.selfEmpPct || 0,
              perYear[y]?.implementedPct || 0,
              perYear[y]?.awardedPct || 0,
              Math.min(100, (perYear[y]?.projectTotal || 0) * 10),
            ],
            borderColor: [PSU, GOLD, '#0d8a5e'][idx % 3],
            backgroundColor: ['rgba(10,61,143,0.12)', 'rgba(212,168,0,0.10)', 'rgba(13,138,94,0.10)'][idx % 3],
            pointBackgroundColor: [PSU, GOLD, '#0d8a5e'][idx % 3],
            borderWidth: 2.2,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { r: { ticks: { backdropColor: 'transparent', font: { size: 9 } }, grid: { color: 'rgba(214,224,245,0.6)' }, pointLabels: { font: { size: 10 }, color: '#3a5280' } } },
          plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
        },
      })
    }

    if (trendRef.current) {
      destroy('trend')
      instances.current.trend = new Chart(trendRef.current, {
        type: 'line',
        data: {
          labels: trendYears,
          datasets: [{
            label: 'Implementation Rate %',
            data: trendValues,
            borderColor: PSU,
            backgroundColor: 'rgba(10,61,143,0.07)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: PSU,
            borderWidth: 2.5,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 11 } } } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID } } } },
      })
    }

    if (awardsRef.current) {
      destroy('awards')
      instances.current.awards = new Chart(awardsRef.current, {
        type: 'bar',
        data: {
          labels: awardByCategory.labels,
          datasets: [{ label: 'Awards', data: awardByCategory.values, backgroundColor: [PSU, 'rgba(212,168,0,0.85)', 'rgba(13,138,94,0.85)', 'rgba(107,63,160,0.85)', 'rgba(0,119,182,0.85)'], borderWidth: 0, borderRadius: 5 }],
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: 'transparent' } } } },
      })
    }

    if (programRef.current) {
      destroy('program')
      instances.current.program = new Chart(programRef.current, {
        type: 'pie',
        data: {
          labels: employedByProgram.labels,
          datasets: [{ data: employedByProgram.values, backgroundColor: ['rgba(10,61,143,0.85)', 'rgba(212,168,0,0.85)', 'rgba(13,138,94,0.85)', 'rgba(107,63,160,0.85)'], borderWidth: 0, hoverOffset: 10 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } } },
      })
    }

    return () => Object.keys(instances.current).forEach(destroy)
  }, [selectedYears, perYear, trendYears, trendValues, awardByCategory, employedByProgram])

  const batchLabel = batchFilter === 'all' ? 'all batches' : `batch ${batchFilter}`
  const programLabel = programFilter === 'all' ? 'all programs' : programFilter

  const toggleExport = (key) => setExportSel(s => ({ ...s, [key]: !s[key] }))
  const setAllExport = (value) => setExportSel(exportItems.reduce((acc, item) => {
    acc[item.key] = value
    return acc
  }, {}))

  const exportAnalyticsPdf = async () => {
    const selected = exportItems.filter(item => exportSel[item.key])
    if (!selected.length) {
      toast('Select at least one chart to export.', 'error')
      return
    }

    const missing = selected.filter(item => !item.ref?.current)
    if (missing.length) {
      toast('Some charts are not ready to export yet.', 'error')
      return
    }

    setExporting(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 36

      for (let i = 0; i < selected.length; i += 1) {
        const node = selected[i].ref.current
        const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
        const imgData = canvas.toDataURL('image/png')
        const maxWidth = pageWidth - margin * 2
        const maxHeight = pageHeight - margin * 2
        const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
        const renderWidth = canvas.width * ratio
        const renderHeight = canvas.height * ratio
        const x = (pageWidth - renderWidth) / 2
        const y = (pageHeight - renderHeight) / 2

        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST')
      }

      pdf.save(`analytics-export-${Date.now()}.pdf`)
      setExportOpen(false)
      toast('PDF exported successfully.', 'success')
      void logAudit('Export analytics (PDF)', '#0d8a5e')
    } catch (err) {
      toast('Failed to export PDF.', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <SectionHead title="Performance Analytics" sub="Loading analytics data..." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl border border-blue-100 bg-white p-4 text-center animate-pulse">
              <div className="h-6 w-12 bg-slate-100 rounded mx-auto mb-2" />
              <div className="h-2.5 w-16 bg-slate-100 rounded mx-auto" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {[1,2].map(i => (
            <Card key={`a-top-${i}`}>
              <CardHead title=" " sub=" " />
              <div className="p-5 animate-pulse"><div className="h-[280px] bg-slate-100 rounded-xl" /></div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <Card key={`a-btm-${i}`}>
              <CardHead title=" " sub=" " />
              <div className="p-5 animate-pulse"><div className="h-[220px] bg-slate-100 rounded-xl" /></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <SectionHead title="Performance Analytics" sub={`Deep-dive metrics for ${batchLabel} · ${programLabel}`}>
        <Sel value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          <option value="all">All Batches</option>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </Sel>
        <Sel value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
          <option value="all">All Programs</option>
          <option value="BSIT">BSIT</option>
          <option value="BSCS">BSCS</option>
          <option value="BSIS">BSIS</option>
        </Sel>
        <button className="btn-primary whitespace-nowrap" onClick={() => setExportOpen(true)} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </SectionHead>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Analytics Charts"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setExportOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={exportAnalyticsPdf} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </>
        }
      >
        <p className="text-[12px] text-slate-500 mb-4">Select charts to include in the PDF export.</p>
        <div className="space-y-2">
          {exportItems.map(item => (
            <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggleExport(item.key)}
                className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer
                  ${exportSel[item.key] ? 'bg-psu border-psu' : 'border-slate-300 bg-white group-hover:border-psu/50'}`}
              >
                {exportSel[item.key] && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span className="text-[13px] text-slate-600">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 pt-3">
          <button className="btn-ghost" onClick={() => setAllExport(true)}>Select all</button>
          <button className="btn-ghost" onClick={() => setAllExport(false)}>Clear all</button>
        </div>
      </Modal>

      <div ref={refMetricsCard}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <StatBox value={`${stats.alumni}`} label="Alumni" />
          <StatBox value={`${stats.projects}`} label="Projects" />
          <StatBox value={`${stats.employedPct}%`} label="Employed" />
          <StatBox value={`${stats.implementedPct}%`} label="Implemented" />
          <StatBox value={`${stats.awarded}`} label="Awarded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div ref={refRadarCard}>
          <Card>
            <CardHead title="Batch Radar Comparison" sub="Calculated from Supabase records" />
            <div className="p-5"><div style={{ height: 280 }}><canvas ref={radarRef} /></div></div>
          </Card>
        </div>
        <div ref={refTrendCard}>
          <Card>
            <CardHead title="Implementation Rate Trend" sub="% of projects implemented per year" />
            <div className="p-5"><div style={{ height: 280 }}><canvas ref={trendRef} /></div></div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div ref={refAwardsCard}>
          <Card>
            <CardHead title="Awards by Project Category" sub="Awarded projects grouped by category" />
            <div className="p-5"><div style={{ height: 220 }}><canvas ref={awardsRef} /></div></div>
          </Card>
        </div>
        <div ref={refProgramCard}>
          <Card>
            <CardHead title="Employment by Program" sub="Employed alumni grouped by course" />
            <div className="p-5"><div style={{ height: 220 }}><canvas ref={programRef} /></div></div>
          </Card>
        </div>
      </div>

      {(kpis.total_alumni === 0 && kpis.total_projects === 0) && (
        <div className="text-center text-[12px] text-slate-400 mt-4">No analytics records available yet.</div>
      )}
    </div>
  )
}
