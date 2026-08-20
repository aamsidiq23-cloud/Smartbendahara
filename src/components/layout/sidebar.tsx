import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PiggyBank,
  Receipt,
  FileText,
  MessageSquare,
  Shield,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/siswa', label: 'Data Siswa', icon: Users },
  { to: '/dashboard/spp', label: 'Manajemen SPP', icon: CreditCard },
  { to: '/dashboard/tabungan', label: 'Tabungan Siswa', icon: PiggyBank },
  { to: '/dashboard/tagihan', label: 'Tagihan', icon: Receipt },
  { to: '/dashboard/laporan', label: 'Laporan', icon: FileText },
  { to: '/dashboard/notifikasi', label: 'Notifikasi WA', icon: MessageSquare },
  { to: '/dashboard/audit', label: 'Audit Log', icon: Shield },
  { to: '/dashboard/pengaturan', label: 'Pengaturan', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{ background: 'var(--color-sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-white font-bold text-base leading-tight">Smart Bendahara</h1>
            <p className="text-[11px] text-emerald-400/70">Manajemen Keuangan Sekolah</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = item.end
              ? currentPath === item.to
              : currentPath.startsWith(item.to)
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 w-full cursor-pointer"
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
        )}
      </button>
    </aside>
  )
}
