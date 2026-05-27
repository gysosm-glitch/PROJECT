'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contest, ContestField } from '@/types/database'
import ContestCard from '@/components/contest/ContestCard'
import ContestFilter from '@/components/contest/ContestFilter'
import ContestProfileModal from '@/components/profile/ContestProfileModal'
import { Trophy, Search, SlidersHorizontal, Loader2 } from 'lucide-react'

const PAGE_SIZE = 12

export default function ContestPage() {
  const supabase = createClient()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeField, setActiveField] = useState<ContestField | 'all'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [page, setPage] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchContests = useCallback(async (pageNum: number, field: ContestField | 'all', q: string) => {
    const from = pageNum * PAGE_SIZE
    let query = supabase
      .from('contests')
      .select('*')
      .eq('is_active', true)
      .order('end_date', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (field !== 'all') query = query.eq('field', field)
    if (q) query = query.ilike('title', `%${q}%`)

    const { data, error } = await query
    if (error) {
      console.error('공모전 조회 오류:', error)
      return []
    }
    return data as Contest[]
  }, [supabase])

  // Initial load & filter change
  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true)
      setPage(0)
      setHasMore(true)
    })
    fetchContests(0, activeField, search).then((data) => {
      setContests(data)
      setHasMore(data.length === PAGE_SIZE)
      setLoading(false)
    })
  }, [activeField, search, fetchContests])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        const nextPage = page + 1
        setLoadingMore(true)
        fetchContests(nextPage, activeField, search).then((data) => {
          setContests((prev) => [...prev, ...data])
          setHasMore(data.length === PAGE_SIZE)
          setPage(nextPage)
          setLoadingMore(false)
        })
      }
    })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loading, page, activeField, search, fetchContests])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-primary-400" />
            <h1 className="text-xl font-bold text-white">공모전</h1>
          </div>
          <p className="text-gray-400 text-sm">팀원이 필요한 공모전을 찾아보세요</p>
        </div>
        <button
          id="contest-profile-btn"
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 btn-secondary text-sm py-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          내 프로필
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          id="contest-search"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="공모전 제목으로 검색..."
          className="input-base pl-10"
        />
      </div>

      {/* Filter */}
      <ContestFilter activeField={activeField} onChange={(f) => setActiveField(f)} />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card h-64 animate-pulse">
              <div className="h-40 bg-surface-elevated rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-surface-elevated rounded w-3/4" />
                <div className="h-3 bg-surface-elevated rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">공모전이 없습니다</p>
          <p className="text-gray-600 text-sm mt-1">다른 분야나 검색어를 시도해보세요</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {contests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="flex justify-center py-4">
            {loadingMore && (
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
            )}
            {!hasMore && contests.length > 0 && (
              <p className="text-gray-600 text-sm">모든 공모전을 불러왔습니다</p>
            )}
          </div>
        </>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ContestProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
