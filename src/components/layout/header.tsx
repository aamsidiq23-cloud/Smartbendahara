import { Bell, Search, ChevronDown, GraduationCap, LogOut, User, Settings, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../lib/auth-context'

export function Header() {
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari siswa, transaksi, atau menu..."
          className="input pl-10 bg-slate-50 border-slate-200 focus:bg-white"
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifikasi</h3>
                <span className="badge badge-danger">3 baru</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {[
                  { title: 'SPP Ahmad Fauzi lunas', time: '5 menit lalu', icon: '✅' },
                  { title: 'Setoran tabungan Siti Nurhaliza', time: '15 menit lalu', icon: '💰' },
                  { title: '3 WA notifikasi gagal terkirim', time: '1 jam lalu', icon: '❗' },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{n.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 text-center">
                <button className="text-xs text-emerald-600 font-medium hover:text-emerald-700 cursor-pointer">Lihat Semua</button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200"></div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {profile?.tenant_name || 'Sekolah'}
              </p>
              <p className="text-xs text-slate-500">
                {profile?.name || 'User'} · {profile?.role === 'admin' ? 'Admin' : profile?.role === 'treasurer' ? 'Bendahara' : 'Kepala Sekolah'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold">{profile?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{profile?.email || ''}</p>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Profil Saya
                </button>
                <button
                  onClick={() => { setShowProfile(false); navigate({ to: '/dashboard/pengaturan' }) }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Pengaturan
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Bantuan
                </button>
              </div>
              <div className="py-1 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
