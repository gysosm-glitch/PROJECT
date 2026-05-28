'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ContestProfileModal from '@/components/profile/ContestProfileModal'
import SportsProfileModal from '@/components/profile/SportsProfileModal'
import { Trophy, Dumbbell, AlertCircle, CheckCircle2, XCircle, Star, Clock } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('contest')
  const [showContestModal, setShowContestModal] = useState(false)
  const [showSportsModal, setShowSportsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [mannerScore, setMannerScore] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setUser(data)
      setMannerScore(data?.manner_score || 0)

      // Fetch applications
      const { data: appData } = await supabase
        .from('applications')
        .select('*, match_id(*)')
        .eq('applicant_id', authUser.id)
        .order('created_at', { ascending: false })
      setApplications(appData || [])

      setLoading(false)
    }
    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">내 프로필</h1>
        <p className="text-gray-400">공모전, 스포츠 매칭을 위한 프로필을 관리하세요</p>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="glass-card p-6 border border-surface-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-2xl font-bold">
                {user.nickname?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user.nickname}</h2>
                <p className="text-gray-400">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">학번: {user.student_id || '미등록'}</p>
              </div>
            </div>
            {/* Manner Score Badge */}
            <div className="flex flex-col items-center gap-1 bg-primary-900/30 rounded-lg p-3 border border-primary-500/20">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(mannerScore) ? 'fill-accent-400 text-accent-400' : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">매너 평가</p>
              <p className="text-sm font-bold text-white">{mannerScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tabs */}
      <div className="w-full">
        <div className="grid w-full grid-cols-4 gap-2 bg-transparent mb-6">
          <button
            onClick={() => setActiveTab('contest')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'contest'
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'bg-surface-elevated text-gray-400 border border-surface-border hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">공모전</span>
          </button>
          <button
            onClick={() => setActiveTab('sports')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'sports'
                ? 'bg-accent-600/20 text-accent-300 border border-accent-500/30'
                : 'bg-surface-elevated text-gray-400 border border-surface-border hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">스포츠</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'applications'
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'bg-surface-elevated text-gray-400 border border-surface-border hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">신청 관리</span>
          </button>
          <button
            onClick={() => setActiveTab('manner')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'manner'
                ? 'bg-accent-600/20 text-accent-300 border border-accent-500/30'
                : 'bg-surface-elevated text-gray-400 border border-surface-border hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">평가</span>
          </button>
        </div>

        {/* Contest Profile Tab */}
        {activeTab === 'contest' && (
          <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-6 border border-surface-border space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary-400" />
                  공모전 매칭 프로필
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  공모전 팀원 매칭을 위한 프로필 정보입니다.
                </p>
              </div>
              <button
                onClick={() => setShowContestModal(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                {showContestModal ? '편집' : '편집'}
              </button>
            </div>

            <div className="bg-surface-elevated/50 rounded-lg p-4 border border-surface-border">
              <p className="text-gray-400 text-sm">
                프로필 정보를 입력하여 공모전 팀원 매칭에 참여하세요.
              </p>
            </div>

            <button
              onClick={() => setShowContestModal(true)}
              className="w-full btn-secondary py-3 rounded-lg font-medium"
            >
              공모전 프로필 관리
            </button>
          </div>

          <div className="glass-card p-4 border border-yellow-900/30 bg-yellow-900/10 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium">프로필이 보이지 않나요?</p>
              <p className="text-yellow-300/80 mt-1">프로필을 공개 설정해야 다른 사용자에게 보입니다.</p>
            </div>
          </div>
          </div>
        )}

        {/* Sports Profile Tab */}
        {activeTab === 'sports' && (
          <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-6 border border-surface-border space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-accent-400" />
                  스포츠 매칭 프로필
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  스포츠 파트너 매칭을 위한 프로필 정보입니다.
                </p>
              </div>
              <button
                onClick={() => setShowSportsModal(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                {showSportsModal ? '편집' : '편집'}
              </button>
            </div>

            <div className="bg-surface-elevated/50 rounded-lg p-4 border border-surface-border">
              <p className="text-gray-400 text-sm">
                프로필 정보를 입력하여 스포츠 파트너 매칭에 참여하세요.
              </p>
            </div>

            <button
              onClick={() => setShowSportsModal(true)}
              className="w-full btn-secondary py-3 rounded-lg font-medium"
            >
              스포츠 프로필 관리
            </button>
          </div>

          <div className="glass-card p-4 border border-yellow-900/30 bg-yellow-900/10 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium">프로필이 보이지 않나요?</p>
              <p className="text-yellow-300/80 mt-1">프로필을 공개 설정해야 다른 사용자에게 보입니다.</p>
            </div>
          </div>
          </div>
        )}
      </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-4 animate-fade-in">
            {applications.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">신청 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map(app => (
                  <div key={app.id} className="glass-card p-4 flex items-center justify-between group">
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">매칭 신청</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(app.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.status === 'accepted' && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          수락됨
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/20 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3 h-3" />
                          거절됨
                        </span>
                      )}
                      {app.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs text-accent-400 bg-accent-900/20 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          대기 중
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manner Evaluation Tab */}
        {activeTab === 'manner' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-400" />
                매너 평가
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                경기나 협업이 끝난 후 상대방을 평가할 수 있습니다. 별점(1~5점)으로 평가하면 누적 매너 스코어가 계산됩니다.
              </p>

              <div className="bg-accent-900/10 border border-accent-500/20 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">현재 매너 점수</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-accent-400">{mannerScore.toFixed(1)}</p>
                  <p className="text-gray-500">/5.0</p>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(mannerScore) ? 'fill-accent-400 text-accent-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 bg-surface-elevated rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  <span className="font-medium text-white">평가 항목:</span> 약속 시간 준수, 친절함, 책임감, 성실성, 소통 능력
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showContestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <ContestProfileModal onClose={() => setShowContestModal(false)} />
          </div>
        </div>
      )}

      {showSportsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <SportsProfileModal onClose={() => setShowSportsModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
