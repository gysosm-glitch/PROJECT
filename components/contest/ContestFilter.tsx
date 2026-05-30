'use client'

import { ContestField, ContestRegion, CONTEST_FIELD_LABELS, CONTEST_REGION_LABELS, CONTEST_REGION_EMOJIS } from '@/types/database'

interface ContestFilterProps {
  activeField: ContestField | 'all'
  activeRegion: ContestRegion | 'all'
  onChange: (field?: ContestField | 'all', region?: ContestRegion | 'all') => void
}

const FIELD_FILTERS: { value: ContestField | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: '전체', emoji: '🎯' },
  { value: 'marketing', label: '마케팅·아이디어', emoji: '📢' },
  { value: 'video', label: '영상·UCC·사진', emoji: '🎬' },
  { value: 'design', label: '디자인', emoji: '🎨' },
  { value: 'literature', label: '문학·글', emoji: '✍️' },
  { value: 'it', label: 'IT·소프트웨어', emoji: '💻' },
  { value: 'arts', label: '예체능·음악·미술', emoji: '🎭' },
  { value: 'academic', label: '학술·창업·논술', emoji: '🔬' },
]

const REGION_FILTERS: { value: ContestRegion | 'all'; label: string }[] = [
  { value: 'all', label: '전체 지역' },
  { value: '충청북도', label: CONTEST_REGION_LABELS['충청북도'] },
  { value: '충청남도', label: CONTEST_REGION_LABELS['충청남도'] },
  { value: '세종특별자치시', label: CONTEST_REGION_LABELS['세종특별자치시'] },
  { value: '대전광역시', label: CONTEST_REGION_LABELS['대전광역시'] },
]

export default function ContestFilter({ activeField, activeRegion, onChange }: ContestFilterProps) {
  return (
    <div className="space-y-3">
      {/* 분야 필터 */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase">분야</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {FIELD_FILTERS.map(({ value, label, emoji }) => (
            <button
              key={value}
              id={`filter-field-${value}`}
              onClick={() => onChange(value, activeRegion)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeField === value
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'bg-surface-elevated border border-surface-border text-gray-400 hover:text-white hover:border-primary-600/50'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
