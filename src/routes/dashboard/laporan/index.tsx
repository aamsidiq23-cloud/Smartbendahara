import { createFileRoute } from '@tanstack/react-router'
import { FileText, Download, CreditCard, PiggyBank, Receipt, TrendingUp, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, MONTHS } from '../../../lib/utils'
import { useSppPayments, useSavings, useCustomBills, useDashboardStats, useStudents, useAcademicYears } from '../../../lib/supabase-hooks'

export const Route = createFileRoute('/dashboard/laporan/')({ component: LaporanPage })

const tabs = [
  { id: 'spp', label: 'Laporan SPP', icon: CreditCard },
  { id: 'tabungan', label: 'Tabungan', icon: PiggyBank },
  { id: 'tagihan', label: 'Tagihan', icon: Receipt },
  { id: 'pemasukan', label: 'Rekap Pemasukan', icon: TrendingUp },
]

function LaporanPage() {
  const [activeTab, setActiveTab] = useState('spp')
  const [period, setPeriod] = useState('bulanan')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan & Export</h1>
          <p className="text-slate-500 text-sm mt-1">Generate laporan dan export ke PDF atau Excel</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="btn-primary">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Period Filter */}
      <div className="card p-4 flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">Periode:</span>
        {['harian', 'bulanan', 'tahunan'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              period === p ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input type="date" className="input" style={{ width: '160px' }} defaultValue="2025-07-01" />
          <span className="text-slate-400">—</span>
          <input type="date" className="input" style={{ width: '160px' }} defaultValue="2025-07-31" />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'spp' && <SppReport />}
      {activeTab === 'tabungan' && <TabunganReport />}
      {activeTab === 'tagihan' && <TagihanReport />}
      {activeTab === 'pemasukan' && <PemasukanReport />}
    </div>
  )
}

function SppReport() {
  const { activeYear } = useAcademicYears()
  const { payments, loading } = useSppPayments({ yearId: activeYear?.id })
  const { students } = useStudents()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat laporan SPP...</span>
      </div>
    )
  }

  const paidCount = payments.filter(p => p.status === 'paid').length
  const partialCount = payments.filter(p => p.status === 'partial').length
  const unpaidCount = payments.filter(p => p.status === 'unpaid').length
  const totalCollected = payments.reduce((sum, p) => sum + p.amount_paid, 0)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentMonthName = MONTHS[now.getMonth()]
  const currentYear = now.getFullYear()

  // Get unpaid/partial payments for current month with student info
  const arrearPayments = payments
    .filter(p => p.month === currentMonth && p.status !== 'paid')
    .map(p => {
      const student = students.find(s => s.id === p.student_id)
      return {
        ...p,
        studentName: student?.name || '-',
        className: student?.class_name || '-',
      }
    })
    .slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500">Total Terkumpul</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Lunas</p><p className="text-xl font-bold text-emerald-600">{paidCount}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Sebagian</p><p className="text-xl font-bold text-amber-600">{partialCount}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Belum Bayar</p><p className="text-xl font-bold text-red-600">{unpaidCount}</p></div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="font-semibold text-slate-900">Detail Tunggakan — {currentMonthName} {currentYear}</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Siswa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Kelas</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Tagihan</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Dibayar</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Sisa</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {arrearPayments.map((p) => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{p.studentName}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{p.className}</td>
                  <td className="px-6 py-3 text-sm text-right text-slate-600">{formatCurrency(p.amount_due)}</td>
                  <td className="px-6 py-3 text-sm text-right text-slate-600">{formatCurrency(p.amount_paid)}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(p.amount_due - p.amount_paid)}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`badge ${p.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {p.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                    </span>
                  </td>
                </tr>
              ))}
              {arrearPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada tunggakan bulan ini 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TabunganReport() {
  const { accounts, loading } = useSavings()
  const { students } = useStudents()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat laporan tabungan...</span>
      </div>
    )
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const avgBalance = accounts.length > 0 ? Math.round(totalBalance / accounts.length) : 0

  // Enrich accounts with student details
  const enrichedAccounts = accounts.map(a => {
    const student = (a as any).student
    const studentDetail = students.find(s => s.id === a.student_id)
    return {
      ...a,
      studentName: student?.name || studentDetail?.name || '-',
      className: studentDetail?.class_name || '-',
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500">Total Saldo</p><p className="text-xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Rata-rata per Siswa</p><p className="text-xl font-bold text-blue-600">{formatCurrency(avgBalance)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Jumlah Rekening</p><p className="text-xl font-bold text-slate-900">{accounts.length}</p></div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="font-semibold text-slate-900">Top 10 Saldo Tertinggi</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">#</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Siswa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Kelas</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...enrichedAccounts].sort((a, b) => b.balance - a.balance).slice(0, 10).map((a, i) => (
                <tr key={a.id} className="table-row-hover">
                  <td className="px-6 py-3 text-sm text-slate-400">{i + 1}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{a.studentName}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{a.className}</td>
                  <td className="px-6 py-3 text-sm text-right font-bold text-slate-900">{formatCurrency(a.balance)}</td>
                </tr>
              ))}
              {enrichedAccounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">Belum ada data tabungan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TagihanReport() {
  const { bills, assignments, loading } = useCustomBills()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat laporan tagihan...</span>
      </div>
    )
  }

  const getBillStats = (billId: string) => {
    const billAssignments = assignments.filter(a => a.custom_bill_id === billId)
    const paid = billAssignments.filter(a => a.status === 'paid').length
    const total = billAssignments.length
    const collected = billAssignments.reduce((sum, a) => sum + a.amount_paid, 0)
    return { paid, total, collected }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="font-semibold text-slate-900">Ringkasan Tagihan Insidental</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Tagihan</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Nominal</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Assigned</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Lunas</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Progress</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((b) => {
                const stats = getBillStats(b.id)
                const progressPercent = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0
                return (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-6 py-3"><p className="text-sm font-medium text-slate-800">{b.name}</p><p className="text-xs text-slate-500">{b.description || '-'}</p></td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700">{formatCurrency(b.default_amount)}</td>
                    <td className="px-6 py-3 text-sm text-center text-slate-600">{stats.total}</td>
                    <td className="px-6 py-3 text-sm text-center text-emerald-600 font-medium">{stats.paid}</td>
                    <td className="px-6 py-3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {b.status === 'active' ? 'Aktif' : 'Arsip'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Belum ada tagihan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PemasukanReport() {
  const { stats, loading } = useDashboardStats()

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat rekap pemasukan...</span>
      </div>
    )
  }

  const totalIncome = stats.monthlyIncomeData.reduce((sum, d) => sum + d.amount, 0)
  const avgMonthly = stats.monthlyIncomeData.length > 0 ? Math.round(totalIncome / stats.monthlyIncomeData.length) : 0
  const highestMonth = stats.monthlyIncomeData.reduce((max, d) => d.amount > max.amount ? d : max, stats.monthlyIncomeData[0] || { month: '-', amount: 0 })

  const chartData = stats.monthlyIncomeData.map(d => ({ month: d.month, income: d.amount }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500">Total Pemasukan (6 bln)</p><p className="text-xl font-bold text-slate-900">{formatCurrency(totalIncome)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Rata-rata/Bulan</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(avgMonthly)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Bulan Tertinggi</p><p className="text-xl font-bold text-blue-600">{highestMonth.month} — {formatCurrency(highestMonth.amount)}</p></div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-slate-900">Grafik Pemasukan Bulanan</h3></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Pemasukan']} contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
