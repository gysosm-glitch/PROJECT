'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FacilityType, FacilityGroup, FACILITY_GROUP_COURTS, SportsProfile } from '@/types/database'
import UserSportsCard from '@/components/profile/UserSportsCard'
import MatchRequestModal from '@/components/match/MatchRequestModal'
import ReportModal from '@/components/report/ReportModal'
import { Loader2 } from 'lucide-react'

interface MatchSportsUserListProps {
  facility: FacilityType
  reservationId: string
  currentUserId?: string
}

type ProfileWithUser = SportsProfile & { users: { nickname: string } | null }

// 코트 타입(futsal_a 등) → 그룹(futsal 등) 역변환
function getFacilityGroup(facility: FacilityType): FacilityGroup {
  for (const [group, courts] of Object.entries(FACILITY_GROUP_COURTS) as [FacilityGroup, FacilityType[]][]) {
    if ((courts as string[]).includes(facility)) return group
  }
  return facility as unknown as FacilityGroup
}

export default function MatchSportsUserList({ facility, reservationId, currentUserId }: MatchSportsUserListProps) {
  const supabase = createClient()
  const [users, setUsers] = useState<ProfileWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<ProfileWithUser | null>(null)
  const [reportingUser, setReportingUser] = useState<ProfileWithUser | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      // 코트(futsal_a)를 그룹(futsal)으로 변환해서 관심 종목 매칭
      const group = getFacilityGroup(facility)
      let query = supabase
        .from('sports_profiles')
        .select('*, users(nickname)')
        .eq('is_visible', true)
        .contains('sports', [group])

      if (currentUserId) {
        query = query.neq('user_id', currentUserId)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(20)

      if (error) {
        console.error('유저 목록 조회 오류:', error)
      } else {
        setUsers((data as unknown) as ProfileWithUser[])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [supabase, facility, currentUserId])

  const handleMatchRequest = (targetUserId: string) => {
    if (!currentUserId) {
      alert('로그인이 필요한 기능입니다.')
      return
    }
    const target = users.find(u => u.user_id === targetUserId)
    if (target) setSelectedUser(target)
  }

  const submitMatchRequest = async (message: string) => {
    if (!selectedUser) return
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sports',
          receiver_id: selectedUser.user_id,
          reservation_id: reservationId,
          message
        })
      })

      if (!res.ok) throw new Error('API Error')
      alert('매칭 신청이 완료되었습니다!')
      setSelectedUser(null)
    } catch (e) {
      console.error(e)
      alert('매칭 신청에 실패했습니다.')
    }
  }

  const handleReport = (targetUserId: string) => {
    if (!currentUserId) {
      alert('로그인이 필요한 기능입니다.')
      return
    }
    const target = users.find(u => u.user_id === targetUserId)
    if (target) setReportingUser(target)
  }

  const submitReport = async (reason: string, detail: string) => {
    if (!reportingUser) return
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_id: reportingUser.user_id,
          reason,
          detail
        })
      })

      if (!res.ok) throw new Error('API Error')
      alert('신고가 접수되었습니다.')
      setReportingUser(null)
    } catch (e) {
      console.error(e)
      alert('신고 접수에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="glass-card py-16 text-center">
        <p className="text-gray-400 font-medium">아직 이 종목에 관심 있는 유저가 없습니다.</p>
        <p className="text-sm text-gray-500 mt-2">가장 먼저 프로필을 등록해보세요!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map(profile => (
        <UserSportsCard
          key={profile.id}
          profile={profile}
          onMatchRequest={handleMatchRequest}
          onReport={handleReport}
        />
      ))}

      {selectedUser && (
        <MatchRequestModal
          onClose={() => setSelectedUser(null)}
          onSubmit={submitMatchRequest}
          targetNickname={selectedUser.users?.nickname || '사용자'}
        />
      )}

      {reportingUser && (
        <ReportModal
          onClose={() => setReportingUser(null)}
          onSubmit={submitReport}
          targetNickname={reportingUser.users?.nickname || '사용자'}
        />
      )}
    </div>
  )
}
