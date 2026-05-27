import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reported_id, reason, detail } = await req.json()

    if (!reported_id || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert report
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_id,
        reason,
        detail,
        status: 'pending'
      })

    if (error) {
      console.error('Report insert error:', error)
      return NextResponse.json({ error: 'Failed to insert report' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
