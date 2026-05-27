'use client'

import { FacilityType, SportsReservation } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Clock, Users } from 'lucide-react'

interface ReservationTimelineProps {
  reservations: SportsReservation[]
  facility: FacilityType
  date: string
}

export default function ReservationTimeline({ reservations, facility, date }: ReservationTimelineProps) {
  const router = useRouter()

  // Group by hour or just list them
  // The API returns slots like start_time="09:00:00", end_time="11:00:00"

  const handleSlotClick = (reservation: SportsReservation) => {
    if (reservation.status === 'available') {
      router.push(`/sports/match?facility=${facility}&date=${date}&reservationId=${reservation.id}`)
    }
  }

  return (
    <div className="space-y-3">
      {reservations.map((slot) => {
        const isAvailable = slot.status === 'available'
        const isReserved = slot.status === 'reserved'
        const isClosed = slot.status === 'closed'
        
        // Format time (e.g. 09:00:00 -> 09:00)
        const startTime = slot.start_time.slice(0, 5)
        const endTime = slot.end_time.slice(0, 5)

        return (
          <div
            key={slot.id}
            onClick={() => handleSlotClick(slot)}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              isAvailable
                ? 'bg-green-900/10 border-green-500/30 hover:bg-green-900/20 hover:border-green-500/50 cursor-pointer group'
                : 'bg-surface-elevated/30 border-surface-border opacity-70 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border ${
                isAvailable ? 'bg-green-900/40 border-green-500/30 text-green-400' : 'bg-surface-elevated border-surface-border text-gray-500'
              }`}>
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-sm font-bold">{startTime}</span>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-0.5">종료 {endTime}</p>
                <div className="flex items-center gap-2">
                  {isAvailable && <span className="text-green-400 font-medium">예약 가능</span>}
                  {isReserved && <span className="text-gray-500">예약 완료</span>}
                  {isClosed && <span className="text-gray-600">마감/불가</span>}
                </div>
              </div>
            </div>

            {isAvailable && (
              <div className="flex items-center gap-2 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium hidden sm:block">파트너 찾기</span>
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
