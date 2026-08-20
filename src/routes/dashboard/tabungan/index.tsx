import { createFileRoute } from '@tanstack/react-router'
import { Search, PiggyBank, ArrowDownRight, ArrowUpRight, X, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useSavings, useStudents } from '../../../lib/supabase-hooks'
import { formatCurrency } from '../../../lib/utils'
import { useAuth } from '../../../lib/auth-context'

export const Route = createFileRoute('/dashboard/tabungan/')({ component: TabunganPage })

function TabunganPage() {
  const { profile } = useAuth()
  const { accounts, transactions, loading, deposit, withdraw } = useSavings()
  const { students } = useStudents()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredAccounts = accounts.filter((a) => {
    const student = (a as any).student
    const name = student?.name || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
      (student?.nisn || '').includes(search)
  })

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  const openModal = (account: typeof accounts[0], type: 'deposit' | 'withdrawal') => {
    setSelectedAccount(account)
    setModalType(type)
    setAmount(0)
    setNotes('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selectedAccount || amount <= 0) return
    setSaving(true)
    if (modalType === 'deposit') {
      await deposit(selectedAccount.id, amount, notes || undefined)
    } else {
      await withdraw(selectedAccount.id, amount, notes || undefined)
    }
    setSaving(false)
    setShowModal(false)
  }

  const accountTransactions = showHistory
    ? transactions.filter(t => t.savings_account_id === showHistory)
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat data tabungan...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tabungan Siswa</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola tabungan siswa {profile?.tenant_name || ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Total Saldo</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-slate-400">{accounts.length} akun</p>
        </div>
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Setoran Terbaru</p>
          <p className="text-xl font-bold text-emerald-600">
            {transactions.filter(t => t.type === 'deposit').length}
          </p>
          <span className="badge badge-success text-[10px]">transaksi</span>
        </div>
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500 mb-1">Penarikan Terbaru</p>
          <p className="text-xl font-bold text-red-600">
            {transactions.filter(t => t.type === 'withdrawal').length}
          </p>
          <span className="badge badge-danger text-[10px]">transaksi</span>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Siswa</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Saldo</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((account) => {
                const student = (account as any).student
                return (
                  <tr key={account.id} className="table-row-hover">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                          {(student?.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{student?.name || '-'}</p>
                          <p className="text-xs text-slate-400">{student?.nisn || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(account.balance)}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openModal(account, 'deposit')} className="btn-primary btn-sm !py-1 !text-xs">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Setor
                        </button>
                        <button onClick={() => openModal(account, 'withdrawal')} className="btn-secondary btn-sm !py-1 !text-xs">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Tarik
                        </button>
                        <button onClick={() => setShowHistory(showHistory === account.id ? null : account.id)} className="btn-secondary btn-sm !py-1 !text-xs">
                          Riwayat
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      {showHistory && accountTransactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Riwayat Mutasi</h3>
          </div>
          <div className="card-body p-0 divide-y divide-slate-100">
            {accountTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {tx.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{tx.type === 'deposit' ? 'Setoran' : 'Penarikan'}</p>
                  <p className="text-xs text-slate-500">{tx.notes || '-'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(tx.transacted_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">
                {modalType === 'deposit' ? 'Setor Tabungan' : 'Tarik Tabungan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Siswa</span>
                  <span className="font-medium text-slate-800">{(selectedAccount as any).student?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Saldo Saat Ini</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedAccount.balance)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label>
                <input type="number" className="input" value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="Masukkan jumlah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label>
                <input type="text" className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan transaksi" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSubmit} disabled={saving || amount <= 0} className="btn-primary disabled:opacity-60">
                {saving ? 'Memproses...' : modalType === 'deposit' ? 'Setor' : 'Tarik'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
