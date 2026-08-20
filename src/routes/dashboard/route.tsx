import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '../../components/layout/sidebar'
import { Header } from '../../components/layout/header'
import { supabase } from '../../lib/supabase'
import { TenantStatusGuard, TrialBanner } from '../../lib/role-guard'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    // Check if user is authenticated before accessing dashboard
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <TenantStatusGuard>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-[260px] transition-all duration-300">
          <TrialBanner />
          <Header />
          <main className="p-6 page-enter">
            <Outlet />
          </main>
        </div>
      </div>
    </TenantStatusGuard>
  )
}

