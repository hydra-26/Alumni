import { useRef, useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { logAudit } from '../utils/audit'
import { Card, CardHead, Modal, SectionHead, Badge } from '../components/ui'

const DATASETS = {
  alumni: {
    label: 'Alumni Records',
    route: '/alumni/',
    bulkRoute: '/alumni/bulk',
    auditLabel: 'alumni records',
    expectedColumns: ['batch_year', 'first_name', 'last_name', 'email', 'contact', 'employment_status', 'company'],
    requiredColumns: ['batch_year', 'first_name', 'last_name', 'employment_status'],
    valueChecks: {
      employment_status: ['Seeking', 'Self-Employed', 'Employed', 'Studying'],
    },
  },
  projects: {
    label: 'Projects',
    route: '/projects/',
    bulkRoute: '/projects/bulk',
    auditLabel: 'project records',
    expectedColumns: ['title', 'category', 'year', 'adviser', 'members', 'status', 'award', 'project_link', 'abstract'],
    requiredColumns: ['title', 'category', 'year', 'status', 'abstract'],
    valueChecks: {
      category: ['Web App', 'Mobile App', 'IoT System', 'Data Analytics', 'Desktop App'],
      status: ['Implemented', 'In Progress', 'Proposed', 'Awarded'],
    },
  },
}

export default function UploadPage() {
  const { canManageData, user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [datasetKey, setDatasetKey] = useState('alumni')
  const [preview, setPreview] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const dataset = DATASETS[datasetKey]

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)

  useEffect(() => {
    let mounted = true
    const loadHistory = async () => {
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const res = await api.get('/analytics/upload-history')
        const rows = (res.data || [])
        if (mounted) setHistory(rows)
      } catch (err) {
        if (mounted) setHistoryError('Failed to load upload history')
      } finally {
        if (mounted) setHistoryLoading(false)
      }
    }

    void loadHistory()
    const onRecordsChanged = () => { void loadHistory() }
    window.addEventListener('records:changed', onRecordsChanged)
    return () => {
      mounted = false
      window.removeEventListener('records:changed', onRecordsChanged)
    }
  }, [])

  if (!canManageData) {
    return (
      <div className="animate-fade-up">
        <SectionHead title="Upload Data" sub="Chairperson access required" />
        <Card>
          <div className="p-8 text-center text-slate-500 text-[13px]">
            This section is available only to the Chairperson role.
          </div>
        </Card>
      </div>
    )
  }

  const parseFile = async (file) => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('The selected file does not contain any sheets.')

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: '',
      raw: false,
    })

    if (!rows.length) throw new Error('The selected file is empty.')

    const headers = (rows[0] || []).map(value => String(value ?? '').trim())
    const normalizedHeaders = headers.map(normalizeColumnName)
    const expectedHeaders = dataset.expectedColumns
    const normalizedExpected = expectedHeaders.map(normalizeColumnName)

    const missingColumns = expectedHeaders.filter(expected => !normalizedHeaders.includes(normalizeColumnName(expected)))
    const excessColumns = headers.filter(header => header && !normalizedExpected.includes(normalizeColumnName(header)))

    const parsedRows = rows
      .slice(1)
      .map((cells, index) => {
        const values = {}
        headers.forEach((header, headerIndex) => {
          const normalized = normalizeColumnName(header)
          if (normalized) values[normalized] = cells[headerIndex] ?? ''
        })
        return {
          rowNumber: index + 2,
          values,
        }
      })
      .filter(row => Object.values(row.values).some(value => String(value ?? '').trim() !== ''))

    const validationErrors = collectValidationErrors(datasetKey, parsedRows)

    return {
      fileName: file.name,
      headers,
      parsedRows,
      missingColumns,
      excessColumns,
      validationErrors,
      previewRows: parsedRows.slice(0, 5),
      hasColumnIssues: missingColumns.length > 0 || excessColumns.length > 0,
    }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const parsed = await parseFile(file)
      setPreview(parsed)
      setPreviewOpen(true)
      setErrorOpen(false)
    } catch (error) {
      toast(error?.message || 'Failed to read the selected file.', 'error')
    } finally {
      event.target.value = ''
    }
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    try {
      const parsed = await parseFile(file)
      setPreview(parsed)
      setPreviewOpen(true)
      setErrorOpen(false)
    } catch (error) {
      toast(error?.message || 'Failed to read the selected file.', 'error')
    }
  }

  const openFileDialog = () => fileInputRef.current?.click()

  const clearSelectedFile = () => {
    setPreview(null)
    setPreviewOpen(false)
    setErrorOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openPreview = () => {
    if (!preview) {
      toast('Choose a file first to preview its contents.', 'info')
      return
    }

    setPreviewOpen(true)
  }

  const downloadTemplate = () => {
    const templateHeaders = dataset.expectedColumns
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders])
    const workbook = XLSX.utils.book_new()
    const sheetName = datasetKey === 'alumni' ? 'Alumni Template' : 'Projects Template'

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    worksheet['!cols'] = templateHeaders.map(column => ({ wch: Math.max(column.length + 2, 16) }))

    XLSX.writeFile(workbook, `${sheetName.replace(/\s+/g, '_')}.xlsx`)
    toast(`${dataset.label} template downloaded.`, 'success')
    void logAudit(`Downloaded ${dataset.auditLabel} template`, '#0d8a5e')
  }

  const startUpload = async () => {
    if (!preview) return
    if (preview.hasColumnIssues) return
    if (preview.validationErrors.length > 0) {
      setErrorOpen(true)
      return
    }

    setUploading(true)
    try {
      const payloads = preview.parsedRows.map(row => buildPayload(datasetKey, row.values))
      const batchSize = 200

      if (dataset.bulkRoute) {
        for (let i = 0; i < payloads.length; i += batchSize) {
          const batch = payloads.slice(i, i + batchSize)
          await api.post(dataset.bulkRoute, batch, { headers: { 'X-File-Name': preview.fileName } })
        }
      } else {
        for (const payload of payloads) {
          await api.post(dataset.route, payload, { headers: { 'X-File-Name': preview.fileName } })
        }
      }

      toast(`${preview.parsedRows.length} ${dataset.auditLabel} uploaded successfully.`, 'success')
      void logAudit(`Uploaded ${preview.parsedRows.length} ${dataset.auditLabel}`, '#0d8a5e')
      // Notify layout to refresh record counts
      window.dispatchEvent(new CustomEvent('records:changed', { detail: { dataset: datasetKey } }))
      setPreviewOpen(false)
      setErrorOpen(false)
      setPreview(null)
    } catch (error) {
      console.error('Upload error', error)
      toast(error?.response?.data?.error || error?.message || 'Upload failed. Please check the file and try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHead title="Upload Data" sub="Import alumni or project records from a spreadsheet">
        <Badge variant="gold">Chairperson only</Badge>
      </SectionHead>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHead title="Import settings" sub="Choose the record type and prepare the file template" />
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(DATASETS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setDatasetKey(key)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-150 ${datasetKey === key
                    ? 'border-psu bg-blue-50 shadow-[0_10px_24px_rgba(10,61,143,0.08)]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-[13px] font-bold text-slate-800">{config.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {key === 'alumni' ? 'Batch, names, status, and contact details' : 'Project title, category, status, and abstract'}
                  </div>
                </button>
              ))}
            </div>

            <div
              onClick={openFileDialog}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-psu hover:bg-blue-50/40 transition-all duration-200"
            >
              <div className="text-3xl mb-3">📥</div>
              <p className="text-[13px] font-semibold text-slate-600">
                Click to choose a file or drop it here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Supports .xlsx, .xls, and .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Selected file</div>
                  <div className="text-[13px] font-semibold text-slate-700 break-words">
                    {preview?.fileName || 'No file chosen'}
                  </div>
                </div>
                {preview?.fileName && (
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center text-sm transition-colors flex-shrink-0"
                    aria-label="Clear selected file"
                    title="Clear selected file"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={openFileDialog}>Choose File</button>
              <button className="btn-ghost" onClick={openPreview}>Preview</button>
              <button className="btn-ghost" onClick={downloadTemplate}>Template</button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHead title="Expected columns" sub="Validation is case-insensitive" />
            <div className="p-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Required columns</div>
              <div className="flex flex-wrap gap-2">
                {dataset.expectedColumns.map(column => (
                  <span key={column} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                    {column}
                  </span>
                ))}
              </div>
            </div>

            {datasetKey === 'alumni' ? (
              <ValidationHint title="Employment status" values={DATASETS.alumni.valueChecks.employment_status} />
            ) : (
              <>
                <ValidationHint title="Category" values={DATASETS.projects.valueChecks.category} />
                <ValidationHint title="Status" values={DATASETS.projects.valueChecks.status} />
              </>
            )}

            <div className="text-[12px] text-slate-400 leading-relaxed">
              {datasetKey === 'alumni'
                ? 'The imported file is validated against the alumni template before upload.'
                : 'Rows are mapped into the existing project fields before they are saved.'}
            </div>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead title="Upload history" sub="Recent uploads for selected dataset" />
        <div className="p-5 space-y-3">
          {historyLoading ? (
            <div className="text-[13px] text-slate-500">Loading…</div>
          ) : historyError ? (
            <div className="text-[13px] text-red-600">{historyError}</div>
          ) : history.length === 0 ? (
            <div className="text-[13px] text-slate-500">No recent uploads found for this dataset.</div>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {history.map(item => {
                    const datasetLabel = item.dataset === 'alumni' ? 'Alumni' : item.dataset === 'projects' ? 'Projects' : (item.dataset || detectDatasetFromAction(item.action))
                    const actionText = item.file_name ? `${item.file_name} — ${item.rows_count} rows` : `Uploaded ${item.rows_count} rows`
                    return (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-[13px] text-slate-700">{actionText}</div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${datasetLabel === 'Alumni' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : datasetLabel === 'Projects' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                              {datasetLabel}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</div>
                        </div>
                        <div className="text-[12px] text-slate-500">{item.actor}</div>
                      </div>
                    )
                  })}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview: ${dataset.label}`}
        panelClassName="max-w-[1160px]"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPreviewOpen(false)}>Close</button>
            <button
              className="btn-primary"
              onClick={startUpload}
              disabled={!preview || preview.hasColumnIssues || uploading}
              style={{ opacity: (!preview || preview.hasColumnIssues || uploading) ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading…' : 'Validate & Upload'}
            </button>
          </>
        }
      >
        {preview && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SummaryTile label="File" value={preview.fileName} />
              <SummaryTile label="Rows found" value={String(preview.parsedRows.length)} />
              <SummaryTile label="Columns found" value={String(preview.headers.length)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <IssuePanel title="Missing columns" items={preview.missingColumns} emptyText="None" tone={preview.missingColumns.length ? 'warn' : 'ok'} />
              <IssuePanel title="Excess columns" items={preview.excessColumns} emptyText="None" tone={preview.excessColumns.length ? 'warn' : 'ok'} />
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                First rows preview
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white">
                    <tr>
                      <Th>#</Th>
                      {dataset.expectedColumns.map(column => <Th key={column}>{column}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.previewRows.length === 0 ? (
                      <tr>
                        <td colSpan={dataset.expectedColumns.length + 1} className="px-4 py-8 text-center text-slate-400 text-[13px]">
                          No data rows were found.
                        </td>
                      </tr>
                    ) : preview.previewRows.map(row => (
                      <tr key={row.rowNumber} className="border-t border-slate-100">
                        <Td>{row.rowNumber}</Td>
                        {dataset.expectedColumns.map(column => (
                          <Td key={column}>{previewCellValue(datasetKey, row.values, column)}</Td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-[12px] text-slate-500">
              {preview.hasColumnIssues
                ? 'Fix the missing or excess columns before uploading. The import button is disabled until the structure matches the template.'
                : preview.validationErrors.length > 0
                  ? 'The file structure matches, but some rows contain invalid values. Open the error modal to review them.'
                  : 'The file structure and row values are ready for upload.'}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        title={`Validation errors: ${dataset.label}`}
        panelClassName="max-w-[900px]"
        footer={<button className="btn-primary" onClick={() => setErrorOpen(false)}>Close</button>}
      >
        {preview && preview.validationErrors.length > 0 ? (
          <div className="space-y-4">
            <div className="text-[13px] text-slate-600">
              The selected file contains invalid values in the highlighted column(s). Please correct the spreadsheet and upload it again.
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {preview.validationErrors.map((error, index) => (
                <div key={`${error.rowNumber}-${error.column}-${index}`} className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[12px] font-bold text-red-700">Row {error.rowNumber}</div>
                      <div className="text-[13px] text-slate-700 mt-1">
                        {error.column} contains <span className="font-semibold">{error.value || 'blank'}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-red-700 font-semibold text-right">
                      Allowed values: {error.allowedValues.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[13px] text-slate-500">No validation errors were found.</div>
        )}
      </Modal>
    </div>
  )
}

function ValidationHint({ title, values }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {values.map(value => (
          <span key={value} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
      <div className="text-[13px] font-semibold text-slate-800 mt-1 break-words">{value}</div>
    </div>
  )
}

function IssuePanel({ title, items, emptyText, tone }) {
  const hasItems = items.length > 0
  return (
    <div className={`rounded-2xl border p-4 ${tone === 'warn' && hasItems ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <div className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${hasItems ? 'text-slate-500' : 'text-emerald-700'}`}>{title}</div>
      {hasItems ? (
        <div className="flex flex-wrap gap-2">
          {items.map(item => <span key={item} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">{item}</span>)}
        </div>
      ) : (
        <div className="text-[12px] text-emerald-700 font-medium">{emptyText}</div>
      )}
    </div>
  )
}

function Th({ children }) {
  return <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap border-b border-slate-100">{children}</th>
}

function Td({ children }) {
  return <td className="px-4 py-3 text-[12px] text-slate-700 border-b border-slate-100 align-top">{children || '—'}</td>
}

function normalizeColumnName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
}

function normalizeValue(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function collectValidationErrors(datasetKey, rows) {
  const checks = DATASETS[datasetKey].valueChecks
  const errors = []

  rows.forEach(row => {
    Object.entries(checks).forEach(([column, allowedValues]) => {
      const rawValue = String(row.values[normalizeColumnName(column)] ?? '').trim()
      if (!rawValue) return

      const matched = allowedValues.find(value => normalizeValue(value) === normalizeValue(rawValue))
      if (!matched) {
        errors.push({
          rowNumber: row.rowNumber,
          column,
          value: rawValue,
          allowedValues,
        })
      }
    })

    DATASETS[datasetKey].requiredColumns.forEach(column => {
      const rawValue = String(row.values[normalizeColumnName(column)] ?? '').trim()
      if (!rawValue) {
        errors.push({
          rowNumber: row.rowNumber,
          column,
          value: '',
          allowedValues: ['value required'],
        })
      }
    })
  })

  return errors
}

function buildPayload(datasetKey, values) {
  if (datasetKey === 'alumni') {
    const employmentStatus = matchAllowedValue(values.employment_status, DATASETS.alumni.valueChecks.employment_status)
    return {
      first_name: String(values.first_name ?? '').trim(),
      last_name: String(values.last_name ?? '').trim(),
      batch_year: String(values.batch_year ?? '').trim(),
      email: emptyToNull(values.email),
      contact: emptyToNull(values.contact),
      employment_status: employmentStatus,
      company: emptyToNull(values.company),
    }
  }

  const category = matchAllowedValue(values.category, DATASETS.projects.valueChecks.category)
  const projectStatus = matchAllowedValue(values.status, DATASETS.projects.valueChecks.status)

  return {
    title: String(values.title ?? '').trim(),
    category,
    year: String(values.year ?? '').trim(),
    adviser: emptyToNull(values.adviser),
    members: emptyToNull(values.members),
    status: projectStatus,
    award: emptyToNull(values.award),
    project_link: emptyToNull(values.project_link),
    abstract: String(values.abstract ?? '').trim(),
  }
}

function previewCellValue(datasetKey, values, column) {
  const raw = values[normalizeColumnName(column)]
  return String(raw ?? '').trim() || '—'
}

function emptyToNull(value) {
  const text = String(value ?? '').trim()
  return text ? text : null
}

function matchAllowedValue(value, allowedValues) {
  const matched = allowedValues.find(option => normalizeValue(option) === normalizeValue(value))
  return matched || String(value ?? '').trim()
}

function detectDatasetFromAction(action) {
  const a = String(action || '').toLowerCase()
  if (a.includes('alumni')) return 'Alumni'
  if (a.includes('project')) return 'Projects'
  if (a.includes('uploaded') && a.includes('rows')) {
    if (a.includes('alumni')) return 'Alumni'
    if (a.includes('project')) return 'Projects'
  }
  return 'Other'
}