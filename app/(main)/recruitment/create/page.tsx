'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trophy, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  CONTEST_FIELD_LABELS,
  FACILITY_LABELS,
  type FacilityType,
} from '@/types/database'

type RoomType = 'contest' | 'sports'

export default function CreateRecruitmentRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => setUser(res.data?.user))
  }, [supabase])

  // Form state
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // 공모전 모집방
  const [selectedContestId, setSelectedContestId] = useState<string>('')
  const [contests, setContests] = useState<any[]>([])
  const [contestsLoading, setContestsLoading] = useState(false)

  // 스포츠 모집방
  const [selectedFacility, setSelectedFacility] = useState<FacilityType | ''>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedStartTime, setSelectedStartTime] = useState<string>('')
  const [selectedEndTime, setSelectedEndTime] = useState<string>('')

  // 공통
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requiredMembers, setRequiredMembers] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 공모전 목록 조회
  const fetchContests = async (preselectId?: string) => {
    setContestsLoading(true)
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('is_active', true)
      .order('end_date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching contests:', error)
      setError('공모전 목록을 불러올 수 없습니다.')
    } else {
      setContests(data || [])
      if (preselectId && data?.some((c: any) => c.id === preselectId)) {
        setSelectedContestId(preselectId)
      }
    }
    setContestsLoading(false)
  }

  useEffect(() => {
    const typeParam = searchParams.get('type')
    const contestIdParam = searchParams.get('contestId')
    
    if (typeParam === 'contest') {
      setRoomType('contest')
      setStep(2)
      fetchContests(contestIdParam || undefined)
    } else if (typeParam === 'sports') {
      setRoomType('sports')
      setStep(2)
    }
  }, [searchParams])

  const handleSubmit = async () => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!title.trim() || requiredMembers < 2 || requiredMembers > 20) {
      setError('제목과 필요한 인원을 확인해주세요.')
      return
    }

    if (roomType === 'contest' && !selectedContestId) {
      setError('공모전을 선택해주세요.')
      return
    }

    if (roomType === 'sports') {
      if (!selectedFacility || !selectedDate || !selectedStartTime || !selectedEndTime) {
        setError('시설, 날짜, 시간을 모두 입력해주세요.')
        return
      }
      if (selectedStartTime >= selectedEndTime) {
        setError('시작 시간이 종료 시간보다 먼저여야 합니다.')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: insertError } = await supabase
        .from('recruitment_rooms')
        .insert({
          host_id: user.id,
          type: roomType,
          contest_id: roomType === 'contest' ? selectedContestId : null,
          sports_facility: roomType === 'sports' ? selectedFacility : null,
          sports_date: roomType === 'sports' ? selectedDate : null,
          sports_start_time: roomType === 'sports' ? selectedStartTime : null,
          sports_end_time: roomType === 'sports' ? selectedEndTime : null,
          title,
          description,
          required_members: requiredMembers,
          current_members: 1,
        })
        .select()

      if (insertError) throw insertError

      if (data && data[0]) {
        router.push(`/recruitment/${data[0].id}`)
      }
    } catch (err: any) {
      setError(err.message || '모집방 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (type: RoomType) => {
    setRoomType(type)
    if (type === 'contest') {
      fetchContests()
    }
    setStep(2)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center glass-card p-8">
          <p className="text-slate-700 mb-4 font-medium">로그인이 필요합니다.</p>
          <Link href="/login" className="btn-primary inline-block">
            로그인
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => {
              if (step > 1) {
                setStep((s) => (s === 1 ? 1 : (s - 1) as any))
              } else {
                router.back()
              }
            }}
            className="p-2 hover:bg-surface-elevated rounded-xl transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">팀원 모집 개설</h1>
            <p className="text-slate-500 font-medium mt-1">Step {step} of 3</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 font-medium text-sm">
            {error}
          </div>
        )}

        {/* Step 1: 모집 유형 선택 */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-slate-600 font-medium mb-6">어떤 유형의 팀원을 모집하시나요?</p>

            <button
              onClick={() => handleTypeSelect('contest')}
              className="w-full glass-card p-8 transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-orange-500" />
                </div>
                <div className="flex-1 text-left pt-1">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">공모전 팀원</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    공모전 참가를 위한 팀원을 구하고 있어요
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleTypeSelect('sports')}
              className="w-full glass-card p-8 transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-1 text-left pt-1">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">스포츠 파트너</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    운동 시간에 함께할 파트너를 찾고 있어요
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: 유형별 정보 입력 */}
        {step === 2 && roomType && (
          <div className="space-y-6 glass-card p-8 animate-fade-in">
            {roomType === 'contest' && (
              <div>
                <label className="block text-slate-800 font-semibold mb-3">
                  공모전 선택
                </label>
                <select
                  value={selectedContestId}
                  onChange={(e) => setSelectedContestId(e.target.value)}
                  className="w-full input-base"
                >
                  <option value="">공모전을 선택해주세요</option>
                  {contests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      [{CONTEST_FIELD_LABELS[contest.field as ContestField] || '기타'}] {contest.title}
                    </option>
                  ))}
                </select>
                {contestsLoading && <p className="text-sm text-slate-500 mt-2">목록을 불러오는 중...</p>}
              </div>
            )}

            {roomType === 'sports' && (
              <>
                <div>
                  <label className="block text-slate-800 font-semibold mb-3">
                    시설 선택
                  </label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value as any)}
                    className="w-full input-base"
                  >
                    <option value="">시설을 선택해주세요</option>
                    {Object.entries(FACILITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                         {label as string}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-semibold mb-3">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full input-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-semibold mb-3">
                      시작 시간
                    </label>
                    <input
                      type="time"
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
                      className="w-full input-base"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-semibold mb-3">
                      종료 시간
                    </label>
                    <input
                      type="time"
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="w-full input-base"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => {
                if (roomType === 'contest' && !selectedContestId) {
                  setError('공모전을 선택해주세요.')
                  return
                }
                if (roomType === 'sports' && (!selectedFacility || !selectedDate || !selectedStartTime || !selectedEndTime)) {
                  setError('모든 항목을 입력해주세요.')
                  return
                }
                setError('')
                setStep(3)
              }}
              className="btn-primary w-full mt-4"
            >
              다음
            </button>
          </div>
        )}

        {/* Step 3: 모집방 정보 입력 */}
        {step === 3 && (
          <div className="space-y-6 glass-card p-8 animate-fade-in">
            <div>
              <label className="block text-slate-800 font-semibold mb-3">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 공모전 함께할 디자이너 구합니다"
                maxLength={100}
                className="w-full input-base"
              />
              <p className="text-slate-400 text-sm mt-2 text-right">
                {title.length}/100
              </p>
            </div>

            <div>
              <label className="block text-slate-800 font-semibold mb-3">
                모집 상세 설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="팀원을 모집하는 이유, 기대하는 역할 등을 자유롭게 적어주세요!"
                maxLength={500}
                rows={5}
                className="w-full input-base resize-none"
              />
              <p className="text-slate-400 text-sm mt-2 text-right">
                {description.length}/500
              </p>
            </div>

            <div>
              <label className="block text-slate-800 font-semibold mb-3">
                필요한 팀원 수 <span className="text-slate-500 font-normal text-sm">(본인 제외)</span>
              </label>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setRequiredMembers(Math.max(2, requiredMembers - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-surface-elevated hover:bg-slate-200 rounded-xl transition-colors text-slate-700 font-bold text-xl"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-primary-700 w-12 text-center">
                  {requiredMembers}
                </span>
                <button
                  onClick={() => setRequiredMembers(Math.min(20, requiredMembers + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-surface-elevated hover:bg-slate-200 rounded-xl transition-colors text-slate-700 font-bold text-xl"
                >
                  +
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-3">
                최소 2명, 최대 20명까지 설정 가능합니다.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full mt-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-primary-800/30 shadow-lg"
            >
              {loading ? '생성 중...' : '모집 방 개설 완료 🎉'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
