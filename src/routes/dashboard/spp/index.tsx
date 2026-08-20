import { createFileRoute } from '@tanstack/react-router'
import { Filter, Search, CreditCard, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useStudents, useClasses, useSppPayments, useAcademicYears } from '../../../lib/supabase-hooks'
import { formatCurrency, MONTHS } from '../../../lib/utils'

export const Route = createFileRoute('/dashboard/spp/')({ component: SppPage })

function SppPage() {
  const { classes, loading: classesLoading } = useClasses()
  const { academicYears, activeYear } = useAcademicYears()
  const { students, loading: studentsLoading } = useStudents()
  const [filterClass, setFilterClass] = useState('')
  const [search, setSearch] = useState('')
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; month: number } | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [saving, setSaving] = useState(false)

  // Set default class once loaded
  if (!filterClass && classes.length > 0) {
    setFilterClass(classes[0].id)
  }

  const { payments, loading: paymentsLoading, recordPayment, createPaymentRecord } = useSppPayments({
    yearId: activeYear?.id,
  })

  const loading = classesLoading || studentsLoading || paymentsLoading

  // Filter students by class
  const filteredStudents = students.filter((s) => {
    const matchClass = s.class_id === filterClass
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return matchClass && matchSearch
  })

  const getPayment = (studentId: string, month: number) => {
    return payments.find((p) => p.student_id === studentId && p.month === month)
  }

  const currentClass = classes.find((c) => c.id === filterClass)

  const handleCellClick = (studentId: string, month: number) => {
    const payment = getPayment(studentId, month)
    setSelectedCell({ studentId, month })
    setPayAmount(payment ? (payment.amount_due - payment.amount_paid) : (currentClass?.spp_amount || 0))
    setShowPayModal(true)
  }

  const selectedStudent = selectedCell ? students.find((s) => s.id === selectedCell.studentId) : null
  const selectedPayment = selectedCell ? getPayment(selectedCell.studentId, selectedCell.month) : null

  const handlePayment = async () => {
    if (!selectedCell || !activeYear || !currentClass) return
    setSaving(true)

    if (selectedPayment) {
      // Update existing payment
      const newPaid = selectedPayment.amount_paid + payAmount
      await recordPayment(selectedPayment.id, newPaid, selectedPayment.amount_due)
    } else {
      // Create new payment record
      await createPaymentRecord(
        selectedCell.studentId, activeYear.id, selectedCell.month,
        selectedCell.month >= 7 ? (activeYear.start_date ? new Date(activeYear.start_date).getFullYear() : 2024) : (activeYear.end_date ? new Date(activeYear.end_date).getFullYear() : 2025),
        currentClass.spp_amount, payAmount
      )
    }

    setSaving(false)
    setShowPayModal(false)
  }

  // Summary stats
  const classPayments = payments.filter((p) => {
    const student = students.find((s) => s.id === p.student_id)
    return student?.class_id === filterClass
  })
  const totalPaid = classPayments.filter((p) => p.status === 'paid').length
  const totalPartial = classPayments.filter((p) => p.status === 'partial').length
  const totalUnpaid = classPayments.filter((p) => p.status === 'unpaid').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat data SPP...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen SPP</h1>
          <p className="text-slate-500 text-sm mt-1">Tabel pembayaran SPP per kelas — {activeYear?.name || ''}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Nominal SPP</p>
          <p className="text-xl font-bold text-slate-900">{currentClass ? formatCurrency(currentClass.spp_amount) : '-'}</p>
          <p className="text-xs text-slate-400">{currentClass?.name}</p>
        </div>
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Lunas</p>
          <p className="text-xl font-bold text-emerald-600">{totalPaid}</p>
          <span className="badge badge-success text-[10px]">pembayaran</span>
        </div>
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Sebagian</p>
          <p className="text-xl font-bold text-amber-600">{totalPartial}</p>
          <span className="badge badge-warning text-[10px]">pembayaran</span>
        </div>
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Belum Bayar</p>
          <p className="text-xl font-bold text-red-600">{totalUnpaid}</p>
          <span className="badge badge-danger text-[10px]">pembayaran</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="select"
              style={{ width: '250px' }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {formatCurrency(c.spp_amount)}/bln</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* SPP Grid Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                  Siswa
                </th>
                {MONTHS.slice(0, 12).map((m) => (
                  <th key={m} className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[80px]">
                    {m.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="table-row-hover">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate">{student.name}</span>
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const payment = getPayment(student.id, month)
                    return (
                      <td key={month} className="px-2 py-3 text-center">
                        <button
                          onClick={() => handleCellClick(student.id, month)}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            payment?.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : payment?.status === 'partial'
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : payment
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {payment?.status === 'paid' ? '✓ Lunas' :
                           payment?.status === 'partial' ? `${Math.round((payment.amount_paid / payment.amount_due) * 100)}%` :
                           payment ? 'Belum' : '-'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-slate-400">Tidak ada siswa di kelas ini</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Input Pembayaran SPP</h3>
              </div>
              <button onClick={() => setShowPayModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Siswa</span>
                  <span className="font-medium text-slate-800">{selectedStudent.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kelas</span>
                  <span className="font-medium text-slate-800">{selectedStudent.class_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bulan</span>
                  <span className="font-medium text-slate-800">{selectedCell ? MONTHS[selectedCell.month - 1] : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tagihan</span>
                  <span className="font-bold text-slate-900">{formatCurrency(currentClass?.spp_amount || 0)}</span>
                </div>
                {selectedPayment && selectedPayment.amount_paid > 0 && (
                  <>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                      <span className="text-slate-500">Sudah Bayar</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(selectedPayment.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sisa</span>
                      <span className="font-bold text-red-600">{formatCurrency(selectedPayment.amount_due - selectedPayment.amount_paid)}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Bayar</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Masukkan jumlah"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowPayModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handlePayment} disabled={saving || payAmount <= 0} className="btn-primary disabled:opacity-60">
                {saving ? 'Memproses...' : <>
                  <CreditCard className="w-4 h-4" />
                  Bayar SPP
                </>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
