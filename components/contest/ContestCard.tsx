import Link from 'next/link'
import { Calendar, Building2, Trophy, ExternalLink } from 'lucide-react'
import { Contest, CONTEST_FIELD_LABELS, CONTEST_REGION_EMOJIS } from '@/types/database'

interface ContestCardProps {
  contest: Contest
}

function getDaysLeft(endDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function DeadlineBadge({ endDate }: { endDate: string }) {
  const days = getDaysLeft(endDate)
  if (days < 0) return <span className="badge-red">마감</span>
  if (days === 0) return <span className="badge-red animate-pulse">오늘마감</span>
  if (days <= 3) return <span className="badge-red">D-{days}</span>
  if (days <= 7) return <span className="badge" style={{ background: 'rgba(234,88,12,0.1)', color: '#ea580c', border: '1px solid rgba(234,88,12,0.2)' }}>D-{days}</span>
  return <span className="badge-primary">D-{days}</span>
}

export default function ContestCard({ contest }: ContestCardProps) {
  return (
    <Link
      href={`/contest/${contest.id}`}
      id={`contest-card-${contest.id}`}
      className="group glass-card flex flex-col overflow-hidden hover:border-primary-200 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-surface-elevated overflow-hidden border-b border-surface-border">
        {contest.thumbnail_url ? (
          <img
            src={contest.thumbnail_url}
            alt={contest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <Trophy className="w-12 h-12 text-primary-300" />
          </div>
        )}
        {/* Field badge overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="badge-primary text-xs backdrop-blur-sm bg-white/90">
            {CONTEST_FIELD_LABELS[contest.field] || '기타'}
          </span>
          {contest.region && (
            <span className="badge text-xs backdrop-blur-sm bg-white/90" style={{ color: '#9333ea', border: '1px solid rgba(147, 51, 234, 0.2)' }}>
              {CONTEST_REGION_EMOJIS[contest.region] || '🌍'}
            </span>
          )}
        </div>
        {/* Deadline overlay */}
        <div className="absolute top-3 right-3">
          <DeadlineBadge endDate={contest.end_date} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
          {contest.title}
        </h3>

        {/* Organizer */}
        {contest.organizer && (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{contest.organizer}</span>
          </div>
        )}

        {/* Prize */}
        {contest.prize && (
          <div className="flex items-center gap-1.5 text-accent-600 text-xs font-medium">
            <span className="text-accent-500">🏆</span>
            <span className="truncate">{contest.prize}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>~{new Date(contest.end_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
            </div>
            <span className="text-primary-500 group-hover:text-primary-700 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
          {contest.max_participants && (
            <div className="text-xs text-slate-500">
              <span className="text-accent-600 font-medium">최대 {contest.max_participants}명</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
