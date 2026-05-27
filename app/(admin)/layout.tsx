import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const userData = data as { role?: string } | null
    
  if (userData?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">관리자 대시보드</h1>
        {children}
      </div>
    </div>
  )
}
