'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, ShieldCheck, UserCheck, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RecruitmentRoomDetail() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => setUser(res.data?.user))
  }, [supabase])

  const [room, setRoom] = useState<any>(null)
  const [hostProfile, setHostProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [myApplication, setMyApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applyMessage, setApplyMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRoomDetail()
    }
  }, [params.id, user])

  const fetchRoomDetail = async () => {
    setLoading(true)
    try {
      // 1. 방 정보
      const { data: roomData, error: roomError } = await supabase
        .from('recruitment_rooms')
        .select('*, host:users!host_id ( nickname, avatar_url )')
        .eq('id', params.id as string)
        .single()
      
      if (roomError || !roomData) throw new Error('방 정보를 찾을 수 없습니다.')
      setRoom(roomData)

      // 2. 방장 프로필 요약
      const profileTable = roomData.type === 'contest' ? 'contest_profiles' : 'sports_profiles'
      const { data: profileData } = await supabase
        .from(profileTable)
        .select('*')
        .eq('user_id', roomData.host_id)
        .single()
      
      setHostProfile(profileData || { error: '프로필 미등록' })

      if (user) {
        // 3. 내 신청 내역 확인
        const { data: myAppData } = await supabase
          .from('room_applications')
          .select('*')
          .eq('room_id', roomData.id)
          .eq('applicant_id', user.id)
          .single()
        
        setMyApplication(myAppData)

        // 4. 방장일 경우: 모든 신청 내역
        if (user.id === roomData.host_id) {
          const { data: appsData } = await supabase
            .from('room_applications')
            .select('*, applicant:users!applicant_id ( nickname )')
            .eq('room_id', roomData.id)
            .order('applied_at', { ascending: false })
          setApplications(appsData || [])
        }
      }
    } catch (err) {
      console.error(err)
      alert('방 정보를 불러오는 데 실패했습니다.')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) return alert('로그인이 필요합니다.')
    if (isApplying) return
    setIsApplying(true)

    try {
      const { error } = await supabase
        .from('room_applications')
        .insert({
          room_id: room.id,
          applicant_id: user.id,
          message: applyMessage,
          status: 'pending'
        })
      if (error) throw error
      alert('신청이 완료되었습니다!')
      fetchRoomDetail()
    } catch (err) {
      console.error(err)
      alert('신청에 실패했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  const handleApprove = async (appId: string) => {
    if (room.current_members >= room.required_members + 1) {
      return alert('이미 모집 정원이 마감되었습니다.')
    }

    try {
      // 수락 처리
      await supabase.from('room_applications').update({ status: 'accepted', decided_at: new Date().toISOString() }).eq('id', appId)
      
      // 인원 수 증가
      const newCount = room.current_members + 1
      await supabase.from('recruitment_rooms').update({ 
        current_members: newCount,
        status: newCount >= room.required_members + 1 ? 'closed' : 'active'
      }).eq('id', room.id)
      
      fetchRoomDetail()
    } catch (err) {
      console.error(err)
      alert('수락 처리 실패')
    }
  }

  const handleReject = async (appId: string) => {
    try {
      await supabase.from('room_applications').update({ status: 'rejected', decided_at: new Date().toISOString() }).eq('id', appId)
      fetchRoomDetail()
    } catch (err) {
      console.error(err)
      alert('거절 처리 실패')
    }
  }

  if (loading) return <div className="min-h-screen pt-20 pb-12 flex items-center justify-center"><p className="text-slate-500 text-lg">불러오는 중...</p></div>
  if (!room) return null

  const isHost = user?.id === room.host_id
  const isClosed = room.status === 'closed'

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-surface-border bg-white">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {room.title}
              </h1>
              {isClosed ? (
                <span className="badge-red px-3 py-1.5 text-sm">모집 마감</span>
              ) : (
                <span className="badge-primary px-3 py-1.5 text-sm">모집 중</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-primary-600">{room.current_members}</span>
                <span>/ {room.required_members + 1}명 (방장 포함)</span>
              </div>
              <span>|</span>
              <span>{new Date(room.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Body */}
            <div className="flex-1 p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">모집 상세 설명</h3>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {room.description || '상세 설명이 없습니다.'}
                </p>
              </div>
            </div>

            {/* Sidebar (Host Info & Apply) */}
            <div className="w-full md:w-80 bg-surface-elevated p-8 border-t md:border-t-0 md:border-l border-surface-border">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent-500" />
                방장 프로필
              </h3>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {room.host?.nickname?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{room.host?.nickname || '익명'}</p>
                    {hostProfile?.department && <p className="text-xs text-slate-500">{hostProfile.department}</p>}
                  </div>
                </div>
                {room.type === 'contest' ? (
                  <div className="text-sm space-y-1.5 text-slate-700">
                    <p><span className="text-slate-400 w-16 inline-block">공모전</span>: {hostProfile?.contest_count || 0}회 참여</p>
                    <p><span className="text-slate-400 w-16 inline-block">관심분야</span>: {hostProfile?.fields?.join(', ') || '미입력'}</p>
                    {hostProfile?.intro && <p className="mt-2 text-slate-500 italic">"{hostProfile.intro}"</p>}
                  </div>
                ) : (
                  <div className="text-sm space-y-1.5 text-slate-700">
                    <p><span className="text-slate-400 w-16 inline-block">운동경력</span>: {hostProfile?.career_years || 0}년</p>
                    <p><span className="text-slate-400 w-16 inline-block">주종목</span>: {hostProfile?.sports?.join(', ') || '미입력'}</p>
                  </div>
                )}
              </div>

              {!user ? (
                <Link href="/login" className="btn-secondary w-full text-center block">
                  로그인하고 신청하기
                </Link>
              ) : isHost ? (
                <div className="text-center p-3 bg-primary-50 rounded-xl text-primary-700 font-medium">
                  내가 개설한 방입니다
                </div>
              ) : myApplication ? (
                <div className={`text-center p-4 rounded-xl font-medium ${
                  myApplication.status === 'accepted' ? 'bg-green-50 text-green-700' :
                  myApplication.status === 'rejected' ? 'bg-red-50 text-red-700' :
                  'bg-yellow-50 text-yellow-700'
                }`}>
                  {myApplication.status === 'accepted' ? '수락되었습니다 🎉' :
                   myApplication.status === 'rejected' ? '거절되었습니다' :
                   '신청 대기 중입니다 ⏳'}
                </div>
              ) : isClosed ? (
                <div className="text-center p-3 bg-slate-100 rounded-xl text-slate-500 font-medium">
                  모집이 마감되었습니다
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="방장에게 보낼 짧은 어필 메시지를 적어주세요!"
                    className="w-full input-base text-sm resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleApply}
                    disabled={isApplying || !applyMessage.trim()}
                    className="btn-primary w-full disabled:opacity-50 text-sm py-2.5"
                  >
                    {isApplying ? '신청 중...' : '참여 신청하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Host Dashboard */}
        {isHost && (
          <div className="glass-card p-8 mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary-600" />
              신청자 관리 ({applications.length})
            </h2>

            {applications.length === 0 ? (
              <p className="text-slate-500 text-center py-8">아직 들어온 신청이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white p-5 rounded-2xl border border-surface-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{app.applicant?.nickname || '익명'}</span>
                        <span className="text-xs text-slate-400">{new Date(app.applied_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-xl inline-block mt-2">
                        "{app.message || '메시지 없음'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                      {app.status === 'pending' && !isClosed ? (
                        <>
                          <button onClick={() => handleApprove(app.id)} className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors">
                            수락
                          </button>
                          <button onClick={() => handleReject(app.id)} className="flex-1 sm:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-medium text-sm transition-colors">
                            거절
                          </button>
                        </>
                      ) : (
                        <span className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {app.status === 'accepted' ? '수락됨' : app.status === 'rejected' ? '거절됨' : '마감/대기'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
