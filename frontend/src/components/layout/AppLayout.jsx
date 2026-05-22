import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal } from '../ui'
import logoDash from '../../assets/logo-dash.svg'

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { key: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { key: 'number', label: 'One number', test: (value) => /\d/.test(value) },
  { key: 'special', label: 'One special character', test: (value) => /[^A-Za-z\d]/.test(value) },
]

const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: <GridIcon />, exact: true },
      { to: '/analytics', label: 'Analytics', icon: <PulseIcon /> },
    ],
  },
  {
    group: 'Records',
    items: [
      { to: '/alumni',   label: 'Alumni Records', icon: <UsersIcon /> },
      { to: '/projects', label: 'Projects',        icon: <BookIcon /> },
    ],
  },
]

const DATA_NAV = {
  group: 'Data Tools',
  items: [
    { to: '/upload', label: 'Upload Data', icon: <UploadIcon /> },
  ],
}

const ADMIN_NAV = {
  group: 'Administration',
  items: [
    { to: '/users',  label: 'User Management',  icon: <UserIcon /> },
    { to: '/system', label: 'User Activity Logs', icon: <CogIcon /> },
  ],
}

const PAGE_META = {
  '/':          { name: 'Dashboard',        crumb: 'PSU · AlumniTrack · Overview' },
  '/analytics': { name: 'Analytics',        crumb: 'PSU · AlumniTrack · Performance Analytics' },
  '/alumni':    { name: 'Alumni Records',   crumb: 'PSU · AlumniTrack · Records' },
  '/projects':  { name: 'Projects',         crumb: 'PSU · AlumniTrack · Records' },
  '/upload':    { name: 'Upload Data',      crumb: 'PSU · AlumniTrack · Data Tools' },
  '/reports':   { name: 'Export Reports',   crumb: 'PSU · AlumniTrack · Reports' },
  '/users':     { name: 'User Management',  crumb: 'PSU · AlumniTrack · Administration' },
  '/system':    { name: 'User Activity Logs', crumb: 'PSU · AlumniTrack · Administration' },
}

export default function AppLayout() {
  const { user, logout, isAdmin, canManageData } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const profileMenuRef = useRef(null)
  const [counts, setCounts] = useState({ alumni: 0, projects: 0 })
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changeForm, setChangeForm] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const meta = PAGE_META[pathname] || { name: 'AlumniTrack', crumb: 'PSU · AlumniTrack' }
  const initials = user ? (user.name.split(' ').map(n => n[0]).slice(0, 2).join('')) : 'U'

  const passwordChecks = PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(changeForm.password) }))
  const passwordsMatch = changeForm.password.length > 0 && changeForm.password === changeForm.confirmPassword
  const canChangePassword = Boolean(changeForm.currentPassword.trim()) && passwordChecks.every(rule => rule.passed) && passwordsMatch

  useEffect(() => {
    api.get('/analytics/kpis')
      .then(r => {
        const data = r.data || {}
        setCounts({
          alumni: Number(data.total_alumni) || 0,
          projects: Number(data.total_projects) || 0,
        })
      })
      .catch(() => setCounts({ alumni: 0, projects: 0 }))
  }, [])

  useEffect(() => {
    const refreshCounts = () => {
      api.get('/analytics/kpis')
        .then(r => {
          const data = r.data || {}
          setCounts({
            alumni: Number(data.total_alumni) || 0,
            projects: Number(data.total_projects) || 0,
          })
        })
        .catch(() => {})
    }

    window.addEventListener('records:changed', refreshCounts)
    return () => window.removeEventListener('records:changed', refreshCounts)
  }, [])

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        setChangePasswordOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const formatCount = (value) => (value > 999 ? '999+' : String(value))

  const resetChangePasswordForm = () => {
    setChangeForm({ currentPassword: '', password: '', confirmPassword: '' })
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setChangeLoading(false)
  }

  const openChangePasswordModal = () => {
    setProfileMenuOpen(false)
    setChangePasswordOpen(true)
  }

  const closeChangePasswordModal = () => {
    setChangePasswordOpen(false)
    resetChangePasswordForm()
  }

  const handleChangePassword = async () => {
    if (!changeForm.currentPassword.trim()) {
      toast('Enter your current password.', 'error')
      return
    }
    if (!passwordChecks.every(rule => rule.passed)) {
      toast('Please complete all new password requirements.', 'error')
      return
    }
    if (!passwordsMatch) {
      toast('New password and confirmation must match.', 'error')
      return
    }

    setChangeLoading(true)
    try {
      await api.post('/auth/password-change', {
        current_password: changeForm.currentPassword,
        password: changeForm.password,
        confirm_password: changeForm.confirmPassword,
      })
      toast('Password changed successfully.', 'success')
      closeChangePasswordModal()
    } catch (error) {
      toast(error?.response?.data?.error || 'Unable to change password.', 'error')
    } finally {
      setChangeLoading(false)
    }
  }

  const doLogout = () => {
    setProfileMenuOpen(false)
    logout()
    toast('Signed out successfully', 'info')
    navigate('/login')
  }

  const allNav = [
    ...NAV,
    ...(canManageData ? [DATA_NAV] : []),
    ...(isAdmin ? [ADMIN_NAV] : []),
  ]

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="w-64 fixed top-0 left-0 bottom-0 z-50 flex flex-col sidebar-gradient"
             style={{ boxShadow: '4px 0 24px rgba(5,31,74,0.4)' }}>

        {/* Brand */}
        <div className="px-5 py-5 border-b border-gold/10 flex items-center justify-center">
          <img src={logoDash} alt="AlumniTrack Logo" className="h-16 object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto px-2">
          {allNav.map(section => (
            <div key={section.group} className="mb-2">
              <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.14em] px-3 mb-1.5 mt-3">
                {section.group}
              </p>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="w-4 h-4 flex-shrink-0 opacity-80">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {(item.to === '/alumni' || item.to === '/projects') && (
                    <span className="text-[10px] font-mono font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded-full">
                      {item.to === '/alumni' ? formatCount(counts.alumni) : formatCount(counts.projects)}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* View-only notice
          {!isAdmin && (
            <div className="mx-3 mt-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <p className="text-sky-300 text-[10px] font-medium leading-relaxed">
                👁️ <span className="font-semibold">View-Only Mode</span><br />
                OSAA Dean and OSAA Director can view records only.
              </p>
            </div>
          )} */}
        </nav>

        {/* User footer */}
        <div ref={profileMenuRef} className="relative px-4 py-4 border-t border-gold/10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[13px] text-psu-deep transition-transform duration-150 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #f5c518, #d4a800)', border: '2px solid rgba(245,197,24,0.3)' }}
          >
            {initials}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-white/85 text-[12px] font-semibold truncate">{user?.name}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${isAdmin ? 'text-gold' : 'text-sky-300'}`}>
              {user?.role}
            </div>
          </div>
          {profileMenuOpen && (
            <div className="absolute bottom-[calc(100%+12px)] left-4 w-[220px] rounded-2xl border border-slate-100 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] overflow-hidden">
              <button
                type="button"
                onClick={openChangePasswordModal}
                className="w-full px-4 py-3 text-left text-[13px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-psu transition-colors"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={doLogout}
                className="w-full px-4 py-3 text-left text-[13px] font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-100"
              >
                Sign Out
              </button>
            </div>
          )}
          <button onClick={doLogout} title="Sign Out"
                  className="text-white/25 hover:text-red-400 p-1.5 rounded-lg transition-colors duration-150">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">

        {/* View-only banner */}
        {/* {!isAdmin && (
          <div className="flex items-center gap-3 px-7 py-2.5 bg-blue-50 border-b border-blue-100 text-[12px] text-slate-600">
            <InfoIcon />
            You're signed in with <strong className="text-psu mx-1">view-only</strong> access
            — Upload, edit, and delete actions require Chairperson access.
          </div>
        )} */}

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-[60px] flex items-center gap-4 px-7"
                style={{ boxShadow: '0 1px 4px rgba(10,61,143,0.06)' }}>
          <div className="flex-1">
            <div className="font-display text-psu text-[17px]">Welcome {user?.username || user?.name || 'User'}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-7">
          <Outlet />
        </main>
      </div>

      <Modal
        open={changePasswordOpen}
        onClose={closeChangePasswordModal}
        title="Change Password"
        panelClassName="max-w-[620px]"
        bodyClassName="space-y-5"
      >
        <div className="pb-1">
          <p className="text-slate-500 text-[14px]">
            Enter your current password and choose a new password.
          </p>
        </div>

        <PasswordField
          label="Current Password"
          value={changeForm.currentPassword}
          onChange={(value) => setChangeForm(form => ({ ...form, currentPassword: value }))}
          placeholder="Current password"
          visible={showCurrentPassword}
          onToggle={() => setShowCurrentPassword(v => !v)}
        />

        <PasswordField
          label="New Password"
          value={changeForm.password}
          onChange={(value) => setChangeForm(form => ({ ...form, password: value }))}
          placeholder="Create a strong password"
          visible={showNewPassword}
          onToggle={() => setShowNewPassword(v => !v)}
        />

        <PasswordField
          label="Confirm Password"
          value={changeForm.confirmPassword}
          onChange={(value) => setChangeForm(form => ({ ...form, confirmPassword: value }))}
          placeholder="Re-type new password"
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(v => !v)}
        />

        <div className="space-y-2 text-[13px]">
          {passwordChecks.map(rule => (
            <div
              key={rule.key}
              className={`flex items-center gap-2 ${rule.passed ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              {rule.passed ? <CheckIcon /> : <CircleIcon />}
              <span>{rule.label}</span>
            </div>
          ))}
          <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
            {passwordsMatch ? <CheckIcon /> : <CircleIcon />}
            <span>Passwords match</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={!canChangePassword || changeLoading}
          className={canChangePassword
            ? 'w-full bg-psu text-white font-bold text-[15px] py-3.5 rounded-xl transition-all duration-150 hover:opacity-95'
            : 'w-full bg-slate-300 text-white font-bold text-[15px] py-3.5 rounded-xl transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed'
          }
        >
          {changeLoading ? 'Updating...' : 'Change Password'}
        </button>
      </Modal>
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder, visible, onToggle }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-[15px] text-slate-800 outline-none placeholder-slate-400 focus:border-psu focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-500 hover:text-psu transition-colors"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────
function GridIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function PulseIcon()   { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function UsersIcon()   { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function BookIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
function UploadIcon()  { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> }
function FileIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function UserIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> }
function CogIcon()     { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg> }
function LogoutIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function PlusIcon()    { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function DownloadIcon(){ return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function InfoIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function EyeIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg> }
function EyeOffIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.8 21.8 0 0 1 5.06-6.94" /><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.22 4.63" /><line x1="1" y1="1" x2="23" y2="23" /></svg> }
function CheckIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> }
function CircleIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /></svg> }
