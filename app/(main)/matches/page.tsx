'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, CheckCircle2, XCircle, Clock } from 'lucide-react'

// Extended match type to include related data
type MatchItem = {
  id: string
  type: 'contest' | 'sports'
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  message: string
  created_at: string
  requester_id: string
  receiver_id: string
  requester?: { nickname: string; email: string; department?: string; gender?: string }
  receiver?: { nickname: string; email: string }
  contest?: { title: string }
  // reservation info can be added later
}

export default function MatchesPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      let query = supabase
        .from('matches')
        .select(`
          *,
          requester:users!requester_id(nickname, email),
          receiver:users!receiver_id(nickname, email),
          contest:contests(title)
        `)
        .order('created_at', { ascending: false })

      if (activeTab === 'received') {
        query = query.eq('receiver_id', user.id)
      } else {
        query = query.eq('requester_id', user.id)
      }

      const { data, error } = await query
      if (error) {
        console.error('Error fetching matches:', error)
      } else {
        // Also fetch department for the other party if needed, 
        // but for now, we'll just display what we have from users table
        setMatches(data as any[])
      }
      setLoading(false)
    }

    fetchMatches()
  }, [supabase, activeTab])

  const handleStatusChange = async (matchId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId)

      if (error) throw error

      // Optimistic update
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: newStatus } : m))

      // Find the match to send notification
      const match = matches.find(m => m.id === matchId)
      if (match) {
        // Fetch current user nickname
        const { data: currentUserData } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', currentUserId)
          .single()

        const nickname = currentUserData?.nickname || '사용자'
        const content = newStatus === 'accepted'
          ? `${nickname}님이 매칭 요청을 수락했습니다! 이메일로 연락해보세요.`
          : `${nickname}님이 매칭 요청을 거절했습니다.`

        await supabase.from('notifications').insert({
          user_id: match.requester_id,
          type: newStatus === 'accepted' ? 'match_accepted' : 'match_rejected',
          content,
          related_id: match.id
        })
      }

    } catch (e) {
      console.error(e)
      alert('상태 변경에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">매칭 관리</h1>
        <p className="text-gray-400 text-sm">주고받은 매칭 요청을 확인하고 관리하세요.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-border pb-px">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'received'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          받은 요청
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'sent'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          보낸 요청
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <p className="text-gray-400">
            {activeTab === 'received' ? '아직 받은 매칭 요청이 없습니다.' : '보낸 매칭 요청이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(match => {
            const isReceived = activeTab === 'received'
            const otherParty = isReceived ? match.requester : match.receiver

            return (
              <div key={match.id} className="glass-card p-6 flex flex-col md:flex-row gap-6">
                {/* Info Section */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`badge-primary text-xs ${match.type === 'sports' ? 'bg-accent-600/20 text-accent-400 border-accent-500/30' : ''}`}>
                        {match.type === 'contest' ? '공모전 매칭' : '스포츠 매칭'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(match.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {match.status === 'pending' && <><Clock className="w-4 h-4 text-yellow-500" /><span className="text-yellow-500">대기중</span></>}
                      {match.status === 'accepted' && <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-green-500">수락됨</span></>}
                      {match.status === 'rejected' && <><XCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">거절됨</span></>}
                    </div>
                  </div>

                  {match.contest && (
                    <h3 className="text-white font-medium mb-3">
                      대상: <span className="text-primary-300">{match.contest.title}</span>
                    </h3>
                  )}

                  <div className="bg-surface-elevated/50 p-4 rounded-xl border border-surface-border">
                    <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">
                      &ldquo;{match.message}&rdquo;
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span>보낸 사람:</span>
                      <span className="font-medium text-white">{otherParty?.nickname}</span>
                    </p>
                  </div>
                  
                  {/* Contact info reveals on accepted */}
                  {match.status === 'accepted' && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                      <Mail className="w-5 h-5 text-green-400" />
                      <div className="text-sm">
                        <p className="text-green-400 font-medium mb-0.5">매칭이 성사되었습니다!</p>
                        <p className="text-green-200">상대방 이메일: {otherParty?.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Section (only for received pending requests) */}
                {isReceived && match.status === 'pending' && (
                  <div className="flex md:flex-col gap-2 justify-center shrink-0 w-full md:w-32 border-t md:border-t-0 md:border-l border-surface-border pt-4 md:pt-0 md:pl-6">
                    <button
                      onClick={() => handleStatusChange(match.id, 'accepted')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      수락하기
                    </button>
                    <button
                      onClick={() => handleStatusChange(match.id, 'rejected')}
                      className="flex-1 py-2 bg-surface-elevated hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      거절하기
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
