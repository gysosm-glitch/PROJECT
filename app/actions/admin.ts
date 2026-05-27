'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveReport(reportId: string, action: 'ban' | 'dismiss', reportedId?: string) {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') return { error: 'Forbidden' }

  try {
    if (action === 'dismiss') {
      await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    } else if (action === 'ban' && reportedId) {
      // 1. Mark report as resolved
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
      
      // 2. Ban user (set is_active = false)
      await supabase.from('users').update({ is_active: false }).eq('id', reportedId)
      
      // 3. Hide their profiles
      await supabase.from('contest_profiles').update({ is_visible: false }).eq('user_id', reportedId)
      await supabase.from('sports_profiles').update({ is_visible: false }).eq('user_id', reportedId)
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Internal Server Error' }
  }
}

export async function unbanUser(userId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') return { error: 'Forbidden' }

  try {
    await supabase.from('users').update({ is_active: true }).eq('id', userId)
    await supabase.from('contest_profiles').update({ is_visible: true }).eq('user_id', userId)
    await supabase.from('sports_profiles').update({ is_visible: true }).eq('user_id', userId)

    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Internal Server Error' }
  }
}
