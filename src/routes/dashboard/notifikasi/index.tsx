import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Filter, RefreshCw, CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNotificationLogs } from '../../../lib/supabase-hooks'

export const Route = createFileRoute('/dashboard/notifikasi/')({ component: NotifikasiPage })

const eventLabels: Record<string, { label: string; emoji: string }> = {
  spp_paid: { label: 'Konfirmasi SPP', emoji: '✅' },
  savings_deposit: { label: 'Setoran Tabungan', emoji: '💰' },
  savings_withdrawal: { label: 'Penarikan Tabungan', emoji: '💸' },
  spp_reminder_h3: { label: 'Pengingat H-3', emoji: '⏰' },
  spp_reminder_h0: { label: 'Pengingat H-0', emoji: '📢' },
  spp_overdue_h7: { label: 'Tunggakan H+7', emoji: '❗' },
  bill_created: { label: 'Tagihan Baru', emoji: '📋' },
  bill_paid: { label: 'Bayar Tagihan', emoji: '✅' },
}

const statusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  delivered: { label: 'Terkirim', class: 'badge-success', icon: CheckCircle2 },
  sent: { label: 'Dikirim', class: 'badge-info', icon: Send },
  queued: { label: 'Antrian', class: 'badge-neutral', icon: Clock },
  failed: { label: 'Gagal', class: 'badge-danger', icon: XCircle },
  skipped_no_gateway: { label: 'Dilewati', class: 'badge-neutral', icon: XCircle },
}

function NotifikasiPage() {
  const { logs, loading, refetch } = useNotificationLogs()
  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = logs.filter((n) => {
    const matchEvent = !filterEvent || n.event_type === filterEvent
    const matchStatus = !filterStatus || n.status === filterStatus
    return matchEvent && matchStatus
  })

  const totalSent = logs.filter(n => n.status === 'delivered' || n.status === 'sent').length
  const totalFailed = logs.filter(n => n.status === 'failed').length
  const totalQueued = logs.filter(n => n.status === 'queued').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat log notifikasi...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi WhatsApp</h1>
          <p className="text-slate-500 text-sm mt-1">Log pengiriman pesan WA otomatis</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500">Total Pesan</p>
          <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
        </div>
        <div className="card p-4 stat-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="status-dot status-dot-success"></div>
            <p className="text-xs text-slate-500">Terkirim</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalSent}</p>
        </div>
        <div className="card p-4 stat-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="status-dot status-dot-danger"></div>
            <p className="text-xs text-slate-500">Gagal</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
        </div>
        <div className="card p-4 stat-card">
          <p className="text-xs text-slate-500">Success Rate</p>
          <p className="text-2xl font-bold text-blue-600">
            {logs.length > 0 ? Math.round((totalSent / logs.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="select" style={{ width: '200px' }}>
            <option value="">Semua Event</option>
            {Object.entries(eventLabels).map(([key, val]) => (
              <option key={key} value={key}>{val.emoji} {val.label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select" style={{ width: '160px' }}>
            <option value="">Semua Status</option>
            <option value="delivered">Terkirim</option>
            <option value="sent">Dikirim</option>
            <option value="queued">Antrian</option>
            <option value="failed">Gagal</option>
          </select>
          <span className="text-sm text-slate-500 ml-auto">{filtered.length} pesan</span>
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Event</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Siswa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Penerima</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Pesan</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => {
                const event = eventLabels[log.event_type] || { label: log.event_type, emoji: '📨' }
                const status = statusConfig[log.status] || statusConfig.queued
                const studentName = (log as any).student?.name || '-'
                return (
                  <tr key={log.id} className="table-row-hover">
                    <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {(log.sent_at || log.created_at) ? new Date(log.sent_at || log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="flex items-center gap-2 text-sm">
                        <span>{event.emoji}</span>
                        <span className="font-medium text-slate-800">{event.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{studentName}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 font-mono">{log.recipient_phone || '-'}</td>
                    <td className="px-6 py-3.5">
                      <p className="text-xs text-slate-500 max-w-xs truncate">{log.message_sent || '-'}</p>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`badge ${status.class}`}>{status.label}</span>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Belum ada log notifikasi
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
