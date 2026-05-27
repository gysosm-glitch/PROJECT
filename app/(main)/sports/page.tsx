'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FacilityType, FACILITY_LABELS, SportsReservation } from '@/types/database'
import SportsFilter from '@/components/sports/SportsFilter'
import ReservationTimeline from '@/components/sports/ReservationTimeline'
import SportsProfileModal from '@/components/profile/SportsProfileModal'
import { Dumbbell, SlidersHorizontal, Loader2, Calendar as CalendarIcon, Info } from 'lucide-react'

// Get today + next 6 days
const getNext7Days = () => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const DATES = getNext7Days()
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function SportsPage() {
  const supabase = createClient()
  const [activeFacility, setActiveFacility] = useState<FacilityType>('futsal')
  const [activeDate, setActiveDate] = useState<string>(DATES[0])
  const [reservations, setReservations] = useState<SportsReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('sports_reservations')
        .select('*')
        .eq('facility', activeFacility)
        .eq('reservation_date', activeDate)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching reservations:', error)
      } else {
        setReservations(data as SportsReservation[])
      }
      setLoading(false)
    }

    fetchReservations()
  }, [supabase, activeFacility, activeDate])

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr)
    const isToday = dateStr === DATES[0]
    return {
      day: d.getDate(),
      dayName: DAY_NAMES[d.getDay()],
      isToday
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-5 h-5 text-accent-400" />
            <h1 className="text-xl font-bold text-white">스포츠</h1>
          </div>
          <p className="text-gray-400 text-sm">충북대 시설 예약 현황을 보고 파트너를 찾으세요</p>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 btn-secondary text-sm py-2 hover:border-accent-500/30"
        >
          <SlidersHorizontal className="w-4 h-4" />
          내 프로필
        </button>
      </div>

      {/* Facility Filter */}
      <SportsFilter activeFacility={activeFacility} onChange={setActiveFacility} />

      {/* Main Content Area */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Date Selector (Left column on desktop, horizontal on mobile) */}
        <div className="md:col-span-1 glass-card p-4 md:p-5 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-none h-fit">
          <div className="hidden md:flex items-center gap-2 text-gray-300 font-medium mb-3 pl-1 border-b border-surface-border pb-3">
            <CalendarIcon className="w-4 h-4" />
            <span>날짜 선택</span>
          </div>
          {DATES.map(dateStr => {
            const { day, dayName, isToday } = formatDateLabel(dateStr)
            const isActive = activeDate === dateStr
            
            return (
              <button
                key={dateStr}
                onClick={() => setActiveDate(dateStr)}
                className={`flex-shrink-0 md:flex-shrink flex flex-col md:flex-row items-center md:justify-between px-4 md:px-3 py-3 md:py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-600/20 border border-accent-500/50 text-accent-300 shadow-[0_0_15px_rgba(234,88,12,0.15)]'
                    : 'bg-surface-elevated/50 border border-transparent text-gray-400 hover:bg-surface-elevated hover:text-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-center md:text-left">
                  <span className={`text-sm font-medium ${isToday ? 'text-accent-400' : ''}`}>
                    {isToday ? '오늘' : dayName}
                  </span>
                  <span className={`text-xl md:text-base font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {day}일
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Timeline Area */}
        <div className="md:col-span-3 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {FACILITY_LABELS[activeFacility]} <span className="text-gray-400 font-normal text-sm">{activeDate.replace(/-/g, '.')}</span>
              </h2>
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50 block"></span><span className="text-gray-400">예약 가능</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-surface-elevated border border-surface-border block"></span><span className="text-gray-400">예약 불가</span></div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-16 bg-surface-elevated/30 rounded-xl border border-surface-border border-dashed">
                <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">조회된 예약 데이터가 없습니다.</p>
                <p className="text-xs text-gray-500 mt-1">학교 시스템 예약 기간이 아닐 수 있습니다.</p>
              </div>
            ) : (
              <ReservationTimeline reservations={reservations} facility={activeFacility} date={activeDate} />
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <SportsProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
