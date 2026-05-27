import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Building2, Trophy, ExternalLink } from 'lucide-react'
import { Contest, CONTEST_FIELD_LABELS } from '@/types/database'

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
  if (days <= 7) return <span className="badge" style={{ background: 'rgba(234,88,12,0.2)', color: '#fb923c', border: '1px solid rgba(234,88,12,0.3)' }}>D-{days}</span>
  return <span className="badge-primary">D-{days}</span>
}

export default function ContestCard({ contest }: ContestCardProps) {
  return (
    <Link
      href={`/contest/${contest.id}`}
      id={`contest-card-${contest.id}`}
      className="group glass-card flex flex-col overflow-hidden hover:border-primary-500/40 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-surface-elevated overflow-hidden">
        {contest.thumbnail_url ? (
          <img
            src={contest.thumbnail_url}
            alt={contest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/60 to-surface-elevated">
            <Trophy className="w-12 h-12 text-primary-600/50" />
          </div>
        )}
        {/* Field badge overlay */}
        <div className="absolute top-3 left-3">
          <span className="badge-primary text-xs backdrop-blur-sm">
            {CONTEST_FIELD_LABELS[contest.field]}
          </span>
        </div>
        {/* Deadline overlay */}
        <div className="absolute top-3 right-3">
          <DeadlineBadge endDate={contest.end_date} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-primary-300 transition-colors">
          {contest.title}
        </h3>

        {/* Organizer */}
        {contest.organizer && (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{contest.organizer}</span>
          </div>
        )}

        {/* Prize */}
        {contest.prize && (
          <div className="flex items-center gap-1.5 text-accent-400 text-xs font-medium">
            <span className="text-accent-500">💰</span>
            <span className="truncate">{contest.prize}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-surface-border">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>~{new Date(contest.end_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
          </div>
          <span className="text-primary-500 group-hover:text-primary-300 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
