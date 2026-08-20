import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { GraduationCap, Mail, Lock, User, School, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/register')({ component: RegisterPage })

function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [schoolName, setSchoolName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!schoolName.trim()) {
      setError('Nama sekolah harus diisi')
      return
    }
    if (!adminName.trim()) {
      setError('Nama admin harus diisi')
      return
    }
    if (!email.trim()) {
      setError('Email harus diisi')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    if (!agreedToTerms) {
      setError('Anda harus menyetujui syarat & ketentuan')
      return
    }

    setLoading(true)
    const { error: signUpError } = await signUp(email, password, schoolName, adminName)

    if (signUpError) {
      setLoading(false)
      if (signUpError.message.includes('already registered')) {
        setError('Email sudah terdaftar. Silakan login atau gunakan email lain.')
      } else if (signUpError.message.includes('rate limit')) {
        setError('Terlalu banyak percobaan. Silakan tunggu beberapa menit lalu coba lagi.')
      } else {
        setError(signUpError.message)
      }
    } else {
      setLoading(false)
      setSuccess(true)
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
          <h1 className="text-4xl font-bold text-white mb-4">Bergabunglah Sekarang</h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            250+ sekolah sudah menggunakan Smart Bendahara. Mulai trial gratis 14 hari tanpa kartu kredit.
          </p>
          <div className="mt-10 space-y-3 text-left max-w-sm mx-auto">
            {[
              'Setup hanya 10 menit',
              'Import data siswa dari Excel',
              'Notifikasi WA otomatis',
              'Laporan siap cetak kapan saja',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-emerald-100">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-300 text-xs">✓</span>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Smart Bendahara</span>
          </div>

          {/* Success State */}
          {success ? (
            <div className="text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Registrasi Berhasil! 🎉</h2>
              <p className="text-slate-500 mb-2">
                Akun sekolah <strong>{schoolName}</strong> telah dibuat.
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Cek inbox email Anda untuk konfirmasi, lalu login.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Ke Halaman Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Daftar Akun Baru</h2>
              <p className="text-slate-500 mb-8">Mulai kelola keuangan sekolah Anda secara digital</p>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Sekolah</label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="SD Nusantara Jaya"
                      className="input pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Admin</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Sari Rahayu"
                      className="input pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sekolah.sch.id"
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
                      placeholder="Minimal 8 karakter"
                      className="input pl-10"
                      disabled={loading}
                    />
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-amber-600 mt-1">Password minimal 8 karakter ({password.length}/8)</p>
                  )}
                </div>
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 mt-0.5"
                      disabled={loading}
                    />
                    <span className="text-sm text-slate-600">
                      Saya menyetujui <a href="#" className="text-emerald-600 font-medium">Syarat & Ketentuan</a> serta <a href="#" className="text-emerald-600 font-medium">Kebijakan Privasi</a>
                    </span>
                  </label>
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
                      Daftar — Trial 14 Hari Gratis
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                  Masuk
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
