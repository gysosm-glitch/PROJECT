import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FacilityType, FACILITY_LABELS } from '@/types/database'
import { ArrowLeft, MapPin, Calendar, Clock, Users } from 'lucide-react'
import RoomList from '@/components/room/RoomList'

interface SportsMatchPageProps {
  searchParams: Promise<{
    facility?: FacilityType
    date?: string
    reservationId?: string
  }>
}

export default async function SportsMatchPage({ searchParams }: SportsMatchPageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  if (!resolvedParams.facility || !resolvedParams.date || !resolvedParams.reservationId) {
    redirect('/sports')
  }

  // Fetch reservation details to show exact time
  const { data: reservation } = await supabase
    .from('sports_reservations')
    .select('*')
    .eq('id', resolvedParams.reservationId)
    .single()

  if (!reservation) {
    redirect('/sports')
  }

  const { data: { user } } = await supabase.auth.getUser()

  const startTime = reservation.start_time.slice(0, 5)
  const endTime = reservation.end_time.slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Back button */}
      <Link href="/sports" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        스포츠 예약 현황으로 돌아가기
      </Link>

      {/* Target Info */}
      <div className="glass-card p-6 sm:p-8 border-accent-500/30 shadow-[0_0_30px_rgba(234,88,12,0.1)] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-accent-400" />
          파트너 찾기
        </h1>
        
        <div className="flex flex-wrap gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">시설</p>
              <p className="text-white font-medium">{FACILITY_LABELS[resolvedParams.facility]}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">날짜</p>
              <p className="text-white font-medium">{resolvedParams.date.replace(/-/g, '. ')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">시간</p>
              <p className="text-accent-400 font-bold">{startTime} ~ {endTime}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            해당 시간에 개설된 스포츠 매칭 방입니다. 함께 운동할 팀원을 구해보세요!
          </p>
          <Link
            href={`/recruitment/create?type=sports&facility=${resolvedParams.facility}&date=${resolvedParams.date}&startTime=${startTime}&endTime=${endTime}`}
            className="btn-primary"
          >
            팀원 모집 개설하기
          </Link>
        </div>

        {/* Client component for room list */}
        <RoomList
          type="sports"
          sportsFacility={resolvedParams.facility}
          sportsDate={resolvedParams.date}
        />
      </div>
    </div>
  )
}
