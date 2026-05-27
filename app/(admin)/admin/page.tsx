import { createClient } from '@/lib/supabase/server'
import AdminReportList from './AdminReportList'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id,
      reason,
      detail,
      status,
      created_at,
      reporter:users!reporter_id(id, nickname, email),
      reported:users!reported_id(id, nickname, email, is_active)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <AdminReportList reports={reports || []} />
    </div>
  )
}
