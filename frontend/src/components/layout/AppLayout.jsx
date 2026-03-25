import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import logoDash from '../../assets/logo-dash.svg'

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
  {
    group: 'Reports',
    items: [
      { to: '/reports', label: 'Export Reports', icon: <FileIcon /> },
    ],
  },
]

const ADMIN_NAV = {
  group: 'Administration',
  items: [
    { to: '/users',  label: 'User Management',  icon: <UserIcon /> },
    { to: '/system', label: 'User Activity Logs', icon: <CogIcon /> },
  ],
}

const PAGE_META = {
  '/':          { name: 'Dashboard',        crumb: 'PSU · APPAS · Overview' },
  '/analytics': { name: 'Analytics',         crumb: 'PSU · APPAS · Performance Analytics' },
  '/alumni':    { name: 'Alumni Records',    crumb: 'PSU · APPAS · Records' },
  '/projects':  { name: 'Projects',          crumb: 'PSU · APPAS · Records' },
  '/reports':   { name: 'Export Reports',    crumb: 'PSU · APPAS · Reports' },
  '/users':     { name: 'User Management',   crumb: 'PSU · APPAS · Administration' },
  '/system':    { name: 'User Activity Logs',  crumb: 'PSU · APPAS · Administration' },
}

export default function AppLayout() {
  const { user, logout, isAdmin, canManageData } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [counts, setCounts] = useState({ alumni: 0, projects: 0 })
  const meta = PAGE_META[pathname] || { name: 'APPAS', crumb: 'PSU · APPAS' }
  const initials = user ? (user.name.split(' ').map(n => n[0]).slice(0, 2).join('')) : 'U'

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

  const formatCount = (value) => (value > 999 ? '999+' : String(value))

  const doLogout = () => {
    logout()
    toast('Signed out successfully', 'info')
    navigate('/login')
  }

  const allNav = isAdmin ? [...NAV, ADMIN_NAV] : NAV

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="w-64 fixed top-0 left-0 bottom-0 z-50 flex flex-col sidebar-gradient"
             style={{ boxShadow: '4px 0 24px rgba(5,31,74,0.4)' }}>

        {/* Brand */}
        <div className="px-5 py-5 border-b border-gold/10 flex items-center justify-center">
          <img src={logoDash} alt="APPAS Logo" className="h-16 object-contain" />
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
        <div className="px-4 py-4 border-t border-gold/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[13px] text-psu-deep"
               style={{ background: 'linear-gradient(135deg, #f5c518, #d4a800)', border: '2px solid rgba(245,197,24,0.3)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/85 text-[12px] font-semibold truncate">{user?.name}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${isAdmin ? 'text-gold' : 'text-sky-300'}`}>
              {user?.role}
            </div>
          </div>
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
    </div>
  )
}

// ── Icons ──────────────────────────────────────
function GridIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function PulseIcon()   { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function UsersIcon()   { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function BookIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
function FileIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function UserIcon()    { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> }
function CogIcon()     { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-full h-full"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg> }
function LogoutIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function PlusIcon()    { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function DownloadIcon(){ return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function InfoIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
