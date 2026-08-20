import { createFileRoute } from '@tanstack/react-router'
import {
  GraduationCap,
  CreditCard,
  PiggyBank,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  LogOut,
  Phone,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, MONTHS } from '../../lib/utils'
import { usePortalData } from '../../lib/supabase-hooks'
import type { PortalStudentData } from '../../lib/supabase-hooks'

export const Route = createFileRoute('/portal/')({ component: PortalPage })

function PortalPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', ''])

  const { data: portalData, loading, error } = usePortalData(confirmedPhone)

  const handleSendOtp = () => {
    if (!phoneNumber.trim()) return
    // Normalize phone number — accept 08xxx, convert to 628xxx
    let normalized = phoneNumber.replace(/[\s\-()]/g, '')
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.slice(1)
    }
    setPhoneNumber(normalized)
    setOtpSent(true)
  }

  const handleVerify = () => {
    // In production, verify OTP code here
    // For now, just proceed with the phone lookup
    setConfirmedPhone(phoneNumber)
  }

  const handleLogout = () => {
    setConfirmedPhone(null)
    setOtpSent(false)
    setPhoneNumber('')
    setOtpValues(['', '', '', ''])
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otpValues]
    newOtp[index] = value
    setOtpValues(newOtp)
    // Auto-focus next input
    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }

  // Show portal dashboard if we have data
  if (confirmedPhone && portalData) {
    return <PortalDashboard data={portalData} onLogout={handleLogout} />
  }

  // Loading state after verification
  if (confirmedPhone && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Memuat data siswa...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (confirmedPhone && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button onClick={handleLogout} className="btn-primary justify-center w-full py-3">
            Coba Nomor Lain
          </button>
        </div>
      </div>
    )
  }

  // Login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portal Orang Tua</h1>
          <p className="text-slate-500 text-sm mt-1">Smart Bendahara</p>
        </div>

        <div className="card p-6">
          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="0812-3456-7890"
                    className="input pl-10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Gunakan nomor yang terdaftar di sekolah</p>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={!phoneNumber.trim()}
                className="btn-primary w-full justify-center py-3 disabled:opacity-50"
              >
                Kirim Kode OTP via WhatsApp
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-2">
                <p className="text-sm text-slate-600">Kode OTP telah dikirim ke</p>
                <p className="font-semibold text-slate-800">{phoneNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Masukkan Kode OTP</label>
                <div className="flex gap-2 justify-center">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      className="input text-center text-xl font-bold"
                      style={{ width: '52px', height: '52px' }}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleVerify}
                className="btn-primary w-full justify-center py-3"
              >
                Verifikasi & Masuk
              </button>
              <button
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-sm text-slate-500 hover:text-emerald-600 cursor-pointer"
              >
                Kirim ulang kode
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Smart Bendahara
        </p>
      </div>
    </div>
  )
}

// ----- Portal Dashboard (after login) -----
function PortalDashboard({ data, onLogout }: { data: PortalStudentData; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'spp' | 'tabungan' | 'tagihan'>('spp')

  const { student, className, tenantName, sppPayments, savingsAccount, billAssignments } = data
  const initials = student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Calculate quick stats
  const paidSpp = sppPayments.filter(p => p.status === 'paid').length
  const totalSpp = sppPayments.length
  const balance = savingsAccount?.balance || 0
  const activeBills = billAssignments.filter(a => a.status !== 'paid').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="gradient-primary text-white sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">{tenantName}</p>
              <p className="text-emerald-100 text-xs">Portal Orang Tua</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Student Info Card */}
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">
              {initials}
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">{student.name}</h2>
              <p className="text-sm text-slate-500">{className} · NISN: {student.nisn || '-'}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card p-3 text-center stat-card">
            <CreditCard className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{paidSpp}/{totalSpp}</p>
            <p className="text-[10px] text-slate-500">SPP Lunas</p>
          </div>
          <div className="card p-3 text-center stat-card">
            <PiggyBank className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{formatCurrency(balance)}</p>
            <p className="text-[10px] text-slate-500">Tabungan</p>
          </div>
          <div className="card p-3 text-center stat-card">
            <Receipt className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{activeBills}</p>
            <p className="text-[10px] text-slate-500">Tagihan Aktif</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {[
            { id: 'spp' as const, label: 'SPP', icon: CreditCard },
            { id: 'tabungan' as const, label: 'Tabungan', icon: PiggyBank },
            { id: 'tagihan' as const, label: 'Tagihan', icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'spp' && <PortalSpp data={data} />}
          {activeTab === 'tabungan' && <PortalTabungan data={data} />}
          {activeTab === 'tagihan' && <PortalTagihan data={data} />}
        </div>
      </div>
    </div>
  )
}

function PortalSpp({ data }: { data: PortalStudentData }) {
  const { sppPayments } = data
  const currentYear = new Date().getFullYear()

  // Group by year, show current year's payments
  const currentYearPayments = sppPayments.filter(p => p.year === currentYear || p.year === currentYear - 1)
  // Sort: show most relevant first
  const sorted = [...currentYearPayments].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return a.month - b.month
  })

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="font-semibold text-slate-900 text-sm">Status SPP</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {sorted.map((p) => (
          <div key={`${p.year}-${p.month}`} className="flex items-center gap-3 px-5 py-3.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              p.status === 'paid' ? 'bg-emerald-100' :
              p.status === 'partial' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              {p.status === 'paid' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
               p.status === 'partial' ? <Clock className="w-4 h-4 text-amber-600" /> :
               <AlertTriangle className="w-4 h-4 text-red-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">{MONTHS[p.month - 1]} {p.year}</p>
              <p className="text-xs text-slate-500">{formatCurrency(p.amount_due)}</p>
            </div>
            <span className={`badge ${
              p.status === 'paid' ? 'badge-success' :
              p.status === 'partial' ? 'badge-warning' : 'badge-danger'
            }`}>
              {p.status === 'paid' ? 'Lunas' :
               p.status === 'partial' ? `Sisa ${formatCurrency(p.amount_due - p.amount_paid)}` : 'Belum Bayar'}
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Belum ada data SPP
          </div>
        )}
      </div>
    </div>
  )
}

function PortalTabungan({ data }: { data: PortalStudentData }) {
  const { savingsAccount, savingsTransactions } = data
  const balance = savingsAccount?.balance || 0

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-medium">Saldo Tabungan</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{formatCurrency(balance)}</p>
          </div>
          <PiggyBank className="w-10 h-10 text-blue-400" />
        </div>
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="font-semibold text-slate-900 text-sm">Riwayat Mutasi</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {savingsTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tx.type === 'deposit' ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {tx.type === 'deposit' ? (
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {tx.type === 'deposit' ? 'Setoran' : 'Penarikan'}
                </p>
                <p className="text-xs text-slate-500">
                  {tx.notes || new Date(tx.transacted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <p className="text-[10px] text-slate-400">Saldo: {formatCurrency(tx.balance_after)}</p>
              </div>
            </div>
          ))}
          {savingsTransactions.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Belum ada transaksi tabungan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PortalTagihan({ data }: { data: PortalStudentData }) {
  const { billAssignments } = data

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="font-semibold text-slate-900 text-sm">Tagihan</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {billAssignments.map((a) => {
          const bill = (a as any).bill
          return (
            <div key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{bill?.name || 'Tagihan'}</p>
                  <p className="text-xs text-slate-500">
                    {bill?.due_date ? `Jatuh tempo: ${new Date(bill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : '-'}
                  </p>
                </div>
                <span className={`badge ${a.status === 'paid' ? 'badge-success' : a.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                  {a.status === 'paid' ? 'Lunas' : a.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(a.amount_due)}</p>
                {a.status === 'partial' && (
                  <p className="text-xs text-slate-500">Dibayar: {formatCurrency(a.amount_paid)} · Sisa: <span className="text-red-600 font-semibold">{formatCurrency(a.amount_due - a.amount_paid)}</span></p>
                )}
              </div>
            </div>
          )
        })}
        {billAssignments.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Tidak ada tagihan
          </div>
        )}
      </div>
    </div>
  )
}
