import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`toast-enter pointer-events-auto flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-panel border max-w-sm
            ${t.type === 'success' ? 'border-l-4 border-l-emerald-500' : t.type === 'error' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-psu'}`}>
            <span className="text-base flex-shrink-0">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="text-[13px] text-slate-700 font-medium">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
