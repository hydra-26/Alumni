import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import {
  SectionHead, TableWrap, SearchInput, Sel, IconBtn,
  StatusBadge, Card, Modal, FormGroup, FormRow, DeleteModal, Pagination
} from '../components/ui'

const EMPTY = { first_name:'', last_name:'', username:'', email:'', role:'Chairperson', password:'' }

const PASSWORD_LENGTH = 8
const PASSWORD_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  special: '!@#$%^&*?'
}

const pickChar = (chars) => chars[Math.floor(Math.random() * chars.length)]

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const generatePassword = () => {
  const chars = [
    pickChar(PASSWORD_SETS.upper),
    pickChar(PASSWORD_SETS.lower),
    pickChar(PASSWORD_SETS.number),
    pickChar(PASSWORD_SETS.special)
  ]
  const all = `${PASSWORD_SETS.upper}${PASSWORD_SETS.lower}${PASSWORD_SETS.number}${PASSWORD_SETS.special}`
  while (chars.length < PASSWORD_LENGTH) {
    chars.push(pickChar(all))
  }
  return shuffle(chars).join('')
}

function Avatar({ name, color }) {
  const initials = name.split(' ').map(n=>n[0]).slice(0,2).join('')
  const COLORS = ['from-psu to-psu-mid','from-gold-dark to-gold','from-emerald-600 to-emerald-400','from-violet-600 to-violet-400','from-sky-600 to-sky-400']
  const grad = color !== undefined ? COLORS[color % COLORS.length] : COLORS[0]
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 bg-gradient-to-br ${grad}`}>
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const { toast } = useToast()
  const [rows, setRows]   = useState([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [delModal, setDelModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm]   = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const PER_PAGE = 8

  const load = async () => {
    const params = {}
    if (filterRole) params.role = filterRole
    if (search)     params.q    = search
    setLoading(true)
    try {
      const r = await api.get('/users/', { params })
      setRows(r.data || [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterRole])
  useEffect(() => { setPage(1) }, [search, filterRole])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (r) => { setEditing(r); setForm({ ...r, password:'' }); setModal(true) }
  const openDel  = (r) => { setEditing(r); setDelModal(true) }
  const openDetail = (r) => { setSelectedUser(r); setDetailModal(true) }

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, form)
        toast('User updated!', 'success')
      } else {
        await api.post('/users/', form)
        toast('User created!', 'success')
      }
      setModal(false)
      await load()
    } catch { toast('Failed to save user.', 'error') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try {
      await api.delete(`/users/${editing.id}`)
      toast('User deleted.', 'success')
      setDelModal(false)
      await load()
    } catch { toast('Delete failed.', 'error') }
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    return !q || `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q)
  }).filter(r => !filterRole || r.role === filterRole).sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB - dateA
  })

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
    if (page > maxPage) setPage(maxPage)
  }, [filtered.length, page])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const F = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleGeneratePassword = () => setForm(f => ({ ...f, password: generatePassword() }))

  return (
    <div className="animate-fade-up">
      <SectionHead title="User Management" sub="Chairperson and OSAA role assignments">
        <button className="btn-primary" onClick={openAdd}>+ Add User</button>
      </SectionHead>

      <TableWrap>
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2.5">
          <SearchInput placeholder="Search users…" value={search} onChange={setSearch} />
          <Sel value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            <option>Chairperson</option>
            <option>OSAA Dean</option>
            <option>OSAA Director</option>
          </Sel>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-psu-deep">
                {['User','Email','Username','Role','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white/60 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="border-t border-slate-100 animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="h-3.5 w-28 bg-slate-100 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-slate-100 rounded-full" /></td>
                    
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100" />
                        <div className="w-8 h-8 rounded-lg bg-slate-100" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-[13px]">No users found.</td></tr>
              ) : paginated.map((u, i) => (
                <tr key={u.id} className="tbl-row border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => openDetail(u)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${u.first_name} ${u.last_name}`} color={(page - 1) * PER_PAGE + i} />
                      <span className="font-semibold text-slate-800 text-[13px]">{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-700">{u.email}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{u.username}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <IconBtn title="Edit" onClick={() => openEdit(u)}>✏️</IconBtn>
                      <IconBtn title="Delete" danger onClick={() => openDel(u)}>🗑️</IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </TableWrap>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit User' : 'Add User'}
        footer={<>
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? (editing ? 'Updating...' : 'Creating...') : `${editing ? 'Update' : 'Create'} User`}
          </button>
        </>}>
        <FormRow>
          <FormGroup label="First Name"><input className="field" value={form.first_name} onChange={F('first_name')} placeholder="First name" /></FormGroup>
          <FormGroup label="Last Name"><input className="field" value={form.last_name}  onChange={F('last_name')}  placeholder="Last name" /></FormGroup>
        </FormRow>
        <FormGroup label="Username"><input className="field" value={form.username} onChange={F('username')} placeholder="login.username" /></FormGroup>
        <FormGroup label="Email"><input className="field" type="email" value={form.email} onChange={F('email')} placeholder="user@psu.edu.ph" disabled={!!editing} /></FormGroup>
        <FormGroup label="Role">
          <select className="field" value={form.role} onChange={F('role')}>
            <option>Chairperson</option>
            <option>OSAA Dean</option>
            <option>OSAA Director</option>
          </select>
        </FormGroup>
        <FormGroup label={editing ? 'New Password (leave blank to keep)' : 'Password'}>
          <div className="relative">
            <input className="field pr-28" type="password" value={form.password} onChange={F('password')} placeholder="••••••••" disabled={!!editing} />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={!!editing}
                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-colors ${
                  editing
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                    : 'border-blue-100 bg-blue-50 text-psu hover:bg-blue-100 hover:border-psu/30'
                }`}
              >
                Generate
              </button>
            </div>
          </div>
        </FormGroup>
      </Modal>

      <DeleteModal open={delModal} onClose={() => setDelModal(false)} onConfirm={del}
        item={editing ? `${editing.first_name} ${editing.last_name}` : ''} />

      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="User Details">
        {selectedUser && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-200">
              <Avatar name={`${selectedUser.first_name} ${selectedUser.last_name}`} color={0} />
              <div className="flex-1">
                <div className="text-[16px] font-bold text-slate-800">{selectedUser.first_name} {selectedUser.last_name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={selectedUser.role} />
                  <StatusBadge status={selectedUser.status || 'Active'} />
                </div>
              </div>
            </div>
            {/* Account Info */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Account Information</div>
              <div className="space-y-2.5">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Username</div>
                  <div className="text-[13px] font-mono text-slate-700">{selectedUser.username}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Email</div>
                  <div className="text-[13px] text-slate-700">{selectedUser.email}</div>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </Modal>

    </div>
  )
}

