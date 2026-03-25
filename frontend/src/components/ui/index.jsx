import { createPortal } from 'react-dom'

// ═══════════════════════════════
// Shared UI Primitives
// ═══════════════════════════════

// KPI Card
export function KpiCard({ icon, label, value, trend, trendUp, color = 'blue' }) {
  const colors = {
    blue:   { bar: 'bg-psu',        icon: 'bg-blue-50 text-psu',      val: 'text-psu' },
    gold:   { bar: 'bg-gold',       icon: 'bg-amber-50 text-gold-dark', val: 'text-gold-dark' },
    green:  { bar: 'bg-emerald-600',icon: 'bg-emerald-50 text-emerald-700', val: 'text-emerald-700' },
    violet: { bar: 'bg-violet-600', icon: 'bg-violet-50 text-violet-700', val: 'text-violet-700' },
    red:    { bar: 'bg-red-500',    icon: 'bg-red-50 text-red-600',    val: 'text-red-600' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-5 relative overflow-hidden
                    hover:-translate-y-0.5 hover:shadow-panel transition-all duration-200">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl ${c.bar}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${c.icon}`}>{icon}</div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold leading-none ${c.val}`}>{value}</p>
      {trend && (
        <p className="text-[11px] text-slate-400 mt-2">
          <span className={trendUp ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          {' '}vs last period
        </p>
      )}
    </div>
  )
}

// Card wrapper
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-blue-100 shadow-card overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

// Card header
export function CardHead({ title, sub, action }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
      <div>
        <h3 className="text-[13px] font-bold text-psu">{title}</h3>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Badge
export function Badge({ children, variant = 'blue' }) {
  const variants = {
    green:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    gold:   'bg-amber-50 text-amber-700 border border-amber-200',
    blue:   'bg-blue-50 text-psu border border-blue-200',
    red:    'bg-red-50 text-red-700 border border-red-200',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200',
    cyan:   'bg-sky-50 text-sky-700 border border-sky-200',
    gray:   'bg-slate-50 text-slate-500 border border-slate-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  }
  return (
    <span className={`badge ${variants[variant] || variants.blue}`}>{children}</span>
  )
}

// Employment status badge mapping
export function StatusBadge({ status }) {
  const map = {
    'Employed':      { label: 'Employed',      v: 'green'  },
    'Self-Employed': { label: 'Self-Employed',  v: 'cyan'   },
    'Seeking':       { label: 'Seeking',        v: 'orange' },
    'Studying':      { label: 'Studying',       v: 'violet' },
    'Implemented':   { label: 'Implemented',   v: 'green'  },
    'In Progress':   { label: 'In Progress',   v: 'orange' },
    'Proposed':      { label: 'Proposed',       v: 'gray'   },
    'Awarded':       { label: '🏆 Awarded',     v: 'gold'   },
    'Active':        { label: 'Active',         v: 'green'  },
    'Inactive':      { label: 'Inactive',       v: 'gray'   },
    'Chairperson':   { label: '👑 Chairperson',  v: 'blue'   },
    'OSAA Dean':     { label: '👁️ OSAA Dean',    v: 'cyan'   },
    'OSAA Director': { label: '👁️ OSAA Director', v: 'violet' },
    'Admin':         { label: '👑 Admin',         v: 'blue'   },
  }
  const m = map[status] || { label: status, v: 'gray' }
  return <Badge variant={m.v}>{m.label}</Badge>
}

// Stat box (analytics)
export function StatBox({ value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 text-center">
      <div className="font-display text-2xl font-bold text-psu">{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

// Section header
export function SectionHead({ title, sub, children }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h2 className="font-display text-xl text-psu">{title}</h2>
        {sub && <p className="text-slate-400 text-[11px] mt-1">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  )
}

// Select dropdown (filter bar)
export function Sel({ children, ...props }) {
  return (
    <select {...props}
      className="bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg px-3 py-2 outline-none
                 cursor-pointer font-sans transition-colors duration-150 focus:border-psu hover:border-slate-300">
      {children}
    </select>
  )
}

// Icon button
export function IconBtn({ children, danger, onClick, title }) {
  return (
    <button title={title} onClick={onClick}
      className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[13px] transition-all duration-150
        ${danger
          ? 'border-slate-200 bg-slate-50 text-slate-400 hover:border-red-400 hover:bg-red-50 hover:text-red-600'
          : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-psu hover:bg-blue-50 hover:text-psu'
        }`}
    >
      {children}
    </button>
  )
}

// Search input
export function SearchInput({ placeholder, value, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-[280px] hover:border-slate-300 transition-colors">
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-slate-400 flex-shrink-0">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-[13px] text-slate-700 outline-none w-full placeholder-slate-400 font-sans"
      />
    </div>
  )
}

// Progress bar
export function ProgBar({ label, pct, color = '#0a3d8f' }) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-400 font-mono text-[11px]">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full prog-fill" style={{ '--target-w': `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// Modal wrapper
export function Modal({ open, onClose, title, children, footer, panelClassName = '', bodyClassName = '' }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
         style={{ background: 'rgba(5,31,74,0.5)', backdropFilter: 'blur(3px)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-enter bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-slate-100 ${panelClassName}`}>
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display text-[17px] text-psu">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all duration-150">✕</button>
        </div>
        <div className={`px-7 py-6 ${bodyClassName}`}>{children}</div>
        {footer && <div className="px-7 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// Form field
export function FormRow({ children }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}
export function FormGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4 last:mb-0">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

// Confirm delete modal
export function DeleteModal({ open, onClose, onConfirm, item }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-semibold hover:bg-red-700 transition-colors" onClick={onConfirm}>Delete Permanently</button>
      </>}>
      <div className="text-center py-4">
        <div className="text-5xl mb-4">🗑️</div>
        <p className="text-slate-700 font-medium mb-2">Are you sure you want to delete</p>
        <p className="text-psu font-bold text-[15px]">"{item}"</p>
        <p className="text-slate-400 text-[12px] mt-3">This action cannot be undone.</p>
      </div>
    </Modal>
  )
}

// Table wrapper
export function TableWrap({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-card overflow-hidden mb-5">
      {children}
    </div>
  )
}

// Pagination
export function Pagination({ page, total, perPage, onChange }) {
  const safePerPage = Math.max(1, Number(perPage) || 1)
  const pages = Math.max(1, Math.ceil(total / safePerPage))
  const current = Math.min(Math.max(1, Number(page) || 1), pages)
  const from = total === 0 ? 0 : (current - 1) * safePerPage + 1
  const to   = total === 0 ? 0 : Math.min(current * safePerPage, total)

  const maxButtons = 5
  const start = Math.max(1, Math.min(current - Math.floor(maxButtons / 2), pages - maxButtons + 1))
  const end = Math.min(pages, start + maxButtons - 1)
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const goPrev = () => current > 1 && onChange(current - 1)
  const goNext = () => current < pages && onChange(current + 1)

  return (
    <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
      <span className="text-[12px] text-slate-400 font-mono">Showing {from}–{to} of {total} records</span>
      <div className="flex gap-1">
        <button
          onClick={goPrev}
          disabled={current === 1}
          className={`min-w-[30px] h-[30px] px-2 rounded-lg border text-[12px] font-mono transition-all duration-100 ${current === 1 ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-500 border-slate-200 hover:border-psu hover:text-psu'}`}
        >
          ‹
        </button>
        {nums.map((n) => (
          <button key={n}
            onClick={() => onChange(n)}
            className={`min-w-[30px] h-[30px] px-2 rounded-lg border text-[12px] font-mono transition-all duration-100 ${n === current ? 'bg-psu text-white border-psu' : 'bg-white text-slate-500 border-slate-200 hover:border-psu hover:text-psu'}`}>
            {n}
          </button>
        ))}
        <button
          onClick={goNext}
          disabled={current === pages}
          className={`min-w-[30px] h-[30px] px-2 rounded-lg border text-[12px] font-mono transition-all duration-100 ${current === pages ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-500 border-slate-200 hover:border-psu hover:text-psu'}`}
        >
          ›
        </button>
      </div>
    </div>
  )
}
