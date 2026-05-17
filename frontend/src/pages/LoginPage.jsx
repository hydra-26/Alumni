import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/ui'
import api from '../utils/api'
import logo from '../assets/logo.svg'

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { key: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { key: 'number', label: 'One number', test: (value) => /\d/.test(value) },
  { key: 'special', label: 'One special character', test: (value) => /[^A-Za-z\d]/.test(value) },
]

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' })

  const resetChallenge = () => {
    setForgotEmail('')
    setChallengeId('')
    setVerificationCode('')
    setEmailVerified(false)
    setShowResetPassword(false)
    setResetForm({ password: '', confirmPassword: '' })
    setForgotLoading(false)
    setVerifyLoading(false)
    setResetLoading(false)
  }

  const closeForgot = () => {
    setForgotOpen(false)
    resetChallenge()
  }

  const passwordChecks = PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(resetForm.password) }))
  const passwordsMatch = resetForm.password.length > 0 && resetForm.password === resetForm.confirmPassword
  const canCompleteReset = emailVerified && passwordChecks.every(rule => rule.passed) && passwordsMatch

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

  const requestVerification = async () => {
    if (!forgotEmail.trim()) {
      toast('Enter your email first.', 'error')
      return
    }
    setForgotLoading(true)
    try {
      const { data } = await api.post('/auth/password-reset/request', { email: forgotEmail.trim() })
      setChallengeId(data.challenge_id)
      toast('Verification email sent.', 'success')
    } catch (error) {
      toast(error?.response?.data?.error || 'Unable to send verification email.', 'error')
    } finally {
      setForgotLoading(false)
    }
  }

  const verifyEmail = async () => {
    if (!challengeId) {
      toast('Request the verification email first.', 'error')
      return
    }
    if (!verificationCode.trim()) {
      toast('Enter the verification code from your email.', 'error')
      return
    }
    setVerifyLoading(true)
    try {
      await api.post('/auth/password-reset/verify', {
        challenge_id: challengeId,
        code: verificationCode.trim(),
      })
      setEmailVerified(true)
      toast('Email verified.', 'success')
    } catch (error) {
      toast(error?.response?.data?.error || 'Verification failed.', 'error')
    } finally {
      setVerifyLoading(false)
    }
  }

  const completeReset = async () => {
    if (!canCompleteReset) {
      toast('Please complete all password requirements.', 'error')
      return
    }
    setResetLoading(true)
    try {
      await api.post('/auth/password-reset/complete', {
        challenge_id: challengeId,
        password: resetForm.password,
        confirm_password: resetForm.confirmPassword,
      })
      toast('Password changed successfully.', 'success')
      closeForgot()
    } catch (error) {
      toast(error?.response?.data?.error || 'Unable to change password.', 'error')
    } finally {
      setResetLoading(false)
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

                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="w-full text-center text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={forgotOpen}
        onClose={closeForgot}
        title="Forgot Password"
        panelClassName="max-w-[620px]"
        bodyClassName="space-y-5"
      >
        <div className="text pb-1">
          <p className="text-slate-500 text-[14px]">
            Enter your account email and verify it to continue with the password reset.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="email"
              value={forgotEmail}
              onChange={e => {
                setForgotEmail(e.target.value)
                setEmailVerified(false)
                setChallengeId('')
                setVerificationCode('')
              }}
              placeholder="username@psu.edu.ph"
              className="flex-1 bg-transparent outline-none text-slate-800 text-[15px] placeholder-slate-400"
              disabled={emailVerified}
            />
            {emailVerified ? (
              <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-[13px]">
                <CheckIcon /> Verified
              </span>
            ) : null}
          </div>
        </div>

        {!emailVerified ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <button
              type="button"
              onClick={requestVerification}
              disabled={forgotLoading}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-psu text-white font-semibold text-[14px] hover:opacity-95 disabled:opacity-60"
            >
              {forgotLoading ? 'Sending...' : 'Send Verification Email'}
            </button>
            {challengeId ? (
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="Enter the code from your email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 outline-none placeholder-slate-400 focus:border-psu focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyEmail}
                  disabled={verifyLoading}
                  className="w-full px-5 py-3 rounded-xl bg-gold text-psu-deep font-bold text-[14px] hover:opacity-95 disabled:opacity-60"
                >
                  {verifyLoading ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {emailVerified ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetForm.password}
                  onChange={e => setResetForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-[15px] text-slate-800 outline-none placeholder-slate-400 focus:border-psu focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(v => !v)}
                  aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-500 hover:text-psu transition-colors"
                >
                  {showResetPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetForm.confirmPassword}
                  onChange={e => setResetForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-type new password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-[15px] text-slate-800 outline-none placeholder-slate-400 focus:border-psu focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(v => !v)}
                  aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-500 hover:text-psu transition-colors"
                >
                  {showResetPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

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
              onClick={completeReset}
              disabled={!canCompleteReset || resetLoading}
              className={canCompleteReset ?
                `w-full bg-psu text-white font-bold text-[15px] py-3.5 rounded-xl transition-all duration-150 hover:opacity-95` :
                `w-full bg-slate-300 text-white font-bold text-[15px] py-3.5 rounded-xl transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed`
              }
            >
              {resetLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        ) : null}
      </Modal>
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

function EnvelopeIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}