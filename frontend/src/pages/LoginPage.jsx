import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import logo from '../assets/logo.svg'

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast('Welcome back!', 'success')
      navigate('/')
    } catch {
      toast('Invalid credentials. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8"
         style={{ background: 'linear-gradient(135deg, #051f4a 0%, #072d6b 50%, #051f4a 100%)' }}>

      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #f5c518 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #1a5cc8 0%, transparent 70%)' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'linear-gradient(#f5c518 1px, transparent 1px), linear-gradient(90deg, #f5c518 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Rings */}
        {[300, 520, 740, 960].map((s, i) => (
          <div key={i} className="absolute rounded-full border border-gold/10"
               style={{ width: s, height: s, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[1020px] animate-fade-up">
        <div className="rounded-3xl border border-gold/20 backdrop-blur-sm overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[640px] md:min-h-[560px]">
            {/* Left side: logo and brand */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-gold/15 flex flex-col justify-between"
                 style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 70%)' }}>
              <div>
                <div className="flex justify-center mt-6">
                  <img 
                    src={logo}
                    alt="PSU Logo" 
                    className="w-80 h-80 object-contain" 
                  />
                </div>
                <p className="text-gold font-semibold text-sm tracking-wide">Pangasinan State University</p>
                <p className="text-white/55 text-[13px] mt-2 leading-relaxed">
                  Alumni Project Performance Analytics and Visualization System for centralized alumni tracking, project outcomes, and institutional reporting.
                </p>
              </div>
            </div>

            {/* Right side: sign in form */}
            <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
              <h1 className="font-display text-white text-3xl mb-1">Sign In</h1>
              <p className="text-white/55 text-[14px] mb-8">Log in using your account credentials</p>

              <form onSubmit={handleSubmit} className="space-y-5 max-w-[460px] w-full">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="username@psu.edu.ph"
                    className="w-full bg-white border border-white/75 text-slate-800 rounded-xl px-4 py-3.5 text-[15px] outline-none placeholder-slate-400
                               focus:border-gold focus:ring-2 focus:ring-gold/25 transition-all duration-150 font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-white border border-white/75 text-slate-800 rounded-xl px-4 py-3.5 pr-12 text-[15px] outline-none placeholder-slate-400
                                 focus:border-gold focus:ring-2 focus:ring-gold/25 transition-all duration-150 font-sans"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-500 hover:text-psu transition-colors"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-psu-deep font-bold text-[15px] py-3.5 rounded-xl mt-1
                             transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.8 21.8 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.22 4.63" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}