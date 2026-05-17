import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { exportAlumniToExcel } from '../utils/exportToExcel'
import { logAudit } from '../utils/audit'
import {
  SectionHead, TableWrap, SearchInput, Sel, IconBtn,
  StatusBadge, Pagination, Modal, FormGroup, DeleteModal
} from '../components/ui'

const EMPTY = { first_name:'', last_name:'', batch_year:'2025', email:'', contact:'', employment_status:'Seeking', company:'' }
const STATUSES = ['Employed','Self-Employed','Seeking','Studying']

export default function AlumniPage() {
  const { toast }   = useToast()
  const { canManageData, isAdmin } = useAuth()
  const [rows, setRows]     = useState([])
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage]     = useState(1)
  const [modal, setModal]   = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [delModal, setDelModal] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const PER_PAGE = 10

  const load = async () => {
    const params = {}
    if (filterBatch)  params.batch  = filterBatch
    if (filterStatus) params.status = filterStatus
    if (search)       params.q      = search
    setLoading(true)
    try {
      const r = await api.get('/alumni/', { params })
      setRows(r.data || [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterBatch, filterStatus])
  useEffect(() => { setPage(1) }, [search, filterBatch, filterStatus])

  const openAdd  = () => {
    if (!canManageData) return toast('View-only access: only Chairperson can add records.', 'info')
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }
  
  const handleExport = () => {
    const filename = `Alumni_Records_${new Date().toISOString().split('T')[0]}.xlsx`
    exportAlumniToExcel(filtered, filename)
    toast('Alumni records exported successfully!', 'success')
    void logAudit('Export alumni records (Excel)', '#0d8a5e')
  }
  const openView = (r) => { setViewing(r); setViewModal(true) }
  const openEdit = (r) => {
    if (!canManageData) return toast('View-only access: only Chairperson can edit records.', 'info')
    setEditing(r)
    setForm({ ...r })
    setModal(true)
  }
  const openDel  = (r) => {
    if (!canManageData) return toast('View-only access: only Chairperson can delete records.', 'info')
    setEditing(r)
    setDelModal(true)
  }

  const save = async () => {
    const payload = { ...form }
    delete payload.skills
    try {
      if (editing) {
        await api.put(`/alumni/${editing.id}`, payload)
        toast('Alumni record updated!', 'success')
      } else {
        await api.post('/alumni/', payload)
        toast('Alumni record added!', 'success')
      }
      setModal(false)
      await load()
      window.dispatchEvent(new CustomEvent('records:changed', { detail: { dataset: 'alumni' } }))
    } catch { toast('Failed to save record.', 'error') }
  }

  const del = async () => {
    try {
      await api.delete(`/alumni/${editing.id}`)
      toast('Record deleted.', 'success')
      setDelModal(false)
      await load()
      window.dispatchEvent(new CustomEvent('records:changed', { detail: { dataset: 'alumni' } }))
    } catch { toast('Delete failed.', 'error') }
  }

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase()
    const passQ = !q || `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || r.batch_year?.includes(q)
    const passBatch = !filterBatch || r.batch_year === filterBatch
    const passStatus = !filterStatus || r.employment_status === filterStatus
    return passQ && passBatch && passStatus
  }).sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB - dateA
  })

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
    if (page > maxPage) setPage(maxPage)
  }, [filtered.length, page])

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)
  
  const uniqueBatchYears = (() => {
    const years = new Set(rows.map(r => r.batch_year).filter(Boolean))
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  })()

  const F = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const showActionsColumn = !isAdmin

  return (
    <div className="animate-fade-up">
      <SectionHead title="Alumni Records" sub={`${filtered.length} registered alumni`}>
        <div className="flex gap-2">
          {canManageData && <button className="btn-primary" onClick={openAdd}>+ Add Alumni</button>}
          <button className="btn-primary" onClick={handleExport} style={{backgroundColor: '#10b981'}}>📥 Export</button>
        </div>
      </SectionHead>

      <TableWrap>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2.5">
          <SearchInput placeholder="Search by name or batch…" value={search} onChange={setSearch} />
          <Sel value={filterBatch}  onChange={e => setFilterBatch(e.target.value)}>
            <option value="">All Batches</option>
            {uniqueBatchYears.map(y => <option key={y}>{y}</option>)}
          </Sel>
          <Sel value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Sel>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-psu-deep">
                {['Name','Batch','Contact','Employment', ...(showActionsColumn ? ['Actions'] : [])].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white/60 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="border-t border-slate-100 animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-36 bg-slate-100 rounded mb-2" />
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                    </td>
                    <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-slate-100 rounded-full" /></td>
                    {showActionsColumn && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100" />
                          <div className="w-8 h-8 rounded-lg bg-slate-100" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={showActionsColumn ? 5 : 4} className="text-center py-12 text-slate-400 text-[13px]">No alumni records found.</td></tr>
              ) : paginated.map((a) => (
                <tr key={a.id} className="tbl-row border-t border-slate-100 cursor-pointer" onClick={() => openView(a)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 text-[13px]">{a.first_name} {a.last_name}</div>
                    {a.company && <div className="text-[11px] text-slate-400 mt-0.5">{a.company}</div>}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono font-semibold text-psu">{a.batch_year}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 font-mono">{a.contact || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.employment_status} /></td>
                  {showActionsColumn && (
                    <td className="px-4 py-3">
                      {canManageData && (
                        <div className="flex gap-1.5">
                          <IconBtn title="Edit" onClick={(e) => { e.stopPropagation(); openEdit(a) }}>✏️</IconBtn>
                          <IconBtn title="Delete" danger onClick={(e) => { e.stopPropagation(); openDel(a) }}>🗑️</IconBtn>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </TableWrap>

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Alumni Record' : 'Add Alumni Record'}
        panelClassName="max-w-[920px] md:max-h-none md:overflow-visible"
        footer={<>
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>{editing ? 'Update' : 'Save'} Alumni</button>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <FormGroup label="First Name"><input className="field" value={form.first_name} onChange={F('first_name')} placeholder="First name" /></FormGroup>
          <FormGroup label="Last Name"><input className="field" value={form.last_name} onChange={F('last_name')} placeholder="Last name" /></FormGroup>

          <FormGroup label="Batch Year">
            <select className="field" value={form.batch_year} onChange={F('batch_year')}>
              {uniqueBatchYears.map(y => <option key={y}>{y}</option>)}
            </select>
          </FormGroup>

          <FormGroup label="Email Address"><input className="field" type="email" value={form.email} onChange={F('email')} placeholder="student@psu.edu.ph" /></FormGroup>
          <FormGroup label="Contact Number"><input className="field" value={form.contact} onChange={F('contact')} placeholder="+63 9XX XXX XXXX" /></FormGroup>

          <FormGroup label="Employment Status">
            <select className="field" value={form.employment_status} onChange={F('employment_status')}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Company / Employer"><input className="field" value={form.company} onChange={F('company')} placeholder="Optional" /></FormGroup>

        </div>
      </Modal>

      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Alumni Details"
        panelClassName="max-w-[920px]"
        footer={<button className="btn-primary" onClick={() => setViewModal(false)}>Close</button>}>
        {viewing && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-white p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-psu text-white flex items-center justify-center font-bold text-sm">
                    {`${viewing.first_name?.[0] || ''}${viewing.last_name?.[0] || ''}`}
                  </div>
                  <div>
                    <div className="text-[18px] font-display text-psu leading-tight">{viewing.first_name} {viewing.last_name}</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">Alumni Record #{viewing.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={viewing.employment_status} />
                  <Tag>{viewing.batch_year || 'No Batch'}</Tag>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Contact">
                <FieldRow label="Email" value={viewing.email} />
                <FieldRow label="Contact" value={viewing.contact} />
                <FieldRow label="Company" value={viewing.company} />
              </InfoCard>

              <InfoCard title="Record Info">
                <FieldRow label="Batch Year" value={viewing.batch_year} />
                <FieldRow label="Created" value={formatDate(viewing.created_at)} />
              </InfoCard>
            </div>

          </div>
        )}
      </Modal>

      <DeleteModal open={delModal} onClose={() => setDelModal(false)} onConfirm={del}
        item={editing ? `${editing.first_name} ${editing.last_name}` : ''} />
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FieldRow({ label, value }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 items-start text-[13px]">
      <div className="text-slate-400 font-semibold">{label}</div>
      <div className="text-slate-700 break-words">{value || '—'}</div>
    </div>
  )
}

function Tag({ children }) {
  return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-psu border border-blue-100">{children}</span>
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—'
}
