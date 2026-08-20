// ============================================
// Smart Bendahara — Role-Based Access Guard
// Controls UI visibility based on user role
// ============================================
import { type ReactNode } from 'react'
import { useAuth } from './auth-context'
import { ShieldAlert } from 'lucide-react'

type UserRole = 'admin' | 'treasurer' | 'principal'

interface RoleGuardProps {
  /** Roles allowed to see the content */
  allowedRoles: UserRole[]
  /** Content to render if role is allowed */
  children: ReactNode
  /** Optional: what to show if denied (defaults to null/hidden) */
  fallback?: ReactNode
  /** If true, show a styled "access denied" message instead of hiding */
  showDenied?: boolean
}

/**
 * RoleGuard — renders children only if the current user's role
 * is in the allowedRoles list.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['admin', 'treasurer']}>
 *     <button>Edit Data</button>
 *   </RoleGuard>
 */
export function RoleGuard({ allowedRoles, children, fallback, showDenied }: RoleGuardProps) {
  const { profile, loading } = useAuth()

  // While loading, don't render anything
  if (loading) return null

  // If no profile, don't render (user not logged in)
  if (!profile) return null

  // Check if user's role is in the allowed list
  if (allowedRoles.includes(profile.role as UserRole)) {
    return <>{children}</>
  }

  // Show fallback or denied message
  if (fallback) return <>{fallback}</>
  if (showDenied) return <AccessDeniedMessage />

  // Default: hide content silently
  return null
}

/**
 * useRoleCheck — hook to check role in component logic
 *
 * Usage:
 *   const { isAdmin, isTreasurer, isPrincipal, canEdit } = useRoleCheck()
 *   if (canEdit) { // show edit buttons }
 */
export function useRoleCheck() {
  const { profile } = useAuth()
  const role = profile?.role as UserRole | undefined

  return {
    role,
    isAdmin: role === 'admin',
    isTreasurer: role === 'treasurer',
    isPrincipal: role === 'principal',
    /** Admin and treasurer can create/update/delete data */
    canEdit: role === 'admin' || role === 'treasurer',
    /** Only admin can manage settings, users, academic years */
    canManage: role === 'admin',
    /** All roles can read/view data */
    canView: !!role,
  }
}

/**
 * TenantStatusGuard — shows warning if tenant is suspended/cancelled
 */
export function TenantStatusGuard({ children }: { children: ReactNode }) {
  const { profile } = useAuth()

  if (!profile) return <>{children}</>

  if (profile.tenant_status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akun Ditangguhkan</h2>
          <p className="text-slate-500 mb-4">
            Akun sekolah Anda saat ini ditangguhkan. Silakan hubungi tim Smart Bendahara
            untuk informasi lebih lanjut.
          </p>
          <a
            href="mailto:support@smartbendahara.id"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            Hubungi Support
          </a>
        </div>
      </div>
    )
  }

  if (profile.tenant_status === 'cancelled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Langganan Berakhir</h2>
          <p className="text-slate-500 mb-4">
            Langganan sekolah Anda telah berakhir. Silakan perbarui langganan untuk
            melanjutkan menggunakan Smart Bendahara.
          </p>
          <a
            href="mailto:support@smartbendahara.id"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            Perbarui Langganan
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * TrialBanner — shows banner if tenant is on trial
 */
export function TrialBanner() {
  const { profile } = useAuth()

  if (!profile || profile.tenant_status !== 'trial') return null

  // Calculate days remaining if trial_ends_at is available
  // (For now we show a generic trial banner)
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-center text-sm font-medium">
      <span className="mr-1">🎉</span>
      Anda sedang dalam masa trial gratis 14 hari.{' '}
      <a href="#" className="underline font-bold hover:text-amber-100 transition-colors">
        Pilih paket berlangganan →
      </a>
    </div>
  )
}

function AccessDeniedMessage() {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <ShieldAlert className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">Akses Terbatas</h3>
      <p className="text-sm text-slate-500">
        Anda tidak memiliki izin untuk mengakses fitur ini.
        Hubungi admin sekolah untuk informasi lebih lanjut.
      </p>
    </div>
  )
}
