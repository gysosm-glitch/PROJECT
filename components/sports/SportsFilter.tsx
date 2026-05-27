'use client'

import { FacilityType, FACILITY_LABELS } from '@/types/database'

interface SportsFilterProps {
  activeFacility: FacilityType
  onChange: (facility: FacilityType) => void
}

const FACILITIES: { value: FacilityType; label: string; emoji: string }[] = [
  { value: 'futsal', label: FACILITY_LABELS.futsal, emoji: '⚽' },
  { value: 'basketball', label: FACILITY_LABELS.basketball, emoji: '🏀' },
  { value: 'tennis', label: FACILITY_LABELS.tennis, emoji: '🎾' },
  { value: 'small_field', label: FACILITY_LABELS.small_field, emoji: '🏃' },
  { value: 'main_field', label: FACILITY_LABELS.main_field, emoji: '🏟️' },
]

export default function SportsFilter({ activeFacility, onChange }: SportsFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
      {FACILITIES.map(({ value, label, emoji }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
            activeFacility === value
              ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/30'
              : 'bg-surface-elevated border border-surface-border text-gray-400 hover:text-white hover:border-accent-600/50'
          }`}
        >
          <span>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
