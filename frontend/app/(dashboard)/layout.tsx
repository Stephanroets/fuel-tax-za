import { AuthProvider } from '@/lib/contexts/auth-context'
import { BottomNav, FloatingAddButton } from '@/components/navigation/bottom-nav'
import { DashboardHeader } from '@/components/navigation/dashboard-header'
import { SidebarNav } from '@/components/navigation/sidebar-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader />
        <div className="flex flex-1">
          <SidebarNav />
          <main className="flex-1 pb-20 md:pb-0 md:pl-0">
            {children}
          </main>
        </div>
        <BottomNav />
        <FloatingAddButton />
      </div>
    </AuthProvider>
  )
}
