import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CONTEST_FIELD_LABELS, ContestField } from '@/types/database'
import { Calendar, Building2, ExternalLink, Trophy, Users, ArrowLeft } from 'lucide-react'
import RoomList from '@/components/room/RoomList'

interface ContestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContestDetailPage({ params }: ContestDetailPageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 1. Fetch contest
  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!contest) {
    notFound()
  }

  // 2. Fetch current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Back button */}
      <Link href="/contest" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        목록으로 돌아가기
      </Link>

      {/* Contest Details Card */}
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="w-full md:w-1/3 h-64 md:h-auto relative bg-surface-elevated border-b md:border-b-0 md:border-r border-surface-border">
            {contest.thumbnail_url ? (
              <img
                src={contest.thumbnail_url}
                alt={contest.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/60 to-surface-elevated">
                <Trophy className="w-16 h-16 text-primary-600/50" />
              </div>
            )}
            <div className="absolute top-4 left-4">
                <span className="badge-primary px-3 py-1">
                  {CONTEST_FIELD_LABELS[contest.field as keyof typeof CONTEST_FIELD_LABELS] || '기타'}
                </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
              {contest.title}
            </h1>
            
            <div className="space-y-4 mb-8">
              {contest.organizer && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">주최</p>
                    <p className="text-slate-800 font-medium">{contest.organizer}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500 mb-0.5">접수 기간</p>
                  <p className="text-slate-800 font-medium">
                    {contest.start_date ? `${contest.start_date} ~ ` : '마감일: '}
                    <span className="text-red-500">{contest.end_date}</span>
                  </p>
                </div>
              </div>
              {contest.prize && (
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-accent-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">시상 내역</p>
                    <p className="text-slate-800 font-medium">{contest.prize}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                상세정보 보기 <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                href={`/recruitment/create?type=contest&contestId=${contest.id}`}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" /> 팀원 모집 방 개설하기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Match Section */}
      <div id="match-section" className="pt-8 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-slate-900">모집 중인 팀</h2>
          </div>
          <Link
            href={`/recruitment/create?type=contest&contestId=${contest.id}`}
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            + 직접 개설하기
          </Link>
        </div>
        <p className="text-slate-500 mb-6">
          이 공모전을 함께할 팀원을 찾고 있는 모집 방입니다.
        </p>

        {/* Client component for recruitment rooms list */}
        <RoomList type="contest" relationId={contest.id} />
      </div>
    </div>
  )
}
