import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Email dan password harus diisi')
      return
    }

    setLoading(true)
    const { error: authError } = await signIn(email, password)

    if (authError) {
      setLoading(false)
      // Translate common Supabase errors to Indonesian
      if (authError.message.includes('Invalid login credentials')) {
        setError('Email atau password salah')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Email belum diverifikasi. Cek inbox Anda.')
      } else {
        setError(authError.message)
      }
    } else {
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center">
        <div className="absolute top-20 right-20 w-64 h-64 bg-emerald-400 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-blue-400 rounded-full blur-3xl opacity-10"></div>
        <div className="relative text-center px-12 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 border border-white/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Smart Bendahara</h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Kelola keuangan sekolah dengan mudah. SPP, tabungan, tagihan, dan laporan — semua dalam satu platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Sekolah', value: '250+' },
              { label: 'Transaksi', value: '50K+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-emerald-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Smart Bendahara</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang Kembali</h2>
          <p className="text-slate-500 mb-8">Masuk ke dashboard sekolah Anda</p>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bendahara@sekolah.sch.id"
                  className="input pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-600" />
                <span className="text-sm text-slate-600">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Lupa password?</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-pulse-soft">Memproses...</span>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
