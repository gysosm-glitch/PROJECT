import AppHeader from '@/components/layout/AppHeader'
import BottomTabBar from '@/components/layout/BottomTabBar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-app-container flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-20 bg-[#f5f6f8]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  )
}
