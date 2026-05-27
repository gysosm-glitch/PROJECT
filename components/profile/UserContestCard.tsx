import { ContestProfile, User, CONTEST_FIELD_LABELS, ContestField } from '@/types/database'
import { User as UserIcon, Award, Target, MessageSquare } from 'lucide-react'

interface UserContestCardProps {
  profile: ContestProfile & { users: { nickname: string } | null }
  onMatchRequest: (userId: string) => void
  onReport: (userId: string) => void
}

export default function UserContestCard({ profile, onMatchRequest, onReport }: UserContestCardProps) {
  const nickname = profile.users?.nickname || '알 수 없는 사용자'

  return (
    <div className="glass-card p-5 hover:border-primary-500/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center border border-surface-border">
            <UserIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">{nickname}</h3>
            <p className="text-sm text-gray-400">
              {profile.department} · {profile.age ? `${profile.age}세` : '나이 비공개'} · {
                profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '성별 비공개'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {/* Intro */}
        {profile.intro && (
          <div className="text-sm text-gray-300 bg-surface-elevated/50 p-3 rounded-lg border border-surface-border/50">
            "{profile.intro}"
          </div>
        )}

        {/* Stats & Fields */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Award className="w-4 h-4" />
            <span>공모전 참여 {profile.contest_count}회</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span>관심분야 {profile.fields.length}개</span>
          </div>
        </div>

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.certificates.map(cert => (
              <span key={cert} className="px-2 py-0.5 text-xs rounded border border-accent-500/30 text-accent-300 bg-accent-500/10">
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Fields */}
        {profile.fields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.fields.map(field => (
              <span key={field} className="badge-primary text-xs">
                {CONTEST_FIELD_LABELS[field as ContestField]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-surface-border">
        <button
          onClick={() => onMatchRequest(profile.user_id)}
          className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          매칭 신청
        </button>
        <button
          onClick={() => onReport(profile.user_id)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/30"
        >
          신고
        </button>
      </div>
    </div>
  )
}
