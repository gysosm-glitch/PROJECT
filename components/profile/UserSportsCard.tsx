import { SportsProfile, User, FACILITY_LABELS, FacilityType } from '@/types/database'
import { User as UserIcon, Activity, Star, MessageSquare } from 'lucide-react'

interface UserSportsCardProps {
  profile: SportsProfile & { users: { nickname: string } | null }
  onMatchRequest: (userId: string) => void
  onReport: (userId: string) => void
}

export default function UserSportsCard({ profile, onMatchRequest, onReport }: UserSportsCardProps) {
  const nickname = profile.users?.nickname || '알 수 없는 사용자'

  return (
    <div className="glass-card p-5 hover:border-accent-500/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center border border-surface-border">
            <UserIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold">{nickname}</h3>
              {profile.is_pro && (
                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[10px] font-bold">
                  선출
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {profile.age ? `${profile.age}세` : '나이 비공개'} · {
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-4 h-4" />
            <span>운동 경력 {profile.career_years}년</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Star className="w-4 h-4" />
            <span>관심종목 {profile.sports.length}개</span>
          </div>
        </div>

        {/* Sports */}
        {profile.sports.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.sports.map(sport => (
              <span key={sport} className="badge-accent text-xs">
                {FACILITY_LABELS[sport as FacilityType]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-surface-border">
        <button
          onClick={() => onMatchRequest(profile.user_id)}
          className="flex-1 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
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
