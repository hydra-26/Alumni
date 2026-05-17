import { useState, useEffect, useMemo, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import api from '../utils/api'
import { logAudit } from '../utils/audit'
import { KpiCard, Card, CardHead, SectionHead, Sel, Modal } from '../components/ui'
import { useToast } from '../context/ToastContext'

Chart.register(...registerables)
Chart.defaults.font.family = "'Lexend', 'Noto Sans', 'Segoe UI', sans-serif"
Chart.defaults.color = '#7a93bb'

const PSU  = '#0a3d8f'
const GOLD = '#d4a800'
const GRID = 'rgba(214,224,245,0.45)'

const STATUS_BADGE = {
  'Employed':      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Self-Employed': 'bg-sky-50 text-sky-700 border border-sky-200',
  'Seeking':       'bg-orange-50 text-orange-700 border border-orange-200',
  'Studying':      'bg-violet-50 text-violet-700 border border-violet-200',
}
const PROJ_BADGE = {
  'Implemented': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Awarded':     'bg-amber-50 text-amber-700 border border-amber-200',
  'In Progress': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Proposed':    'bg-slate-100 text-slate-500 border border-slate-200',
}

export default function Dashboard() {
  const { toast } = useToast()
  const [kpis, setKpis]         = useState({ total_alumni: 0, total_projects: 0, employment_rate: 0, award_winning: 0, implemented_rate: 0 })
  const [alumni, setAlumni]     = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [projectsPerYear, setProjectsPerYear] = useState({})
  const [categoryCounts, setCategoryCounts] = useState({})
  const [employmentTrend, setEmploymentTrend] = useState({})
  const [yearFilter, setYearFilter] = useState('all')
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportSel, setExportSel] = useState({
    metrics: true,
    projects: true,
    categories: true,
    employment: true,
    recentAlumni: true,
    recentProjects: true,
  })

  // Chart refs
  const refProjects   = useRef(null)
  const refCategories = useRef(null)
  const refEmployment = useRef(null)
  const chartInstances = useRef({})

  // Export capture refs
  const refMetricsCard = useRef(null)
  const refProjectsCard = useRef(null)
  const refCategoriesCard = useRef(null)
  const refEmploymentCard = useRef(null)
  const refRecentAlumniCard = useRef(null)
  const refRecentProjectsCard = useRef(null)

  const exportItems = [
    { key: 'metrics', label: 'Key Metrics', ref: refMetricsCard },
    { key: 'projects', label: 'Projects Per Batch Year', ref: refProjectsCard },
    { key: 'categories', label: 'Project Categories', ref: refCategoriesCard },
    { key: 'employment', label: 'Employment Trend', ref: refEmploymentCard },
    { key: 'recentAlumni', label: 'Recent Alumni', ref: refRecentAlumniCard },
    { key: 'recentProjects', label: 'Recent Projects', ref: refRecentProjectsCard },
  ]

  useEffect(() => {
    Promise.all([
      api.get('/analytics/kpis').catch(() => ({ data: { total_alumni: 0, total_projects: 0, employment_rate: 0, award_winning: 0, implemented_rate: 0 } })),
      api.get('/alumni/').catch(() => ({ data: [] })),
      api.get('/projects/').catch(() => ({ data: [] })),
      api.get('/analytics/projects-per-year').catch(() => ({ data: {} })),
      api.get('/analytics/categories').catch(() => ({ data: {} })),
      api.get('/analytics/employment-trend').catch(() => ({ data: {} })),
    ]).then(([k, a, p, ppy, cats, emp]) => {
      setKpis(k.data || { total_alumni: 0, total_projects: 0, employment_rate: 0, award_winning: 0, implemented_rate: 0 })
      setAlumni(a.data || [])
      setProjects(p.data || [])
      setProjectsPerYear(ppy.data || {})
      setCategoryCounts(cats.data || {})
      setEmploymentTrend(emp.data || {})
    }).finally(() => setLoading(false))
  }, [])

  // Filter alumni and projects based on selected filters
  const filteredAlumni = useMemo(() => alumni.filter(a => {
    const yearMatch = yearFilter === 'all' || a.batch_year === yearFilter
    return yearMatch
  }), [alumni, yearFilter])

  const filteredProjects = useMemo(() => projects.filter(p => yearFilter === 'all' || p.year === yearFilter), [projects, yearFilter])

  const availableYears = useMemo(() => {
    const yearSet = new Set()
    for (const p of projects) if (p.year) yearSet.add(p.year)
    for (const a of alumni) if (a.batch_year) yearSet.add(a.batch_year)
    return Array.from(yearSet).sort((a, b) => Number(a) - Number(b))
  }, [projects, alumni])

  // Calculate filtered KPIs
  const displayKpis = useMemo(() => {
    const employed = filteredAlumni.filter(a => a.employment_status === 'Employed').length
    const selfEmp = filteredAlumni.filter(a => a.employment_status === 'Self-Employed').length
    const implemented = filteredProjects.filter(p => p.status === 'Implemented').length
    const awarded = filteredProjects.filter(p => p.status === 'Awarded').length

    const alumniTotal = filteredAlumni.length
    const projectsTotal = filteredProjects.length

    return {
      total_alumni: alumniTotal,
      total_projects: projectsTotal,
      employment_rate: alumniTotal ? Math.round((employed / alumniTotal) * 100) : 0,
      award_winning: awarded,
      implemented_rate: projectsTotal ? Math.round((implemented / projectsTotal) * 100) : 0,
    }
  }, [filteredAlumni, filteredProjects])

  // Calculate filtered chart data
  const projectYears = useMemo(() => {
    const yearSet = new Set()
    for (const p of filteredProjects) if (p.year) yearSet.add(p.year)
    return Array.from(yearSet).sort((a, b) => Number(a) - Number(b))
  }, [filteredProjects])

  const alumniYears = useMemo(() => {
    const yearSet = new Set()
    for (const a of filteredAlumni) if (a.batch_year) yearSet.add(a.batch_year)
    return Array.from(yearSet).sort((a, b) => Number(a) - Number(b))
  }, [filteredAlumni])

  const totalsByYear = useMemo(() => projectYears.map(y => filteredProjects.filter(p => p.year === y).length), [projectYears, filteredProjects])
  const awardedByYear = useMemo(() => projectYears.map(y => filteredProjects.filter(p => p.year === y && p.status === 'Awarded').length), [projectYears, filteredProjects])

  const categoryLabels = useMemo(() => {
    const cats = new Set()
    for (const p of filteredProjects) if (p.category) cats.add(p.category)
    return Array.from(cats)
  }, [filteredProjects])
  const categoryValues = useMemo(() => categoryLabels.map(cat => filteredProjects.filter(p => p.category === cat).length), [categoryLabels, filteredProjects])

  const employedTrend = useMemo(() => alumniYears.map(y => {
    const yearAlumni = filteredAlumni.filter(a => a.batch_year === y)
    const employed = yearAlumni.filter(a => a.employment_status === 'Employed').length
    return yearAlumni.length ? Math.round((employed / yearAlumni.length) * 100) : 0
  }), [alumniYears, filteredAlumni])

  const selfEmpTrend = useMemo(() => alumniYears.map(y => {
    const yearAlumni = filteredAlumni.filter(a => a.batch_year === y)
    const selfEmp = yearAlumni.filter(a => a.employment_status === 'Self-Employed').length
    return yearAlumni.length ? Math.round((selfEmp / yearAlumni.length) * 100) : 0
  }), [alumniYears, filteredAlumni])

  useEffect(() => {
    const destroy = (key) => { if (chartInstances.current[key]) { chartInstances.current[key].destroy(); delete chartInstances.current[key] } }

    // Projects per batch
    if (refProjects.current) {
      destroy('projects')
      chartInstances.current.projects = new Chart(refProjects.current, {
        type: 'bar',
        data: {
          labels: projectYears,
          datasets: [
            { label: 'Total Projects', data: totalsByYear, backgroundColor: 'rgba(10,61,143,0.75)', borderColor: PSU, borderWidth: 1.5, borderRadius: 5 },
            { label: 'Awarded',        data: awardedByYear,  backgroundColor: 'rgba(212,168,0,0.8)',  borderColor: GOLD, borderWidth: 1.5, borderRadius: 5 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID } } } },
      })
    }

    // Categories doughnut
    if (refCategories.current) {
      destroy('categories')
      chartInstances.current.categories = new Chart(refCategories.current, {
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{ data: categoryValues, backgroundColor: ['rgba(10,61,143,0.85)','rgba(107,63,160,0.85)','rgba(212,168,0,0.85)','rgba(13,138,94,0.85)','rgba(0,119,182,0.75)'], borderWidth: 0, hoverOffset: 10 }],
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 12 } } } },
      })
    }

    // Employment trend line
    if (refEmployment.current) {
      destroy('employment')
      chartInstances.current.employment = new Chart(refEmployment.current, {
        type: 'line',
        data: {
          labels: alumniYears,
          datasets: [
            { label: 'Employed %',      data: employedTrend, borderColor: PSU,  backgroundColor: 'rgba(10,61,143,0.07)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: PSU,  borderWidth: 2.5 },
            { label: 'Self-Employed %', data: selfEmpTrend, borderColor: GOLD, backgroundColor: 'rgba(212,168,0,0.05)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: GOLD, borderWidth: 2.5 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID } } } },
      })
    }

    return () => { Object.keys(chartInstances.current).forEach(destroy) }
  }, [projectYears, totalsByYear, awardedByYear, categoryLabels, categoryValues, alumniYears, employedTrend, selfEmpTrend])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const vals = months.map((_, i) => filteredProjects.filter(p => {
    if (!p.created_at) return false
    return new Date(p.created_at).getMonth() === i
  }).length)
  const awarded = months.map((_, i) => filteredProjects.filter(p => {
    if (!p.created_at) return false
    return new Date(p.created_at).getMonth() === i && p.status === 'Awarded'
  }).length)
  const max = Math.max(1, ...vals)

  const yearLabel = yearFilter === 'all' ? 'All Years' : yearFilter
  const toggleExport = (key) => setExportSel(s => ({ ...s, [key]: !s[key] }))
  const setAllExport = (value) => setExportSel(exportItems.reduce((acc, item) => {
    acc[item.key] = value
    return acc
  }, {}))

  const exportDashboardPdf = async () => {
    const selected = exportItems.filter(item => exportSel[item.key])
    if (!selected.length) {
      toast('Select at least one item to export.', 'error')
      return
    }

    const missing = selected.filter(item => !item.ref?.current)
    if (missing.length) {
      toast('Some items are not ready to export yet.', 'error')
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

      pdf.save(`dashboard-export-${Date.now()}.pdf`)
      setExportOpen(false)
      toast('PDF exported successfully.', 'success')
      void logAudit('Export dashboard (PDF)', '#0d8a5e')
    } catch (err) {
      toast('Failed to export PDF.', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <SectionHead title="Performance Overview" sub="Loading dashboard data..." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl border border-blue-100 bg-white p-5 animate-pulse">
              <div className="h-2 w-20 bg-slate-100 rounded mb-4" />
              <div className="h-8 w-16 bg-slate-100 rounded mb-3" />
              <div className="h-2.5 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {[1,2].map(i => (
            <Card key={`c1-${i}`}>
              <CardHead title=" " sub=" " />
              <div className="p-5 animate-pulse"><div className="h-[240px] bg-slate-100 rounded-xl" /></div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHead title=" " sub=" " />
            <div className="p-5 animate-pulse"><div className="h-[200px] bg-slate-100 rounded-xl" /></div>
          </Card>
          <Card>
            <CardHead title=" " sub=" " />
            <div className="p-5 space-y-4 animate-pulse">
              {[1,2,3,4,5].map(i => (
                <div key={`skill-${i}`}>
                  <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
                  <div className="h-2 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="mb-4">
          <CardHead title=" " sub=" " />
          <div className="p-5 animate-pulse">
            <div className="grid grid-cols-12 gap-1.5 mb-2">
              {Array.from({ length: 12 }).map((_, i) => <div key={`hmh-${i}`} className="h-2 bg-slate-100 rounded" />)}
            </div>
            <div className="grid grid-cols-12 gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => <div key={`hm-${i}`} className="h-8 bg-slate-100 rounded" />)}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(t => (
            <Card key={`tbl-${t}`}>
              <CardHead title=" " />
              <div className="p-5 space-y-3 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={`row-${t}-${i}`} className="h-8 bg-slate-100 rounded" />)}
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <SectionHead title="Performance Overview" sub={`Academic Year ${yearLabel} · Real-time`}>
        <Sel value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="all">All Years</option>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </Sel>
        <button className="btn-primary whitespace-nowrap" onClick={() => setExportOpen(true)} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </SectionHead>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Dashboard Items"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setExportOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={exportDashboardPdf} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </>
        }
      >
        <p className="text-[12px] text-slate-500 mb-4">Select items to include in the PDF export.</p>
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

      {/* KPIs */}
      <div ref={refMetricsCard}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard icon="🎓" label="Total Alumni"    value={displayKpis.total_alumni}                  trend="filtered" trendUp={false} color="blue" />
          <KpiCard icon="📁" label="Total Projects"  value={displayKpis.total_projects}                trend="filtered" trendUp={false} color="gold" />
          <KpiCard icon="💼" label="Employment Rate" value={`${displayKpis.employment_rate}%`}         trend="filtered" trendUp={false} color="green" />
          <KpiCard icon="🏆" label="Award-Winning"   value={displayKpis.award_winning}                 trend="filtered" trendUp={false} color="violet" />
          <KpiCard icon="🚀" label="Implemented"     value={`${displayKpis.implemented_rate}%`}        trend="filtered" trendUp={false} color="red" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div ref={refProjectsCard}>
          <Card>
            <CardHead title="Projects Per Batch Year" sub="Annual submissions & awards" />
            <div className="p-5"><div style={{ height: 240 }}><canvas ref={refProjects} /></div></div>
          </Card>
        </div>
        <div ref={refCategoriesCard}>
          <Card>
            <CardHead title="Project Categories" sub="Distribution by type" />
            <div className="p-5"><div style={{ height: 240 }}><canvas ref={refCategories} /></div></div>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div ref={refEmploymentCard} className="lg:col-span-2">
          <Card>
            <CardHead title="Employment Trend" sub="Employed vs self-employed % by batch" />
            <div className="p-5"><div style={{ height: 200 }}><canvas ref={refEmployment} /></div></div>
          </Card>
        </div>
      </div>

      {/* Heatmap */}
      <Card className="mb-4">
        <CardHead title="Monthly Project Activity" sub="Submission volume per month" />
        <div className="p-5">
          <div className="grid grid-cols-12 gap-1.5 mb-1">
            {months.map(m => <div key={m} className="text-center text-[9px] text-slate-400 font-medium">{m}</div>)}
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            {vals.map((v, i) => {
              const intensity = v / max
              const bg = awarded[i]
                ? `rgba(212,168,0,${0.15 + intensity * 0.65})`
                : `rgba(10,61,143,${0.07 + intensity * 0.83})`
              return (
                <div key={i} className="hm-cell" style={{ background: bg }} title={`${months[i]}: ${v} projects${awarded[i] ? ' · Awarded month' : ''}`}>
                  <span className="text-[9px] font-mono" style={{ color: intensity > 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(10,61,143,0.5)' }}>{v}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-medium">
            <span>Less</span>
            {[0.07,0.25,0.45,0.65,0.9].map((o, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded" style={{ background: `rgba(10,61,143,${o})` }} />
            ))}
            <span>More</span>
            <span className="ml-3 text-amber-600">▪ Gold = Awarded month</span>
          </div>
        </div>
      </Card>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Alumni */}
        <div ref={refRecentAlumniCard}>
          <Card>
            <CardHead title="Recent Alumni" />
            <table className="w-full">
              <thead>
                <tr className="bg-psu-deep">
                  {['Name','Batch','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white/60 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAlumni.slice(0, 5).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-10 text-slate-400 text-[13px]">No alumni match the selected filters.</td></tr>
                ) : filteredAlumni.slice(0, 5).map(a => (
                  <tr key={a.id} className="tbl-row border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-700 text-[13px]">{a.first_name} {a.last_name}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-psu font-semibold">{a.batch_year}</td>
                    <td className="px-4 py-3"><span className={`badge text-[10px] ${STATUS_BADGE[a.employment_status] || ''}`}>{a.employment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Recent Projects */}
        <div ref={refRecentProjectsCard}>
          <Card>
            <CardHead title="Recent Projects" />
            <table className="w-full">
              <thead>
                <tr className="bg-psu-deep">
                  {['Title','Year','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white/60 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.slice(0, 5).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-10 text-slate-400 text-[13px]">No projects match the selected filters.</td></tr>
                ) : filteredProjects.slice(0, 5).map(p => (
                  <tr key={p.id} className="tbl-row border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-700 text-[13px]">{p.title}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-gold-dark font-semibold">{p.year}</td>
                    <td className="px-4 py-3"><span className={`badge text-[10px] ${PROJ_BADGE[p.status] || ''}`}>{p.status === 'Awarded' ? '🏆 ' : ''}{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  )
}
