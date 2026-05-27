import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, receiver_id, contest_id, reservation_id, message } = body

    if (!type || !receiver_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Insert match request
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        type,
        requester_id: user.id,
        receiver_id,
        contest_id,
        reservation_id,
        message,
        status: 'pending'
      })
      .select()
      .single()

    if (matchError) {
      console.error('Match creation error:', matchError)
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    // 2. Insert notification for the receiver
    // Fetch requester nickname for the notification message
    const { data: requester } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', user.id)
      .single()

    const nickname = requester?.nickname || '누군가'
    let content = `${nickname}님이 매칭을 신청했습니다.`
    if (type === 'contest') {
      content = `${nickname}님이 공모전 팀원으로 함께하길 원합니다!`
    } else if (type === 'sports') {
      content = `${nickname}님이 스포츠 파트너로 매칭을 신청했습니다!`
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'match_request',
        content,
        related_id: match.id,
      })

    if (notifError) {
      console.error('Notification creation error:', notifError)
      // Even if notification fails, the match was created successfully
    }

    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('API /matches POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
