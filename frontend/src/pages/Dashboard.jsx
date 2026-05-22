import { useState, useEffect, useMemo, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import api from '../utils/api'
import { logAudit } from '../utils/audit'
import { KpiCard, Card, CardHead, SectionHead, Sel, Modal, NoDataState } from '../components/ui'
import { useToast } from '../context/ToastContext'
import headerImg from '../assets/header.png'
import footerImg from '../assets/footer.png'

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
    alumniTrend: true,
    employment: true,
    recentAlumni: true,
    recentProjects: true,
  })

  // Chart refs
  const refProjects   = useRef(null)
  const refCategories = useRef(null)
  const refAlumniTrend = useRef(null)
  const refEmployment = useRef(null)
  const chartInstances = useRef({})

  // Export capture refs
  const refMetricsCard = useRef(null)
  const refProjectsCard = useRef(null)
  const refCategoriesCard = useRef(null)
  const refAlumniTrendCard = useRef(null)
  const refEmploymentCard = useRef(null)
  const refRecentAlumniCard = useRef(null)
  const refRecentProjectsCard = useRef(null)

  const exportItems = [
    { key: 'metrics', label: 'Key Metrics', ref: refMetricsCard },
    { key: 'projects', label: 'Projects Per Batch Year', ref: refProjectsCard },
    { key: 'categories', label: 'Project Categories', ref: refCategoriesCard },
    { key: 'alumniTrend', label: 'Alumni Trend', ref: refAlumniTrendCard },
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

  const kpisByYear = useMemo(() => {
    const byYear = {}

    for (const year of availableYears) {
      const yearAlumni = alumni.filter(a => a.batch_year === year)
      const yearProjects = projects.filter(p => p.year === year)
      const alumniTotal = yearAlumni.length
      const projectsTotal = yearProjects.length
      const employed = yearAlumni.filter(a => a.employment_status === 'Employed').length
      const implemented = yearProjects.filter(p => p.status === 'Implemented').length
      const awarded = yearProjects.filter(p => p.status === 'Awarded').length

      byYear[year] = {
        total_alumni: alumniTotal,
        total_projects: projectsTotal,
        employment_rate: alumniTotal ? Math.round((employed / alumniTotal) * 100) : 0,
        award_winning: awarded,
        implemented_rate: projectsTotal ? Math.round((implemented / projectsTotal) * 100) : 0,
      }
    }

    return byYear
  }, [availableYears, alumni, projects])

  const metricComparisons = useMemo(() => {
    const emptyComparison = { state: 'na' }

    if (yearFilter === 'all') {
      return {
        total_alumni: emptyComparison,
        total_projects: emptyComparison,
        employment_rate: emptyComparison,
        award_winning: emptyComparison,
        implemented_rate: emptyComparison,
      }
    }

    const currentYear = kpisByYear[yearFilter]
    const previousYearKey = String(Number(yearFilter) - 1)
    const previousYear = kpisByYear[previousYearKey]

    const buildComparison = (currentValue, previousValue) => {
      if (currentYear == null || previousYear == null || previousValue == null || previousValue === 0) {
        return emptyComparison
      }

      const change = ((currentValue - previousValue) / previousValue) * 100
      return {
        state: 'value',
        up: change >= 0,
        text: `${Math.abs(change).toFixed(2)}%`,
      }
    }

    return {
      total_alumni: buildComparison(currentYear?.total_alumni ?? 0, previousYear?.total_alumni ?? 0),
      total_projects: buildComparison(currentYear?.total_projects ?? 0, previousYear?.total_projects ?? 0),
      employment_rate: buildComparison(currentYear?.employment_rate ?? 0, previousYear?.employment_rate ?? 0),
      award_winning: buildComparison(currentYear?.award_winning ?? 0, previousYear?.award_winning ?? 0),
      implemented_rate: buildComparison(currentYear?.implemented_rate ?? 0, previousYear?.implemented_rate ?? 0),
    }
  }, [yearFilter, kpisByYear])

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

  const alumniCountTrend = useMemo(() => alumniYears.map(y => filteredAlumni.filter(a => a.batch_year === y).length), [alumniYears, filteredAlumni])

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

  // Unfiltered Alumni Trend and Employment Trend (not affected by year filter)
  const allAlumniYears = useMemo(() => {
    const yearSet = new Set()
    for (const a of alumni) if (a.batch_year) yearSet.add(a.batch_year)
    return Array.from(yearSet).sort((a, b) => Number(a) - Number(b))
  }, [alumni])

  const allAlumniCountTrend = useMemo(() => allAlumniYears.map(y => alumni.filter(a => a.batch_year === y).length), [allAlumniYears, alumni])

  const allEmployedTrend = useMemo(() => allAlumniYears.map(y => {
    const yearAlumni = alumni.filter(a => a.batch_year === y)
    const employed = yearAlumni.filter(a => a.employment_status === 'Employed').length
    return yearAlumni.length ? Math.round((employed / yearAlumni.length) * 100) : 0
  }), [allAlumniYears, alumni])

  const allSelfEmpTrend = useMemo(() => allAlumniYears.map(y => {
    const yearAlumni = alumni.filter(a => a.batch_year === y)
    const selfEmp = yearAlumni.filter(a => a.employment_status === 'Self-Employed').length
    return yearAlumni.length ? Math.round((selfEmp / yearAlumni.length) * 100) : 0
  }), [allAlumniYears, alumni])

  const hasProjectChartData = projectYears.length > 0
  const hasCategoryChartData = categoryLabels.length > 0
  const hasAlumniTrendData = allAlumniYears.length > 0
  const hasEmploymentTrendData = allAlumniYears.length > 0

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

    // Alumni trend line
    if (refAlumniTrend.current) {
      destroy('alumniTrend')
      chartInstances.current.alumniTrend = new Chart(refAlumniTrend.current, {
        type: 'line',
        data: {
          labels: allAlumniYears,
          datasets: [{
            label: 'Alumni Count',
            data: allAlumniCountTrend,
            borderColor: PSU,
            backgroundColor: 'rgba(10,61,143,0.08)',
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: PSU,
            borderWidth: 2.5,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID }, ticks: { precision: 0 } } } },
      })
    }

    // Employment trend line
    if (refEmployment.current) {
      destroy('employment')
      chartInstances.current.employment = new Chart(refEmployment.current, {
        type: 'line',
        data: {
          labels: allAlumniYears,
          datasets: [
            { label: 'Employed %',      data: allEmployedTrend, borderColor: PSU,  backgroundColor: 'rgba(10,61,143,0.07)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: PSU,  borderWidth: 2.5 },
            { label: 'Self-Employed %', data: allSelfEmpTrend, borderColor: GOLD, backgroundColor: 'rgba(212,168,0,0.05)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: GOLD, borderWidth: 2.5 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID } } } },
      })
    }

    return () => { Object.keys(chartInstances.current).forEach(destroy) }
  }, [projectYears, totalsByYear, awardedByYear, categoryLabels, categoryValues, alumniYears, alumniCountTrend, employedTrend, selfEmpTrend, allAlumniYears, allAlumniCountTrend, allEmployedTrend, allSelfEmpTrend])

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
      const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 36
      const titleFontSize = 16
      const mainFontSize = 13
      const metaFontSize = 11
      const lineGap = 6
      const exportTitle = 'Dashboard Report'

      const headerImage = await loadImage(headerImg).catch(() => null)
      const footerImage = await loadImage(footerImg).catch(() => null)
      const headerWidth = headerImage ? pageWidth : 0
      const headerHeight = headerImage ? (headerImage.height / headerImage.width) * headerWidth : 0
      const footerWidth = footerImage ? pageWidth : 0
      const footerHeight = footerImage ? (footerImage.height / footerImage.width) * footerWidth : 0
      const headerY = 0
      const footerY = footerImage ? pageHeight - footerHeight : 0

      const drawPageFrame = () => {
        if (headerImage) {
          pdf.addImage(headerImage, 'PNG', 0, headerY, headerWidth, headerHeight, undefined, 'FAST')
        }

        if (footerImage) {
          pdf.addImage(footerImage, 'PNG', 0, footerY, footerWidth, footerHeight, undefined, 'FAST')
        }

        let cursorY = margin + titleFontSize
        if (headerImage) {
          cursorY = headerY + headerHeight + 12 + titleFontSize
        }
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(titleFontSize)
        pdf.text(exportTitle, pageWidth / 2, cursorY, { align: 'center' })

        cursorY += mainFontSize + lineGap
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(mainFontSize)
        pdf.text('Performance Overview', pageWidth / 2, cursorY, { align: 'center' })

        cursorY += metaFontSize + lineGap
        pdf.setFontSize(metaFontSize)
        pdf.text(`Data for ${yearLabel}`, pageWidth / 2, cursorY, { align: 'center' })

        const contentTop = cursorY + metaFontSize + lineGap
        const contentBottom = footerImage ? footerY - 12 : pageHeight - margin

        return { contentTop, contentBottom }
      }

      const gap = 12
      const contentWidth = pageWidth - margin * 2
      const fullWidthKeys = new Set(['metrics', 'alumniTrend', 'employment'])
      const rows = []
      const buffer = []

      selected.forEach(item => {
        if (fullWidthKeys.has(item.key)) {
          if (buffer.length) {
            rows.push({ items: [...buffer] })
            buffer.length = 0
          }
          rows.push({ items: [item], fullWidth: true })
        } else {
          buffer.push(item)
          if (buffer.length === 2) {
            rows.push({ items: [...buffer] })
            buffer.length = 0
          }
        }
      })

      if (buffer.length) {
        rows.push({ items: [...buffer] })
      }

      const canvasMap = new Map()
      for (const item of selected) {
        const canvas = await html2canvas(item.ref.current, { scale: 2, backgroundColor: '#ffffff' })
        canvasMap.set(item.key, canvas)
      }

      let { contentTop, contentBottom } = drawPageFrame()
      let currentY = contentTop

      rows.forEach((row) => {
        const columns = row.items.length
        const columnWidth = columns === 1 ? contentWidth : (contentWidth - gap) / 2
        const canvases = row.items.map(item => canvasMap.get(item.key)).filter(Boolean)
        const rowHeight = Math.max(...canvases.map(canvas => (canvas.height * columnWidth) / canvas.width))
        const availableHeight = contentBottom - currentY

        if (rowHeight > availableHeight && currentY !== contentTop) {
          pdf.addPage()
          const pageBounds = drawPageFrame()
          contentTop = pageBounds.contentTop
          contentBottom = pageBounds.contentBottom
          currentY = contentTop
        }

        const adjustedAvailable = contentBottom - currentY
        const rowScale = rowHeight > adjustedAvailable ? adjustedAvailable / rowHeight : 1
        const scaledGap = gap * rowScale
        const rowWidth = columnWidth * columns + gap * Math.max(0, columns - 1)
        const scaledRowWidth = rowWidth * rowScale
        const startX = (pageWidth - scaledRowWidth) / 2

        canvases.forEach((canvas, colIndex) => {
          const renderWidth = columnWidth * rowScale
          const renderHeight = (canvas.height * columnWidth) / canvas.width * rowScale
          const x = startX + colIndex * (renderWidth + scaledGap)
          const y = currentY
          const imgData = canvas.toDataURL('image/png')

          pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST')
        })

        currentY += rowHeight * rowScale + scaledGap
      })

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
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
          <div className="p-5 animate-pulse"><div className="h-[200px] bg-slate-100 rounded-xl" /></div>
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
      <SectionHead title="Performance Overview" sub={`Data Visualizations for Alumni and Projects`}>
        <Sel value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="all">All Batches</option>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard icon="🎓" label="Total Alumni"    value={displayKpis.total_alumni}           comparison={metricComparisons.total_alumni} color="blue" />
          <KpiCard icon="📁" label="Total Projects"  value={displayKpis.total_projects}         comparison={metricComparisons.total_projects} color="gold" />
          <KpiCard icon="💼" label="Employment Rate" value={`${displayKpis.employment_rate}%`}  comparison={metricComparisons.employment_rate} color="green" />
          <KpiCard icon="🚀" label="Implemented"     value={`${displayKpis.implemented_rate}%`} comparison={metricComparisons.implemented_rate} color="red" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div ref={refProjectsCard}>
          <Card>
            <CardHead title="Projects Per Batch Year" sub="Annual submissions & awards" />
            <div className="p-5">
              <div style={{ height: 240 }}>
                {hasProjectChartData ? <canvas ref={refProjects} /> : <NoDataState />}
              </div>
            </div>
          </Card>
        </div>
        <div ref={refCategoriesCard}>
          <Card>
            <CardHead title="Project Categories" sub="Distribution by type" />
            <div className="p-5">
              <div style={{ height: 240 }}>
                {hasCategoryChartData ? <canvas ref={refCategories} /> : <NoDataState />}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div ref={refAlumniTrendCard} className="lg:col-span-2">
          <Card>
            <CardHead title="Alumni Trend" sub="Total alumni per batch year" />
            <div className="p-5">
              <div style={{ height: 200 }}>
                {hasAlumniTrendData ? <canvas ref={refAlumniTrend} /> : <NoDataState />}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div ref={refEmploymentCard} className="lg:col-span-2">
          <Card>
            <CardHead title="Employment Trend" sub="Employed vs self-employed % by batch" />
            <div className="p-5">
              <div style={{ height: 200 }}>
                {hasEmploymentTrendData ? <canvas ref={refEmployment} /> : <NoDataState />}
              </div>
            </div>
          </Card>
        </div>
      </div>

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
