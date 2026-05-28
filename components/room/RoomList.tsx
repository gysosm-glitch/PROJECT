'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Users, Clock } from 'lucide-react'

interface RoomListProps {
  type: 'contest' | 'sports'
  relationId?: string // contest_id or something
}

export default function RoomList({ type, relationId }: RoomListProps) {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRooms() {
      setLoading(true)
      let query = supabase
        .from('recruitment_rooms')
        .select(`
          id, title, status, required_members, current_members, created_at,
          host:users!host_id ( nickname, avatar_url )
        `)
        .eq('type', type)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (type === 'contest' && relationId) {
        query = query.eq('contest_id', relationId)
      }

      const { data } = await query
      setRooms(data || [])
      setLoading(false)
    }

    fetchRooms()
  }, [type, relationId])

  if (loading) return <div className="text-center py-8 text-slate-500">불러오는 중...</div>
  
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-2xl border border-slate-200 border-dashed">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium mb-1">아직 모집 중인 방이 없습니다.</p>
        <p className="text-sm text-slate-400">첫 번째 방장이 되어 팀원을 모집해보세요!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <Link
          key={room.id}
          href={`/recruitment/${room.id}`}
          className="block glass-card p-5 group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">
              {room.title}
            </h3>
            <span className="badge-primary">모집 중</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-medium">{room.host?.nickname || '익명'}</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(room.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-primary-500" />
              <span className="text-primary-600">{room.current_members}</span>
              <span className="text-slate-400">/ {room.required_members + 1}명</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
