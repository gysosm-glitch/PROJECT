'use client'

import { useState, useEffect } from 'react'
import {
  FacilityType,
  FacilityGroup,
  FACILITY_LABELS,
  FACILITY_GROUP_COURTS,
  FACILITY_GROUP_LABELS,
} from '@/types/database'

interface SportsFilterProps {
  activeFacility: FacilityType
  onChange: (facility: FacilityType) => void
}

const GROUPS: { value: FacilityGroup; emoji: string }[] = [
  { value: 'futsal',      emoji: '⚽' },
  { value: 'basketball',  emoji: '🏀' },
  { value: 'tennis',      emoji: '🎾' },
  { value: 'small_field', emoji: '🏃' },
  { value: 'main_field',  emoji: '🏟️' },
]

// 어떤 FacilityType이 어떤 그룹에 속하는지 역방향 조회
function getGroupOf(facility: FacilityType): FacilityGroup {
  for (const [group, courts] of Object.entries(FACILITY_GROUP_COURTS) as [FacilityGroup, FacilityType[]][]) {
    if ((courts as string[]).includes(facility)) return group
  }
  return 'main_field'
}

export default function SportsFilter({ activeFacility, onChange }: SportsFilterProps) {
  const [activeGroup, setActiveGroup] = useState<FacilityGroup>(() => getGroupOf(activeFacility))

  // 그룹 선택 시 해당 그룹의 첫 번째 코트를 자동 선택
  const handleGroupChange = (group: FacilityGroup) => {
    setActiveGroup(group)
    const courts = FACILITY_GROUP_COURTS[group]
    onChange(courts[0])
  }

  // 외부에서 activeFacility가 바뀌면 그룹도 동기화
  useEffect(() => {
    setActiveGroup(getGroupOf(activeFacility))
  }, [activeFacility])

  const courts = FACILITY_GROUP_COURTS[activeGroup]
  const showCourtSelector = courts.length > 1

  return (
    <div className="space-y-2">
      {/* 시설 그룹 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {GROUPS.map(({ value, emoji }) => (
          <button
            key={value}
            onClick={() => handleGroupChange(value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              activeGroup === value
                ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/30'
                : 'bg-surface-elevated border border-surface-border text-gray-400 hover:text-white hover:border-accent-600/50'
            }`}
          >
            <span>{emoji}</span>
            {FACILITY_GROUP_LABELS[value]}
          </button>
        ))}
      </div>

      {/* 코트 선택 (A/B 또는 A~E) - 단일 코트 시설은 표시 안 함 */}
      {showCourtSelector && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-1">
          {courts.map((court) => {
            const courtLabel = FACILITY_LABELS[court].replace(/.*\s/, '') // "A코트", "B코트" 등 추출
            return (
              <button
                key={court}
                onClick={() => onChange(court)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  activeFacility === court
                    ? 'bg-accent-600/30 border border-accent-500/60 text-accent-300'
                    : 'bg-surface-elevated/60 border border-surface-border text-gray-500 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                {courtLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
