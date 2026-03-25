import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import {
  SectionHead, TableWrap, SearchInput, Sel, IconBtn,
  StatusBadge, Pagination, Modal, FormGroup, DeleteModal
} from '../components/ui'

const EMPTY = { title:'', category:'Web App', year:'2025', adviser:'', members:'', status:'In Progress', award:'', abstract:'' }
const CATEGORIES = ['Web App','Mobile App','IoT System','Data Analytics','Desktop App']
const STATUSES   = ['Implemented','In Progress','Proposed','Awarded']
const YEARS      = ['2025','2024','2023','2022','2021','2020','2019']

const PER_PAGE = 10

export default function ProjectsPage() {
  const { toast }   = useToast()
  const { canManageData } = useAuth()
  const [rows, setRows]     = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat]       = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear]     = useState('')
  const [page, setPage]     = useState(1)
  const [modal, setModal]   = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [delModal, setDelModal] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const params = {}
    if (filterCat)    params.category = filterCat
    if (filterStatus) params.status   = filterStatus
    if (filterYear)   params.year     = filterYear
    if (search)       params.q        = search
    setLoading(true)
    try {
      const r = await api.get('/projects/', { params })
      setRows(r.data || [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterCat, filterStatus, filterYear])
  useEffect(() => { setPage(1) }, [search, filterCat, filterStatus, filterYear])

  const openAdd  = () => {
    if (!canManageData) return toast('View-only access: only Chairperson can add projects.', 'info')
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }
  const openView = (r) => { setViewing(r); setViewModal(true) }
  const openEdit = (r) => {
    if (!canManageData) return toast('View-only access: only Chairperson can edit projects.', 'info')
    setEditing(r)
    setForm({ ...r })
    setModal(true)
  }
  const openDel  = (r) => {
    if (!canManageData) return toast('View-only access: only Chairperson can delete projects.', 'info')
    setEditing(r)
    setDelModal(true)
  }

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/projects/${editing.id}`, form)
        toast('Project updated!', 'success')
      } else {
        await api.post('/projects/', form)
        toast('Project saved!', 'success')
      }
      setModal(false)
      await load()
    } catch { toast('Failed to save project.', 'error') }
  }

  const del = async () => {
    try {
      await api.delete(`/projects/${editing.id}`)
      toast('Project deleted.', 'success')
      setDelModal(false)
      await load()
    } catch { toast('Delete failed.', 'error') }
  }

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase()
    const passQ = !q || r.title?.toLowerCase().includes(q) || r.adviser?.toLowerCase().includes(q)
    const passCategory = !filterCat || r.category === filterCat
    const passStatus = !filterStatus || r.status === filterStatus
    const passYear = !filterYear || r.year === filterYear
    return passQ && passCategory && passStatus && passYear
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
  const F = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="animate-fade-up">
      <SectionHead title="Project Records" sub={`${filtered.length} capstone projects · 2019–2025`}>
        {canManageData && (
          <>
            <button className="btn-primary" onClick={openAdd}>+ Add Project</button>
          </>
        )}
      </SectionHead>

      <TableWrap>
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2.5">
          <SearchInput placeholder="Search projects…" value={search} onChange={setSearch} />
          <Sel value={filterCat}    onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Sel>
          <Sel value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Sel>
          <Sel value={filterYear}   onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </Sel>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-psu-deep">
                {['Title','Category','Year','Adviser','Members','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white/60 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="border-t border-slate-100 animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-40 bg-slate-100 rounded mb-2" />
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </td>
                    <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-10 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-slate-100 rounded-full" /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100" />
                        <div className="w-8 h-8 rounded-lg bg-slate-100" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-[13px]">No projects found.</td></tr>
              ) : paginated.map((p) => (
                <tr key={p.id} className="tbl-row border-t border-slate-100 cursor-pointer" onClick={() => openView(p)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 text-[13px]">{p.title}</div>
                    {p.award && <div className="text-[10px] text-amber-600 font-semibold mt-0.5">🏆 {p.award}</div>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{p.category}</td>
                  <td className="px-4 py-3 text-[12px] font-mono font-semibold text-gold-dark">{p.year}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{p.adviser || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 max-w-[150px] truncate">{p.members || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    {canManageData && (
                      <div className="flex gap-1.5">
                        <IconBtn title="Edit" onClick={(e) => { e.stopPropagation(); openEdit(p) }}>✏️</IconBtn>
                        <IconBtn title="Delete" danger onClick={(e) => { e.stopPropagation(); openDel(p) }}>🗑️</IconBtn>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </TableWrap>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Project Record' : 'Add Project Record'}
        panelClassName="max-w-[920px] md:max-h-none md:overflow-visible"
        footer={<>
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>{editing ? 'Update' : 'Save'} Project</button>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div className="md:col-span-2">
            <FormGroup label="Project Title"><input className="field" value={form.title} onChange={F('title')} placeholder="e.g. BarangayIS v2.0" /></FormGroup>
          </div>

          <FormGroup label="Category">
            <select className="field" value={form.category} onChange={F('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Year">
            <select className="field" value={form.year} onChange={F('year')}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </FormGroup>

          <FormGroup label="Adviser"><input className="field" value={form.adviser} onChange={F('adviser')} placeholder="Faculty adviser name" /></FormGroup>
          <FormGroup label="Members"><input className="field" value={form.members} onChange={F('members')} placeholder="Names comma-separated" /></FormGroup>

          <FormGroup label="Implementation Status">
            <select className="field" value={form.status} onChange={F('status')}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Award (if any)"><input className="field" value={form.award} onChange={F('award')} placeholder="e.g. Best in Capstone" /></FormGroup>

          <div className="md:col-span-2">
            <FormGroup label="Abstract">
              <textarea className="field" rows={3} value={form.abstract} onChange={F('abstract')} placeholder="Brief description..." style={{ resize:'vertical' }} />
            </FormGroup>
          </div>
        </div>
      </Modal>

      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Project Details"
        panelClassName="max-w-[920px]"
        footer={<button className="btn-primary" onClick={() => setViewModal(false)}>Close</button>}>
        {viewing && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-white p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-[12px] text-slate-500">Project #{viewing.id}</div>
                  <div className="text-[20px] leading-tight font-display text-psu mt-1">{viewing.title}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={viewing.status} />
                  <Tag>{viewing.category || 'No Category'}</Tag>
                  <Tag>{viewing.year || 'No Year'}</Tag>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Core Details">
                <FieldRow label="Adviser" value={viewing.adviser} />
                <FieldRow label="Award" value={viewing.award} />
                <FieldRow label="Created" value={formatDate(viewing.created_at)} />
              </InfoCard>

              <InfoCard title="Team Members">
                {splitList(viewing.members).length === 0 ? (
                  <div className="text-[13px] text-slate-400">No team members listed.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {splitList(viewing.members).map((member) => <Tag key={member}>{member}</Tag>)}
                  </div>
                )}
              </InfoCard>
            </div>

            <InfoCard title="Abstract">
              <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewing.abstract || '—'}
              </div>
            </InfoCard>
          </div>
        )}
      </Modal>

      <DeleteModal open={delModal} onClose={() => setDelModal(false)} onConfirm={del}
        item={editing?.title || ''} />
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

function splitList(value) {
  return (value || '').split(',').map(v => v.trim()).filter(Boolean)
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—'
}
