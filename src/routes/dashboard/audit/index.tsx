import { createFileRoute } from '@tanstack/react-router'
import { Shield, Filter, Download, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useAuditLogs } from '../../../lib/supabase-hooks'

export const Route = createFileRoute('/dashboard/audit/')({ component: AuditPage })

const actionConfig: Record<string, { label: string; color: string }> = {
  create: { label: 'Buat', color: 'badge-success' },
  update: { label: 'Ubah', color: 'badge-info' },
  delete: { label: 'Hapus', color: 'badge-danger' },
  export: { label: 'Export', color: 'bg-purple-100 text-purple-700' },
  login: { label: 'Login', color: 'badge-neutral' },
  logout: { label: 'Logout', color: 'badge-neutral' },
}

const entityLabels: Record<string, string> = {
  students: 'Siswa',
  spp_payments: 'SPP',
  savings_accounts: 'Tabungan',
  savings_transactions: 'Transaksi Tabungan',
  custom_bills: 'Tagihan',
  bill_assignments: 'Assign Tagihan',
  bill_payments: 'Bayar Tagihan',
  classes: 'Kelas',
  academic_years: 'Tahun Ajaran',
  users: 'Pengguna',
  tenants: 'Sekolah',
  wa_configs: 'WhatsApp',
  parent_contacts: 'Kontak Ortu',
  student_enrollments: 'Enrollment',
}

function AuditPage() {
  const [filterAction, setFilterAction] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const { logs, loading, refetch } = useAuditLogs({
    action: filterAction || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  })

  // Get unique users from logs
  const uniqueUsers = [...new Set(logs.map(l => (l as any).user?.name).filter(Boolean))]
  const [filterUser, setFilterUser] = useState('')

  const filtered = logs.filter((l) => {
    const matchUser = !filterUser || (l as any).user?.name === filterUser
    return matchUser
  })

  function getDescription(log: typeof logs[0]) {
    const actionLabel = actionConfig[log.action]?.label || log.action
    const entityLabel = entityLabels[log.entity_type] || log.entity_type
    return `${actionLabel} data ${entityLabel}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat audit log...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 text-sm mt-1">Riwayat seluruh aktivitas pengguna dalam sistem</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Export Audit Log
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="select" style={{ width: '160px' }}>
            <option value="">Semua Aksi</option>
            {Object.entries(actionConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="select" style={{ width: '180px' }}>
            <option value="">Semua Pengguna</option>
            {uniqueUsers.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            style={{ width: '160px' }}
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder="Dari tanggal"
          />
          <input
            type="date"
            className="input"
            style={{ width: '160px' }}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            placeholder="Sampai tanggal"
          />
          <span className="text-sm text-slate-500 ml-auto">{filtered.length} aktivitas</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.map((log) => {
            const action = actionConfig[log.action] || actionConfig.create
            const userName = (log as any).user?.name || 'System'
            return (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 table-row-hover">
                <div className="relative flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    log.action === 'create' ? 'bg-emerald-100 text-emerald-700' :
                    log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                    log.action === 'delete' ? 'bg-red-100 text-red-700' :
                    log.action === 'export' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.action === 'create' ? '+' :
                     log.action === 'update' ? '✎' :
                     log.action === 'delete' ? '✕' :
                     log.action === 'export' ? '↓' :
                     log.action === 'login' ? '→' : '←'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800">{userName}</span>
                    <span className={`badge ${action.color}`}>{action.label}</span>
                    <span className="badge badge-neutral">{entityLabels[log.entity_type] || log.entity_type}</span>
                  </div>
                  <p className="text-sm text-slate-600">{getDescription(log)}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap mt-1">
                  {new Date(log.created_at).toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Belum ada aktivitas tercatat
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
