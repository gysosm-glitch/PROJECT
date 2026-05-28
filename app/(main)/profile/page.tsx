'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ContestProfileModal from '@/components/profile/ContestProfileModal'
import SportsProfileModal from '@/components/profile/SportsProfileModal'
import { Trophy, Dumbbell, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('contest')
  const [showContestModal, setShowContestModal] = useState(false)
  const [showSportsModal, setShowSportsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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
        </div>
      )}

      {/* Profile Tabs */}
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-2 bg-transparent mb-6">
          <button
            onClick={() => setActiveTab('contest')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'contest'
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'bg-surface-elevated text-gray-400 border border-surface-border hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">공모전 프로필</span>
            <span className="sm:hidden">공모전</span>
          </button>
          <button
            onClick={() => setActiveTab('sports')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'sports'
                ? 'bg-accent-600/20 text-accent-300 border border-accent-500/30'
                : 'bg-surface-elevated text-gray-400 border border-surface-border hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">스포츠 프로필</span>
            <span className="sm:hidden">스포츠</span>
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
