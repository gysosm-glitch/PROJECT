'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { Star, X, Loader2, CheckCircle2 } from 'lucide-react'

interface EvaluationModalProps {
  roomId: string
  currentUser: User
  onClose: () => void
}

export default function EvaluationModal({ roomId, currentUser, onClose }: EvaluationModalProps) {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<{ [key: string]: { score: number, comment: string } }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const fetchMembersAndEvals = async () => {
      // 1. 방 정보 가져오기 (host 확인용)
      const { data: room } = await supabase.from('recruitment_rooms').select('host_id').eq('id', roomId).single()
      
      // 2. 수락된 인원들 가져오기
      const { data: apps } = await supabase
        .from('room_applications')
        .select('applicant_id, applicant:users!applicant_id(id, nickname, avatar_url)')
        .eq('room_id', roomId)
        .eq('status', 'accepted')

      let allMembers: any[] = []
      
      // 호스트 정보 추가
      if (room && room.host_id !== currentUser.id) {
        const { data: hostUser } = await supabase.from('users').select('id, nickname, avatar_url').eq('id', room.host_id).single()
        if (hostUser) allMembers.push({ ...hostUser, role: '방장' })
      }

      // 신청자들 추가 (본인 제외)
      if (apps) {
        apps.forEach((app: any) => {
          if (app.applicant_id !== currentUser.id) {
            allMembers.push({ ...(app.applicant as any), role: '팀원' })
          }
        })
      }

      setMembers(allMembers)

      // 3. 내가 이미 한 평가 가져오기
      const { data: existingEvals } = await supabase
        .from('user_evaluations')
        .select('*')
        .eq('room_id', roomId)
        .eq('reviewer_id', currentUser.id)

      if (existingEvals && existingEvals.length > 0) {
        setDone(true) // 이미 평가 완료함
      }

      setLoading(false)
    }

    fetchMembersAndEvals()
  }, [roomId, currentUser.id, supabase])

  const handleSubmit = async () => {
    // 평가 안 한 멤버가 있는지 확인 (점수 0)
    const pendingEvals = members.map(m => evaluations[m.id]?.score || 0)
    if (pendingEvals.includes(0)) {
      return alert('모든 팀원에 대해 별점을 매겨주세요!')
    }

    setSubmitting(true)

    const evalData = members.map(m => ({
      room_id: roomId,
      reviewer_id: currentUser.id,
      reviewee_id: m.id,
      score: evaluations[m.id].score,
      comment: evaluations[m.id].comment || null
    }))

    const { error } = await supabase.from('user_evaluations').insert(evalData)

    if (error) {
      console.error(error)
      alert('평가 저장에 실패했습니다.')
    } else {
      setDone(true)
    }
    setSubmitting(false)
  }

  const handleScore = (userId: string, score: number) => {
    setEvaluations(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || { comment: '' }), score }
    }))
  }

  const handleComment = (userId: string, comment: string) => {
    setEvaluations(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || { score: 0 }), comment }
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">팀원 상호 평가</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : done ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">평가 완료!</h3>
              <p className="text-slate-500">소중한 피드백 감사합니다.<br/>더 나은 매칭 문화를 만들어갑니다.</p>
              <button onClick={onClose} className="mt-8 btn-primary px-8">닫기</button>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              평가할 팀원이 없습니다. (혼자 활동)
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 mb-6">
                함께 활동한 팀원들은 어땠나요? 익명으로 평가되며, 상대방의 매너 점수에 반영됩니다.
              </p>
              
              {members.map(member => (
                <div key={member.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      {member.nickname?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{member.nickname}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">{member.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleScore(member.id, star)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star className={`w-8 h-8 ${
                          (evaluations[member.id]?.score || 0) >= star 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-300'
                        }`} />
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    placeholder="팀원에 대한 한줄평을 남겨주세요 (선택)"
                    className="w-full input-base text-sm resize-none"
                    rows={2}
                    value={evaluations[member.id]?.comment || ''}
                    onChange={(e) => handleComment(member.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && !done && members.length > 0 && (
          <div className="p-5 border-t border-surface-border bg-slate-50 rounded-b-2xl">
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '평가 제출하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
