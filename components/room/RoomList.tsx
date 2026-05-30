'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Users, Clock, User } from 'lucide-react'

interface RoomListProps {
  type: 'contest' | 'sports'
  relationId?: string // contest_id or something
  sportsFacility?: string
  sportsDate?: string
}

export default function RoomList({ type, relationId, sportsFacility, sportsDate }: RoomListProps) {
  const supabase = createClient()
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

      if (type === 'sports') {
        if (sportsFacility) {
          if (sportsFacility === 'other') {
            query = query.is('sports_facility', null)
          } else {
            query = query.eq('sports_facility', sportsFacility)
          }
        }
        if (sportsDate) query = query.eq('sports_date', sportsDate)
      }

      const { data } = await query
      setRooms(data || [])
      setLoading(false)
    }

    fetchRooms()
  }, [type, relationId, sportsFacility, sportsDate])

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
          className="flex items-center gap-4 bg-white p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          {/* Avatar (Left) */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {room.host?.avatar_url ? (
              <img src={room.host.avatar_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          {/* Content (Middle) */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#191919] text-base truncate mb-0.5">
              {room.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="truncate max-w-[100px]">{room.host?.nickname || '익명'}</span>
              <span>·</span>
              <span>{new Date(room.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* Members (Right) */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <div className="bg-[#f5f6f8] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-bold text-gray-700">
                {room.current_members} <span className="text-gray-400 font-normal">/ {room.required_members + 1}</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
              모집 중
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
