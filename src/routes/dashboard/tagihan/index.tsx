import { createFileRoute } from '@tanstack/react-router'
import { Plus, Receipt, Archive, Calendar, Users, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useCustomBills, useClasses } from '../../../lib/supabase-hooks'
import { formatCurrency, formatDate } from '../../../lib/utils'

export const Route = createFileRoute('/dashboard/tagihan/')({ component: TagihanPage })

function TagihanPage() {
  const { bills, assignments, loading, createBill, archiveBill } = useCustomBills()
  const { classes } = useClasses()
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState(0)
  const [formDueDate, setFormDueDate] = useState('')
  const [formClassIds, setFormClassIds] = useState<string[]>([])

  const filtered = bills.filter((b) =>
    tab === 'active' ? b.status === 'active' : b.status === 'archived'
  )

  const handleCreate = async () => {
    if (!formName || formAmount <= 0) return
    setSaving(true)
    await createBill({
      name: formName, description: formDesc, default_amount: formAmount,
      due_date: formDueDate || undefined, class_ids: formClassIds.length > 0 ? formClassIds : undefined,
    })
    setSaving(false)
    setShowModal(false)
    setFormName(''); setFormDesc(''); setFormAmount(0); setFormDueDate(''); setFormClassIds([])
  }

  const handleArchive = async (id: string) => {
    if (confirm('Arsipkan tagihan ini?')) {
      await archiveBill(id)
    }
  }

  const getBillStats = (billId: string) => {
    const billAssignments = assignments.filter(a => a.custom_bill_id === billId)
    const paid = billAssignments.filter(a => a.status === 'paid').length
    const partial = billAssignments.filter(a => a.status === 'partial').length
    const unpaid = billAssignments.filter(a => a.status === 'unpaid').length
    const total = billAssignments.length
    const collected = billAssignments.reduce((sum, a) => sum + a.amount_paid, 0)
    return { paid, partial, unpaid, total, collected }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat tagihan...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tagihan Insidental</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola tagihan kustom untuk siswa</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Buat Tagihan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('active')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'active' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Receipt className="w-4 h-4 inline mr-1.5" />Aktif ({bills.filter(b => b.status === 'active').length})
        </button>
        <button onClick={() => setTab('archived')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'archived' ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Archive className="w-4 h-4 inline mr-1.5" />Arsip ({bills.filter(b => b.status === 'archived').length})
        </button>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((bill) => {
          const stats = getBillStats(bill.id)
          return (
            <div key={bill.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{bill.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{bill.description || '-'}</p>
                </div>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(bill.default_amount)}</span>
              </div>
              {bill.due_date && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  Jatuh tempo: {formatDate(bill.due_date)}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs mb-3">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">{stats.total} siswa</span>
                <span className="badge badge-success">{stats.paid} lunas</span>
                {stats.partial > 0 && <span className="badge badge-warning">{stats.partial} sebagian</span>}
                {stats.unpaid > 0 && <span className="badge badge-danger">{stats.unpaid} belum</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Terkumpul: <span className="font-semibold text-emerald-600">{formatCurrency(stats.collected)}</span></span>
                {bill.status === 'active' && (
                  <button onClick={() => handleArchive(bill.id)} className="btn-secondary btn-sm !py-1 !text-xs">
                    <Archive className="w-3.5 h-3.5" /> Arsipkan
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            {tab === 'active' ? 'Belum ada tagihan aktif' : 'Tidak ada tagihan diarsipkan'}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Buat Tagihan Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Tagihan</label>
                <input type="text" className="input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Uang Ujian Semester 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <input type="text" className="input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Keterangan tambahan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal</label>
                  <input type="number" className="input" value={formAmount} onChange={e => setFormAmount(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jatuh Tempo</label>
                  <input type="date" className="input" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign ke Kelas</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={formClassIds.includes(c.id)} onChange={e => {
                        if (e.target.checked) setFormClassIds([...formClassIds, c.id])
                        else setFormClassIds(formClassIds.filter(id => id !== c.id))
                      }} className="accent-emerald-600" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleCreate} disabled={saving || !formName || formAmount <= 0} className="btn-primary disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Buat Tagihan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
