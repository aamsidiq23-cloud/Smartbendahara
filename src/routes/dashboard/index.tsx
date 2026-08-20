import { createFileRoute } from '@tanstack/react-router'
import {
  Users,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency, MONTHS } from '../../lib/utils'
import { useDashboardStats, useAuditLogs } from '../../lib/supabase-hooks'
import { useAuth } from '../../lib/auth-context'

export const Route = createFileRoute('/dashboard/')({ component: DashboardIndex })

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

function DashboardIndex() {
  const { profile } = useAuth()
  const { stats, loading } = useDashboardStats()
  const { logs: activityLogs } = useAuditLogs()

  const now = new Date()
  const currentMonthName = MONTHS[now.getMonth()]
  const currentYear = now.getFullYear()

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat dashboard...</span>
      </div>
    )
  }

  const pieData = stats.paymentStatusData.map((d, i) => ({ ...d, color: PIE_COLORS[i] }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan keuangan {profile?.tenant_name || 'Sekolah'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Siswa Aktif"
          value={stats.totalStudents.toString()}
          subtitle={`${stats.totalClasses} kelas`}
          icon={Users}
          iconBg="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(stats.monthlyIncome)}
          subtitle={`${currentMonthName} ${currentYear}`}
          icon={TrendingUp}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Total Tunggakan"
          value={formatCurrency(stats.totalArrears)}
          subtitle={`${stats.arrearsCount} pembayaran`}
          icon={AlertTriangle}
          iconBg="bg-red-100 text-red-600"
        />
        <StatCard
          title="Saldo Tabungan"
          value={formatCurrency(stats.totalSavings)}
          subtitle="Seluruh siswa"
          icon={PiggyBank}
          iconBg="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="xl:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Tren Pemasukan</h3>
              <p className="text-xs text-slate-500 mt-0.5">6 bulan terakhir</p>
            </div>
          </div>
          <div className="card-body pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.monthlyIncomeData.map(d => ({ month: d.month, income: d.amount }))}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Pemasukan']}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Status Pembayaran SPP</h3>
            <p className="text-xs text-slate-500 mt-0.5">Semua periode</p>
          </div>
          <div className="card-body flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Aktivitas Terbaru</h3>
            <p className="text-xs text-slate-500 mt-0.5">Log aktivitas terakhir</p>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-slate-100">
            {activityLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-3.5 table-row-hover">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  log.action === 'create' ? 'bg-emerald-100 text-emerald-700' :
                  log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                  log.action === 'delete' ? 'bg-red-100 text-red-700' :
                  log.action === 'export' ? 'bg-purple-100 text-purple-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {log.action[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">
                    {log.action === 'login' ? 'Login ke sistem' :
                     log.action === 'create' ? `Membuat data ${log.entity_type}` :
                     log.action === 'update' ? `Mengubah data ${log.entity_type}` :
                     log.action === 'delete' ? `Menghapus data ${log.entity_type}` :
                     log.action === 'export' ? `Export ${log.entity_type}` :
                     log.action}
                  </p>
                  <p className="text-xs text-slate-500">oleh <span className="font-medium">{(log as any).user?.name || 'System'}</span></p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-slate-400">Belum ada aktivitas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, iconBg }: {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
}) {
  return (
    <div className="card p-5 stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}
